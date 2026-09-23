import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuRotateCcw, LuUserX, LuUsers } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { CLIENT_COLUMNS, ClientFormModal } from "../modules/clients";
import { ApiError } from "../services/api";
import { clientService } from "../services/clientService";
import type {
  Client,
  ClientStatusFilter,
  CreateClientDto,
} from "../services/clientService";

type ClientRecord = Client & Record<string, unknown>;

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<ClientStatusFilter, string> = {
  active: "Activos",
  inactive: "Inactivos",
  all: "Todos",
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Ocurrio un error inesperado.";
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<ClientStatusFilter>("active");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusCandidate, setStatusCandidate] = useState<Client | null>(null);
  const [notification, setNotification] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  // La consulta vigente: la tabla avisa cuando cambia de pagina o de busqueda.
  const queryRef = useRef({ page: 1, search: "" });

  const showNotification = (
    message: string,
    status: "success" | "error" = "success",
  ) => {
    setNotification({ status, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await clientService.list({
        page: queryRef.current.page,
        limit: PAGE_SIZE,
        search: queryRef.current.search || undefined,
        status,
      });
      setClients(page.items as ClientRecord[]);
      setTotal(page.total);
    } catch (error) {
      setLoadError(errorMessage(error));
      setClients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleQueryChange = useCallback(
    (query: { page: number; search: string }) => {
      queryRef.current = query;
      void load();
    },
    [load],
  );

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  // El error se relanza: el modal lo muestra y no se cierra, para que la persona
  // no pierda lo que cargo.
  const handleSaveClient = async (formData: CreateClientDto) => {
    if (selectedClient) {
      await clientService.update(selectedClient.id, formData);
      showNotification("Cliente actualizado correctamente.");
    } else {
      await clientService.create(formData);
      showNotification("Cliente creado con exito.");
    }
    await load();
  };

  const handleConfirmStatusChange = async () => {
    if (!statusCandidate) return;
    const target = statusCandidate;
    setStatusCandidate(null);

    try {
      await clientService.setStatus(target.id, !target.isActive);
      showNotification(
        target.isActive
          ? `Cliente "${target.businessName}" desactivado.`
          : `Cliente "${target.businessName}" reactivado.`,
      );
      await load();
    } catch (error) {
      showNotification(errorMessage(error), "error");
    }
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

      {/* Tabla universal: la API pagina y busca; la tabla solo muestra */}
      <DataTable<ClientRecord>
        columns={CLIENT_COLUMNS}
        data={clients}
        loading={loading}
        error={loadError}
        onRetry={load}
        searchPlaceholder="Buscar por razon social o CUIT..."
        emptyTitle="No hay clientes cargados"
        emptyDescription="Cuando cargues el primero, aparece aca."
        server={{
          total,
          pageSize: PAGE_SIZE,
          onChange: handleQueryChange,
        }}
        toolbarActions={
          <HStack gap={2} wrap="wrap">
            <HStack gap={1}>
              {(Object.keys(STATUS_LABELS) as ClientStatusFilter[]).map(
                (value) => (
                  <Button
                    key={value}
                    size="xs"
                    variant={status === value ? "solid" : "outline"}
                    colorPalette={status === value ? "blue" : "gray"}
                    onClick={() => setStatus(value)}
                  >
                    {STATUS_LABELS[value]}
                  </Button>
                ),
              )}
            </HStack>

            <Can perform="clients:create">
              <Button colorPalette="blue" size="sm" onClick={handleOpenCreate}>
                <LuPlus style={{ marginRight: "6px" }} />
                Nuevo Cliente
              </Button>
            </Can>
          </HStack>
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
                colorPalette={client.isActive ? "red" : "green"}
                onClick={() => setStatusCandidate(client)}
                title={client.isActive ? "Desactivar cliente" : "Reactivar cliente"}
                aria-label={
                  client.isActive ? "Desactivar cliente" : "Reactivar cliente"
                }
              >
                {client.isActive ? (
                  <LuUserX size={14} />
                ) : (
                  <LuRotateCcw size={14} />
                )}
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

      {/* Confirmacion de baja o reactivacion: los clientes no se eliminan */}
      <ConfirmDialog
        open={Boolean(statusCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setStatusCandidate(null);
        }}
        title={
          statusCandidate?.isActive ? "Desactivar Cliente" : "Reactivar Cliente"
        }
        description={
          statusCandidate?.isActive
            ? `El cliente "${statusCandidate?.businessName}" deja de aparecer en los listados, pero su historial se conserva y podes reactivarlo cuando quieras.`
            : `El cliente "${statusCandidate?.businessName}" vuelve a estar disponible con los mismos datos.`
        }
        confirmText={statusCandidate?.isActive ? "Desactivar" : "Reactivar"}
        cancelText="Cancelar"
        confirmColorPalette={statusCandidate?.isActive ? "red" : "green"}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusCandidate(null)}
      />
    </Box>
  );
}
