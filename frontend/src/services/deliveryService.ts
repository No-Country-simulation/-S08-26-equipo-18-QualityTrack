import { api } from "./api";
import type { Client } from "./clientService";
import type { WorkOrder } from "./workOrderService";

export interface Delivery {
  id: number;
  clientId?: number | null;
  client?: Pick<Client, "id" | "businessName" | "taxId" | "isActive"> | null;
  workOrderId: number;
  workOrder?: Pick<WorkOrder, "id" | "workOrderNumber" | "title" | "status">;
  deliveryDate: string;
  quantity: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  updatedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export type CreateDeliveryDto = {
  workOrderId: number;
  deliveryDate: string;
  quantity: number;
  notes?: string | null;
};
export type UpdateDeliveryDto = Partial<CreateDeliveryDto>;

export const deliveryService = {
  getWorkOrders(): Promise<WorkOrder[]> {
    return api.get<WorkOrder[]>("/deliveries/work-orders");
  },
  getAll(): Promise<Delivery[]> {
    return api.get<Delivery[]>("/deliveries");
  },
  getByWorkOrder(workOrderId: number | string): Promise<Delivery[]> {
    return api.get<Delivery[]>(`/deliveries/work-order/${workOrderId}`);
  },
  getById(id: number | string): Promise<Delivery> {
    return api.get<Delivery>(`/deliveries/${id}`);
  },
  create(data: CreateDeliveryDto): Promise<Delivery> {
    return api.post<Delivery>("/deliveries", data);
  },
  update(id: number | string, data: UpdateDeliveryDto): Promise<Delivery> {
    return api.put<Delivery>(`/deliveries/${id}`, data);
  },
};

export default deliveryService;
