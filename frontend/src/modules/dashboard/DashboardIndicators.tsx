import { useCallback, useEffect, useRef, useState } from "react";
import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { LuFileText, LuShieldCheck, LuTruck, LuWrench } from "react-icons/lu";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { hasPermission } from "../../utils/permissions";
import { errorMessage } from "../../utils/errorMessage";
import {
  workOrderService,
  type WorkOrder,
} from "../../services/workOrderService";
import { requestService, type Request } from "../../services/requestService";
import {
  quotationService,
  type Quotation,
} from "../../services/quotationService";
import {
  qualityService,
  type QualityControl,
} from "../../services/qualityService";
import { deliveryService, type Delivery } from "../../services/deliveryService";
import { documentService, type Document } from "../../services/documentService";
import { StatCard } from "./StatCard";
import { TraceabilityCompletenessCard } from "./TraceabilityCompletenessCard";
import { TraceabilityTimelineCard } from "./TraceabilityTimelineCard";
import { requestsWithoutQuotation } from "./indicators";

interface Data {
  workOrders?: WorkOrder[];
  requests?: Request[];
  quotations?: Quotation[];
  qualityControls?: QualityControl[];
  deliveries?: Delivery[];
  documents?: Document[];
}

export function DashboardIndicators({ roleName }: { roleName?: string }) {
  const [data, setData] = useState<Data>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const canOrders = hasPermission(roleName, "workOrders:view");
  const canRequests = hasPermission(roleName, "requests:view");
  const canQuotes = hasPermission(roleName, "quotations:view");
  const canQuality = hasPermission(roleName, "quality:view");
  const canDeliveries = hasPermission(roleName, "deliveries:view");
  const load = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true);
    setData({});
    setErrors([]);
    const tasks: { label: string; run: () => Promise<Data> }[] = [];
    if (canOrders) {
      tasks.push({
        label: "OT",
        run: async () => ({ workOrders: await workOrderService.getAll() }),
      });
      tasks.push({
        label: "Documentos",
        run: async () => ({ documents: await documentService.getAll() }),
      });
    }
    if (canRequests)
      tasks.push({
        label: "Solicitudes",
        run: async () => ({ requests: await requestService.getAll() }),
      });
    if (canQuotes)
      tasks.push({
        label: "Cotizaciones",
        run: async () => ({ quotations: await quotationService.getAll() }),
      });
    if (canQuality)
      tasks.push({
        label: "Calidad",
        run: async () => ({ qualityControls: await qualityService.getAll() }),
      });
    if (canDeliveries)
      tasks.push({
        label: "Entregas",
        run: async () => ({ deliveries: await deliveryService.getAll() }),
      });
    const results = await Promise.allSettled(tasks.map((task) => task.run()));
    if (version !== generation.current) return;
    const next: Data = {},
      failures: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") Object.assign(next, result.value);
      else
        failures.push(`${tasks[index].label}: ${errorMessage(result.reason)}`);
    });
    setData(next);
    setErrors(failures);
    setLoading(false);
  }, [canOrders, canRequests, canQuotes, canQuality, canDeliveries]);
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);
  if (loading) return <Text aria-busy="true">Cargando indicadores…</Text>;
  const canCoverage = canOrders && canQuality && canDeliveries;
  const hasCoverage =
    data.workOrders !== undefined &&
    data.qualityControls !== undefined &&
    data.deliveries !== undefined &&
    data.documents !== undefined;
  return (
    <Box>
      {errors.length > 0 && (
        <Box mb={4}>
          <Alert
            status="error"
            title="Algunos indicadores no están disponibles"
            description={errors.join("; ")}
          />
          <Button mt={2} onClick={() => void load()}>
            Reintentar indicadores
          </Button>
        </Box>
      )}
      <Text fontSize="sm" color="gray.600" mb={4}>
        Datos de los módulos autorizados para tu rol. La actividad incluye
        únicamente consultas exitosas.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} mb={6}>
        {canOrders && (
          <StatCard
            label="Órdenes activas"
            icon={LuWrench}
            value={
              data.workOrders?.filter((wo) =>
                ["PENDING", "APPROVED", "IN_PROGRESS"].includes(wo.status),
              ).length ?? "—"
            }
            hint="Pendientes, aprobadas o en proceso"
          />
        )}
        {canRequests && canQuotes && (
          <StatCard
            label="Pendientes de cotización"
            icon={LuFileText}
            value={
              data.requests && data.quotations
                ? requestsWithoutQuotation(data.requests, data.quotations)
                : "—"
            }
            hint="Solicitudes sin ninguna cotización vinculada"
          />
        )}
        {canQuality && (
          <StatCard
            label="Inspecciones registradas"
            icon={LuShieldCheck}
            value={data.qualityControls?.length ?? "—"}
            hint="Cantidad de registros; no indica conformidad"
          />
        )}
        {canDeliveries && (
          <StatCard
            label="Entregas registradas"
            icon={LuTruck}
            value={data.deliveries?.length ?? "—"}
            hint="Cantidad de entregas, no unidades despachadas"
          />
        )}
      </SimpleGrid>
      {canCoverage ? (
        hasCoverage ? (
          <Box mb={6}>
            <TraceabilityCompletenessCard {...data} />
          </Box>
        ) : (
          <Alert
            status="warning"
            title="Cobertura parcial no disponible"
            description="Se necesitan consultas exitosas de OT, calidad, entregas y documentos. Reintentá los indicadores."
          />
        )
      ) : (
        <Alert
          status="info"
          title="Cobertura parcial no disponible para este rol"
          description="El indicador requiere permisos de consulta de OT, calidad y entregas."
        />
      )}
      <Box mt={6}>
        <TraceabilityTimelineCard {...data} />
      </Box>
    </Box>
  );
}
