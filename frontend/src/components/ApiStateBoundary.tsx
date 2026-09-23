import { Box, Flex, Text } from "@chakra-ui/react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Loading } from "./Loading";

export interface ApiStateBoundaryProps {
  loading: boolean;
  error: string | null;
  data?: unknown;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Componente unificador de estados de API.
 * 1. Loading: Muestra un spinner centrado con mensaje de progreso.
 * 2. Error: Muestra una alerta en español con opción de reintentar.
 * 3. Empty: Muestra el componente EmptyState cuando no hay registros.
 * 4. Success: Renderiza los hijos (tablas, formularios o tarjetas).
 */
export function ApiStateBoundary({
  loading,
  error,
  data,
  onRetry,
  loadingMessage = "Cargando información de planta...",
  emptyTitle = "No hay registros disponibles",
  emptyDescription = "Todavía no se han cargado datos para esta sección.",
  emptyIcon,
  emptyAction,
  children,
}: ApiStateBoundaryProps) {
  // 1. Estado de Carga (Loading)
  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" py={12} gap={3}>
        <Loading size="lg" color="brand.600" />
        <Text fontSize="sm" color="gray.500">
          {loadingMessage}
        </Text>
      </Flex>
    );
  }

  // 2. Estado de Error con Reintento
  if (error) {
    return (
      <Box py={6}>
        <Alert
          status="error"
          title="Error al consultar el servidor"
          description={
            <Box mt={1}>
              <Text fontSize="sm" mb={onRetry ? 3 : 0} color="gray.700">
                {error}
              </Text>
              {onRetry && (
                <Button size="xs" variant="outline" onClick={onRetry}>
                  Reintentar operación
                </Button>
              )}
            </Box>
          }
        />
      </Box>
    );
  }

  // 3. Estado Vacío (Empty State)
  const isEmpty =
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0);

  if (isEmpty) {
    return (
      <Box py={8}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={emptyAction}
        />
      </Box>
    );
  }

  // 4. Estado de Éxito (Success)
  return <>{children}</>;
}

export default ApiStateBoundary;
