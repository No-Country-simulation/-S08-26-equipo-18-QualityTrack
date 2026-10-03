import type { RouteSheet } from "../../services/routeSheetService";

export const MOCK_ROUTE_SHEETS: RouteSheet[] = [
  {
    id: 1,
    workOrderId: 1,
    routeNumber: "HR-1001",
    instructions:
      "Secuencia de manufactura: Corte de material bruto, desbaste CNC, mecanizado de estrias, tratamiento termico de temple por induccion y rectificado cilindrico final.",
    createdById: 1,
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-03-02T10:00:00Z",
  },
  {
    id: 2,
    workOrderId: 2,
    routeNumber: "HR-1002",
    instructions:
      "Torneado de refrentado y cilindrado exterior, mecanizado interior a cota H7 y perforado de 8 agujeros de sujecion segun plantilla.",
    createdById: 1,
    createdAt: "2026-02-14T08:30:00Z",
    updatedAt: "2026-02-15T09:00:00Z",
  },
];
