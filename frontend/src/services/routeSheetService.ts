import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export interface RouteSheet {
  id: number;
  workOrderId: number;
  workOrder?: WorkOrder;
  routeNumber: string;
  instructions?: string;
  createdById?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateRouteSheetDto = Omit<
  RouteSheet,
  "id" | "workOrder" | "createdAt" | "updatedAt"
>;
export type UpdateRouteSheetDto = Partial<CreateRouteSheetDto>;

export const routeSheetService = {
  getAll(): Promise<RouteSheet[]> {
    return api.get<RouteSheet[]>("/route-sheets");
  },
  getByWorkOrder(workOrderId: number | string): Promise<RouteSheet[]> {
    return api.get<RouteSheet[]>(`/route-sheets/work-order/${workOrderId}`);
  },
  getById(id: number | string): Promise<RouteSheet> {
    return api.get<RouteSheet>(`/route-sheets/${id}`);
  },
  create(data: CreateRouteSheetDto): Promise<RouteSheet> {
    return api.post<RouteSheet>("/route-sheets", data);
  },
  update(
    id: number | string,
    data: UpdateRouteSheetDto,
  ): Promise<RouteSheet> {
    return api.put<RouteSheet>(`/route-sheets/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/route-sheets/${id}`);
  },
};

export default routeSheetService;
