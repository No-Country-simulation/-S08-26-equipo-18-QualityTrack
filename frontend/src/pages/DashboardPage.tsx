import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { Card } from "../components/Card";
import { useAuthStore } from "../store/authStore";

const STATS = [
  { label: "Órdenes activas", value: "—", hint: "Sin conectar a la API" },
  {
    label: "Solicitudes pendientes",
    value: "—",
    hint: "Sin conectar a la API",
  },
  {
    label: "Controles de calidad hoy",
    value: "—",
    hint: "Sin conectar a la API",
  },
  { label: "Entregas programadas", value: "—", hint: "Sin conectar a la API" },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <Box>
      <Heading size="lg" color="gray.800" mb={1}>
        Hola, {user?.firstName ?? "operador"}
      </Heading>
      <Text color="gray.500" mb={6}>
        Aquí puedes ver un resumen de todas las métricas de planta.
      </Text>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        {STATS.map((stat) => (
          <Card key={stat.label} title={stat.label}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {stat.value}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {stat.hint}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
