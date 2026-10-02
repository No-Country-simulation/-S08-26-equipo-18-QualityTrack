import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LockMode, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Client } from '../entities/Client';
import { Request } from '../entities/Request';
import { Quotation } from '../entities/Quotation';
import { QuotationItem } from '../entities/QuotationItem';
import { User } from '../entities/User';
import { hasPermission, Permission } from '../auth/permissions';
import { toClientResponse } from '../clients/dto/client-response.dto';
import {
  CreateRequestDto,
  UpdateRequestDto,
  CreateQuotationDto,
  UpdateQuotationDto,
  QuotationDecisionDto,
} from './commercial.dto';
import {
  checked,
  decimalCents,
  decimalText,
  itemCents,
  storedTotal,
} from './decimal';

const requestPopulate = ['client', 'createdBy'] as const;
const quotationPopulate = [
  'client',
  'request.client',
  'request.createdBy',
  'createdBy',
  'decidedBy',
] as const;
const identity = (user?: User | null) =>
  user
    ? { id: user.id, firstName: user.firstName, lastName: user.lastName }
    : null;
export function requestResponse(request: Request) {
  return {
    id: request.id,
    clientId: request.client.id,
    client: toClientResponse(request.client),
    requestNumber: request.requestNumber,
    title: request.title,
    description: request.description,
    receivedAt: request.receivedAt.toISOString(),
    requestedDeliveryDate: request.requestedDeliveryDate?.toISOString() ?? null,
    createdById: request.createdBy.id,
    createdBy: identity(request.createdBy),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class CommercialService {
  constructor(private readonly em: EntityManager) {}
  async requests() {
    return (
      await this.em.find(
        Request,
        {},
        {
          populate: [...requestPopulate],
          orderBy: { createdAt: 'desc', id: 'desc' },
        },
      )
    ).map(requestResponse);
  }
  async request(id: number) {
    this.id(id);
    const record = await this.em.findOne(
      Request,
      { id },
      { populate: [...requestPopulate] },
    );
    if (!record) throw new NotFoundException('La solicitud no existe.');
    return requestResponse(record);
  }
  async quotations() {
    const records = await this.em.find(
      Quotation,
      {},
      {
        populate: [...quotationPopulate],
        orderBy: { createdAt: 'desc', id: 'desc' },
      },
    );
    const items = records.length
      ? await this.em.find(
          QuotationItem,
          { quotation: { $in: records.map((record) => record.id) } },
          { orderBy: { id: 'asc' } },
        )
      : [];
    return records.map((record) =>
      this.quoteResponse(
        record,
        items.filter((item) => item.quotation.id === record.id),
      ),
    );
  }
  async quotation(id: number) {
    this.id(id);
    const record = await this.em.findOne(
      Quotation,
      { id },
      { populate: [...quotationPopulate] },
    );
    if (!record) throw new NotFoundException('La cotización no existe.');
    return this.withItems(this.em, record);
  }

  async createRequest(dto: CreateRequestDto, actorId: number) {
    return this.write(actorId, 'requests:create', async (em, actor) => {
      const record = new Request();
      record.client = await this.client(em, dto.clientId, true);
      record.createdBy = actor;
      this.assignRequest(record, dto);
      await em.persist(record).flush();
      return requestResponse(record);
    });
  }
  async updateRequest(id: number, dto: UpdateRequestDto, actorId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(actorId, 'requests:edit', async (em) => {
      const current = await em.findOne(Request, { id });
      if (!current) throw new NotFoundException('La solicitud no existe.');
      if (dto.clientId !== undefined && dto.clientId !== current.client.id)
        throw new ConflictException(
          'El cliente de la solicitud no se puede cambiar.',
        );
      await this.client(em, current.client.id, false);
      const record = await em.findOneOrFail(
        Request,
        { id },
        { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
      );
      await em.populate(record, [...requestPopulate]);
      if (
        dto.requestNumber !== undefined &&
        dto.requestNumber !== record.requestNumber
      )
        throw new ConflictException(
          'El número de solicitud no se puede cambiar.',
        );
      // Una oferta ya emitida conserva la descripción técnica que fue cotizada.
      if (await em.count(Quotation, { request: id }))
        throw new ConflictException(
          'La solicitud ya tiene cotizaciones; sus datos de origen se conservan.',
        );
      this.assignRequest(record, dto);
      await em.flush();
      return requestResponse(record);
    });
  }
  private assignRequest(record: Request, dto: UpdateRequestDto) {
    for (const field of ['requestNumber', 'title', 'description'] as const)
      if (dto[field] !== undefined) record[field] = dto[field];
    if (dto.receivedAt !== undefined)
      record.receivedAt = new Date(dto.receivedAt);
    if (dto.requestedDeliveryDate !== undefined)
      record.requestedDeliveryDate =
        dto.requestedDeliveryDate === null
          ? null
          : new Date(dto.requestedDeliveryDate);
    if (
      record.requestedDeliveryDate &&
      record.requestedDeliveryDate < record.receivedAt
    )
      throw new BadRequestException(
        'La entrega deseada no puede ser anterior a la recepción.',
      );
  }
  async createQuotation(dto: CreateQuotationDto, actorId: number) {
    return this.write(actorId, 'quotations:create', async (em, actor) => {
      const client = await this.client(em, dto.clientId, true);
      const request = await this.origin(em, dto.requestId, client.id);
      const record = new Quotation();
      record.client = client;
      record.request = request;
      record.createdBy = actor;
      record.quotationNumber = dto.quotationNumber;
      await this.assignQuotation(em, record, dto);
      await em.flush();
      return this.withItems(em, record);
    });
  }
  async updateQuotation(id: number, dto: UpdateQuotationDto, actorId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(actorId, 'quotations:edit', async (em) => {
      const record = await this.lockQuotation(em, id);
      if (record.decisionStatus !== 'pending')
        throw new ConflictException(
          'La cotización ya tiene una decisión. Creá una nueva revisión con otro número.',
        );
      for (const [field, current] of [
        ['clientId', record.client.id],
        ['requestId', record.request.id],
        ['quotationNumber', record.quotationNumber],
      ] as const) {
        if (dto[field] !== undefined && dto[field] !== current)
          throw new ConflictException(
            'El número y origen de la cotización no se pueden cambiar.',
          );
      }
      await this.assignQuotation(em, record, dto);
      await em.flush();
      return this.withItems(em, record);
    });
  }
  async decide(id: number, dto: QuotationDecisionDto, actorId: number) {
    this.id(id);
    return this.write(actorId, 'quotations:approve', async (em, actor) => {
      const record = await this.lockQuotation(em, id);
      if (record.decisionStatus !== 'pending') {
        if (record.decisionStatus === dto.status)
          return this.withItems(em, record);
        throw new ConflictException(
          'La cotización ya tiene una decisión registrada.',
        );
      }
      if (dto.status === 'accepted') {
        if (!record.client.isActive)
          throw new ConflictException(
            'No se puede aceptar una cotización de un cliente inactivo.',
          );
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (record.validUntil && record.validUntil < today)
          throw new ConflictException(
            'La cotización está vencida. Creá una nueva revisión.',
          );
        const items = await em.find(QuotationItem, { quotation: id });
        if (!items.length)
          throw new ConflictException(
            'La cotización necesita ítems antes de ser aceptada.',
          );
        try {
          let subtotal = 0n;
          for (const item of items) {
            if (decimalCents(item.quantity) <= 0n) throw new Error();
            const line = itemCents(item.quantity, item.unitPrice);
            if (decimalCents(item.subtotal) !== line) throw new Error();
            subtotal = checked(subtotal + line);
          }
          const tax = checked((subtotal * 21n + 50n) / 100n);
          checked(subtotal + tax);
          if (
            decimalCents(record.subtotal) !== subtotal ||
            decimalCents(record.taxAmount) !== tax
          )
            throw new Error();
        } catch {
          throw new ConflictException(
            'Corregí los ítems e importes de la cotización antes de aceptarla.',
          );
        }
        if (record.request.client.id !== record.client.id)
          throw new ConflictException(
            'Corregí el origen de la cotización antes de aceptarla.',
          );
      }
      record.decisionStatus = dto.status;
      record.decidedBy = actor;
      record.decidedAt = new Date();
      await em.flush();
      return this.withItems(em, record);
    });
  }
  private async assignQuotation(
    em: EntityManager,
    record: Quotation,
    dto: UpdateQuotationDto,
  ) {
    for (const field of ['version', 'description', 'currency'] as const)
      if (dto[field] !== undefined)
        (record[field] as string | number) = dto[field];
    if (dto.validUntil !== undefined)
      record.validUntil =
        dto.validUntil === null ? null : new Date(dto.validUntil);
    em.persist(record);
    if (dto.items !== undefined) {
      let subtotal = 0n;
      const items = dto.items.map((input) => {
        const item = new QuotationItem();
        item.quotation = record;
        item.description = input.description;
        item.quantity = decimalText(decimalCents(input.quantity));
        item.unitPrice = decimalText(decimalCents(input.unitPrice));
        const cents = itemCents(input.quantity, input.unitPrice);
        subtotal = checked(subtotal + cents);
        item.subtotal = decimalText(cents);
        item.notes = input.notes ?? null;
        return item;
      });
      // Importes derivados: redondeo por línea y luego IVA estimado del 21%.
      const tax = checked((subtotal * 21n + 50n) / 100n);
      checked(subtotal + tax);
      if (record.id)
        await em.nativeDelete(QuotationItem, { quotation: record.id });
      em.persist(items);
      record.subtotal = decimalText(subtotal);
      record.taxAmount = decimalText(tax);
    }
  }
  private async lockQuotation(em: EntityManager, id: number) {
    const initial = await em.findOne(Quotation, { id });
    if (!initial) throw new NotFoundException('La cotización no existe.');
    // Todas las escrituras comerciales siguen cliente → solicitud → cotización.
    await this.client(em, initial.client.id, false);
    await this.origin(em, initial.request.id, initial.client.id);
    const record = await em.findOneOrFail(
      Quotation,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
    await em.populate(record, [...quotationPopulate]);
    return record;
  }
  private async origin(em: EntityManager, id: number, clientId: number) {
    const request = await em.findOne(
      Request,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!request) throw new NotFoundException('La solicitud no existe.');
    await em.populate(request, [...requestPopulate]);
    if (request.client.id !== clientId)
      throw new BadRequestException(
        'La solicitud no pertenece al cliente elegido.',
      );
    return request;
  }
  private async client(em: EntityManager, id: number, active: boolean) {
    const client = await em.findOne(
      Client,
      { id },
      { lockMode: LockMode.PESSIMISTIC_READ },
    );
    if (!client) throw new NotFoundException('El cliente no existe.');
    if (active && !client.isActive)
      throw new ConflictException('El cliente está inactivo.');
    return client;
  }
  private async withItems(em: EntityManager, record: Quotation) {
    const items = await em.find(
      QuotationItem,
      { quotation: record.id },
      { orderBy: { id: 'asc' } },
    );
    return this.quoteResponse(record, items);
  }
  private quoteResponse(record: Quotation, items: QuotationItem[]) {
    return {
      id: record.id,
      clientId: record.client.id,
      client: toClientResponse(record.client),
      requestId: record.request.id,
      request: requestResponse(record.request),
      quotationNumber: record.quotationNumber,
      version: record.version,
      description: record.description,
      subtotal: record.subtotal,
      taxAmount: record.taxAmount,
      total: storedTotal(record.subtotal, record.taxAmount),
      currency: record.currency,
      validUntil: record.validUntil?.toISOString() ?? null,
      createdById: record.createdBy.id,
      createdBy: identity(record.createdBy),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt?.toISOString() ?? null,
      decisionStatus: record.decisionStatus,
      decidedById: record.decidedBy?.id ?? null,
      decidedBy: identity(record.decidedBy),
      decidedAt: record.decidedAt?.toISOString() ?? null,
      items: items.map((item) => ({
        id: item.id,
        quotationId: record.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        notes: item.notes ?? null,
      })),
    };
  }
  private nonempty(dto: object) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('Indicá al menos un campo.');
  }
  private id(id: number) {
    if (id < 1 || id > 2147483647)
      throw new BadRequestException('ID inválido.');
  }
  private async write<T>(
    actorId: number,
    permission: Permission,
    action: (em: EntityManager, actor: User) => Promise<T>,
  ) {
    try {
      return await this.em.transactional(
        async (em) => {
          const actor = await em.findOne(
            User,
            { id: actorId },
            { populate: ['role'] },
          );
          if (!actor?.isActive || !hasPermission(actor.role.name, permission))
            throw new ForbiddenException(
              'El rol actual no permite esta acción.',
            );
          return action(em, actor);
        },
        { clear: true },
      );
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException)
        throw new ConflictException('Ese número ya está registrado.');
      throw error;
    }
  }
}
