import type { WorkOrder } from "../../services/workOrderService";

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 1,
    workOrderNumber: 1001,
    title: "Fabricacion de ejes estriados para reductor",
    description:
      "Mecanizado integral de 20 ejes en acero SAE 4140 bonificado con templado por induccion en zonas de apoyo y rectificado de acabado.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    plannedStartDate: "2026-03-01T08:00:00Z",
    plannedEndDate: "2026-03-15T17:00:00Z",
    actualStartDate: "2026-03-02T08:30:00Z",
    createdAt: "2026-02-25T10:00:00Z",
    updatedAt: "2026-03-02T08:30:00Z",
  },
  {
    id: 2,
    workOrderNumber: 1002,
    title: "Mecanizado de bridas de acero SAE 1045",
    description:
      "Torneado y fresado CNC de 50 bridas segun plano ME-BR-08. Agujereado con plantilla y control dimensional de concentricidad.",
    priority: "MEDIUM",
    status: "COMPLETED",
    plannedStartDate: "2026-02-15T08:00:00Z",
    plannedEndDate: "2026-02-28T17:00:00Z",
    actualStartDate: "2026-02-15T08:00:00Z",
    actualEndDate: "2026-02-27T16:00:00Z",
    createdAt: "2026-02-10T11:00:00Z",
    updatedAt: "2026-02-27T16:00:00Z",
  },
  {
    id: 3,
    workOrderNumber: 1003,
    title: "Pernos de anclaje de alta resistencia",
    description:
      "Roscado por laminacion de 120 pernos M24 x 350mm en acero grado 8.8 con recubrimiento de galvanizado en caliente.",
    priority: "LOW",
    status: "PENDING",
    plannedStartDate: "2026-03-20T08:00:00Z",
    plannedEndDate: "2026-04-05T17:00:00Z",
    createdAt: "2026-02-28T09:30:00Z",
    updatedAt: "2026-02-28T09:30:00Z",
  },
  {
    id: 4,
    workOrderNumber: 1004,
    title: "Engranajes helicoidales Z=38 M=4",
    description:
      "Tallado por generacion y rectificado de perfiles de dientes. Ensayo de particulas magneticas para deteccion de microfisuras.",
    priority: "URGENT",
    status: "IN_PROGRESS",
    plannedStartDate: "2026-03-05T08:00:00Z",
    plannedEndDate: "2026-03-18T17:00:00Z",
    actualStartDate: "2026-03-05T09:00:00Z",
    createdAt: "2026-03-01T14:00:00Z",
    updatedAt: "2026-03-05T09:00:00Z",
  },
  {
    id: 5,
    workOrderNumber: 1005,
    title: "Cuerpos de valvulas esfericas 3 pulgadas",
    description:
      "Mecanizado interno de cavidades y roscado NPT en piezas forjadas de acero inoxidable AISI 316. Prueba hidrostatica a 150 PSI.",
    priority: "HIGH",
    status: "APPROVED",
    plannedStartDate: "2026-03-25T08:00:00Z",
    plannedEndDate: "2026-04-12T17:00:00Z",
    createdAt: "2026-03-03T16:00:00Z",
    updatedAt: "2026-03-03T16:00:00Z",
  },
  {
    id: 6,
    workOrderNumber: 1006,
    title: "Balanceo dinamico de rotor de turbina",
    description:
      "Reparacion de muñones por metalizado y balanceo dinamico en banco segun norma ISO 1940 grado G2.5.",
    priority: "LOW",
    status: "CANCELLED",
    plannedStartDate: "2026-02-01T08:00:00Z",
    plannedEndDate: "2026-02-10T17:00:00Z",
    actualStartDate: "2026-02-01T08:00:00Z",
    actualEndDate: "2026-02-03T12:00:00Z",
    createdAt: "2026-01-28T10:00:00Z",
    updatedAt: "2026-02-03T12:00:00Z",
  },
];

