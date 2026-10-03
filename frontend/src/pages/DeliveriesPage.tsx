import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuTruck } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { DataTable } from "../components/DataTable";
import { DELIVERY_COLUMNS, DeliveryFormModal } from "../modules/deliveries";
import { errorMessage } from "../utils/errorMessage";
import { deliveryService } from "../services/deliveryService";
import type { CreateDeliveryDto, Delivery } from "../services/deliveryService";
import type { WorkOrder } from "../services/workOrderService";

type DeliveryRecord = Delivery & {
  clientName?: string;
  workOrderNumber?: string;
} & Record<string, unknown>;

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
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
        deliveryService.getAll(),
        deliveryService.getWorkOrders(),
      ]);
      setDeliveries(records as Delivery[]);
      setWorkOrders(related0);
    } catch (error) {
      setLoadError(errorMessage(error));
      setDeliveries([]);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpenCreate = () => {
    setSelectedDelivery(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsFormOpen(true);
  };

  const handleSaveDelivery = async (formData: CreateDeliveryDto) => {
    if (selectedDelivery) {
      const updated = await deliveryService.update(
        selectedDelivery.id,
        formData,
      );
      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === selectedDelivery.id ? (updated as Delivery) : item,
        ),
      );
      showNotification("Entrega actualizada correctamente.");
    } else {
      const created = await deliveryService.create(formData);
      setDeliveries((prev) => [created as Delivery, ...prev]);
      showNotification("Entrega creada correctamente.");
    }
  };

  // Mapeamos para permitir busqueda multicanal enriquecida
  const tableData: DeliveryRecord[] = useMemo(() => {
    return deliveries.map((d) => ({
      ...d,
      clientName: d.client?.businessName || "",
      workOrderNumber: d.workOrder?.workOrderNumber
        ? `OT-${d.workOrder.workOrderNumber}`
        : "Origen no documentado",
    }));
  }, [deliveries]);

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
            <LuTruck size={24} color="#2563EB" />
            <Heading size="lg" color="gray.800">
              Entregas
            </Heading>
          </Flex>
          <Text color="gray.500" fontSize="sm">
            Registro de despachos, remitos de entrega y conformidad de recepcion
            en planta.
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
      <DataTable<DeliveryRecord>
        columns={DELIVERY_COLUMNS as any}
        data={tableData}
        loading={loading}
        error={loadError}
        onRetry={load}
        searchFields={["clientName", "workOrderNumber", "notes"]}
        searchPlaceholder="Buscar por cliente, numero de OT o notas de transporte..."
        emptyTitle="No hay entregas registradas"
        emptyDescription="Cuando registres el primer remito o despacho, aparecera aqui."
        toolbarActions={
          <Can perform="deliveries:create">
            <Button
              colorPalette="blue"
              size="sm"
              disabled={loading || Boolean(loadError)}
              onClick={handleOpenCreate}
            >
              <LuPlus style={{ marginRight: "6px" }} />
              Nueva entrega
            </Button>
          </Can>
        }
        actions={(delivery) => (
          <HStack gap={1}>
            <Can perform="deliveries:edit">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() => handleOpenEdit(delivery)}
                title="Editar entrega"
                aria-label="Editar entrega"
              >
                <LuPencil size={14} />
              </Button>
            </Can>
          </HStack>
        )}
      />

      {/* Modal de formulario de Alta / Edicion */}
      <DeliveryFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        delivery={selectedDelivery}
        workOrders={workOrders}
        onSave={handleSaveDelivery}
      />
    </Box>
  );
}
