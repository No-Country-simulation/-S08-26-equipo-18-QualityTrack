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
import type { IconType } from "react-icons";
import {
  LuActivity,
  LuCalendar,
  LuChevronRight,
  LuFileSpreadsheet,
  LuFileText,
  LuShieldCheck,
  LuTruck,
  LuWrench,
} from "react-icons/lu";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { formatDate } from "../../utils";
import type { WorkOrder } from "../../services/workOrderService";
import type { Request } from "../../services/requestService";
import type { Quotation } from "../../services/quotationService";
import type { QualityControl } from "../../services/qualityService";
import type { Delivery } from "../../services/deliveryService";

export type TimelineEventType =
  | "ALL"
  | "WORK_ORDER"
  | "QUALITY"
  | "DELIVERY"
  | "COMMERCIAL";

export interface TimelineEvent {
  id: string;
  category: "WORK_ORDER" | "QUALITY" | "DELIVERY" | "COMMERCIAL";
  title: string;
  description: string;
  date: string;
  path: string;
  badgeLabel: string;
  badgeColorPalette: string;
  icon: IconType;
  iconColor: string;
  iconBg: string;
}

export interface TraceabilityTimelineCardProps {
  workOrders?: WorkOrder[];
  requests?: Request[];
  quotations?: Quotation[];
  qualityControls?: QualityControl[];
  deliveries?: Delivery[];
  limit?: number;
  onNavigate?: (path: string) => void;
}

export function TraceabilityTimelineCard({
  workOrders = [],
  requests = [],
  quotations = [],
  qualityControls = [],
  deliveries = [],
  limit = 5,
  onNavigate,
}: TraceabilityTimelineCardProps) {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] =
    useState<TimelineEventType>("ALL");

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const allEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Entregas registradas
    for (const del of deliveries) {
      const woNum = del.workOrder?.workOrderNumber || del.workOrderId;
      const clientName = del.client?.businessName || "Cliente";
      events.push({
        id: `del-${del.id}`,
        category: "DELIVERY",
        title: `Entrega #${del.id}`,
        description: `Despacho de ${del.quantity} u. para OT-${woNum} (${clientName})`,
        date: del.deliveryDate || del.createdAt || "",
        path: `/deliveries`,
        badgeLabel: "Entrega",
        badgeColorPalette: "purple",
        icon: LuTruck,
        iconColor: "#7C3AED",
        iconBg: "purple.50",
      });
    }

    // Controles de calidad
    for (const qc of qualityControls) {
      const woNum = qc.workOrder?.workOrderNumber || qc.workOrderId;
      events.push({
        id: `qc-${qc.id}`,
        category: "QUALITY",
        title: `Inspección #${qc.id}`,
        description: `Inspección registrada "${qc.specification}" para OT-${woNum}`,
        date: qc.performedAt || qc.createdAt || "",
        path: `/work-orders/${qc.workOrderId}`,
        badgeLabel: "Calidad",
        badgeColorPalette: "teal",
        icon: LuShieldCheck,
        iconColor: "#0D9488",
        iconBg: "teal.50",
      });
    }

    // Ordenes de trabajo
    for (const wo of workOrders) {
      const clientName = wo.client?.businessName || (wo.clientId ? `Cliente #${wo.clientId}` : "Cliente no documentado");
      events.push({
        id: `wo-${wo.id}`,
        category: "WORK_ORDER",
        title: `OT-${wo.workOrderNumber}`,
        description: `${wo.title} (${clientName})`,
        date: wo.actualStartDate || wo.createdAt,
        path: `/work-orders/${wo.id}`,
        badgeLabel: "OT",
        badgeColorPalette: "blue",
        icon: LuWrench,
        iconColor: "#2563EB",
        iconBg: "blue.50",
      });
    }

    // Cotizaciones
    for (const quot of quotations) {
      const clientName =
        quot.client?.businessName || `Cliente #${quot.clientId}`;
      events.push({
        id: `quot-${quot.id}`,
        category: "COMMERCIAL",
        title: `Cotizacion ${quot.quotationNumber}`,
        description: `Version ${quot.version} emitida para ${clientName}`,
        date: quot.createdAt || "",
        path: `/quotations?search=${encodeURIComponent(quot.quotationNumber)}`,
        badgeLabel: "Cotizacion",
        badgeColorPalette: "green",
        icon: LuFileSpreadsheet,
        iconColor: "#16A34A",
        iconBg: "green.50",
      });
    }

    // Solicitudes
    for (const req of requests) {
      const clientName = req.client?.businessName || `Cliente #${req.clientId}`;
      events.push({
        id: `req-${req.id}`,
        category: "COMMERCIAL",
        title: `Solicitud ${req.requestNumber}`,
        description: `${req.title} (${clientName})`,
        date: req.receivedAt || req.createdAt || "",
        path: `/requests?search=${encodeURIComponent(req.requestNumber)}`,
        badgeLabel: "Solicitud",
        badgeColorPalette: "yellow",
        icon: LuFileText,
        iconColor: "#D97706",
        iconBg: "yellow.50",
      });
    }

    // Ordenar de mas reciente a mas antigua
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [deliveries, qualityControls, workOrders, quotations, requests]);

  const filteredEvents = useMemo(() => {
    if (selectedFilter !== "ALL") {
      return allEvents
        .filter((e) => e.category === selectedFilter)
        .slice(0, limit);
    }

    return allEvents.slice(0, limit);
  }, [allEvents, selectedFilter, limit]);

  return (
    <Card p={5} h="full">
      {/* Encabezado: Titulo/subtitulo a la izquierda y filtros compactos a la derecha superior */}
      <Flex
        justify="space-between"
        align="center"
        mb={3}
        minH="40px"
      >
        <Box minW="0" mr={2}>
          <HStack gap={1.5} mb={0.5}>
            <LuActivity size={18} color="#2563EB" />
            <Heading fontSize="sm" color="gray.800" whiteSpace="nowrap">
              Flujo reciente de manufactura y trazabilidad
            </Heading>
          </HStack>
          <Text fontSize="2xs" color="gray.500" whiteSpace="nowrap">
            Registros ordenados por fecha de los módulos consultados correctamente.
          </Text>
        </Box>

        {/* Filtros compactos en el lado derecho superior */}
        <HStack
          gap={0.5}
          bg="gray.100"
          p={0.5}
          borderRadius="md"
          wrap="nowrap"
          flexShrink={0}
        >
          <Button
            size="2xs"
            px={1.5}
            h="22px"
            fontSize="2xs"
            variant={selectedFilter === "ALL" ? "solid" : "ghost"}
            colorPalette={selectedFilter === "ALL" ? "blue" : "gray"}
            onClick={() => setSelectedFilter("ALL")}
          >
            Todos
          </Button>
          <Button
            size="2xs"
            px={1.5}
            h="22px"
            fontSize="2xs"
            variant={selectedFilter === "WORK_ORDER" ? "solid" : "ghost"}
            colorPalette={selectedFilter === "WORK_ORDER" ? "blue" : "gray"}
            onClick={() => setSelectedFilter("WORK_ORDER")}
          >
            OTs
          </Button>
          <Button
            size="2xs"
            px={1.5}
            h="22px"
            fontSize="2xs"
            variant={selectedFilter === "QUALITY" ? "solid" : "ghost"}
            colorPalette={selectedFilter === "QUALITY" ? "teal" : "gray"}
            onClick={() => setSelectedFilter("QUALITY")}
          >
            Calidad
          </Button>
          <Button
            size="2xs"
            px={1.5}
            h="22px"
            fontSize="2xs"
            variant={selectedFilter === "DELIVERY" ? "solid" : "ghost"}
            colorPalette={selectedFilter === "DELIVERY" ? "purple" : "gray"}
            onClick={() => setSelectedFilter("DELIVERY")}
          >
            Entregas
          </Button>
          <Button
            size="2xs"
            px={1.5}
            h="22px"
            fontSize="2xs"
            variant={selectedFilter === "COMMERCIAL" ? "solid" : "ghost"}
            colorPalette={selectedFilter === "COMMERCIAL" ? "green" : "gray"}
            onClick={() => setSelectedFilter("COMMERCIAL")}
          >
            Comercial
          </Button>
        </HStack>
      </Flex>

      {/* Listado de eventos en sub-contenedores (alineados a la misma altura que las OTs) */}
      <VStack gap={3} align="stretch">
        {filteredEvents.length === 0 && <Text>Sin actividad disponible para este filtro.</Text>}
        {filteredEvents.map((event) => {
          const EventIcon = event.icon;

          return (
            <Flex
              key={event.id}
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
              onClick={() => handleNavigate(event.path)}
              transition="all 0.15s ease"
            >
              <HStack gap={3} maxW="70%">
                <Flex
                  w={8}
                  h={8}
                  borderRadius="md"
                  bg={event.iconBg}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <EventIcon size={16} color={event.iconColor} />
                </Flex>

                <Box minW="0">
                  <HStack gap={2} mb={1}>
                    <Badge
                      size="xs"
                      colorPalette={event.badgeColorPalette}
                      variant="subtle"
                    >
                      {event.badgeLabel}
                    </Badge>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="gray.800"
                      lineClamp={1}
                    >
                      {event.title}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" lineClamp={1}>
                    {event.description}
                  </Text>
                </Box>
              </HStack>

              <HStack gap={1.5} color="gray.400" fontSize="xs" flexShrink={0}>
                <LuCalendar size={13} />
                <Text>{formatDate(event.date)}</Text>
                <LuChevronRight size={14} color="#9CA3AF" />
              </HStack>
            </Flex>
          );
        })}
      </VStack>
    </Card>
  );
}

export default TraceabilityTimelineCard;
