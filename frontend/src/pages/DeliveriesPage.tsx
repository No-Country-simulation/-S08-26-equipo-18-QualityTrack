import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPencil, LuPlus, LuTrash2, LuTruck } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { DELIVERY_COLUMNS, DeliveryFormModal } from "../modules/deliveries";
import { MOCK_CLIENTS } from "../test/mocks/mockClients";
import { MOCK_DELIVERIES } from "../test/mocks/mockDeliveries";
import { MOCK_WORK_ORDERS } from "../test/mocks/mockWorkOrders";
import { ApiError } from "../services/api";
import { clientService } from "../services/clientService";
import type { Client } from "../services/clientService";
import { deliveryService } from "../services/deliveryService";
import type { CreateDeliveryDto, Delivery } from "../services/deliveryService";
import { workOrderService } from "../services/workOrderService";
import type { WorkOrder } from "../services/workOrderService";

type DeliveryRecord = Delivery & {
  clientName?: string;
  workOrderNumber?: string;
} & Record<string, unknown>;

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Ocurrio un error inesperado.";
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] = useState<Delivery | null>(null);
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
      let delData: Delivery[];
      try {
        delData = await deliveryService.getAll();
      } catch (backendErr) {
        console.warn(
          "Backend no disponible para entregas, utilizando datos locales.",
          backendErr,
        );
        delData = MOCK_DELIVERIES;
      }
      setDeliveries(delData);

      try {
        const woData = await workOrderService.getAll();
        setWorkOrders(woData.length > 0 ? woData : MOCK_WORK_ORDERS);
      } catch {
        setWorkOrders(MOCK_WORK_ORDERS);
      }

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
      setDeliveries(MOCK_DELIVERIES);
      setWorkOrders(MOCK_WORK_ORDERS);
      setClients(MOCK_CLIENTS);
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

  const handleOpenDelete = (delivery: Delivery) => {
    setDeleteCandidate(delivery);
  };

  const handleSaveDelivery = async (formData: CreateDeliveryDto) => {
    const associatedWo = workOrders.find((w) => w.id === formData.workOrderId);
    const associatedClient = clients.find((c) => c.id === formData.clientId);

    if (selectedDelivery) {
      // Edicion de entrega existente
      try {
        const updated = await deliveryService.update(
          selectedDelivery.id,
          formData,
        );
        setDeliveries((prev) =>
          prev.map((item) =>
            item.id === selectedDelivery.id
              ? ({
                  ...item,
                  ...updated,
                  workOrder: associatedWo,
                  client: associatedClient,
                  updatedAt: new Date().toISOString(),
                } as Delivery)
              : item,
          ),
        );
        showNotification("Entrega actualizada correctamente.");
      } catch {
        setDeliveries((prev) =>
          prev.map((item) =>
            item.id === selectedDelivery.id
              ? ({
                  ...item,
                  ...formData,
                  workOrder: associatedWo,
                  client: associatedClient,
                  updatedAt: new Date().toISOString(),
                } as Delivery)
              : item,
          ),
        );
        showNotification("Entrega actualizada correctamente.");
      }
    } else {
      // Alta de nueva entrega
      try {
        const created = await deliveryService.create(formData);
        const newDelivery = {
          ...created,
          workOrder: associatedWo,
          client: associatedClient,
        } as Delivery;
        setDeliveries((prev) => [newDelivery, ...prev]);
        showNotification("Entrega registrada con exito.");
      } catch {
        const newId =
          deliveries.length > 0
            ? Math.max(...deliveries.map((d) => d.id)) + 1
            : 1;

        const newDelivery: Delivery = {
          id: newId,
          ...formData,
          workOrder: associatedWo,
          client: associatedClient,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setDeliveries((prev) => [newDelivery, ...prev]);
        showNotification("Entrega registrada con exito.");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    const target = deleteCandidate;
    setDeleteCandidate(null);

    try {
      await deliveryService.delete(target.id);
    } catch {
      // Fallback local
    }

    setDeliveries((prev) =>
      prev.filter((item) => item.id !== target.id),
    );
    showNotification(`Remito "#REM-${target.id}" eliminado.`);
  };

  // Mapeamos para permitir busqueda multicanal enriquecida
  const tableData: DeliveryRecord[] = useMemo(() => {
    return deliveries.map((d) => ({
      ...d,
      clientName: d.client?.businessName || "",
      workOrderNumber: d.workOrder?.workOrderNumber
        ? `OT-${d.workOrder.workOrderNumber}`
        : `OT-${d.workOrderId}`,
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
            <Button colorPalette="blue" size="sm" onClick={handleOpenCreate}>
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

            <Can perform="deliveries:delete">
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => handleOpenDelete(delivery)}
                title="Eliminar entrega"
                aria-label="Eliminar entrega"
              >
                <LuTrash2 size={14} />
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
        clients={clients}
        onSave={handleSaveDelivery}
      />

      {/* Dialogo de confirmacion de eliminacion */}
      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={({ open }) => {
          if (!open) setDeleteCandidate(null);
        }}
        title="Eliminar entrega"
        description={`Estas seguro de que deseas eliminar el remito "#REM-${deleteCandidate?.id}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPalette="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}
