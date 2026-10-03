import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export interface RouteSheet {
  id: number;
  workOrderId: number;
  workOrder?: WorkOrder;
  routeNumber: string;
  instructions?: string | null;
  createdById?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export type CreateRouteSheetDto = Pick<
  RouteSheet,
  "workOrderId" | "instructions"
>;
export type UpdateRouteSheetDto = Pick<CreateRouteSheetDto, "instructions">;

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
  update(id: number | string, data: UpdateRouteSheetDto): Promise<RouteSheet> {
    return api.put<RouteSheet>(`/route-sheets/${id}`, data);
  },
};

export default routeSheetService;
