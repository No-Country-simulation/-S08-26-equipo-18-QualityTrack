import { Box, Text } from "@chakra-ui/react";
import type { ColumnDef } from "../../components/DataTable";
import type { WorkOrder } from "../../services/workOrderService";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

export function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export const WORK_ORDER_COLUMNS: ColumnDef<WorkOrder>[] = [
  {
    header: "Nro. OT",
    accessorKey: "workOrderNumber",
    sortable: true,
    width: "120px",
    cell: (item: WorkOrder) => (
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="bold"
        color="blue.700"
        bg="blue.50"
        px={2}
        py={1}
        borderRadius="md"
        display="inline-block"
      >
        OT-{item.workOrderNumber}
      </Text>
    ),
  },
  {
    header: "Titulo",
    accessorKey: "title",
    sortable: true,
    cell: (item: WorkOrder) => (
      <Box>
        <Text fontWeight="semibold" color="gray.800" fontSize="sm">
          {item.title}
        </Text>
        {item.description && (
          <Text fontSize="xs" color="gray.500" lineClamp={1} maxW="380px">
            {item.description}
          </Text>
        )}
      </Box>
    ),
  },
  {
    header: "Prioridad",
    accessorKey: "priority",
    sortable: true,
    width: "110px",
    cell: (item: WorkOrder) => <PriorityBadge priority={item.priority} />,
  },
  {
    header: "Estado",
    accessorKey: "status",
    sortable: true,
    width: "120px",
    cell: (item: WorkOrder) => <StatusBadge status={item.status} />,
  },
  {
    header: "Inicio planificado",
    accessorKey: "plannedStartDate",
    sortable: true,
    width: "140px",
    cell: (item: WorkOrder) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.plannedStartDate)}
      </Text>
    ),
  },
  {
    header: "Fin planificado",
    accessorKey: "plannedEndDate",
    sortable: true,
    width: "140px",
    cell: (item: WorkOrder) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.plannedEndDate)}
      </Text>
    ),
  },
];

