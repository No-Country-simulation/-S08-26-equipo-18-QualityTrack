import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuCheck,
  LuChevronRight,
  LuCircleAlert,
  LuFileSpreadsheet,
  LuFileText,
  LuPaperclip,
  LuShieldCheck,
  LuTruck,
} from "react-icons/lu";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { WorkOrder } from "../../services/workOrderService";
import type { QualityControl } from "../../services/qualityService";
import type { Delivery } from "../../services/deliveryService";
import type { Document } from "../../services/documentService";
import { MOCK_WORK_ORDERS } from "../../test/mocks/mockWorkOrders";
import { MOCK_QUALITY_CONTROLS } from "../../test/mocks/mockQualityControls";
import { MOCK_DELIVERIES } from "../../test/mocks/mockDeliveries";
import { MOCK_DOCUMENTS } from "../../test/mocks/mockDocuments";

export interface WorkOrderTraceabilitySummary {
  workOrder: WorkOrder;
  hasRequest: boolean;
  hasQuotation: boolean;
  hasQuality: boolean;
  hasDeliveries: boolean;
  hasDocuments: boolean;
  qualityCount: number;
  deliveryCount: number;
  documentCount: number;
  score: number;
  percentage: number;
  missing: string[];
}

export interface TraceabilityCompletenessCardProps {
  workOrders?: WorkOrder[];
  qualityControls?: QualityControl[];
  deliveries?: Delivery[];
  documents?: Document[];
  onNavigateToWorkOrder?: (id: number) => void;
}

export function TraceabilityCompletenessCard({
  workOrders = MOCK_WORK_ORDERS,
  qualityControls = MOCK_QUALITY_CONTROLS,
  deliveries = MOCK_DELIVERIES,
  documents = MOCK_DOCUMENTS,
  onNavigateToWorkOrder,
}: TraceabilityCompletenessCardProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"ALL" | "INCOMPLETE" | "COMPLETE">(
    "ALL",
  );
  const [showAll, setShowAll] = useState(false);

  const handleNavigate = (id: number) => {
    if (onNavigateToWorkOrder) {
      onNavigateToWorkOrder(id);
    } else {
      navigate(`/work-orders/${id}`);
    }
  };

  const {
    summaries,
    completeCount,
    incompleteCount,
    totalCount,
    completePercentage,
    averagePercentage,
  } = useMemo(() => {
    const list: WorkOrderTraceabilitySummary[] = workOrders.map((wo) => {
      const hasRequest = Boolean(wo.requestId || wo.request);
      const hasQuotation = Boolean(wo.quotationId || wo.quotation);
      const relatedQuality = qualityControls.filter(
        (qc) => qc.workOrderId === wo.id,
      );
      const hasQuality = relatedQuality.length > 0;
      const relatedDeliveries = deliveries.filter(
        (del) => del.workOrderId === wo.id,
      );
      const hasDeliveries = relatedDeliveries.length > 0;
      const relatedDocs = documents.filter((doc) => doc.workOrderId === wo.id);
      const hasDocuments = relatedDocs.length > 0;

      const missing: string[] = [];
      if (!hasRequest) missing.push("Solicitud");
      if (!hasQuotation) missing.push("Cotizacion");
      if (!hasQuality) missing.push("Calidad");
      if (!hasDeliveries) missing.push("Entregas");
      if (!hasDocuments) missing.push("Documentos");

      const score = 5 - missing.length;
      const percentage = Math.round((score / 5) * 100);

      return {
        workOrder: wo,
        hasRequest,
        hasQuotation,
        hasQuality,
        hasDeliveries,
        hasDocuments,
        qualityCount: relatedQuality.length,
        deliveryCount: relatedDeliveries.length,
        documentCount: relatedDocs.length,
        score,
        percentage,
        missing,
      };
    });

    const total = list.length;
    const complete = list.filter((s) => s.score === 5).length;
    const incomplete = total - complete;
    const compPct = total > 0 ? Math.round((complete / total) * 100) : 0;
    const avgPct =
      total > 0
        ? Math.round(list.reduce((acc, s) => acc + s.percentage, 0) / total)
        : 0;

    return {
      summaries: list,
      completeCount: complete,
      incompleteCount: incomplete,
      totalCount: total,
      completePercentage: compPct,
      averagePercentage: avgPct,
    };
  }, [workOrders, qualityControls, deliveries, documents]);

  const filteredSummaries = useMemo(() => {
    let result = summaries;
    if (filter === "COMPLETE") {
      result = summaries.filter((s) => s.score === 5);
    } else if (filter === "INCOMPLETE") {
      result = summaries.filter((s) => s.score < 5);
    }
    return [...result].sort((a, b) => a.score - b.score);
  }, [summaries, filter]);

  const displayedSummaries = useMemo(() => {
    if (showAll) {
      return filteredSummaries;
    }
    return filteredSummaries.slice(0, 5);
  }, [filteredSummaries, showAll]);

  return (
    <Card
      p={5}
      title={
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "flex-start", sm: "center" }}
          gap={2}
          w="full"
        >
          <HStack gap={2}>
            <LuShieldCheck size={22} color="#059669" />
            <Box>
              <Heading size="md" color="gray.800">
                Completitud de trazabilidad
              </Heading>
              <Text fontSize="xs" color="gray.500" fontWeight="normal">
                Seguimiento de integridad documental y operativa del expediente
                por orden de trabajo
              </Text>
            </Box>
          </HStack>

          <HStack gap={2} wrap="wrap">
            <HStack gap={1} bg="gray.100" p={1} borderRadius="md">
              <Button
                size="xs"
                variant={filter === "ALL" ? "solid" : "ghost"}
                colorPalette={filter === "ALL" ? "blue" : "gray"}
                onClick={() => setFilter("ALL")}
              >
                Todas ({totalCount})
              </Button>
              <Button
                size="xs"
                variant={filter === "INCOMPLETE" ? "solid" : "ghost"}
                colorPalette={filter === "INCOMPLETE" ? "yellow" : "gray"}
                onClick={() => setFilter("INCOMPLETE")}
              >
                Pendientes ({incompleteCount})
              </Button>
              <Button
                size="xs"
                variant={filter === "COMPLETE" ? "solid" : "ghost"}
                colorPalette={filter === "COMPLETE" ? "green" : "gray"}
                onClick={() => setFilter("COMPLETE")}
              >
                Completas ({completeCount})
              </Button>
            </HStack>

            {filteredSummaries.length > 5 && (
              <Button
                size="xs"
                variant="outline"
                colorPalette="blue"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll
                  ? "Mostrar 5"
                  : `Ver todas (${filteredSummaries.length})`}
              </Button>
            )}
          </HStack>
        </Flex>
      }
    >
      {/* Resumen metrico superior */}
      <Box
        p={4}
        bg="gray.50"
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
        mt={2}
        mb={4}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
        >
          <Box flex="1" w="full">
            <Flex justify="space-between" align="baseline" mb={1.5}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.700"
                textTransform="uppercase"
              >
                Indice general de trazabilidad
              </Text>
              <HStack gap={2}>
                <Text fontSize="sm" fontWeight="bold" color="green.700">
                  {completePercentage}% expedientes completos
                </Text>
                <Text fontSize="xs" color="gray.500">
                  ({averagePercentage}% promedio global)
                </Text>
              </HStack>
            </Flex>

            {/* Barra de progreso visual */}
            <Box
              w="full"
              h="8px"
              bg="gray.200"
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                h="full"
                w={`${averagePercentage}%`}
                bg={
                  averagePercentage >= 80
                    ? "green.500"
                    : averagePercentage >= 50
                    ? "blue.500"
                    : "yellow.500"
                }
                borderRadius="full"
                transition="width 0.4s ease"
              />
            </Box>
          </Box>

          <HStack gap={3} flexShrink={0} fontSize="xs">
            <HStack
              gap={1.5}
              color="green.700"
              bg="green.50"
              px={2.5}
              py={1}
              borderRadius="md"
            >
              <LuCheck size={14} />
              <Text fontWeight="semibold">{completeCount} al 100%</Text>
            </HStack>
            <HStack
              gap={1.5}
              color="yellow.800"
              bg="yellow.50"
              px={2.5}
              py={1}
              borderRadius="md"
            >
              <LuCircleAlert size={14} />
              <Text fontWeight="semibold">{incompleteCount} con faltantes</Text>
            </HStack>
          </HStack>
        </Flex>
      </Box>

      {/* Listado de ordenes de trabajo con columnas perfectamente alineadas */}
      <VStack
        gap={2.5}
        align="stretch"
        maxH={showAll ? "460px" : undefined}
        overflowY={showAll ? "auto" : undefined}
        pr={showAll ? 1 : 0}
      >
        {displayedSummaries.map((item) => {
          const { workOrder: wo } = item;
          const isComplete = item.score === 5;

          return (
            <Box
              key={wo.id}
              p={3}
              borderWidth="1px"
              borderColor={isComplete ? "gray.200" : "yellow.200"}
              bg={isComplete ? "white" : "yellow.50/20"}
              borderRadius="md"
              _hover={{
                bg: "gray.50",
                cursor: "pointer",
                borderColor: "blue.300",
              }}
              onClick={() => handleNavigate(wo.id)}
              transition="all 0.15s ease"
            >
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
                gap={3}
              >
                {/* Columna 1: Informacion de la orden y faltantes (ancho flexible a la izquierda) */}
                <Box flex="1" minW="0" pr={{ md: 4 }}>
                  <HStack gap={2} mb={0.5}>
                    <Text
                      fontFamily="mono"
                      fontSize="xs"
                      fontWeight="bold"
                      color="blue.700"
                      bg="blue.50"
                      px={1.5}
                      py={0.5}
                      borderRadius="sm"
                      flexShrink={0}
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
                  <HStack gap={2} fontSize="xs" color="gray.500" wrap="wrap">
                    <Text lineClamp={1}>
                      {wo.client?.businessName || `Cliente #${wo.clientId}`}
                    </Text>
                    {!isComplete && (
                      <>
                        <Text color="gray.300">|</Text>
                        <Text
                          fontSize="2xs"
                          color="orange.700"
                          fontWeight="medium"
                          lineClamp={1}
                        >
                          Falta: {item.missing.join(", ")}
                        </Text>
                      </>
                    )}
                  </HStack>
                </Box>

                {/* Columna 2: Los 5 eslabones de trazabilidad con posicion FIJA */}
                <HStack
                  gap={1.5}
                  flexShrink={0}
                  w={{ base: "full", md: "340px" }}
                  justify={{ base: "space-between", md: "center" }}
                >
                  {/* Solicitud */}
                  <Badge
                    size="xs"
                    w="60px"
                    justifyContent="center"
                    variant={item.hasRequest ? "subtle" : "outline"}
                    colorPalette={item.hasRequest ? "green" : "gray"}
                    title={
                      item.hasRequest
                        ? "Solicitud vinculada"
                        : "Falta solicitud de origen"
                    }
                  >
                    <LuFileText size={11} style={{ marginRight: "3px" }} />
                    Sol. {item.hasRequest ? "✓" : "—"}
                  </Badge>

                  {/* Cotizacion */}
                  <Badge
                    size="xs"
                    w="60px"
                    justifyContent="center"
                    variant={item.hasQuotation ? "subtle" : "outline"}
                    colorPalette={item.hasQuotation ? "green" : "gray"}
                    title={
                      item.hasQuotation
                        ? "Cotizacion aprobada"
                        : "Falta cotizacion aprobada"
                    }
                  >
                    <LuFileSpreadsheet
                      size={11}
                      style={{ marginRight: "3px" }}
                    />
                    Cot. {item.hasQuotation ? "✓" : "—"}
                  </Badge>

                  {/* Calidad */}
                  <Badge
                    size="xs"
                    w="60px"
                    justifyContent="center"
                    variant={item.hasQuality ? "subtle" : "outline"}
                    colorPalette={item.hasQuality ? "green" : "gray"}
                    title={
                      item.hasQuality
                        ? `${item.qualityCount} controles registrados`
                        : "Sin controles de calidad"
                    }
                  >
                    <LuShieldCheck size={11} style={{ marginRight: "3px" }} />
                    Cal. {item.hasQuality ? `${item.qualityCount}` : "—"}
                  </Badge>

                  {/* Entregas */}
                  <Badge
                    size="xs"
                    w="60px"
                    justifyContent="center"
                    variant={item.hasDeliveries ? "subtle" : "outline"}
                    colorPalette={item.hasDeliveries ? "green" : "gray"}
                    title={
                      item.hasDeliveries
                        ? `${item.deliveryCount} remitos emitidos`
                        : "Sin remitos de entrega"
                    }
                  >
                    <LuTruck size={11} style={{ marginRight: "3px" }} />
                    Ent. {item.hasDeliveries ? `${item.deliveryCount}` : "—"}
                  </Badge>

                  {/* Documentos */}
                  <Badge
                    size="xs"
                    w="60px"
                    justifyContent="center"
                    variant={item.hasDocuments ? "subtle" : "outline"}
                    colorPalette={item.hasDocuments ? "green" : "gray"}
                    title={
                      item.hasDocuments
                        ? `${item.documentCount} documentos adjuntos`
                        : "Sin documentacion tecnica"
                    }
                  >
                    <LuPaperclip size={11} style={{ marginRight: "3px" }} />
                    Doc. {item.hasDocuments ? `${item.documentCount}` : "—"}
                  </Badge>
                </HStack>

                {/* Columna 3: Porcentaje y flecha de navegacion con posicion FIJA */}
                <HStack
                  gap={2}
                  flexShrink={0}
                  w={{ base: "full", md: "85px" }}
                  justify="flex-end"
                >
                  <Badge
                    size="sm"
                    w="46px"
                    justifyContent="center"
                    colorPalette={
                      item.percentage === 100
                        ? "green"
                        : item.percentage >= 80
                        ? "blue"
                        : item.percentage >= 60
                        ? "yellow"
                        : "red"
                    }
                    variant="subtle"
                  >
                    {item.percentage}%
                  </Badge>
                  <LuChevronRight size={16} color="#9CA3AF" />
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </Card>
  );
}

export default TraceabilityCompletenessCard;
