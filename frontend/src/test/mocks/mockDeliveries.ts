import type { Delivery } from "../../services/deliveryService";
import { MOCK_CLIENTS } from "./mockClients";
import { MOCK_WORK_ORDERS } from "./mockWorkOrders";

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: 1,
    workOrderId: 2,
    workOrder: MOCK_WORK_ORDERS[1],
    clientId: 1,
    client: MOCK_CLIENTS[0],
    deliveryDate: "2026-02-28T14:00:00Z",
    quantity: 50,
    notes:
      "Despacho completo por Expreso Camionera del Sur. Remito conformado nro. 0001-0004523.",
    createdAt: "2026-02-28T14:00:00Z",
    updatedAt: "2026-02-28T14:00:00Z",
  },
  {
    id: 2,
    workOrderId: 1,
    workOrder: MOCK_WORK_ORDERS[0],
    clientId: 2,
    client: MOCK_CLIENTS[1],
    deliveryDate: "2026-03-05T10:30:00Z",
    quantity: 10,
    notes:
      "Primera entrega parcial para mecanizado de urgencia. Certificado de calidad #QC-1 adjunto.",
    createdAt: "2026-03-05T10:30:00Z",
    updatedAt: "2026-03-05T10:30:00Z",
  },
  {
    id: 3,
    workOrderId: 4,
    workOrder: MOCK_WORK_ORDERS[3],
    clientId: 3,
    client: MOCK_CLIENTS[2],
    deliveryDate: "2026-03-08T16:00:00Z",
    quantity: 15,
    notes:
      "Retiro en planta por chofer de la firma. Piezas embaladas con film anticorrosivo VCI.",
    createdAt: "2026-03-08T16:00:00Z",
    updatedAt: "2026-03-08T16:00:00Z",
  },
  {
    id: 4,
    workOrderId: 3,
    workOrder: MOCK_WORK_ORDERS[2],
    clientId: 4,
    client: MOCK_CLIENTS[3],
    deliveryDate: "2026-03-10T11:15:00Z",
    quantity: 60,
    notes:
      "Entrega parcial 60 de 120 pernos galvanizados en caliente. Control de rosca aprobado.",
    createdAt: "2026-03-10T11:15:00Z",
    updatedAt: "2026-03-10T11:15:00Z",
  },
  {
    id: 5,
    workOrderId: 5,
    workOrder: MOCK_WORK_ORDERS[4],
    clientId: 5,
    client: MOCK_CLIENTS[4],
    deliveryDate: "2026-03-12T09:00:00Z",
    quantity: 4,
    notes:
      "Despacho con ensayo de estanqueidad 3000 PSI aprobado. Protocolo firmado.",
    createdAt: "2026-03-12T09:00:00Z",
    updatedAt: "2026-03-12T09:00:00Z",
  },
  {
    id: 6,
    workOrderId: 1,
    workOrder: MOCK_WORK_ORDERS[0],
    clientId: 2,
    client: MOCK_CLIENTS[1],
    deliveryDate: "2026-03-14T15:45:00Z",
    quantity: 10,
    notes:
      "Segunda entrega y cierre del lote de 20 ejes. Remito final de conformidad.",
    createdAt: "2026-03-14T15:45:00Z",
    updatedAt: "2026-03-14T15:45:00Z",
  },
];
