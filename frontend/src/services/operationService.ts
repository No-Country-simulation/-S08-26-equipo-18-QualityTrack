import { api } from "./api";
import type { RouteSheet } from "./routeSheetService";

export interface Operation {
  id: number;
  routeSheetId: number;
  routeSheet?: RouteSheet;
  operationNumber: string;
  name: string;
  description?: string | null;
  machine?: string | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  notes?: string | null;
  createdBy?: import("./workOrderUserService").WorkOrderAssignedUser | null;
  executedBy?: import("./workOrderUserService").WorkOrderAssignedUser | null;
}

export type CreateOperationDto = Pick<
  Operation,
  | "routeSheetId"
  | "name"
  | "description"
  | "machine"
  | "plannedStart"
  | "plannedEnd"
  | "notes"
>;
export type UpdateOperationDto = Partial<
  Omit<CreateOperationDto, "routeSheetId">
>;

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
  execute(
    id: number | string,
    data: { actualStart?: string; actualEnd?: string },
  ): Promise<Operation> {
    return api.patch<Operation>(`/operations/${id}/execution`, data);
  },
};

export default operationService;
