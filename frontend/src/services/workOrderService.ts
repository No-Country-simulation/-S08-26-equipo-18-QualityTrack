import { api } from "./api";
import type { Client } from "./clientService";
import type { Request } from "./requestService";
import type { Quotation } from "./quotationService";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WorkOrderStatus =
  "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface WorkOrder {
  id: number;
  workOrderNumber: number;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  // Relaciones con entidades padre para trazabilidad completa del expediente
  clientId: number | null;
  client?: Client | null;
  requestId?: number | null;
  request?: Request | null;
  quotationId?: number | null;
  quotation?: Quotation | null;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  createdById?: number;
  createdAt: string;
  updatedAt: string | null;
}

export type CreateWorkOrderDto = Pick<
  WorkOrder,
  "title" | "description" | "priority" | "plannedStartDate" | "plannedEndDate"
> & { quotationId: number };
export type UpdateWorkOrderDto = Partial<
  Pick<
    WorkOrder,
    | "title"
    | "description"
    | "priority"
    | "plannedStartDate"
    | "plannedEndDate"
    | "actualStartDate"
    | "actualEndDate"
    | "status"
  >
>;
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
};

export default workOrderService;
