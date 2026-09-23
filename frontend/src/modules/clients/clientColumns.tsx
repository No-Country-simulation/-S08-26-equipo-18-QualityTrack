import { Box, Text } from "@chakra-ui/react";
import type { ColumnDef } from "../../components/DataTable";
import type { Client } from "../../services/clientService";

export function formatCuit(taxId: number | string): string {
  const clean = String(taxId).replace(/\D/g, "");
  if (clean.length !== 11) return String(taxId);
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

export const CLIENT_COLUMNS: ColumnDef<Client>[] = [
  {
    header: "Razon social",
    accessorKey: "businessName",
    sortable: true,
    cell: (item: Client) => (
      <Box>
        <Text fontWeight="semibold" color="gray.800">
          {item.businessName}
        </Text>
        {item.notes && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>
            {item.notes}
          </Text>
        )}
      </Box>
    ),
  },
  {
    header: "CUIT",
    accessorKey: "taxId",
    sortable: true,
    cell: (item: Client) => (
      <Text fontFamily="mono" fontSize="xs" color="gray.700">
        {formatCuit(item.taxId)}
      </Text>
    ),
  },
  {
    header: "Contacto",
    accessorKey: "contactName",
    sortable: true,
    cell: (item: Client) => <Text color="gray.700">{item.contactName}</Text>,
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: (item: Client) => (
      <Text color="blue.600" fontSize="xs">
        {item.email}
      </Text>
    ),
  },
  {
    header: "Telefono",
    accessorKey: "phone",
    cell: (item: Client) => (
      <Text color="gray.600" fontSize="xs">
        {item.phone || "—"}
      </Text>
    ),
  },
  {
    header: "Ubicacion",
    cell: (item: Client) => (
      <Text color="gray.600" fontSize="xs">
        {item.city ? `${item.city}, ${item.province}` : item.province || "—"}
      </Text>
    ),
  },
];
