import { useNavigate } from "react-router-dom";
import { Badge, Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { LuPlus, LuShieldCheck, LuTruck } from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
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
            <Badge colorPalette="gray" variant="subtle" size="sm">
              QualityTrack
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

      <Alert
        status="info"
        title="Indicadores no disponibles"
        description="No hay datos verificados para mostrar los indicadores de manufactura y trazabilidad. Consultá el estado de cada módulo desde el menú."
      />
    </Box>
  );
}
