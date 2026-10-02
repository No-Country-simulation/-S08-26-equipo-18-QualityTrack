import { api } from "./api";

export interface Material {
  id: number;
  materialCode: string;
  name: string;
  specification?: string | null;
  manufacturer?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrderMaterial {
  id: number;
  workOrderId: number;
  materialId: number;
  material: Material;
  materialName: string;
  specification?: string | null;
  lotNumber?: string | null;
  quantity: string | number;
  unit?: string | null;
  certificateNumber?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  assignedBy?: import("./workOrderUserService").WorkOrderAssignedUser | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateWorkOrderMaterialDto = {
  workOrderId: number;
  materialId: number;
  lotNumber?: string | null;
  quantity: string | number;
  unit?: string | null;
  certificateNumber?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
};

export type UpdateWorkOrderMaterialDto = Partial<
  Omit<CreateWorkOrderMaterialDto, "workOrderId" | "materialId">
>;

export const materialService = {
  getCatalogue(): Promise<Material[]> {
    return api.get<Material[]>("/materials");
  },
  createMaterial(
    data: Omit<Material, "id" | "createdAt" | "updatedAt">,
  ): Promise<Material> {
    return api.post<Material>("/materials", data);
  },
  getAll(): Promise<WorkOrderMaterial[]> {
    return api.get<WorkOrderMaterial[]>("/work-order-materials");
  },
  getById(id: number | string): Promise<WorkOrderMaterial> {
    return api.get<WorkOrderMaterial>(`/work-order-materials/${id}`);
  },
  getByWorkOrder(workOrderId: number | string): Promise<WorkOrderMaterial[]> {
    return api.get<WorkOrderMaterial[]>(
      `/work-orders/${workOrderId}/materials`,
    );
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
};

export default materialService;
