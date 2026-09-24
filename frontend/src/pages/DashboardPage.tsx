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
  LuPackage,
  LuPlus,
  LuShieldCheck,
  LuTruck,
  LuWrench,
} from "react-icons/lu";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { Card } from "../components/Card";
import { StatCard } from "../modules/dashboard";
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

  const recentDeliveries = useMemo(() => {
    return MOCK_DELIVERIES.slice(0, 4);
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

      {/* Grilla operativa inferior: Ultimas OTs y Proximas Entregas */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Panel 1: Ultimas ordenes de trabajo */}
        <Card
          p={5}
          title={
            <Flex align="center" justify="space-between" w="full">
              <HStack gap={2}>
                <LuWrench size={20} color="#2563EB" />
                <Heading size="md" color="gray.800">
                  Ultimas ordenes de trabajo
                </Heading>
              </HStack>
              <Button
                variant="ghost"
                size="xs"
                colorPalette="blue"
                onClick={() => navigate("/work-orders")}
              >
                Ver todas <LuArrowRight style={{ marginLeft: "4px" }} />
              </Button>
            </Flex>
          }
        >
          <VStack gap={3} align="stretch" mt={3}>
            {recentWorkOrders.map((wo) => (
              <Flex
                key={wo.id}
                p={3}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                justify="space-between"
                align="center"
                _hover={{ bg: "gray.50", cursor: "pointer" }}
                onClick={() => navigate(`/work-orders/${wo.id}`)}
                transition="background 0.15s ease"
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

        {/* Panel 2: Proximas entregas y despachos */}
        <Card
          p={5}
          title={
            <Flex align="center" justify="space-between" w="full">
              <HStack gap={2}>
                <LuTruck size={20} color="#7C3AED" />
                <Heading size="md" color="gray.800">
                  Despachos y remitos recientes
                </Heading>
              </HStack>
              <Button
                variant="ghost"
                size="xs"
                colorPalette="purple"
                onClick={() => navigate("/deliveries")}
              >
                Ver todos <LuArrowRight style={{ marginLeft: "4px" }} />
              </Button>
            </Flex>
          }
        >
          <VStack gap={3} align="stretch" mt={3}>
            {recentDeliveries.map((del) => (
              <Flex
                key={del.id}
                p={3}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                justify="space-between"
                align="center"
                _hover={{ bg: "gray.50", cursor: "pointer" }}
                onClick={() => navigate("/deliveries")}
                transition="background 0.15s ease"
              >
                <Box maxW="70%">
                  <HStack gap={2} mb={1}>
                    <Text
                      fontFamily="mono"
                      fontSize="xs"
                      fontWeight="bold"
                      color="teal.700"
                      bg="teal.50"
                      px={1.5}
                      py={0.5}
                      borderRadius="sm"
                    >
                      #REM-{del.id}
                    </Text>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="gray.800"
                      lineClamp={1}
                    >
                      {del.client?.businessName || "Cliente sin registrar"}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" lineClamp={1}>
                    {del.notes || "Despacho de piezas terminadas de planta"}
                  </Text>
                </Box>
                <VStack align="flex-end" gap={0.5} flexShrink={0}>
                  <Badge colorPalette="blue" variant="subtle" size="xs">
                    <LuPackage size={11} style={{ marginRight: "3px" }} />
                    {del.quantity} u.
                  </Badge>
                  <Text fontSize="2xs" color="gray.400">
                    {formatDate(del.deliveryDate)}
                  </Text>
                </VStack>
              </Flex>
            ))}
          </VStack>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
