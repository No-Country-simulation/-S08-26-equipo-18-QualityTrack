import { Box, Text } from "@chakra-ui/react";
import { Badge } from "../../components/Badge";
import type { ColumnDef } from "../../components/DataTable";
import type { QualityControl } from "../../services/qualityService";

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

export const QUALITY_COLUMNS: ColumnDef<QualityControl>[] = [
  {
    header: "Nro. control",
    accessorKey: "id",
    sortable: true,
    width: "110px",
    cell: (item: QualityControl) => (
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="bold"
        color="purple.700"
        bg="purple.50"
        px={2}
        py={1}
        borderRadius="md"
        display="inline-block"
      >
        #QC-{item.id}
      </Text>
    ),
  },
  {
    header: "Orden de trabajo",
    sortable: true,
    cell: (item: QualityControl) => (
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
          <Text fontSize="xs" color="gray.500" lineClamp={1} maxW="260px">
            {item.workOrder.title}
          </Text>
        )}
      </Box>
    ),
  },
  {
    header: "Especificacion",
    accessorKey: "specification",
    sortable: true,
    cell: (item: QualityControl) => (
      <Box>
        <Text fontWeight="semibold" color="gray.800" fontSize="sm">
          {item.specification}
        </Text>
        {item.observations && (
          <Text fontSize="xs" color="gray.500" lineClamp={1} maxW="320px">
            {item.observations}
          </Text>
        )}
      </Box>
    ),
  },
  {
    header: "Valor medido",
    accessorKey: "measuredValue",
    sortable: true,
    cell: (item: QualityControl) => (
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="bold"
        color="teal.700"
        bg="teal.50"
        px={2}
        py={0.5}
        borderRadius="sm"
        display="inline-block"
      >
        {item.measuredValue}
      </Text>
    ),
  },
  {
    header: "Valor esperado",
    accessorKey: "expectedValue",
    sortable: true,
    cell: (item: QualityControl) => (
      <Text fontSize="xs" color="gray.700" fontFamily="mono">
        {item.expectedValue}
      </Text>
    ),
  },
  {
    header: "Unidad",
    accessorKey: "unit",
    sortable: true,
    width: "90px",
    cell: (item: QualityControl) => (
      <Badge colorPalette="gray" variant="subtle" size="sm">
        {item.unit || "—"}
      </Badge>
    ),
  },
  {
    header: "Fecha de control",
    accessorKey: "performedAt",
    sortable: true,
    width: "130px",
    cell: (item: QualityControl) => (
      <Text fontSize="xs" color="gray.600">
        {formatDate(item.performedAt)}
      </Text>
    ),
  },
];

