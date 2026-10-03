import type {
  WorkOrderAssignedUser,
  WorkOrderUser,
} from "../../services/workOrderUserService";

export const MOCK_AVAILABLE_OPERATORS: WorkOrderAssignedUser[] = [
  {
    id: 101,
    firstName: "Juan",
    lastName: "Perez",
    isActive: true,
    role: "Operador CNC Senior",
  },
  {
    id: 102,
    firstName: "Roberto",
    lastName: "Gomez",
    isActive: true,
    role: "Tornero Matricero",
  },
  {
    id: 103,
    firstName: "Marcos",
    lastName: "Benitez",
    isActive: true,
    role: "Fresador CNC",
  },
  {
    id: 104,
    firstName: "Laura",
    lastName: "Gutierrez",
    isActive: true,
    role: "Inspectora de Calidad",
  },
  {
    id: 105,
    firstName: "Esteban",
    lastName: "Rossi",
    isActive: true,
    role: "Ajustador Mecanico",
  },
  {
    id: 106,
    firstName: "Carlos",
    lastName: "Mendoza",
    isActive: true,
    role: "Supervisor de Planta",
  },
];

export const MOCK_WORK_ORDER_USERS: WorkOrderUser[] = [
  {
    id: 1,
    workOrderId: 1,
    userId: 101,
    user: MOCK_AVAILABLE_OPERATORS[0],

    assignedAt: "2026-03-01T08:00:00Z",

  },
  {
    id: 2,
    workOrderId: 1,
    userId: 102,
    user: MOCK_AVAILABLE_OPERATORS[1],

    assignedAt: "2026-03-01T08:30:00Z",

  },
  {
    id: 3,
    workOrderId: 1,
    userId: 104,
    user: MOCK_AVAILABLE_OPERATORS[3],

    assignedAt: "2026-03-01T14:30:00Z",

  },
  {
    id: 4,
    workOrderId: 2,
    userId: 103,
    user: MOCK_AVAILABLE_OPERATORS[2],

    assignedAt: "2026-02-15T07:30:00Z",

  },
  {
    id: 5,
    workOrderId: 2,
    userId: 105,
    user: MOCK_AVAILABLE_OPERATORS[4],

    assignedAt: "2026-02-15T15:00:00Z",

  },
  {
    id: 6,
    workOrderId: 3,
    userId: 101,
    user: MOCK_AVAILABLE_OPERATORS[0],

    assignedAt: "2026-02-21T22:30:00Z",

  },
];
