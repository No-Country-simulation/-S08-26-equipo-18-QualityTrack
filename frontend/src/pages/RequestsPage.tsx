import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuClipboardList, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { REQUEST_COLUMNS, RequestFormModal } from "../modules/requests";
import { errorMessage } from "../utils/errorMessage";
import { clientService } from "../services/clientService";
import type { Client } from "../services/clientService";
import { requestService } from "../services/requestService";
import type { CreateRequestDto, Request } from "../services/requestService";

type RequestRecord = Request & Record<string, unknown>;

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Request | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [records, related0] = await Promise.all([
        requestService.getAll(),
        clientService.list({ limit: 100, status: "all" }),
      ]);
      setRequests(records as RequestRecord[]);
      setClients(related0.items);
    } catch (error) {
      setLoadError(errorMessage(error));
      setRequests([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpenCreate = () => {
    setSelectedRequest(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (req: Request) => {
    setSelectedRequest(req);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (req: Request) => {
    setDeleteError(null);
    setDeleteCandidate(req);
  };

  const handleSaveRequest = async (formData: CreateRequestDto) => {
    if (selectedRequest) {
      const updated = await requestService.update(selectedRequest.id, formData);
      setRequests((prev) =>
        prev.map((item) =>
          item.id === selectedRequest.id ? (updated as RequestRecord) : item,
        ),
      );
      showNotification("Solicitud actualizada correctamente.");
    } else {
      const created = await requestService.create(formData);
      setRequests((prev) => [created as RequestRecord, ...prev]);
      showNotification("Solicitud creada correctamente.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await requestService.delete(deleteCandidate.id);
      setRequests((prev) =>
        prev.filter((item) => item.id !== deleteCandidate.id),
      );
      setDeleteCandidate(null);
      showNotification("Solicitud eliminada correctamente.");
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally { setIsDeleting(false); }
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
            <LuClipboardList size={24} color="#2563EB" />
            <Heading size="lg" color="gray.800">
              Solicitudes
            </Heading>
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Registro y seguimiento de solicitudes tecnicas de fabricacion y
            cotizacion.
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
      <DataTable<RequestRecord>
        columns={REQUEST_COLUMNS}
        data={requests}
        loading={loading}
        error={loadError}
        onRetry={load}
        searchFields={["requestNumber", "title", "description"]}
        searchPlaceholder="Buscar por nro. solicitud, titulo o descripcion..."
        emptyTitle="No hay solicitudes registradas"
        emptyDescription="Cuando crees la primera solicitud, aparecera aqui."
        toolbarActions={
          <Can perform="requests:create">
            <Button
              colorPalette="blue"
              size="sm"
              disabled={loading || Boolean(loadError)}
              onClick={handleOpenCreate}
            >
              <LuPlus style={{ marginRight: "6px" }} />
              Nueva solicitud
            </Button>
          </Can>
        }
        actions={(req) => (
          <HStack gap={1}>
            <Can perform="requests:edit">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() => handleOpenEdit(req)}
                title="Editar solicitud"
                aria-label="Editar solicitud"
              >
                <LuPencil size={14} />
              </Button>
            </Can>

            <Can perform="requests:delete">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(req)}
                title="Eliminar solicitud"
                aria-label="Eliminar solicitud"
              >
                <LuTrash2 size={14} />
              </Button>
            </Can>
          </HStack>
        )}
      />

      {/* Modal de formulario de Alta / Edicion */}
      <RequestFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        request={selectedRequest}
        clients={clients}
        onSave={handleSaveRequest}
      />

      {/* Dialogo de confirmacion de eliminacion */}
      <ConfirmDialog
        error={deleteError}
        isLoading={isDeleting}
        open={Boolean(deleteCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar solicitud"
        description={`Estas seguro de que deseas eliminar la solicitud "${deleteCandidate?.requestNumber} - ${deleteCandidate?.title}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}
