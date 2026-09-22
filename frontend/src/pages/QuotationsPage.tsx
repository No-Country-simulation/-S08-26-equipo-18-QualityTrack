import { useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuReceiptText, LuTrash2 } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import {
  QUOTATION_COLUMNS,
  QuotationFormModal,
} from "../modules/quotations";
import { MOCK_CLIENTS } from "../test/mocks/mockClients";
import { MOCK_QUOTATIONS } from "../test/mocks/mockQuotations";
import { MOCK_REQUESTS } from "../test/mocks/mockRequests";
import type { Client } from "../services/clientService";
import type {
  CreateQuotationDto,
  Quotation,
} from "../services/quotationService";
import type { Request } from "../services/requestService";

type QuotationRecord = Quotation & Record<string, unknown>;

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>(
    MOCK_QUOTATIONS as QuotationRecord[],
  );
  const [clients] = useState<Client[]>(MOCK_CLIENTS);
  const [requests] = useState<Request[]>(MOCK_REQUESTS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] = useState<Quotation | null>(
    null,
  );
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
    setSelectedQuotation(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (quotation: Quotation) => {
    setDeleteCandidate(quotation);
  };

  const handleSaveQuotation = async (formData: CreateQuotationDto) => {
    const associatedClient = clients.find((c) => c.id === formData.clientId);
    const associatedRequest = requests.find((r) => r.id === formData.requestId);

    if (selectedQuotation) {
      // Edicion de cotizacion existente
      setQuotations((prev) =>
        prev.map((item) =>
          item.id === selectedQuotation.id
            ? ({
                ...item,
                ...formData,
                client: associatedClient,
                request: associatedRequest,
                updatedAt: new Date().toISOString(),
              } as QuotationRecord)
            : item,
        ),
      );
      showNotification("Cotizacion actualizada correctamente.");
    } else {
      // Alta de nueva cotizacion
      const newId =
        quotations.length > 0
          ? Math.max(...quotations.map((q) => q.id)) + 1
          : 1;
      const newQuotation: QuotationRecord = {
        id: newId,
        ...formData,
        client: associatedClient,
        request: associatedRequest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as QuotationRecord;

      setQuotations((prev) => [newQuotation, ...prev]);
      showNotification("Cotizacion creada con exito.");
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;

    setQuotations((prev) =>
      prev.filter((item) => item.id !== deleteCandidate.id),
    );
    showNotification(
      `Cotizacion "${deleteCandidate.quotationNumber}" eliminada.`,
    );
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
        searchFields={["quotationNumber", "description", "currency"]}
        searchPlaceholder="Buscar por nro. cotizacion o descripcion..."
        toolbarActions={
          <Can perform="quotations:create">
            <Button colorPalette="blue" size="sm" onClick={handleOpenCreate}>
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