import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuReceiptText } from "react-icons/lu";
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
  const [readOnly, setReadOnly] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [decision, setDecision] = useState<{
    quotation: Quotation;
    status: "accepted" | "rejected";
  } | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionPending, setDecisionPending] = useState(false);
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
        clientService.listActive(),
        requestService.getAll(),
      ]);
      setQuotations(records as QuotationRecord[]);
      setClients(related0);
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
    setReadOnly(false);
    setSelectedQuotation(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (quotation: Quotation) => {
    setReadOnly(false);
    setSelectedQuotation(quotation);
    setIsFormOpen(true);
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

  const handleDecision = async () => {
    if (!decision || decisionPending) return;
    setDecisionPending(true);
    setDecisionError(null);
    try {
      const updated = await quotationService.decide(
        decision.quotation.id,
        decision.status,
      );
      setQuotations((current) =>
        current.map((record) =>
          record.id === updated.id ? (updated as QuotationRecord) : record,
        ),
      );
      setDecision(null);
      showNotification(
        updated.decisionStatus === "accepted"
          ? "Aceptación del cliente registrada."
          : "Rechazo del cliente registrado.",
      );
    } catch (error) {
      setDecisionError(errorMessage(error));
    } finally {
      setDecisionPending(false);
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
            <Button
              size="xs"
              variant="outline"
              aria-label={`Ver detalle de ${quotation.quotationNumber}`}
              onClick={() => {
                setReadOnly(true);
                setSelectedQuotation(quotation);
                setIsFormOpen(true);
              }}
            >
              Ver detalle
            </Button>
            <Can perform="quotations:edit">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                disabled={Boolean(
                  quotation.decisionStatus &&
                  quotation.decisionStatus !== "pending",
                )}
                onClick={() => handleOpenEdit(quotation)}
                title="Editar cotizacion"
                aria-label="Editar cotizacion"
              >
                <LuPencil size={14} />
              </Button>
            </Can>{" "}
            <Can perform="quotations:approve">
              {(!quotation.decisionStatus ||
                quotation.decisionStatus === "pending") &&
                (["accepted", "rejected"] as const).map((status) => (
                  <Button
                    key={status}
                    size="xs"
                    variant="outline"
                    colorPalette={status === "accepted" ? "green" : "red"}
                    aria-label={`${status === "accepted" ? "Registrar aceptación" : "Registrar rechazo"} de ${quotation.quotationNumber}`}
                    onClick={() => {
                      setDecision({ quotation, status });
                      setDecisionError(null);
                    }}
                  >
                    {status === "accepted"
                      ? "Registrar aceptación"
                      : "Registrar rechazo"}
                  </Button>
                ))}
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
        readOnly={readOnly}
        onSave={handleSaveQuotation}
      />{" "}
      <ConfirmDialog
        open={Boolean(decision)}
        onOpenChange={({ open }) => {
          if (!open && !decisionPending) setDecision(null);
        }}
        title={
          decision?.status === "accepted"
            ? "Registrar aceptación del cliente"
            : "Registrar rechazo del cliente"
        }
        description={`Confirmá la decisión comunicada por el cliente sobre ${decision?.quotation.quotationNumber}. Se guardarán tu usuario y la fecha, y la oferta conservará sus datos comerciales.`}
        confirmText="Registrar decisión"
        confirmColorPalette={decision?.status === "accepted" ? "green" : "red"}
        isLoading={decisionPending}
        error={decisionError}
        onConfirm={() => void handleDecision()}
      />
    </Box>
  );
}
