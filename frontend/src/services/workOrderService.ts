import { api } from "./api";
import type { Client } from "./clientService";
import type { Request } from "./requestService";
import type { Quotation } from "./quotationService";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WorkOrderStatus =
  | "PENDING"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface WorkOrder {
  id: number;
  workOrderNumber: number;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  // Relaciones con entidades padre para trazabilidad completa del expediente
  clientId: number;
  client?: Client;
  requestId?: number;
  request?: Request;
  quotationId?: number;
  quotation?: Quotation;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  createdById?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateWorkOrderDto = Omit<
  WorkOrder,
  "id" | "client" | "request" | "quotation" | "createdAt" | "updatedAt"
>;
export type UpdateWorkOrderDto = Partial<CreateWorkOrderDto>;

export const workOrderService = {
  getAll(): Promise<WorkOrder[]> {
    return api.get<WorkOrder[]>("/work-orders");
  },
  getById(id: number | string): Promise<WorkOrder> {
    return api.get<WorkOrder>(`/work-orders/${id}`);
  },
  create(data: CreateWorkOrderDto): Promise<WorkOrder> {
    return api.post<WorkOrder>("/work-orders", data);
  },
  update(id: number | string, data: UpdateWorkOrderDto): Promise<WorkOrder> {
    return api.put<WorkOrder>(`/work-orders/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/work-orders/${id}`);
  },
};

export default workOrderService;
