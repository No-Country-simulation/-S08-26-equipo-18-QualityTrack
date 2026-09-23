import { Box, Text } from "@chakra-ui/react";
import { Badge } from "../../components/Badge";
import type { ColumnDef } from "../../components/DataTable";
import type { Quotation } from "../../services/quotationService";

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

export function formatCurrency(
  amount?: number | string,
  currency = "ARS",
): string {
  if (amount === undefined || amount === null || amount === "") return "—";
  const num = Number(amount);
  if (isNaN(num)) return "—";
  const formatted = num.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export const QUOTATION_COLUMNS: ColumnDef<Quotation>[] = [
  {
    header: "Nro. cotizacion",
    accessorKey: "quotationNumber",
    sortable: true,
    width: "160px",
    cell: (item: Quotation) => (
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
        {item.quotationNumber}
      </Text>
    ),
  },
  {
    header: "Cliente",
    sortable: true,
    cell: (item: Quotation) => (
      <Text fontWeight="medium" color="gray.800" fontSize="sm">
        {item.client?.businessName || `Cliente #${item.clientId}`}
      </Text>
    ),
  },
  {
    header: "Solicitud",
    sortable: true,
    cell: (item: Quotation) => (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.700">
          {item.request?.requestNumber || `Solicitud #${item.requestId}`}
        </Text>
        {item.request?.title && (
          <Text fontSize="xs" color="gray.500" lineClamp={1} maxW="280px">
            {item.request.title}
          </Text>
        )}
      </Box>
    ),
  },
  {
    header: "Version",
    accessorKey: "version",
    sortable: true,
    width: "90px",
    cell: (item: Quotation) => (
      <Badge colorPalette="gray" variant="subtle" size="sm">
        v{item.version}
      </Badge>
    ),
  },
  {
    header: "Subtotal",
    accessorKey: "subtotal",
    sortable: true,
    cell: (item: Quotation) => (
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="semibold"
        color="gray.800"
      >
        {formatCurrency(item.subtotal, item.currency)}
      </Text>
    ),
  },
  {
    header: "Moneda",
    accessorKey: "currency",
    sortable: true,
    width: "90px",
    cell: (item: Quotation) => (
      <Badge
        colorPalette={item.currency === "USD" ? "green" : "blue"}
        variant="outline"
        size="sm"
      >
        {item.currency}
      </Badge>
    ),
  },
  {
    header: "Valida hasta",
    accessorKey: "validUntil",
    sortable: true,
    cell: (item: Quotation) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.validUntil)}
      </Text>
    ),
  },
];

