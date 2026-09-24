import { useMemo, useState } from "react";
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
import type { Client } from "../services/clientService";
import type { CreateDeliveryDto, Delivery } from "../services/deliveryService";
import type { WorkOrder } from "../services/workOrderService";

type DeliveryRecord = Delivery & {
  clientName?: string;
  workOrderNumber?: string;
} & Record<string, unknown>;

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [workOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [clients] = useState<Client[]>(MOCK_CLIENTS);

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
    } else {
      // Alta de nueva entrega
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
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;

    setDeliveries((prev) =>
      prev.filter((item) => item.id !== deleteCandidate.id),
    );
    showNotification(`Remito "#REM-${deleteCandidate.id}" eliminado.`);
    setDeleteCandidate(null);
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
        searchFields={["clientName", "workOrderNumber", "notes"]}
        searchPlaceholder="Buscar por cliente, numero de OT o notas de transporte..."
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

            <Can perform="deliveries:edit">
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
