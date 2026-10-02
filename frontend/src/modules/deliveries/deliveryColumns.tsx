import { Link } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { Can } from "../../components/Can";
import { Badge } from "../../components/Badge";
import type { ColumnDef } from "../../components/DataTable";
import type { Delivery } from "../../services/deliveryService";

import { formatDate } from "../../utils";

export { formatDate };

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
        <Can
          perform="workOrders:view"
          fallback={
            <Text fontFamily="mono" fontSize="xs">
              {item.workOrder?.workOrderNumber
                ? `OT-${item.workOrder.workOrderNumber}`
                : "Origen no documentado"}
            </Text>
          }
        >
          <Link
            to={`/work-orders/${item.workOrderId}`}
            style={{ textDecoration: "none" }}
          >
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
              _hover={{ textDecoration: "underline", bg: "blue.100" }}
            >
              {item.workOrder?.workOrderNumber
                ? `OT-${item.workOrder.workOrderNumber}`
                : "Origen no documentado"}
            </Text>
          </Link>
        </Can>
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
    cell: (item: Delivery) => {
      const searchTarget = item.client?.taxId || item.client?.businessName;
      return searchTarget ? (
        <Can
          perform="clients:view"
          fallback={<Text fontSize="sm">{item.client?.businessName}</Text>}
        >
          <Link
            to={`/clients?search=${encodeURIComponent(searchTarget)}`}
            style={{ textDecoration: "none" }}
          >
            <Text
              fontWeight="semibold"
              color="blue.600"
              fontSize="sm"
              _hover={{ textDecoration: "underline", color: "blue.800" }}
            >
              {item.client?.businessName || "—"}
            </Text>
          </Link>
        </Can>
      ) : (
        <Text fontWeight="semibold" color="gray.800" fontSize="sm">
          {item.client?.businessName || "—"}
        </Text>
      );
    },
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
  {
    header: "Responsable",
    cell: (item) => (
      <Box>
        <Text fontSize="xs">
          {item.createdBy
            ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
            : "No documentado"}
        </Text>
        {item.updatedBy && (
          <Text fontSize="xs" color="gray.500">
            Editado por {item.updatedBy.firstName} {item.updatedBy.lastName}
          </Text>
        )}
      </Box>
    ),
  },
];
