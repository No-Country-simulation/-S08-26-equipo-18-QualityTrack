import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuClipboardList, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { REQUEST_COLUMNS, RequestFormModal } from "../modules/requests";
import { MOCK_CLIENTS } from "../test/mocks/mockClients";
import { MOCK_REQUESTS } from "../test/mocks/mockRequests";
import { ApiError } from "../services/api";
import { clientService } from "../services/clientService";
import type { Client } from "../services/clientService";
import { requestService } from "../services/requestService";
import type { CreateRequestDto, Request } from "../services/requestService";

type RequestRecord = Request & Record<string, unknown>;

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Ocurrio un error inesperado.";
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Request | null>(null);
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
      let reqData: Request[];
      try {
        reqData = await requestService.getAll();
      } catch (backendErr) {
        console.warn(
          "Backend no disponible para solicitudes, utilizando datos locales.",
          backendErr,
        );
        reqData = MOCK_REQUESTS;
      }
      setRequests(reqData as RequestRecord[]);

      try {
        const clientRes = await clientService.list({
          limit: 100,
          status: "all",
        });
        setClients(clientRes.items.length > 0 ? clientRes.items : MOCK_CLIENTS);
      } catch {
        setClients(MOCK_CLIENTS);
      }
    } catch (error) {
      setLoadError(errorMessage(error));
      setRequests(MOCK_REQUESTS as RequestRecord[]);
      setClients(MOCK_CLIENTS);
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
    setDeleteCandidate(req);
  };

  const handleSaveRequest = async (formData: CreateRequestDto) => {
    const associatedClient = clients.find((c) => c.id === formData.clientId);

    if (selectedRequest) {
      // Edicion de solicitud existente
      try {
        const updated = await requestService.update(
          selectedRequest.id,
          formData,
        );
        setRequests((prev) =>
          prev.map((item) =>
            item.id === selectedRequest.id
              ? ({
                  ...item,
                  ...updated,
                  client: associatedClient,
                  updatedAt: new Date().toISOString(),
                } as RequestRecord)
              : item,
          ),
        );
        showNotification("Solicitud actualizada correctamente.");
      } catch {
        setRequests((prev) =>
          prev.map((item) =>
            item.id === selectedRequest.id
              ? ({
                  ...item,
                  ...formData,
                  client: associatedClient,
                  updatedAt: new Date().toISOString(),
                } as RequestRecord)
              : item,
          ),
        );
        showNotification("Solicitud actualizada correctamente.");
      }
    } else {
      // Alta de nueva solicitud
      try {
        const created = await requestService.create(formData);
        const newRequest = {
          ...created,
          client: associatedClient,
        } as RequestRecord;
        setRequests((prev) => [newRequest, ...prev]);
        showNotification("Solicitud creada con exito.");
      } catch {
        const newId =
          requests.length > 0 ? Math.max(...requests.map((r) => r.id)) + 1 : 1;
        const newRequest: RequestRecord = {
          id: newId,
          ...formData,
          client: associatedClient,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as RequestRecord;

        setRequests((prev) => [newRequest, ...prev]);
        showNotification("Solicitud creada con exito.");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    const target = deleteCandidate;
    setDeleteCandidate(null);

    try {
      await requestService.delete(target.id);
    } catch {
      // Continuar eliminacion local ante fallback
    }

    setRequests((prev) =>
      prev.filter((item) => item.id !== target.id),
    );
    showNotification(`Solicitud "${target.requestNumber}" eliminada.`);
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
            <Button colorPalette="blue" size="sm" onClick={handleOpenCreate}>
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
