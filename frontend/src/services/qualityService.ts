import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export interface QualityControl {
  id: number;
  workOrderId: number;
  workOrder?: Pick<WorkOrder, "id" | "workOrderNumber" | "title" | "status">;
  operationId?: number | null;
  operation?: {
    id: number;
    routeSheetId: number;
    operationNumber: string;
    name: string;
  } | null;
  specification?: string | null;
  measuredValue?: string | null;
  expectedValue?: string | null;
  unit?: string | null;
  observations?: string | null;
  performedById?: number;
  performedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  updatedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  performedAt?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export type CreateQualityControlDto = {
  workOrderId: number;
  operationId?: number | null;
  specification: string;
  expectedValue?: string | null;
  measuredValue?: string | null;
  unit?: string | null;
  observations?: string | null;
  performedAt?: string | null;
};
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
};

export default qualityService;
