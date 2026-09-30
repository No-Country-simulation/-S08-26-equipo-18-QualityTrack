import { api } from "./api";

export interface Material {
  id: number;
  materialCode?: string;
  name: string;
  specification?: string;
  manufacturer?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrderMaterial {
  id: number;
  workOrderId: number;
  materialId?: number;
  materialName: string;
  specification?: string;
  lotNumber?: string;
  quantity: string | number;
  unit?: string;
  certificateNumber?: string;
  supplier?: string;
  receivedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateWorkOrderMaterialDto = {
  workOrderId: number;
  materialId?: number;
  materialName: string;
  specification?: string;
  lotNumber?: string;
  quantity: string | number;
  unit?: string;
  certificateNumber?: string;
  supplier?: string;
  receivedAt?: string;
  notes?: string;
};

export type UpdateWorkOrderMaterialDto = Partial<CreateWorkOrderMaterialDto>;

export const materialService = {
  getAll(): Promise<WorkOrderMaterial[]> {
    return api.get<WorkOrderMaterial[]>("/work-order-materials");
  },
  getById(id: number | string): Promise<WorkOrderMaterial> {
    return api.get<WorkOrderMaterial>(`/work-order-materials/${id}`);
  },
  getByWorkOrder(workOrderId: number | string): Promise<WorkOrderMaterial[]> {
    return api.get<WorkOrderMaterial[]>(`/work-orders/${workOrderId}/materials`);
  },
  assign(data: CreateWorkOrderMaterialDto): Promise<WorkOrderMaterial> {
    return api.post<WorkOrderMaterial>("/work-order-materials", data);
  },
  update(
    id: number | string,
    data: UpdateWorkOrderMaterialDto,
  ): Promise<WorkOrderMaterial> {
    return api.put<WorkOrderMaterial>(`/work-order-materials/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/work-order-materials/${id}`);
  },
};

export default materialService;
