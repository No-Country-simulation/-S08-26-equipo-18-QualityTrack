import type { Approval } from "../../services/approvalService";

export const MOCK_APPROVALS: Approval[] = [
  {
    id: 1,
    workOrderId: 1,
    status: "APPROVED",
    decidedById: 2,
    decidedBy: {
      id: 2,
      name: "Ing. Carlos Mendoza",
      email: "cmendoza@qualitytrack.com",
      role: "Jefe de Planta",
    },
    decisionAt: "2026-03-01T15:30:00Z",
    comments:
      "Cotizacion COT-2026-001 aprobada formalmente con Orden de Compra #4491 recibida de Metalurgica Andina S.A. Se autoriza consumo de materia prima SAE 4140 e inicio de mecanizado.",
    createdAt: "2026-02-28T16:00:00Z",
    updatedAt: "2026-03-01T15:30:00Z",
  },
  {
    id: 2,
    workOrderId: 2,
    status: "APPROVED",
    decidedById: 2,
    decidedBy: {
      id: 2,
      name: "Ing. Carlos Mendoza",
      email: "cmendoza@qualitytrack.com",
      role: "Jefe de Planta",
    },
    decisionAt: "2026-02-14T11:00:00Z",
    comments:
      "Aprobada para ejecucion inmediata segun plano ME-BR-08. Plazo de entrega acordado de 15 dias corridos.",
    createdAt: "2026-02-12T10:00:00Z",
    updatedAt: "2026-02-14T11:00:00Z",
  },
  {
    id: 3,
    workOrderId: 3,
    status: "PENDING",
    comments:
      "A la espera de confirmacion de orden de compra formal y adelanto financiero por parte del cliente.",
    createdAt: "2026-02-20T09:00:00Z",
    updatedAt: "2026-02-20T09:00:00Z",
  },
];
