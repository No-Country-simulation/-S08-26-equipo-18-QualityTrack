import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { QualityControl } from '../entities/QualityControl';
import { Delivery } from '../entities/Delivery';
import { WorkOrder } from '../entities/WorkOrder';
import { WorkOrderStatus } from '../entities/WorkOrderStatus';
import { Operation } from '../entities/Operation';
import { User } from '../entities/User';
import { Permission, hasPermission } from '../auth/permissions';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import {
  CreateQualityDto,
  UpdateQualityDto,
  CreateDeliveryDto,
  UpdateDeliveryDto,
  qualityDecimal,
} from './quality-deliveries.dto';

const actor = (u?: User | null) =>
  u
    ? {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role.name,
      }
    : null;
const order = (wo: WorkOrder) => ({
  id: wo.id,
  workOrderNumber: wo.workOrderNumber,
  title: wo.title,
  status: wo.status,
});
export const businessDay = (value: Date | string) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
};
const date = (value: string) =>
  new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value,
  );
const qualityResponse = (q: QualityControl) => ({
  id: q.id,
  workOrderId: q.workOrder.id,
  workOrder: order(q.workOrder),
  operationId: q.operation?.id ?? null,
  operation: q.operation
    ? {
        id: q.operation.id,
        routeSheetId: q.operation.routeSheet.id,
        operationNumber: q.operation.operationNumber,
        name: q.operation.name,
      }
    : null,
  specification: q.specification ?? null,
  expectedValue: q.expectedValue ?? null,
  measuredValue: q.measuredValue ?? null,
  unit: q.unit ?? null,
  observations: q.observations ?? null,
  performedById: q.performedBy.id,
  performedBy: actor(q.performedBy),
  performedAt: q.performedAt?.toISOString() ?? null,
  updatedBy: actor(q.updatedBy),
  updatedAt: q.updatedAt?.toISOString() ?? null,
});
const deliveryResponse = (d: Delivery) => ({
  id: d.id,
  workOrderId: d.workOrder.id,
  workOrder: order(d.workOrder),
  clientId: d.client?.id ?? null,
  client: d.client
    ? {
        id: d.client.id,
        businessName: d.client.businessName,
        taxId: d.client.taxId,
        isActive: d.client.isActive,
      }
    : null,
  deliveryDate: d.deliveryDate.toISOString(),
  quantity: d.quantity,
  notes: d.notes ?? null,
  createdBy: actor(d.createdBy),
  updatedBy: actor(d.updatedBy),
  createdAt: d.createdAt.toISOString(),
  updatedAt: d.updatedAt?.toISOString() ?? null,
});
@Injectable()
export class QualityDeliveriesService {
  constructor(
    private readonly em: EntityManager,
    private readonly orders: WorkOrdersService,
  ) {}
  private id(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647)
      throw new BadRequestException('ID inválido.');
  }
  private nonempty(dto: object) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('Indicá al menos un campo.');
  }
  private async findOrder(em: EntityManager, id: number, lock = false) {
    this.id(id);
    const wo = await em.findOne(
      WorkOrder,
      { id },
      lock ? { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true } : {},
    );
    if (!wo) throw new NotFoundException('La OT no existe.');
    return wo;
  }
  private async writable(em: EntityManager, id: number) {
    const wo = await this.findOrder(em, id, true);
    if (wo.status === WorkOrderStatus.CANCELLED)
      throw new ConflictException('La OT cancelada conserva su historial.');
    if (!wo.quotation)
      throw new ConflictException(
        'La OT histórica no tiene origen documentado.',
      );
    await em.populate(wo, ['quotation.request.client', 'quotation.client']);
    if (wo.quotation.client.id !== wo.quotation.request.client.id)
      throw new ConflictException('El origen de la OT es inconsistente.');
    return wo;
  }
  private async write<T>(
    id: number,
    permission: Permission,
    action: (em: EntityManager, user: User) => Promise<T>,
  ) {
    return this.em.transactional(
      async (em) => {
        const user = await em.findOne(User, { id }, { populate: ['role'] });
        if (!user?.isActive || !hasPermission(user.role.name, permission))
          throw new ForbiddenException('El rol no permite esta acción.');
        return action(em, user);
      },
      { clear: true },
    );
  }
  async quality(workOrderId?: number) {
    if (workOrderId !== undefined) await this.findOrder(this.em, workOrderId);
    return (
      await this.em.find(
        QualityControl,
        workOrderId === undefined ? {} : { workOrder: workOrderId },
        {
          populate: [
            'workOrder',
            'operation.routeSheet',
            'performedBy.role',
            'updatedBy.role',
          ],
          orderBy: { id: 'desc' },
        },
      )
    ).map(qualityResponse);
  }
  async control(id: number) {
    this.id(id);
    const q = await this.em.findOne(
      QualityControl,
      { id },
      {
        populate: [
          'workOrder',
          'operation.routeSheet',
          'performedBy.role',
          'updatedBy.role',
        ],
      },
    );
    if (!q) throw new NotFoundException('El control no existe.');
    return qualityResponse(q);
  }
  private async assignQuality(
    em: EntityManager,
    q: QualityControl,
    dto: UpdateQualityDto,
  ) {
    if (dto.workOrderId !== undefined && dto.workOrderId !== q.workOrder.id)
      throw new ConflictException('La OT del control es inmutable.');
    if (dto.operationId !== undefined) {
      const op =
        dto.operationId === null
          ? null
          : await em.findOne(
              Operation,
              { id: dto.operationId },
              { populate: ['routeSheet'] },
            );
      if (dto.operationId !== null && !op)
        throw new NotFoundException('La operación no existe.');
      if (op && op.routeSheet.workOrder.id !== q.workOrder.id)
        throw new ConflictException('La operación pertenece a otra OT.');
      q.operation = op;
    }
    for (const key of ['specification', 'unit', 'observations'] as const)
      if (dto[key] !== undefined) q[key] = dto[key];
    for (const key of ['expectedValue', 'measuredValue'] as const)
      if (dto[key] !== undefined)
        q[key] = dto[key] === null ? null : qualityDecimal(dto[key]);
    if (dto.performedAt !== undefined) {
      if (
        dto.performedAt !== null &&
        businessDay(dto.performedAt) > businessDay(new Date())
      )
        throw new BadRequestException(
          'La inspección no puede tener una fecha futura.',
        );
      q.performedAt = dto.performedAt === null ? null : date(dto.performedAt);
    }
  }
  async createQuality(dto: CreateQualityDto, actorId: number) {
    return this.write(actorId, 'quality:inspect', async (em, user) => {
      const q = new QualityControl();
      q.workOrder = await this.writable(em, dto.workOrderId);
      q.performedBy = user;
      q.performedAt = new Date();
      await this.assignQuality(em, q, dto);
      await em.persist(q).flush();
      return qualityResponse(q);
    });
  }
  async updateQuality(id: number, dto: UpdateQualityDto, actorId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(actorId, 'quality:inspect', async (em, user) => {
      const q = await em.findOne(
        QualityControl,
        { id },
        {
          populate: [
            'workOrder',
            'operation.routeSheet',
            'performedBy.role',
            'updatedBy.role',
          ],
        },
      );
      if (!q) throw new NotFoundException('El control no existe.');
      await this.writable(em, q.workOrder.id);
      await em.refresh(q);
      await this.assignQuality(em, q, dto);
      q.updatedBy = user;
      q.updatedAt = new Date();
      await em.flush();
      return qualityResponse(q);
    });
  }
  async deliveries(workOrderId?: number) {
    if (workOrderId !== undefined) await this.findOrder(this.em, workOrderId);
    return (
      await this.em.find(
        Delivery,
        workOrderId === undefined ? {} : { workOrder: workOrderId },
        {
          populate: ['workOrder', 'client', 'createdBy.role', 'updatedBy.role'],
          orderBy: { id: 'desc' },
        },
      )
    ).map(deliveryResponse);
  }
  async delivery(id: number) {
    this.id(id);
    const d = await this.em.findOne(
      Delivery,
      { id },
      { populate: ['workOrder', 'client', 'createdBy.role', 'updatedBy.role'] },
    );
    if (!d) throw new NotFoundException('La entrega no existe.');
    return deliveryResponse(d);
  }
  async deliveryOrders() {
    return this.orders.list();
  }
  private assignDelivery(d: Delivery, dto: UpdateDeliveryDto) {
    if (dto.workOrderId !== undefined && dto.workOrderId !== d.workOrder.id)
      throw new ConflictException('La OT de la entrega es inmutable.');
    if (dto.deliveryDate !== undefined) d.deliveryDate = date(dto.deliveryDate);
    if (dto.quantity !== undefined) d.quantity = dto.quantity;
    if (dto.notes !== undefined) d.notes = dto.notes;
    if (businessDay(d.deliveryDate) < businessDay(d.workOrder.createdAt))
      throw new BadRequestException(
        'La entrega no puede ser anterior a la creación de la OT.',
      );
  }
  async createDelivery(dto: CreateDeliveryDto, actorId: number) {
    return this.write(actorId, 'deliveries:create', async (em, user) => {
      const d = new Delivery();
      d.workOrder = await this.writable(em, dto.workOrderId);
      d.client = d.workOrder.quotation!.client;
      d.createdBy = user;
      this.assignDelivery(d, dto);
      await em.persist(d).flush();
      return deliveryResponse(d);
    });
  }
  async updateDelivery(id: number, dto: UpdateDeliveryDto, actorId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(actorId, 'deliveries:edit', async (em, user) => {
      const d = await em.findOne(
        Delivery,
        { id },
        {
          populate: ['workOrder', 'client', 'createdBy.role', 'updatedBy.role'],
        },
      );
      if (!d) throw new NotFoundException('La entrega no existe.');
      const wo = await this.writable(em, d.workOrder.id);
      await em.refresh(d);
      if (!d.client || d.client.id !== wo.quotation!.client.id)
        throw new ConflictException(
          'La entrega histórica no tiene un destinatario coherente; no se corrige silenciosamente.',
        );
      this.assignDelivery(d, dto);
      d.updatedBy = user;
      await em.flush();
      return deliveryResponse(d);
    });
  }
}
