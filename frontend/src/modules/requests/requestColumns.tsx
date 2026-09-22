import { Box, Text } from "@chakra-ui/react";
import type { ColumnDef } from "../../components/DataTable";
import type { Request } from "../../services/requestService";

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

export const REQUEST_COLUMNS: ColumnDef<Request>[] = [
  {
    header: "Nro. solicitud",
    accessorKey: "requestNumber",
    sortable: true,
    width: "160px",
    cell: (item: Request) => (
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
        {item.requestNumber}
      </Text>
    ),
  },
  {
    header: "Titulo",
    accessorKey: "title",
    sortable: true,
    cell: (item: Request) => (
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
    header: "Cliente",
    sortable: true,
    cell: (item: Request) => (
      <Text fontWeight="medium" color="gray.700" fontSize="sm">
        {item.client?.businessName || `Cliente #${item.clientId}`}
      </Text>
    ),
  },
  {
    header: "Fecha recibida",
    accessorKey: "receivedAt",
    sortable: true,
    cell: (item: Request) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.receivedAt)}
      </Text>
    ),
  },
  {
    header: "Fecha entrega deseada",
    accessorKey: "requestedDeliveryDate",
    sortable: true,
    cell: (item: Request) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.requestedDeliveryDate)}
      </Text>
    ),
  },
];
