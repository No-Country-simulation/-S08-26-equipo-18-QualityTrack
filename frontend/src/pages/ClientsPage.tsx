import { useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuTrash2, LuUsers } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { CLIENT_COLUMNS, ClientFormModal } from "../modules/clients";
import { MOCK_CLIENTS } from "../test/mocks/mockClients";
import type { Client, CreateClientDto } from "../services/clientService";

type ClientRecord = Client & Record<string, unknown>;

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>(
    MOCK_CLIENTS as ClientRecord[],
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Client | null>(null);
  const [notification, setNotification] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (
    message: string,
    status: "success" | "error" = "success",
  ) => {
    setNotification({ status, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (client: Client) => {
    setDeleteCandidate(client);
  };

  const handleSaveClient = async (formData: CreateClientDto) => {
    if (selectedClient) {
      // Edición de cliente existente
      setClients((prev) =>
        prev.map((item) =>
          item.id === selectedClient.id
            ? ({
                ...item,
                ...formData,
                updatedAt: new Date().toISOString(),
              } as ClientRecord)
            : item,
        ),
      );
      showNotification("Cliente actualizado correctamente.");
    } else {
      // Alta de nuevo cliente
      const newId =
        clients.length > 0 ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
      const newClient: ClientRecord = {
        id: newId,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ClientRecord;

      setClients((prev) => [newClient, ...prev]);
      showNotification("Cliente creado con exito.");
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;

    setClients((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
    showNotification(`Cliente "${deleteCandidate.businessName}" eliminado.`);
    setDeleteCandidate(null);
  };

  return (
    <Box>
      {/* Encabezado de la vista */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap={4}
        mb={6}
      >
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <LuUsers size={24} color="#2563EB" />
            <Heading size="lg" color="gray.800">
              Clientes
            </Heading>
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Gestion y administracion del padron de clientes y contactos
            industriales.
          </Text>
        </Box>
      </Flex>

      {/* Alerta de notificacion temporal */}
      {notification && (
        <Box mb={4}>
          <Alert status={notification.status} title={notification.message} />
        </Box>
      )}

      {/* Tabla universal con busqueda, ordenamiento y paginacion */}
      <DataTable<ClientRecord>
        columns={CLIENT_COLUMNS}
        data={clients}
        searchFields={[
          "businessName",
          "contactName",
          "email",
          "city",
          "province",
        ]}
        searchPlaceholder="Buscar por razon social, contacto, email o ubicacion..."
        toolbarActions={
          <Can perform="clients:create">
            <Button colorPalette="blue" size="sm" onClick={handleOpenCreate}>
              <LuPlus style={{ marginRight: "6px" }} />
              Nuevo cliente
            </Button>
          </Can>
        }
        actions={(client) => (
          <HStack gap={1}>
            <Can perform="clients:edit">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() => handleOpenEdit(client)}
                title="Editar cliente"
                aria-label="Editar cliente"
              >
                <LuPencil size={14} />
              </Button>
            </Can>

            <Can perform="clients:delete">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(client)}
                title="Eliminar cliente"
                aria-label="Eliminar cliente"
              >
                <LuTrash2 size={14} />
              </Button>
            </Can>
          </HStack>
        )}
      />

      {/* Modal de formulario de Alta / Edicion */}
      <ClientFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      {/* Dialogo de confirmacion de eliminacion */}
      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar cliente"
        description={`Estas seguro de que deseas eliminar el cliente "${deleteCandidate?.businessName}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}
