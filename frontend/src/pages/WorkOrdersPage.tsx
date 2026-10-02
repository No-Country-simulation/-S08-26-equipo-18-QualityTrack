import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuEye, LuPencil, LuPlus, LuTrash2, LuWrench } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { WORK_ORDER_COLUMNS, WorkOrderFormModal } from "../modules/workOrders";
import { errorMessage } from "../utils/errorMessage";
import { workOrderService } from "../services/workOrderService";
import type {
  CreateWorkOrderDto,
  WorkOrder,
  WorkOrderStatus,
} from "../services/workOrderService";

type WorkOrderRecord = WorkOrder & Record<string, unknown>;

const STATUS_FILTERS: { value: WorkOrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "COMPLETED", label: "Completadas" },
  { value: "CANCELLED", label: "Canceladas" },
];

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "ALL">(
    "ALL",
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] = useState<WorkOrder | null>(
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
      const [records] = await Promise.all([workOrderService.getAll()]);
      setWorkOrders(records as WorkOrderRecord[]);
    } catch (error) {
      setLoadError(errorMessage(error));
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtrado reactivo por estado
  const filteredWorkOrders = useMemo(() => {
    if (statusFilter === "ALL") return workOrders;
    return workOrders.filter((wo) => wo.status === statusFilter);
  }, [workOrders, statusFilter]);

  // Siguiente numero de orden correlativo automatico
  const nextWorkOrderNumber = useMemo(() => {
    return workOrders.length > 0
      ? Math.max(...workOrders.map((wo) => wo.workOrderNumber)) + 1
      : 1001;
  }, [workOrders]);

  const handleOpenCreate = () => {
    setSelectedWorkOrder(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (wo: WorkOrder) => {
    setDeleteError(null);
    setDeleteCandidate(wo);
  };

  const handleViewDetail = (wo: WorkOrder) => {
    navigate(`/work-orders/${wo.id}`);
  };

  const handleSaveWorkOrder = async (formData: CreateWorkOrderDto) => {
    if (selectedWorkOrder) {
      const updated = await workOrderService.update(
        selectedWorkOrder.id,
        formData,
      );
      setWorkOrders((prev) =>
        prev.map((item) =>
          item.id === selectedWorkOrder.id
            ? (updated as WorkOrderRecord)
            : item,
        ),
      );
      showNotification("Orden de trabajo actualizada correctamente.");
    } else {
      const created = await workOrderService.create(formData);
      setWorkOrders((prev) => [created as WorkOrderRecord, ...prev]);
      showNotification("Orden de trabajo creada correctamente.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await workOrderService.delete(deleteCandidate.id);
      setWorkOrders((prev) =>
        prev.filter((item) => item.id !== deleteCandidate.id),
      );
      setDeleteCandidate(null);
      showNotification("Orden de trabajo eliminada correctamente.");
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
            <LuWrench size={24} color="#2563EB" />
            <Heading size="lg" color="gray.800">
              Ordenes de trabajo
            </Heading>
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Control de produccion, asignacion operativa y seguimiento de
            fabricacion en planta.
          </Text>
        </Box>
      </Flex>

      {/* Alerta de notificacion temporal */}
      {notification && (
        <Box mb={4}>
          <Alert status={notification.status} title={notification.message} />
        </Box>
      )}

      {/* Barra de filtros rapidos por estado */}
      <HStack gap={2} mb={4} wrap="wrap">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <Button
              key={f.value}
              size="xs"
              variant={isActive ? "solid" : "outline"}
              colorPalette={isActive ? "blue" : "gray"}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          );
        })}
      </HStack>

      {/* Tabla universal con busqueda, ordenamiento y paginacion */}
      <DataTable<WorkOrderRecord>
        columns={WORK_ORDER_COLUMNS}
        data={filteredWorkOrders}
        loading={loading}
        error={loadError}
        onRetry={load}
        searchFields={["title", "description"]}
        searchPlaceholder="Buscar por titulo o descripcion..."
        emptyTitle="No hay ordenes de trabajo registradas"
        emptyDescription="Cuando crees la primera orden de trabajo, aparecera aqui."
        toolbarActions={
          <Can perform="workOrders:create">
            <Button
              colorPalette="blue"
              size="sm"
              disabled={loading || Boolean(loadError)}
              onClick={handleOpenCreate}
            >
              <LuPlus style={{ marginRight: "6px" }} />
              Nueva orden de trabajo
            </Button>
          </Can>
        }
        actions={(wo) => (
          <HStack gap={1}>
            <Button
              size="xs"
              variant="ghost"
              colorPalette="gray"
              onClick={() => handleViewDetail(wo)}
              title="Ver detalle"
              aria-label="Ver detalle"
            >
              <LuEye size={14} />
            </Button>

            <Can perform="workOrders:edit">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() => handleOpenEdit(wo)}
                title="Editar orden de trabajo"
                aria-label="Editar orden de trabajo"
              >
                <LuPencil size={14} />
              </Button>
            </Can>

            <Can perform="workOrders:delete">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(wo)}
                title="Eliminar orden de trabajo"
                aria-label="Eliminar orden de trabajo"
              >
                <LuTrash2 size={14} />
              </Button>
            </Can>
          </HStack>
        )}
      />

      {/* Modal de formulario de Alta / Edicion */}
      <WorkOrderFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        workOrder={selectedWorkOrder}
        nextWorkOrderNumber={nextWorkOrderNumber}
        onSave={handleSaveWorkOrder}
      />

      {/* Dialogo de confirmacion de eliminacion */}
      <ConfirmDialog
        error={deleteError}
        isLoading={isDeleting}
        open={Boolean(deleteCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar orden de trabajo"
        description={`Estas seguro de que deseas eliminar la orden de trabajo "OT-${deleteCandidate?.workOrderNumber} - ${deleteCandidate?.title}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}
