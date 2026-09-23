import type { QualityControl } from "../../services/qualityService";
import { MOCK_WORK_ORDERS } from "./mockWorkOrders";

export const MOCK_QUALITY_CONTROLS: QualityControl[] = [
  {
    id: 1,
    workOrderId: 1,
    workOrder: MOCK_WORK_ORDERS[0],
    specification: "Control dimensional de diametro de pista h7",
    expectedValue: "45.000 ± 0.015",
    measuredValue: "45.008",
    unit: "mm",
    observations:
      "Medicion realizada con micrometro milesimal calibrado. Dentro de tolerancia de plano.",
    performedAt: "2026-03-03T10:00:00Z",
    createdAt: "2026-03-03T10:00:00Z",
    updatedAt: "2026-03-03T10:00:00Z",
  },
  {
    id: 2,
    workOrderId: 1,
    workOrder: MOCK_WORK_ORDERS[0],
    specification: "Ensayo de dureza superficial en flancos",
    expectedValue: "58 - 62",
    measuredValue: "60.5",
    unit: "HRC",
    observations:
      "Tratamiento termico de induccion conforme segun durometro Rockwell C.",
    performedAt: "2026-03-04T14:30:00Z",
    createdAt: "2026-03-04T14:30:00Z",
    updatedAt: "2026-03-04T14:30:00Z",
  },
  {
    id: 3,
    workOrderId: 2,
    workOrder: MOCK_WORK_ORDERS[1],
    specification: "Rugosidad superficial de cara de sellado",
    expectedValue: "<= 1.6",
    measuredValue: "1.2",
    unit: "µm",
    observations:
      "Perfilometro de contacto. Cara de asiento sin rayas ni marcas de avance.",
    performedAt: "2026-02-26T11:00:00Z",
    createdAt: "2026-02-26T11:00:00Z",
    updatedAt: "2026-02-26T11:00:00Z",
  },
  {
    id: 4,
    workOrderId: 3,
    workOrder: MOCK_WORK_ORDERS[2],
    specification: "Verificacion de paso y angulo de rosca M24",
    expectedValue: "Paso 3.0 mm (6g)",
    measuredValue: "3.001",
    unit: "mm",
    observations:
      "Calibre pasa / no pasa OK. Filetes conformados sin rebabas.",
    performedAt: "2026-03-01T09:15:00Z",
    createdAt: "2026-03-01T09:15:00Z",
    updatedAt: "2026-03-01T09:15:00Z",
  },
  {
    id: 5,
    workOrderId: 4,
    workOrder: MOCK_WORK_ORDERS[3],
    specification: "Ensayo de particulas magneticas no destructivo",
    expectedValue: "Ausencia de discontinuidades superficiales",
    measuredValue: "Sin defectos",
    unit: "visual",
    observations:
      "Inspeccion bajo luz ultravioleta segun norma ASTM E1444. Aprobado.",
    performedAt: "2026-03-08T16:00:00Z",
    createdAt: "2026-03-08T16:00:00Z",
    updatedAt: "2026-03-08T16:00:00Z",
  },
  {
    id: 6,
    workOrderId: 5,
    workOrder: MOCK_WORK_ORDERS[4],
    specification: "Prueba de estanqueidad hidrostatica",
    expectedValue: ">= 150",
    measuredValue: "155.0",
    unit: "PSI",
    observations:
      "Presion sostenida durante 10 minutos sin caida manometrica ni fugas.",
    performedAt: "2026-03-10T15:00:00Z",
    createdAt: "2026-03-10T15:00:00Z",
    updatedAt: "2026-03-10T15:00:00Z",
  },
];

