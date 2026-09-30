import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuArrowRight,
  LuCalendar,
  LuFileText,
  LuPlus,
  LuShieldCheck,
  LuTruck,
  LuWrench,
} from "react-icons/lu";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { Card } from "../components/Card";
import {
  StatCard,
  TraceabilityCompletenessCard,
  TraceabilityTimelineCard,
} from "../modules/dashboard";
import { formatDate } from "../modules/deliveries";
import { PriorityBadge } from "../modules/workOrders/PriorityBadge";
import { StatusBadge } from "../modules/workOrders/StatusBadge";
import { useAuthStore } from "../store/authStore";
import { MOCK_DELIVERIES } from "../test/mocks/mockDeliveries";
import { MOCK_QUALITY_CONTROLS } from "../test/mocks/mockQualityControls";
import { MOCK_REQUESTS } from "../test/mocks/mockRequests";
import { MOCK_WORK_ORDERS } from "../test/mocks/mockWorkOrders";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Calculos operativos reactivos a partir de los datos de planta
  const stats = useMemo(() => {
    const inProgressCount = MOCK_WORK_ORDERS.filter(
      (wo) => wo.status === "IN_PROGRESS",
    ).length;
    const pendingWoCount = MOCK_WORK_ORDERS.filter(
      (wo) => wo.status === "PENDING",
    ).length;
    const activeWoTotal = inProgressCount + pendingWoCount;

    return {
      activeWorkOrders: activeWoTotal,
      activeWoHint: `${inProgressCount} en proceso, ${pendingWoCount} pendientes`,
      pendingRequests: MOCK_REQUESTS.length,
      pendingRequestsHint: "Pendientes de cotizacion tecnica",
      qualityControls: MOCK_QUALITY_CONTROLS.length,
      qualityControlsHint: "Ensayos e inspecciones registradas",
      scheduledDeliveries: MOCK_DELIVERIES.length,
      scheduledDeliveriesHint: "Despachos y remitos emitidos",
    };
  }, []);

  const recentWorkOrders = useMemo(() => {
    return MOCK_WORK_ORDERS.slice(0, 5);
  }, []);

  return (
    <Box>
      {/* Encabezado de bienvenida y estado del sistema MES */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap={4}
        mb={6}
      >
        <Box>
          <HStack gap={2} mb={1}>
            <Heading size="lg" color="gray.800">
              Hola, {user?.firstName ?? "operador"}
            </Heading>
            <Badge colorPalette="green" variant="subtle" size="sm">
              MES Operativo
            </Badge>
          </HStack>
          <Text color="gray.500" fontSize="sm">
            Panel de control general y estado operativo de manufactura en
            planta.
          </Text>
        </Box>

        {/* Acciones rapidas de creacion protegidas por permisos */}
        <HStack gap={2} wrap="wrap">
          <Can perform="workOrders:create">
            <Button
              size="sm"
              colorPalette="blue"
              onClick={() => navigate("/work-orders")}
            >
              <LuPlus style={{ marginRight: "6px" }} />
              Nueva OT
            </Button>
          </Can>
          <Can perform="quality:inspect">
            <Button
              size="sm"
              variant="outline"
              colorPalette="teal"
              onClick={() => navigate("/quality")}
            >
              <LuShieldCheck style={{ marginRight: "6px" }} />
              Nuevo control
            </Button>
          </Can>
          <Can perform="deliveries:create">
            <Button
              size="sm"
              variant="outline"
              colorPalette="purple"
              onClick={() => navigate("/deliveries")}
            >
              <LuTruck style={{ marginRight: "6px" }} />
              Nueva entrega
            </Button>
          </Can>
        </HStack>
      </Flex>

      {/* Tarjetas de metricas operativas (StatCards) */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
        <StatCard
          label="Ordenes activas"
          value={stats.activeWorkOrders}
          hint={stats.activeWoHint}
          icon={LuWrench}
          iconColor="#2563EB"
          iconBg="blue.50"
        />
        <StatCard
          label="Solicitudes pendientes"
          value={stats.pendingRequests}
          hint={stats.pendingRequestsHint}
          icon={LuFileText}
          iconColor="#D97706"
          iconBg="yellow.50"
        />
        <StatCard
          label="Controles de calidad"
          value={stats.qualityControls}
          hint={stats.qualityControlsHint}
          icon={LuShieldCheck}
          iconColor="#059669"
          iconBg="green.50"
        />
        <StatCard
          label="Entregas registradas"
          value={stats.scheduledDeliveries}
          hint={stats.scheduledDeliveriesHint}
          icon={LuTruck}
          iconColor="#7C3AED"
          iconBg="purple.50"
        />
      </SimpleGrid>

      {/* Tarea 8.1: Widget de completitud de trazabilidad */}
      <Box mb={6}>
        <TraceabilityCompletenessCard />
      </Box>

      {/* Grilla operativa inferior: Linea de tiempo y Ultimas OTs */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Tarea 8.2: Flujo reciente de trazabilidad (Timeline) */}
        <TraceabilityTimelineCard limit={5} />

        {/* Panel operativo directo: Ultimas ordenes de trabajo */}
        <Card p={5} h="full">
          <Flex justify="space-between" align="center" mb={3} minH="40px">
            <Box minW="0" mr={2}>
              <HStack gap={1.5} mb={0.5}>
                <LuWrench size={18} color="#2563EB" />
                <Heading fontSize="sm" color="gray.800" whiteSpace="nowrap">
                  Ultimas ordenes de trabajo
                </Heading>
              </HStack>
              <Text fontSize="2xs" color="gray.500" whiteSpace="nowrap">
                Estado y prioridad de las ultimas ordenes en planta
              </Text>
            </Box>
            <Button
              variant="ghost"
              size="xs"
              h="24px"
              colorPalette="blue"
              onClick={() => navigate("/work-orders")}
              flexShrink={0}
            >
              Ver todas <LuArrowRight style={{ marginLeft: "4px" }} />
            </Button>
          </Flex>

          <VStack gap={3} align="stretch">
            {recentWorkOrders.map((wo) => (
              <Flex
                key={wo.id}
                p={3}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                justify="space-between"
                align="center"
                _hover={{
                  bg: "gray.50",
                  cursor: "pointer",
                  borderColor: "blue.300",
                }}
                onClick={() => navigate(`/work-orders/${wo.id}`)}
                transition="all 0.15s ease"
              >
                <Box maxW="65%">
                  <HStack gap={2} mb={1}>
                    <Text
                      fontFamily="mono"
                      fontSize="xs"
                      fontWeight="bold"
                      color="blue.700"
                      bg="blue.50"
                      px={1.5}
                      py={0.5}
                      borderRadius="sm"
                    >
                      OT-{wo.workOrderNumber}
                    </Text>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="gray.800"
                      lineClamp={1}
                    >
                      {wo.title}
                    </Text>
                  </HStack>
                  <HStack gap={1} color="gray.500" fontSize="xs">
                    <LuCalendar size={13} />
                    <Text>Fin planif: {formatDate(wo.plannedEndDate)}</Text>
                  </HStack>
                </Box>
                <HStack gap={1.5} flexShrink={0}>
                  <PriorityBadge priority={wo.priority} size="xs" />
                  <StatusBadge status={wo.status} size="xs" />
                </HStack>
              </Flex>
            ))}
          </VStack>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
