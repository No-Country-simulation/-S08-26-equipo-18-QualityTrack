import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LockMode, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { WorkOrder } from '../entities/WorkOrder';
import { WorkOrderStatus as Status } from '../entities/WorkOrderStatus';
import { Approval } from '../entities/Approval';
import { ApprovalStatus } from '../entities/ApprovalStatus';
import { Quotation } from '../entities/Quotation';
import { Client } from '../entities/Client';
import { User } from '../entities/User';
import { CommercialService } from '../commercial/commercial.service';
import { hasPermission, Permission } from '../auth/permissions';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  DecideApprovalDto,
} from './work-order.dto';

const actor = (user?: User | null) =>
  user
    ? {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role?.name,
      }
    : null;
const approvalResponse = (record: Approval) => ({
  id: record.id,
  workOrderId: record.workorder.id,
  status: record.status,
  decidedById: record.decidedBy?.id ?? null,
  decidedBy: actor(record.decidedBy),
  decisionAt: record.decisionAt?.toISOString() ?? null,
  comments: record.comments ?? null,
});

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly em: EntityManager,
    private readonly commercial: CommercialService,
  ) {}
  async list() {
    return Promise.all(
      (
        await this.em.find(
          WorkOrder,
          {},
          { populate: ['quotation', 'createdBy'], orderBy: { id: 'desc' } },
        )
      ).map((record) => this.response(record)),
    );
  }
  async get(id: number) {
    return this.response(await this.find(this.em, id));
  }
  private async response(record: WorkOrder) {
    const quotation = record.quotation
      ? await this.commercial.quotation(record.quotation.id)
      : null;
    return {
      id: record.id,
      workOrderNumber: record.workOrderNumber,
      title: record.title,
      description: record.description,
      priority: record.priority,
      status: record.status,
      quotationId: quotation?.id ?? null,
      quotation,
      requestId: quotation?.requestId ?? null,
      request: quotation?.request ?? null,
      clientId: quotation?.clientId ?? null,
      client: quotation?.client ?? null,
      originStatus: quotation ? 'linked' : 'missing',
      createdById: record.createdBy.id,
      createdBy: {
        id: record.createdBy.id,
        firstName: record.createdBy.firstName,
        lastName: record.createdBy.lastName,
      },
      plannedStartDate: record.plannedStartDate.toISOString(),
      plannedEndDate: record.plannedEndDate.toISOString(),
      actualStartDate: record.actualStartDate?.toISOString() ?? null,
      actualEndDate: record.actualEndDate?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt?.toISOString() ?? null,
    };
  }
  async create(dto: CreateWorkOrderDto, userId: number) {
    return this.write(userId, 'workOrders:create', async (em, user) => {
      const initial = await em.findOne(Quotation, { id: dto.quotationId });
      if (!initial) throw new NotFoundException('La cotización no existe.');
      const client = await em.findOneOrFail(
        Client,
        { id: initial.client.id },
        { lockMode: LockMode.PESSIMISTIC_READ },
      );
      const quote = await em.findOneOrFail(
        Quotation,
        { id: initial.id },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
          refresh: true,
        },
      );
      await em.populate(quote, ['request.client']);
      if (!client.isActive)
        throw new ConflictException('El cliente está inactivo.');
      if (
        quote.decisionStatus !== 'accepted' ||
        !quote.decidedBy ||
        !quote.decidedAt
      )
        throw new ConflictException(
          'La cotización debe tener aceptación comercial registrada.',
        );
      if (quote.request.client.id !== client.id)
        throw new ConflictException('El origen comercial es inconsistente.');
      const record = new WorkOrder();
      record.quotation = quote;
      record.createdBy = user;
      record.status = Status.PENDING;
      const [number] = await em
        .getConnection()
        .execute(`select nextval('work_order_number_seq') as number`);
      record.workOrderNumber = Number(number.number);
      this.assign(record, dto);
      em.persist(record);
      const approval = new Approval();
      approval.workorder = record;
      approval.status = ApprovalStatus.PENDING;
      approval.decidedBy = null;
      approval.decisionAt = null;
      await em.persist(approval).flush();
      return this.response(record);
    });
  }
  async update(id: number, dto: UpdateWorkOrderDto, userId: number) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('Indicá al menos un campo.');
    return this.write(userId, 'workOrders:edit', async (em) => {
      const record = await this.find(em, id, true);
      if ([Status.COMPLETED, Status.CANCELLED].includes(record.status))
        throw new ConflictException('La OT está cerrada y conserva sus datos.');
      if (dto.status !== undefined && dto.status !== record.status) {
        if ([Status.PENDING, Status.APPROVED].includes(dto.status))
          throw new ConflictException(
            'La aprobación interna se registra desde su acción específica.',
          );
        if ([Status.IN_PROGRESS, Status.COMPLETED].includes(dto.status)) {
          const approval = await em.findOne(Approval, { workorder: id });
          if (!record.quotation || approval?.status !== ApprovalStatus.APPROVED)
            throw new ConflictException(
              'La ejecución requiere origen documentado y aprobación interna.',
            );
        }
        record.status = dto.status;
      }
      this.assign(record, dto);
      await em.flush();
      return this.response(record);
    });
  }
  private assign(record: WorkOrder, dto: UpdateWorkOrderDto) {
    for (const key of ['title', 'description', 'priority'] as const)
      if (dto[key] !== undefined) (record[key] as string) = dto[key];
    for (const key of [
      'plannedStartDate',
      'plannedEndDate',
      'actualStartDate',
      'actualEndDate',
    ] as const)
      if (dto[key] !== undefined)
        (record[key] as Date | null) =
          dto[key] === null ? null : new Date(dto[key]!);
    if (record.plannedEndDate < record.plannedStartDate)
      throw new BadRequestException(
        'El fin planificado no puede ser anterior al inicio.',
      );
    if (
      record.actualEndDate &&
      (!record.actualStartDate || record.actualEndDate < record.actualStartDate)
    )
      throw new BadRequestException(
        'El fin real requiere un inicio real anterior o igual.',
      );
    if (
      record.status === Status.PENDING &&
      (record.actualStartDate || record.actualEndDate)
    )
      throw new ConflictException(
        'La OT pendiente no puede registrar ejecución.',
      );
    if (record.status === Status.IN_PROGRESS && !record.actualStartDate)
      throw new BadRequestException('Indicá la fecha de inicio real.');
    if (
      record.status === Status.COMPLETED &&
      (!record.actualStartDate || !record.actualEndDate)
    )
      throw new BadRequestException('Completar requiere ambas fechas reales.');
  }
  async approvals() {
    return (
      await this.em.find(
        Approval,
        {},
        { populate: ['decidedBy.role'], orderBy: { id: 'desc' } },
      )
    ).map(approvalResponse);
  }
  async approval(id: number) {
    this.id(id);
    const record = await this.em.findOne(
      Approval,
      { id },
      { populate: ['decidedBy.role'] },
    );
    if (!record) throw new NotFoundException('La aprobación no existe.');
    return approvalResponse(record);
  }
  async approvalFor(workOrderId: number) {
    await this.find(this.em, workOrderId);
    const record = await this.em.findOne(
      Approval,
      { workorder: workOrderId },
      { populate: ['decidedBy.role'] },
    );
    return record ? approvalResponse(record) : null;
  }
  async decide(
    id: number,
    dto: DecideApprovalDto,
    userId: number,
    byWorkOrder = false,
  ) {
    this.id(id);
    return this.write(userId, 'workOrders:approve', async (em, user) => {
      let approval = byWorkOrder ? null : await em.findOne(Approval, { id });
      if (!byWorkOrder && !approval)
        throw new NotFoundException('La aprobación no existe.');
      const record = await this.find(
        em,
        byWorkOrder ? id : approval!.workorder.id,
        true,
      );
      const currentApproval = await em.findOne(
        Approval,
        { workorder: record.id },
        { refresh: true, populate: ['decidedBy.role'] },
      );
      approval = currentApproval;
      if (approval && approval.status !== ApprovalStatus.PENDING) {
        if (approval.status === dto.status) return approvalResponse(approval);
        throw new ConflictException(
          'La aprobación ya tiene una decisión registrada.',
        );
      }
      if (!record.quotation || record.quotation.decisionStatus !== 'accepted')
        throw new ConflictException(
          'La OT histórica no tiene un origen documentado; no se inventa su aprobación.',
        );
      if (record.status !== Status.PENDING)
        throw new ConflictException(
          'La OT ya no está pendiente de aprobación.',
        );
      if (!approval) {
        approval = new Approval();
        approval.workorder = record;
      }
      approval.status = dto.status as ApprovalStatus;
      approval.decidedBy = user;
      approval.decisionAt = new Date();
      approval.comments = dto.comments ?? null;
      record.status =
        dto.status === 'APPROVED' ? Status.APPROVED : Status.CANCELLED;
      await em.persist(approval).flush();
      return approvalResponse(approval);
    });
  }
  private id(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647)
      throw new BadRequestException('ID inválido.');
  }
  private async find(em: EntityManager, id: number, lock = false) {
    this.id(id);
    const record = await em.findOne(
      WorkOrder,
      { id },
      {
        ...(!lock ? { populate: ['quotation', 'createdBy'] as const } : {}),
        ...(lock
          ? { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true }
          : {}),
      },
    );
    if (!record) throw new NotFoundException('La orden de trabajo no existe.');
    if (lock) await em.populate(record, ['quotation', 'createdBy']);
    return record;
  }
  private async write<T>(
    userId: number,
    permission: Permission,
    action: (em: EntityManager, user: User) => Promise<T>,
  ) {
    try {
      return await this.em.transactional(
        async (em) => {
          const user = await em.findOne(
            User,
            { id: userId },
            { populate: ['role'] },
          );
          if (!user?.isActive || !hasPermission(user.role.name, permission))
            throw new ForbiddenException('El rol no permite esta acción.');
          return action(em, user);
        },
        { clear: true },
      );
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException)
        throw new ConflictException('Conflicto de identificador o aprobación.');
      throw error;
    }
  }
}
