import { api } from "./api";
import type { WorkOrder } from "./workOrderService";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApprovalUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface Approval {
  id: number;
  workOrderId: number;
  workOrder?: WorkOrder;
  decidedById?: number | null;
  decidedBy?: ApprovalUser | null;
  status: ApprovalStatus;
  decisionAt?: string | null;
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateApprovalDto = {
  workOrderId: number;
  status: "APPROVED" | "REJECTED";
  comments?: string | null;
};

export type DecideApprovalDto = {
  status: "APPROVED" | "REJECTED";
  comments?: string | null;
};

export const approvalService = {
  getAll(): Promise<Approval[]> {
    return api.get<Approval[]>("/approvals");
  },
  getById(id: number | string): Promise<Approval> {
    return api.get<Approval>(`/approvals/${id}`);
  },
  getByWorkOrder(workOrderId: number | string): Promise<Approval | null> {
    return api.get<Approval | null>(`/approvals/work-order/${workOrderId}`);
  },
  create(data: CreateApprovalDto): Promise<Approval> {
    return api.post<Approval>("/approvals", data);
  },
  decide(id: number | string, data: DecideApprovalDto): Promise<Approval> {
    return api.put<Approval>(`/approvals/${id}/decide`, data);
  },
};

export default approvalService;
