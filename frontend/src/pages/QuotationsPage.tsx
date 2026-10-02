import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuReceiptText, LuTrash2 } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { QUOTATION_COLUMNS, QuotationFormModal } from "../modules/quotations";
import { errorMessage } from "../utils/errorMessage";
import { clientService } from "../services/clientService";
import type { Client } from "../services/clientService";
import { quotationService } from "../services/quotationService";
import type {
  CreateQuotationDto,
  Quotation,
} from "../services/quotationService";
import { requestService } from "../services/requestService";
import type { Request } from "../services/requestService";

type QuotationRecord = Quotation & Record<string, unknown>;

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] = useState<Quotation | null>(
    null,
  );
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
      const [records, related0, related1] = await Promise.all([
        quotationService.getAll(),
        clientService.list({ limit: 100, status: "all" }),
        requestService.getAll(),
      ]);
      setQuotations(records as QuotationRecord[]);
      setClients(related0.items);
      setRequests(related1);
    } catch (error) {
      setLoadError(errorMessage(error));
      setQuotations([]);
      setClients([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpenCreate = () => {
    setSelectedQuotation(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (quotation: Quotation) => {
    setDeleteError(null);
    setDeleteCandidate(quotation);
  };

  const handleSaveQuotation = async (formData: CreateQuotationDto) => {
    if (selectedQuotation) {
      const updated = await quotationService.update(
        selectedQuotation.id,
        formData,
      );
      setQuotations((prev) =>
        prev.map((item) =>
          item.id === selectedQuotation.id
            ? (updated as QuotationRecord)
            : item,
        ),
      );
      showNotification("Cotización actualizada correctamente.");
    } else {
      const created = await quotationService.create(formData);
      setQuotations((prev) => [created as QuotationRecord, ...prev]);
      showNotification("Cotización creada correctamente.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await quotationService.delete(deleteCandidate.id);
      setQuotations((prev) =>
        prev.filter((item) => item.id !== deleteCandidate.id),
      );
      setDeleteCandidate(null);
      showNotification("Cotización eliminada correctamente.");
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
            <LuReceiptText size={24} color="#2563EB" />
            <Heading size="lg" color="gray.800">
              Cotizaciones
            </Heading>
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Gestion y seguimiento de cotizaciones comerciales y presupuestos de
            fabricacion.
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
      <DataTable<QuotationRecord>
        columns={QUOTATION_COLUMNS}
        data={quotations}
        loading={loading}
        error={loadError}
        onRetry={load}
        searchFields={["quotationNumber", "description", "currency"]}
        searchPlaceholder="Buscar por nro. cotizacion o descripcion..."
        emptyTitle="No hay cotizaciones registradas"
        emptyDescription="Cuando crees la primera cotizacion, aparecera aqui."
        toolbarActions={
          <Can perform="quotations:create">
            <Button
              colorPalette="blue"
              size="sm"
              disabled={loading || Boolean(loadError)}
              onClick={handleOpenCreate}
            >
              <LuPlus style={{ marginRight: "6px" }} />
              Nueva cotizacion
            </Button>
          </Can>
        }
        actions={(quotation) => (
          <HStack gap={1}>
            <Can perform="quotations:edit">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() => handleOpenEdit(quotation)}
                title="Editar cotizacion"
                aria-label="Editar cotizacion"
              >
                <LuPencil size={14} />
              </Button>
            </Can>

            <Can perform="quotations:delete">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(quotation)}
                title="Eliminar cotizacion"
                aria-label="Eliminar cotizacion"
              >
                <LuTrash2 size={14} />
              </Button>
            </Can>
          </HStack>
        )}
      />

      {/* Modal de formulario de Alta / Edicion */}
      <QuotationFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        quotation={selectedQuotation}
        clients={clients}
        requests={requests}
        onSave={handleSaveQuotation}
      />

      {/* Dialogo de confirmacion de eliminacion */}
      <ConfirmDialog
        error={deleteError}
        isLoading={isDeleting}
        open={Boolean(deleteCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar cotizacion"
        description={`Estas seguro de que deseas eliminar la cotizacion "${deleteCandidate?.quotationNumber}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}
