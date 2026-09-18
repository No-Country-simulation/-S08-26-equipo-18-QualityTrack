import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export interface QualityControl {
  id: number;
  workOrderId: number;
  workOrder?: WorkOrder;
  operationId?: number;
  specification?: string;
  measuredValue?: string;
  expectedValue?: string;
  unit?: string;
  observations?: string;
  performedById?: number;
  performedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateQualityControlDto = Omit<
  QualityControl,
  "id" | "workOrder" | "createdAt" | "updatedAt"
>;
export type UpdateQualityControlDto = Partial<CreateQualityControlDto>;

export const qualityService = {
  getAll(): Promise<QualityControl[]> {
    return api.get<QualityControl[]>("/quality");
  },
  getByWorkOrder(workOrderId: number | string): Promise<QualityControl[]> {
    return api.get<QualityControl[]>(`/quality/work-order/${workOrderId}`);
  },
  getById(id: number | string): Promise<QualityControl> {
    return api.get<QualityControl>(`/quality/${id}`);
  },
  create(data: CreateQualityControlDto): Promise<QualityControl> {
    return api.post<QualityControl>("/quality", data);
  },
  update(
    id: number | string,
    data: UpdateQualityControlDto,
  ): Promise<QualityControl> {
    return api.put<QualityControl>(`/quality/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/quality/${id}`);
  },
};

export default qualityService;
