import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuCalendar,
  LuClock,
  LuPencil,
  LuTruck,
  LuWrench,
} from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { Card } from "../components/Card";
import {
  formatDate,
  PriorityBadge,
  StatusBadge,
  WorkOrderFormModal,
} from "../modules/workOrders";
import { MOCK_WORK_ORDERS } from "../test/mocks/mockWorkOrders";
import type {
  CreateWorkOrderDto,
  WorkOrder,
} from "../services/workOrderService";

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const initialWo = MOCK_WORK_ORDERS.find(
    (wo) => String(wo.id) === id || String(wo.workOrderNumber) === id,
  );

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(
    initialWo || null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const handleBack = () => {
    navigate("/work-orders");
  };

  const handleSave = async (formData: CreateWorkOrderDto) => {
    if (!workOrder) return;
    const updated: WorkOrder = {
      ...workOrder,
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    setWorkOrder(updated);
    showNotification("Orden de trabajo actualizada con exito.");
  };

  if (!workOrder) {
    return (
      <Box p={6}>
        <Alert
          status="error"
          title="Orden de trabajo no encontrada"
          description={`No se encontro ningun registro para el identificador #${id}.`}
        />
        <Button mt={4} variant="outline" onClick={handleBack}>
          <LuArrowLeft style={{ marginRight: "6px" }} />
          Volver al listado
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Barra de navegacion superior */}
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <LuArrowLeft style={{ marginRight: "6px" }} />
          Volver al listado
        </Button>

        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={() => navigate("/quality")}
          >
            Controles de calidad
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={() => navigate("/deliveries")}
          >
            <LuTruck style={{ marginRight: "4px" }} />
            Entregas
          </Button>
          <Can perform="workOrders:edit">
            <Button
              size="sm"
              colorPalette="blue"
              onClick={() => setIsFormOpen(true)}
            >
              <LuPencil style={{ marginRight: "6px" }} />
              Editar orden
            </Button>
          </Can>
        </HStack>
      </Flex>

      {/* Alerta de notificacion temporal */}
      {notification && (
        <Box mb={4}>
          <Alert status={notification.status} title={notification.message} />
        </Box>
      )}

      {/* Cabecera de la ficha tecnica */}
      <Box
        p={5}
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        boxShadow="sm"
        mb={6}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={3}
          mb={3}
        >
          <HStack gap={3} align="center">
            <Box
              p={2}
              bg="blue.50"
              borderRadius="md"
              color="blue.600"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LuWrench size={26} />
            </Box>
            <Box>
              <HStack gap={2} mb={1}>
                <Text
                  fontFamily="mono"
                  fontSize="sm"
                  fontWeight="bold"
                  color="blue.700"
                  bg="blue.50"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  OT-{workOrder.workOrderNumber}
                </Text>
                <StatusBadge status={workOrder.status} />
                <PriorityBadge priority={workOrder.priority} />
              </HStack>
              <Heading size="md" color="gray.800">
                {workOrder.title}
              </Heading>
            </Box>
          </HStack>
        </Flex>

        <Flex gap={4} fontSize="xs" color="gray.500" wrap="wrap">
          <Text>Creada el: {formatDate(workOrder.createdAt)}</Text>
          <Text>—</Text>
          <Text>Ultima actualizacion: {formatDate(workOrder.updatedAt)}</Text>
        </Flex>
      </Box>

      {/* Grilla con detalles tecnicos y cronograma */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Panel izquierdo: Especificaciones tecnicas */}
        <Card
          title="Especificaciones tecnicas y alcance"
          description="Detalle de operaciones de mecanizado y tolerancias requeridas"
        >
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontSize="xs" color="gray.500" fontWeight="medium" mb={1}>
                Descripcion del trabajo
              </Text>
              <Text
                fontSize="sm"
                color="gray.700"
                lineHeight="tall"
                bg="gray.50"
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.100"
              >
                {workOrder.description}
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
              <Box p={3} borderWidth="1px" borderColor="gray.100" borderRadius="md">
                <Text fontSize="xs" color="gray.500">
                  Prioridad operativa
                </Text>
                <Box mt={1}>
                  <PriorityBadge priority={workOrder.priority} />
                </Box>
              </Box>

              <Box p={3} borderWidth="1px" borderColor="gray.100" borderRadius="md">
                <Text fontSize="xs" color="gray.500">
                  Estado actual
                </Text>
                <Box mt={1}>
                  <StatusBadge status={workOrder.status} />
                </Box>
              </Box>
            </SimpleGrid>
          </VStack>
        </Card>

        {/* Panel derecho: Cronograma y Trazabilidad */}
        <Card
          title="Cronograma de fabricacion"
          description="Comparativa de tiempos planificados vs. ejecucion real en planta"
        >
          <VStack gap={4} align="stretch">
            {/* Fechas planificadas */}
            <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.100">
              <HStack gap={2} mb={2} color="blue.800">
                <LuCalendar size={16} />
                <Text fontSize="xs" fontWeight="bold">
                  Fechas planificadas de ingenieria
                </Text>
              </HStack>
              <SimpleGrid columns={2} gap={2} fontSize="xs">
                <Box>
                  <Text color="gray.500">Inicio planificado:</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {formatDate(workOrder.plannedStartDate)}
                  </Text>
                </Box>
                <Box>
                  <Text color="gray.500">Fin planificado:</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {formatDate(workOrder.plannedEndDate)}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Fechas reales de ejecucion */}
            <Box p={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
              <HStack gap={2} mb={2} color="gray.700">
                <LuClock size={16} />
                <Text fontSize="xs" fontWeight="bold">
                  Registro efectivo en planta
                </Text>
              </HStack>
              <SimpleGrid columns={2} gap={2} fontSize="xs">
                <Box>
                  <Text color="gray.500">Inicio real:</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {workOrder.actualStartDate
                      ? formatDate(workOrder.actualStartDate)
                      : "Pendiente de inicio"}
                  </Text>
                </Box>
                <Box>
                  <Text color="gray.500">Fin real:</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    {workOrder.actualEndDate
                      ? formatDate(workOrder.actualEndDate)
                      : "En proceso / No finalizada"}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
        </Card>
      </SimpleGrid>

      {/* Modal de edicion */}
      <WorkOrderFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        workOrder={workOrder}
        onSave={handleSave}
      />
    </Box>
  );
}