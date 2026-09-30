import { api } from "./api";
import type { RouteSheet } from "./routeSheetService";

export interface Operation {
  id: number;
  routeSheetId: number;
  routeSheet?: RouteSheet;
  operationNumber: string;
  name: string;
  description?: string;
  machine?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateOperationDto = Omit<
  Operation,
  "id" | "routeSheet" | "createdAt" | "updatedAt"
>;
export type UpdateOperationDto = Partial<CreateOperationDto>;

export const operationService = {
  getAll(): Promise<Operation[]> {
    return api.get<Operation[]>("/operations");
  },
  getByRouteSheet(routeSheetId: number | string): Promise<Operation[]> {
    return api.get<Operation[]>(`/operations/route-sheet/${routeSheetId}`);
  },
  getById(id: number | string): Promise<Operation> {
    return api.get<Operation>(`/operations/${id}`);
  },
  create(data: CreateOperationDto): Promise<Operation> {
    return api.post<Operation>("/operations", data);
  },
  update(id: number | string, data: UpdateOperationDto): Promise<Operation> {
    return api.put<Operation>(`/operations/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/operations/${id}`);
  },
};

export default operationService;
