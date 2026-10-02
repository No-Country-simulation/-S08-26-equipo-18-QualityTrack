import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export interface WorkOrderAssignedUser {
  id: number;
  firstName: string;
  lastName: string;
  role?: string;
  isActive: boolean;
}

export interface WorkOrderUser {
  id: number;
  workOrderId: number;
  workOrder?: WorkOrder;
  userId: number;
  user?: WorkOrderAssignedUser;
  assignedAt: string;
  assignedBy?: WorkOrderAssignedUser | null;
  unassignedAt?: string | null;
  unassignedBy?: WorkOrderAssignedUser | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignWorkOrderUserDto = {
  workOrderId: number;
  userId: number;
};

export const workOrderUserService = {
  getAvailable(): Promise<WorkOrderAssignedUser[]> {
    return api.get<WorkOrderAssignedUser[]>("/work-order-users/available");
  },
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
  unassign(id: number | string): Promise<WorkOrderUser> {
    return api.patch<WorkOrderUser>(`/work-order-users/${id}/unassign`, {});
  },
};

export default workOrderUserService;
