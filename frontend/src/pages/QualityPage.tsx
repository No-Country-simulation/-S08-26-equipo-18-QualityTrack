import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuShieldCheck } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { DataTable } from "../components/DataTable";
import { QUALITY_COLUMNS, QualityFormModal } from "../modules/quality";
import { errorMessage } from "../utils/errorMessage";
import { qualityService } from "../services/qualityService";
import type {
  CreateQualityControlDto,
  QualityControl,
} from "../services/qualityService";
import { workOrderService } from "../services/workOrderService";
import type { WorkOrder } from "../services/workOrderService";

type QualityControlRecord = QualityControl & Record<string, unknown>;

export default function QualityPage() {
  const [controls, setControls] = useState<QualityControlRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<QualityControl | null>(
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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [records, related0] = await Promise.all([
        qualityService.getAll(),
        workOrderService.getAll(),
      ]);
      setControls(records as QualityControlRecord[]);
      setWorkOrders(related0);
    } catch (error) {
      setLoadError(errorMessage(error));
      setControls([]);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpenCreate = () => {
    setSelectedControl(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (control: QualityControl) => {
    setSelectedControl(control);
    setIsFormOpen(true);
  };

  const handleSaveControl = async (formData: CreateQualityControlDto) => {
    if (selectedControl) {
      const updated = await qualityService.update(selectedControl.id, formData);
      setControls((prev) =>
        prev.map((item) =>
          item.id === selectedControl.id
            ? (updated as QualityControlRecord)
            : item,
        ),
      );
      showNotification("Control de calidad actualizada correctamente.");
    } else {
      const created = await qualityService.create(formData);
      setControls((prev) => [created as QualityControlRecord, ...prev]);
      showNotification("Control de calidad creada correctamente.");
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
            <LuShieldCheck size={24} color="#2563EB" />
            <Heading size="lg" color="gray.800">
              Control de calidad
            </Heading>
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Registro de inspecciones, mediciones dimensionales y ensayos de
            conformidad tecnica en planta.
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
      <DataTable<QualityControlRecord>
        columns={QUALITY_COLUMNS}
        data={controls}
        loading={loading}
        error={loadError}
        onRetry={load}
        searchFields={[
          "specification",
          "measuredValue",
          "expectedValue",
          "unit",
          "observations",
        ]}
        searchPlaceholder="Buscar por especificacion, valor medido u observaciones..."
        emptyTitle="No hay controles de calidad registrados"
        emptyDescription="Cuando registres el primer control de calidad, aparecera aqui."
        toolbarActions={
          <Can perform="quality:inspect">
            <Button
              colorPalette="blue"
              size="sm"
              disabled={loading || Boolean(loadError)}
              onClick={handleOpenCreate}
            >
              <LuPlus style={{ marginRight: "6px" }} />
              Nuevo control
            </Button>
          </Can>
        }
        actions={(control) => (
          <HStack gap={1}>
            <Can perform="quality:inspect">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() => handleOpenEdit(control)}
                title="Editar control"
                aria-label="Editar control"
              >
                <LuPencil size={14} />
              </Button>
            </Can>
          </HStack>
        )}
      />

      {/* Modal de formulario de Alta / Edicion */}
      <QualityFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        control={selectedControl}
        workOrders={workOrders}
        onSave={handleSaveControl}
      />
    </Box>
  );
}
