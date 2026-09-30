import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export interface WorkOrderAssignedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface WorkOrderUser {
  id: number;
  workOrderId: number;
  workOrder?: WorkOrder;
  userId: number;
  user?: WorkOrderAssignedUser;
  role?: string;
  shift?: string;
  notes?: string;
  assignedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignWorkOrderUserDto = {
  workOrderId: number;
  userId: number;
  role?: string;
  shift?: string;
  notes?: string;
};

export type UpdateWorkOrderUserDto = Partial<AssignWorkOrderUserDto>;

export const workOrderUserService = {
  getAll(): Promise<WorkOrderUser[]> {
    return api.get<WorkOrderUser[]>("/work-order-users");
  },
  getById(id: number | string): Promise<WorkOrderUser> {
    return api.get<WorkOrderUser>(`/work-order-users/${id}`);
  },
  getByWorkOrder(workOrderId: number | string): Promise<WorkOrderUser[]> {
    return api.get<WorkOrderUser[]>(`/work-orders/${workOrderId}/users`);
  },
  assign(data: AssignWorkOrderUserDto): Promise<WorkOrderUser> {
    return api.post<WorkOrderUser>("/work-order-users", data);
  },
  update(
    id: number | string,
    data: UpdateWorkOrderUserDto,
  ): Promise<WorkOrderUser> {
    return api.put<WorkOrderUser>(`/work-order-users/${id}`, data);
  },
  unassign(id: number | string): Promise<void> {
    return api.delete<void>(`/work-order-users/${id}`);
  },
};

export default workOrderUserService;
