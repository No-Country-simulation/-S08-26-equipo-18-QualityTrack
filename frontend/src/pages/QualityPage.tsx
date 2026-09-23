import { useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import {
  LuPencil,
  LuPlus,
  LuShieldCheck,
  LuTrash2,
} from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { QUALITY_COLUMNS, QualityFormModal } from "../modules/quality";
import { MOCK_QUALITY_CONTROLS } from "../test/mocks/mockQualityControls";
import { MOCK_WORK_ORDERS } from "../test/mocks/mockWorkOrders";
import type {
  CreateQualityControlDto,
  QualityControl,
} from "../services/qualityService";
import type { WorkOrder } from "../services/workOrderService";

type QualityControlRecord = QualityControl & Record<string, unknown>;

export default function QualityPage() {
  const [controls, setControls] = useState<QualityControlRecord[]>(
    MOCK_QUALITY_CONTROLS as QualityControlRecord[],
  );
  const [workOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedControl, setSelectedControl] =
    useState<QualityControl | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState<QualityControl | null>(null);
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
    setSelectedControl(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (control: QualityControl) => {
    setSelectedControl(control);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (control: QualityControl) => {
    setDeleteCandidate(control);
  };

  const handleSaveControl = async (formData: CreateQualityControlDto) => {
    const associatedWo = workOrders.find((w) => w.id === formData.workOrderId);

    if (selectedControl) {
      // Edicion de control existente
      setControls((prev) =>
        prev.map((item) =>
          item.id === selectedControl.id
            ? ({
                ...item,
                ...formData,
                workOrder: associatedWo,
                updatedAt: new Date().toISOString(),
              } as QualityControlRecord)
            : item,
        ),
      );
      showNotification("Control de calidad actualizado correctamente.");
    } else {
      // Alta de nuevo control
      const newId =
        controls.length > 0 ? Math.max(...controls.map((c) => c.id)) + 1 : 1;
      const newControl: QualityControlRecord = {
        id: newId,
        ...formData,
        workOrder: associatedWo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as QualityControlRecord;

      setControls((prev) => [newControl, ...prev]);
      showNotification("Control de calidad registrado con exito.");
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;

    setControls((prev) =>
      prev.filter((item) => item.id !== deleteCandidate.id),
    );
    showNotification(
      `Control de calidad "#QC-${deleteCandidate.id}" eliminado.`,
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
        searchFields={[
          "specification",
          "measuredValue",
          "expectedValue",
          "unit",
          "observations",
        ]}
        searchPlaceholder="Buscar por especificacion, valor medido u observaciones..."
        toolbarActions={
          <Can perform="quality:inspect">
            <Button colorPalette="blue" size="sm" onClick={handleOpenCreate}>
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

            <Can perform="quality:inspect">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(control)}
                title="Eliminar control"
                aria-label="Eliminar control"
              >
                <LuTrash2 size={14} />
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

      {/* Dialogo de confirmacion de eliminacion */}
      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar control de calidad"
        description={`Estas seguro de que deseas eliminar el control "#QC-${deleteCandidate?.id} - ${deleteCandidate?.specification}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}