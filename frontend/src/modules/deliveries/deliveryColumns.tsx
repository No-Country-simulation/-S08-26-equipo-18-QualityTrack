import { Box, Text } from "@chakra-ui/react";
import { Badge } from "../../components/Badge";
import type { ColumnDef } from "../../components/DataTable";
import type { Delivery } from "../../services/deliveryService";

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

export const DELIVERY_COLUMNS: ColumnDef<Delivery>[] = [
  {
    header: "Nro. remito",
    accessorKey: "id",
    sortable: true,
    width: "110px",
    cell: (item: Delivery) => (
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="bold"
        color="teal.700"
        bg="teal.50"
        px={2}
        py={1}
        borderRadius="md"
        display="inline-block"
      >
        #REM-{item.id}
      </Text>
    ),
  },
  {
    header: "Orden de trabajo",
    sortable: true,
    cell: (item: Delivery) => (
      <Box>
        <Text
          fontFamily="mono"
          fontSize="xs"
          fontWeight="bold"
          color="blue.700"
          bg="blue.50"
          px={1.5}
          py={0.5}
          borderRadius="sm"
          display="inline-block"
          mb={0.5}
        >
          OT-{item.workOrder?.workOrderNumber || item.workOrderId}
        </Text>
        {item.workOrder?.title && (
          <Text fontSize="xs" color="gray.500" lineClamp={1} maxW="240px">
            {item.workOrder.title}
          </Text>
        )}
      </Box>
    ),
  },
  {
    header: "Cliente destinatario",
    sortable: true,
    cell: (item: Delivery) => (
      <Text fontWeight="semibold" color="gray.800" fontSize="sm">
        {item.client?.businessName || "—"}
      </Text>
    ),
  },
  {
    header: "Fecha de entrega",
    accessorKey: "deliveryDate",
    sortable: true,
    width: "130px",
    cell: (item: Delivery) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.deliveryDate)}
      </Text>
    ),
  },
  {
    header: "Cantidad",
    accessorKey: "quantity",
    sortable: true,
    width: "110px",
    cell: (item: Delivery) => (
      <Badge colorPalette="blue" variant="subtle" size="sm">
        {item.quantity} u.
      </Badge>
    ),
  },
  {
    header: "Notas / transporte",
    accessorKey: "notes",
    sortable: true,
    cell: (item: Delivery) => (
      <Text fontSize="xs" color="gray.600" lineClamp={1} maxW="300px">
        {item.notes || "—"}
      </Text>
    ),
  },
];
