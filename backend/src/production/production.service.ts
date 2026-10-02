import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode, UniqueConstraintViolationException } from '@mikro-orm/core';
import { WorkOrder } from '../entities/WorkOrder';
import { WorkOrderStatus as Status } from '../entities/WorkOrderStatus';
import { Approval } from '../entities/Approval';
import { ApprovalStatus } from '../entities/ApprovalStatus';
import { RouteSheet } from '../entities/RouteSheet';
import { Operation } from '../entities/Operation';
import { Material } from '../entities/Material';
import { WorkOrderMaterial } from '../entities/WorkOrderMaterial';
import { WorkOrderUser } from '../entities/WorkOrderUser';
import { User } from '../entities/User';
import { hasPermission, Permission } from '../auth/permissions';
import { decimalCents, decimalText } from '../commercial/decimal';
import {
  CreateMaterialDto,
  CreateRouteSheetDto,
  UpdateRouteSheetDto,
  CreateOperationDto,
  UpdateOperationDto,
  OperationExecutionDto,
  AssignMaterialDto,
  UpdateAssignedMaterialDto,
  AssignPersonnelDto,
} from './production.dto';

const person = (user?: User | null) =>
  user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        isActive: user.isActive,
      }
    : null;
const materialResponse = (m: Material) => ({
  id: m.id,
  materialCode: m.materialCode,
  name: m.name,
  specification: m.specification ?? null,
  manufacturer: m.manufacturer ?? null,
});
const sheetResponse = (s: RouteSheet) => ({
  id: s.id,
  workOrderId: s.workOrder.id,
  routeNumber: s.routeNumber,
  instructions: s.instructions ?? null,
  createdById: s.createdBy.id,
  createdBy: person(s.createdBy),
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt?.toISOString() ?? null,
});
const operationResponse = (o: Operation) => ({
  id: o.id,
  routeSheetId: o.routeSheet.id,
  workOrderId: o.routeSheet.workOrder.id,
  operationNumber: o.operationNumber,
  name: o.name,
  description: o.description ?? null,
  machine: o.machine ?? null,
  plannedStart: o.plannedStart?.toISOString() ?? null,
  plannedEnd: o.plannedEnd?.toISOString() ?? null,
  actualStart: o.actualStart?.toISOString() ?? null,
  actualEnd: o.actualEnd?.toISOString() ?? null,
  notes: o.notes ?? null,
  createdBy: person(o.createdBy),
  executedBy: person(o.executedBy),
});
const assignmentResponse = (a: WorkOrderMaterial) => ({
  id: a.id,
  workOrderId: a.workOrder.id,
  materialId: a.material.id,
  material: materialResponse(a.material),
  materialName: a.material.name,
  specification: a.material.specification ?? null,
  lotNumber: a.lotNumber ?? null,
  quantity: a.quantity,
  unit: a.unit ?? null,
  certificateNumber: a.certificateNumber ?? null,
  receivedAt: a.receivedAt?.toISOString() ?? null,
  notes: a.notes ?? null,
  assignedBy: person(a.assignedBy),
});
const personnelResponse = (a: WorkOrderUser) => ({
  id: a.id,
  workOrderId: a.workOrder.id,
  userId: a.user.id,
  user: person(a.user),
  assignedAt: a.assignedAt.toISOString(),
  assignedBy: person(a.assignedBy),
  unassignedAt: a.unassignedAt?.toISOString() ?? null,
  unassignedBy: person(a.unassignedBy),
});

@Injectable()
export class ProductionService {
  constructor(private readonly em: EntityManager) {}
  private id(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647)
      throw new BadRequestException('ID inválido.');
  }
  private async order(em: EntityManager, id: number, write = false) {
    this.id(id);
    const wo = await em.findOne(
      WorkOrder,
      { id },
      write ? { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true } : {},
    );
    if (!wo) throw new NotFoundException('La OT no existe.');
    if (write && [Status.COMPLETED, Status.CANCELLED].includes(wo.status))
      throw new ConflictException(
        'La OT está cerrada y conserva su historial.',
      );
    return wo;
  }
  private async writable(em: EntityManager, id: number) {
    const wo = await this.order(em, id, true);
    if (!wo.quotation)
      throw new ConflictException(
        'La OT histórica no tiene un origen documentado.',
      );
    return wo;
  }
  private nonempty(dto: object) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('Indicá al menos un campo.');
  }
  private async write<T>(
    userId: number,
    permission: Permission,
    action: (em: EntityManager, user: User) => Promise<T>,
  ): Promise<T> {
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
    } catch (e) {
      if (e instanceof UniqueConstraintViolationException)
        throw new ConflictException('Código o asignación duplicados.');
      throw e;
    }
  }
  async materials() {
    return (
      await this.em.find(Material, {}, { orderBy: { materialCode: 'asc' } })
    ).map(materialResponse);
  }
  async material(id: number) {
    this.id(id);
    const m = await this.em.findOne(Material, { id });
    if (!m) throw new NotFoundException('El material no existe.');
    return materialResponse(m);
  }
  async createMaterial(dto: CreateMaterialDto, userId: number) {
    return this.write(userId, 'workOrders:plan', async (em) => {
      const m = new Material();
      m.materialCode = dto.materialCode;
      m.name = dto.name;
      m.specification = dto.specification ?? undefined;
      m.manufacturer = dto.manufacturer ?? undefined;
      await em.persist(m).flush();
      return materialResponse(m);
    });
  }
  async sheets(workOrderId?: number) {
    if (workOrderId !== undefined) await this.order(this.em, workOrderId);
    return (
      await this.em.find(
        RouteSheet,
        workOrderId === undefined ? {} : { workOrder: workOrderId },
        { populate: ['createdBy.role'], orderBy: { id: 'asc' } },
      )
    ).map(sheetResponse);
  }
  async sheet(id: number) {
    this.id(id);
    const s = await this.em.findOne(
      RouteSheet,
      { id },
      { populate: ['createdBy.role'] },
    );
    if (!s) throw new NotFoundException('La hoja de ruta no existe.');
    return sheetResponse(s);
  }
  async createSheet(dto: CreateRouteSheetDto, userId: number) {
    return this.write(userId, 'workOrders:plan', async (em, user) => {
      const wo = await this.writable(em, dto.workOrderId);
      const [row] = await em
        .getConnection()
        .execute("select nextval('route_sheet_number_seq')::text as value");
      const s = new RouteSheet();
      s.workOrder = wo;
      s.routeNumber = `HR-${row.value.padStart(6, '0')}`;
      s.instructions = dto.instructions ?? undefined;
      s.createdBy = user;
      await em.persist(s).flush();
      return sheetResponse(s);
    });
  }
  async updateSheet(id: number, dto: UpdateRouteSheetDto, userId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(userId, 'workOrders:plan', async (em) => {
      const s = await em.findOne(
        RouteSheet,
        { id },
        { populate: ['createdBy.role'] },
      );
      if (!s) throw new NotFoundException('La hoja de ruta no existe.');
      await this.writable(em, s.workOrder.id);
      if (dto.instructions !== undefined) s.instructions = dto.instructions;
      await em.flush();
      return sheetResponse(s);
    });
  }
  async operations(routeSheetId?: number) {
    if (routeSheetId !== undefined) await this.sheet(routeSheetId);
    return (
      await this.em.find(
        Operation,
        routeSheetId === undefined ? {} : { routeSheet: routeSheetId },
        {
          populate: [
            'routeSheet.workOrder',
            'createdBy.role',
            'executedBy.role',
          ],
          orderBy: { id: 'asc' },
        },
      )
    ).map(operationResponse);
  }
  async operation(id: number) {
    this.id(id);
    const o = await this.em.findOne(
      Operation,
      { id },
      {
        populate: ['routeSheet.workOrder', 'createdBy.role', 'executedBy.role'],
      },
    );
    if (!o) throw new NotFoundException('La operación no existe.');
    return operationResponse(o);
  }
  private assignPlan(o: Operation, dto: UpdateOperationDto) {
    for (const key of ['name', 'description', 'machine', 'notes'] as const)
      if (dto[key] !== undefined) o[key] = dto[key] as string;
    for (const key of ['plannedStart', 'plannedEnd'] as const)
      if (dto[key] !== undefined)
        o[key] = dto[key] === null ? null : new Date(dto[key]!);
    if (o.plannedEnd && (!o.plannedStart || o.plannedEnd < o.plannedStart))
      throw new BadRequestException(
        'El fin planificado requiere un inicio anterior o igual.',
      );
  }
  async createOperation(dto: CreateOperationDto, userId: number) {
    return this.write(userId, 'workOrders:plan', async (em, user) => {
      const s = await em.findOne(RouteSheet, { id: dto.routeSheetId });
      if (!s) throw new NotFoundException('La hoja de ruta no existe.');
      await this.writable(em, s.workOrder.id);
      const [row] = await em
        .getConnection()
        .execute(
          "select coalesce(max(substring(operation_number from '^OP-([0-9]+)$')::bigint),0)+1 as value from operation where route_sheet_id=?",
          [s.id],
        );
      const o = new Operation();
      o.routeSheet = s;
      o.operationNumber = `OP-${String(row.value).padStart(3, '0')}`;
      o.createdBy = user;
      this.assignPlan(o, dto);
      await em.persist(o).flush();
      return operationResponse(o);
    });
  }
  async updateOperation(id: number, dto: UpdateOperationDto, userId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(userId, 'workOrders:plan', async (em) => {
      const o = await em.findOne(
        Operation,
        { id },
        {
          populate: [
            'routeSheet.workOrder',
            'createdBy.role',
            'executedBy.role',
          ],
        },
      );
      if (!o) throw new NotFoundException('La operación no existe.');
      await this.writable(em, o.routeSheet.workOrder.id);
      await em.refresh(o);
      if (o.actualStart)
        throw new ConflictException(
          'La operación iniciada conserva su planificación.',
        );
      this.assignPlan(o, dto);
      await em.flush();
      return operationResponse(o);
    });
  }
  async execute(id: number, dto: OperationExecutionDto, userId: number) {
    this.id(id);
    this.nonempty(dto);
    return this.write(userId, 'workOrders:execute', async (em, user) => {
      const o = await em.findOne(
        Operation,
        { id },
        {
          populate: [
            'routeSheet.workOrder',
            'createdBy.role',
            'executedBy.role',
          ],
        },
      );
      if (!o) throw new NotFoundException('La operación no existe.');
      const wo = await this.writable(em, o.routeSheet.workOrder.id);
      await em.refresh(o);
      const approval = await em.findOne(Approval, { workorder: wo.id });
      if (
        ![Status.APPROVED, Status.IN_PROGRESS].includes(wo.status) ||
        approval?.status !== ApprovalStatus.APPROVED
      )
        throw new ConflictException(
          'La ejecución requiere aprobación interna.',
        );
      const start =
        dto.actualStart === undefined
          ? o.actualStart
          : new Date(dto.actualStart);
      const end =
        dto.actualEnd === undefined ? o.actualEnd : new Date(dto.actualEnd);
      if (!start || (end && end < start))
        throw new BadRequestException(
          'El fin real requiere un inicio anterior o igual.',
        );
      if (
        (o.actualStart &&
          dto.actualStart !== undefined &&
          start.getTime() !== o.actualStart.getTime()) ||
        (o.actualEnd &&
          dto.actualEnd !== undefined &&
          end?.getTime() !== o.actualEnd.getTime())
      )
        throw new ConflictException(
          'Las fechas de ejecución registradas son inmutables.',
        );
      if (start.getTime() > Date.now() || (end && end.getTime() > Date.now()))
        throw new BadRequestException(
          'Una fecha real no puede estar en el futuro.',
        );
      if (!o.actualStart || (!o.actualEnd && end)) {
        o.actualStart = start;
        o.actualEnd = end;
        o.executedBy = user;
      }
      if (wo.status === Status.APPROVED) {
        wo.status = Status.IN_PROGRESS;
        wo.actualStartDate = start;
      } else if (!wo.actualStartDate || start < wo.actualStartDate)
        wo.actualStartDate = start;
      await em.flush();
      return operationResponse(o);
    });
  }
  async assignedMaterials(workOrderId?: number) {
    if (workOrderId !== undefined) await this.order(this.em, workOrderId);
    return (
      await this.em.find(
        WorkOrderMaterial,
        workOrderId === undefined ? {} : { workOrder: workOrderId },
        { populate: ['material', 'assignedBy.role'], orderBy: { id: 'asc' } },
      )
    ).map(assignmentResponse);
  }
  async assignedMaterial(id: number) {
    this.id(id);
    const a = await this.em.findOne(
      WorkOrderMaterial,
      { id },
      { populate: ['material', 'assignedBy.role'] },
    );
    if (!a) throw new NotFoundException('La partida no existe.');
    return assignmentResponse(a);
  }
  private assignMaterialFields(
    a: WorkOrderMaterial,
    dto: UpdateAssignedMaterialDto,
  ) {
    if (dto.quantity !== undefined)
      a.quantity = decimalText(decimalCents(dto.quantity));
    for (const key of [
      'lotNumber',
      'unit',
      'certificateNumber',
      'notes',
    ] as const)
      if (dto[key] !== undefined) a[key] = dto[key];
    if (dto.receivedAt !== undefined)
      a.receivedAt = dto.receivedAt === null ? null : new Date(dto.receivedAt);
  }
  async assignMaterial(dto: AssignMaterialDto, userId: number) {
    return this.write(userId, 'workOrders:plan', async (em, user) => {
      const wo = await this.writable(em, dto.workOrderId);
      const material = await em.findOne(Material, { id: dto.materialId });
      if (!material) throw new NotFoundException('El material no existe.');
      const a = new WorkOrderMaterial();
      a.workOrder = wo;
      a.material = material;
      a.assignedBy = user;
      this.assignMaterialFields(a, dto);
      await em.persist(a).flush();
      return assignmentResponse(a);
    });
  }
  async updateMaterial(
    id: number,
    dto: UpdateAssignedMaterialDto,
    userId: number,
  ) {
    this.id(id);
    this.nonempty(dto);
    return this.write(userId, 'workOrders:plan', async (em) => {
      const a = await em.findOne(
        WorkOrderMaterial,
        { id },
        { populate: ['material', 'assignedBy.role'] },
      );
      if (!a) throw new NotFoundException('La partida no existe.');
      await this.writable(em, a.workOrder.id);
      await em.refresh(a);
      this.assignMaterialFields(a, dto);
      await em.flush();
      return assignmentResponse(a);
    });
  }
  async availablePersonnel() {
    return (
      await this.em.find(
        User,
        { isActive: true },
        { populate: ['role'], orderBy: { lastName: 'asc', firstName: 'asc' } },
      )
    ).map(person);
  }
  async personnel(workOrderId?: number) {
    if (workOrderId !== undefined) await this.order(this.em, workOrderId);
    return (
      await this.em.find(
        WorkOrderUser,
        workOrderId === undefined ? {} : { workOrder: workOrderId },
        {
          populate: ['user.role', 'assignedBy.role', 'unassignedBy.role'],
          orderBy: { id: 'asc' },
        },
      )
    ).map(personnelResponse);
  }
  async assignedPerson(id: number) {
    this.id(id);
    const a = await this.em.findOne(
      WorkOrderUser,
      { id },
      { populate: ['user.role', 'assignedBy.role', 'unassignedBy.role'] },
    );
    if (!a) throw new NotFoundException('La asignación no existe.');
    return personnelResponse(a);
  }
  async assignPersonnel(dto: AssignPersonnelDto, userId: number) {
    return this.write(userId, 'workOrders:assign', async (em, actor) => {
      const wo = await this.writable(em, dto.workOrderId);
      const user = await em.findOne(
        User,
        { id: dto.userId },
        { lockMode: LockMode.PESSIMISTIC_READ, refresh: true },
      );
      if (!user) throw new NotFoundException('El usuario no existe.');
      if (!user.isActive)
        throw new ConflictException('El usuario está inactivo.');
      await em.populate(user, ['role']);
      if (
        await em.findOne(WorkOrderUser, {
          workOrder: wo.id,
          user: user.id,
          unassignedAt: null,
        })
      )
        throw new ConflictException('El usuario ya está asignado a esta OT.');
      const a = new WorkOrderUser();
      a.workOrder = wo;
      a.user = user;
      a.assignedBy = actor;
      await em.persist(a).flush();
      return personnelResponse(a);
    });
  }
  async unassign(id: number, userId: number) {
    this.id(id);
    return this.write(userId, 'workOrders:assign', async (em, actor) => {
      const a = await em.findOne(
        WorkOrderUser,
        { id },
        { populate: ['user.role', 'assignedBy.role', 'unassignedBy.role'] },
      );
      if (!a) throw new NotFoundException('La asignación no existe.');
      await this.writable(em, a.workOrder.id);
      await em.refresh(a);
      if (!a.unassignedAt) {
        a.unassignedAt = new Date();
        a.unassignedBy = actor;
        await em.flush();
      }
      return personnelResponse(a);
    });
  }
}
