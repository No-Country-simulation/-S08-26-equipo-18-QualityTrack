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
  LuBuilding2,
  LuCalendar,
  LuClock,
  LuDownload,
  LuFileSpreadsheet,
  LuFileText,
  LuLayers,
  LuPencil,
  LuPlus,
  LuUpload,
  LuWrench,
} from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import {
  formatDate,
  PriorityBadge,
  StatusBadge,
  WorkOrderFormModal,
} from "../modules/workOrders";
import { QualityFormModal } from "../modules/quality";
import { DeliveryFormModal } from "../modules/deliveries";
import { formatCurrency } from "../modules/quotations/quotationColumns";
import { MOCK_CLIENTS } from "../test/mocks/mockClients";
import { MOCK_DELIVERIES } from "../test/mocks/mockDeliveries";
import { MOCK_QUALITY_CONTROLS } from "../test/mocks/mockQualityControls";
import { MOCK_QUOTATIONS } from "../test/mocks/mockQuotations";
import { MOCK_REQUESTS } from "../test/mocks/mockRequests";
import { MOCK_WORK_ORDERS } from "../test/mocks/mockWorkOrders";
import { MOCK_ROUTE_SHEETS } from "../test/mocks/mockRouteSheets";
import { MOCK_OPERATIONS } from "../test/mocks/mockOperations";
import { MOCK_DOCUMENTS } from "../test/mocks/mockDocuments";
import type { Client } from "../services/clientService";
import type {
  CreateDeliveryDto,
  Delivery,
} from "../services/deliveryService";
import type {
  CreateQualityControlDto,
  QualityControl,
} from "../services/qualityService";
import type {
  CreateWorkOrderDto,
  WorkOrder,
} from "../services/workOrderService";
import type { RouteSheet } from "../services/routeSheetService";
import type { Operation } from "../services/operationService";
import type { Document } from "../services/documentService";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getOperationBadge(op: Operation) {
  if (op.actualStart && op.actualEnd) {
    return { label: "Completada", color: "green" };
  }
  if (op.actualStart && !op.actualEnd) {
    return { label: "En proceso", color: "blue" };
  }
  return { label: "Programada", color: "gray" };
}

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
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // Controles de calidad filtrados para esta OT
  const [qualityControls, setQualityControls] = useState<QualityControl[]>(() =>
    MOCK_QUALITY_CONTROLS.filter(
      (qc) => String(qc.workOrderId) === id || (initialWo && qc.workOrderId === initialWo.id),
    ),
  );

  // Entregas filtradas para esta OT
  const [deliveries, setDeliveries] = useState<Delivery[]>(() =>
    MOCK_DELIVERIES.filter(
      (del) => String(del.workOrderId) === id || (initialWo && del.workOrderId === initialWo.id),
    ),
  );

  // Hoja de ruta vinculada a esta OT (Tarea 3.4)
  const routeSheet = MOCK_ROUTE_SHEETS.find(
    (rs) => String(rs.workOrderId) === id || (initialWo && rs.workOrderId === initialWo.id),
  );

  // Operaciones de mecanizado asociadas
  const operations = routeSheet
    ? MOCK_OPERATIONS.filter((op) => op.routeSheetId === routeSheet.id)
    : [];

  // Documentacion tecnica y comercial asociada (Tarea 3.7)
  const [documents] = useState<Document[]>(() =>
    MOCK_DOCUMENTS.filter(
      (doc) =>
        String(doc.workOrderId) === id ||
        (initialWo && doc.workOrderId === initialWo.id) ||
        (initialWo?.requestId && doc.requestId === initialWo.requestId) ||
        (initialWo?.quotationId && doc.quotationId === initialWo.quotationId),
    ),
  );

  const [notification, setNotification] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const handleDownloadDocument = (doc: Document) => {
    showNotification(`Descargando documento: ${doc.fileName}`);
  };

  const handleAttachDocument = () => {
    showNotification("Modulo de subida de archivos preparado. Conecta con el endpoint en Fase 9.");
  };

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

  // Resolucion de entidades vinculadas para trazabilidad completa
  const client: Client | undefined =
    workOrder?.client ||
    MOCK_CLIENTS.find((c) => c.id === workOrder?.clientId);
  const linkedRequest =
    workOrder?.request ||
    MOCK_REQUESTS.find((r) => r.id === workOrder?.requestId);
  const linkedQuotation =
    workOrder?.quotation ||
    MOCK_QUOTATIONS.find((q) => q.id === workOrder?.quotationId);

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

  const handleSaveQualityControl = async (data: CreateQualityControlDto) => {
    const newId =
      qualityControls.length > 0 ? Math.max(...qualityControls.map((q) => q.id)) + 1 : 1;
    const newControl: QualityControl = {
      id: newId,
      ...data,
      workOrder: workOrder || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQualityControls((prev) => [newControl, ...prev]);
    showNotification("Control de calidad registrado con exito.");
  };

  const handleSaveDelivery = async (data: CreateDeliveryDto) => {
    const newId =
      deliveries.length > 0 ? Math.max(...deliveries.map((d) => d.id)) + 1 : 1;
    const newDelivery: Delivery = {
      id: newId,
      ...data,
      workOrder: workOrder || undefined,
      client: client || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDeliveries((prev) => [newDelivery, ...prev]);
    showNotification("Entrega registrada con exito.");
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
      {/* Barra de navegacion superior (Tarea 2.4: botones contextuales unificados) */}
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <LuArrowLeft style={{ marginRight: "6px" }} />
          Volver al listado
        </Button>

        <HStack gap={2}>
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

      {/* Cabecera de la ficha tecnica (Tarea 2.5: Identificacion y Cliente) */}
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
              <Heading size="md" color="gray.800" mb={1}>
                {workOrder.title}
              </Heading>
              {client && (
                <HStack
                  gap={2}
                  fontSize="xs"
                  color="gray.600"
                  wrap="wrap"
                  cursor="pointer"
                  onClick={() => navigate("/clients")}
                  _hover={{ color: "blue.600" }}
                  title="Ver cliente en el modulo de clientes"
                >
                  <HStack gap={1}>
                    <LuBuilding2 size={13} color="#2563EB" />
                    <Text fontWeight="semibold" color="blue.700" textDecoration="underline">
                      {client.businessName}
                    </Text>
                  </HStack>
                  <Text color="gray.300">|</Text>
                  <Text fontFamily="mono" color="gray.600">
                    CUIT: {client.taxId}
                  </Text>
                  {client.contactName && (
                    <>
                      <Text color="gray.300">|</Text>
                      <Text color="gray.600">Contacto: {client.contactName}</Text>
                    </>
                  )}
                  {client.email && (
                    <>
                      <Text color="gray.300">|</Text>
                      <Text color="gray.500">{client.email}</Text>
                    </>
                  )}
                </HStack>
              )}
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

      {/* Tarea 2.1: Origen del trabajo y trazabilidad comercial */}
      <Box mt={6}>
        <Card
          title="Origen del trabajo y trazabilidad comercial"
          description="Expediente de solicitud de cliente y cotizacion aprobada que respaldan esta orden"
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {/* Solicitud de origen */}
            <Box
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg={linkedRequest ? "white" : "gray.50"}
            >
              <HStack justify="space-between" mb={2}>
                <HStack gap={2}>
                  <LuFileText color="#2563EB" size={18} />
                  <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    Solicitud de cliente
                  </Text>
                </HStack>
                {linkedRequest ? (
                  <Badge colorPalette="blue" variant="subtle">
                    {linkedRequest.requestNumber}
                  </Badge>
                ) : (
                  <Badge colorPalette="gray" variant="subtle">
                    Sin solicitud
                  </Badge>
                )}
              </HStack>

              {linkedRequest ? (
                <VStack align="stretch" gap={2} fontSize="xs">
                  <Text fontWeight="semibold" color="gray.800" fontSize="sm">
                    {linkedRequest.title}
                  </Text>
                  <Text color="gray.600" lineHeight="tall">
                    {linkedRequest.description}
                  </Text>
                  <SimpleGrid columns={2} gap={2} pt={2} borderTopWidth="1px" borderColor="gray.100">
                    <Box>
                      <Text color="gray.500">Recibida el:</Text>
                      <Text fontWeight="semibold" color="gray.700">
                        {formatDate(linkedRequest.receivedAt)}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Entrega deseada:</Text>
                      <Text fontWeight="semibold" color="gray.700">
                        {linkedRequest.requestedDeliveryDate
                          ? formatDate(linkedRequest.requestedDeliveryDate)
                          : "No especificada"}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic" py={4} textAlign="center">
                  Esta orden no posee una solicitud formal previa vinculada (ingreso directo o de urgencia).
                </Text>
              )}
            </Box>

            {/* Cotizacion aprobada */}
            <Box
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg={linkedQuotation ? "white" : "gray.50"}
            >
              <HStack justify="space-between" mb={2}>
                <HStack gap={2}>
                  <LuFileSpreadsheet color="#16A34A" size={18} />
                  <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    Cotizacion comercial
                  </Text>
                </HStack>
                {linkedQuotation ? (
                  <Badge colorPalette="green" variant="subtle">
                    {linkedQuotation.quotationNumber} (v{linkedQuotation.version})
                  </Badge>
                ) : (
                  <Badge colorPalette="gray" variant="subtle">
                    Sin cotizacion
                  </Badge>
                )}
              </HStack>

              {linkedQuotation ? (
                <VStack align="stretch" gap={2} fontSize="xs">
                  <Text fontWeight="semibold" color="gray.800" fontSize="sm">
                    {linkedQuotation.description}
                  </Text>
                  <SimpleGrid columns={3} gap={2} pt={2} borderTopWidth="1px" borderColor="gray.100">
                    <Box>
                      <Text color="gray.500">Subtotal:</Text>
                      <Text fontFamily="mono" fontWeight="medium" color="gray.700">
                        {formatCurrency(linkedQuotation.subtotal, linkedQuotation.currency)}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">IVA (21%):</Text>
                      <Text fontFamily="mono" fontWeight="medium" color="gray.700">
                        {formatCurrency(linkedQuotation.taxAmount, linkedQuotation.currency)}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Total:</Text>
                      <Text fontFamily="mono" fontWeight="bold" color="green.700">
                        {formatCurrency(
                          Number(linkedQuotation.subtotal || 0) + Number(linkedQuotation.taxAmount || 0),
                          linkedQuotation.currency,
                        )}
                      </Text>
                    </Box>
                  </SimpleGrid>
                  {linkedQuotation.validUntil && (
                    <Text fontSize="xs" color="gray.500" pt={1}>
                      Vigencia de la oferta: {formatDate(linkedQuotation.validUntil)}
                    </Text>
                  )}
                </VStack>
              ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic" py={4} textAlign="center">
                  Esta orden no cuenta con una cotizacion comercial asociada registrada en el sistema.
                </Text>
              )}
            </Box>
          </SimpleGrid>
        </Card>
      </Box>

      {/* Tarea 3.4: Hoja de ruta y operaciones de manufactura */}
      <Box mt={6}>
        <Card
          title={
            <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={2}>
              <HStack gap={2}>
                <Text fontWeight="bold" fontSize="md" color="gray.800">
                  Hoja de ruta y operaciones
                </Text>
                {routeSheet && (
                  <Badge colorPalette="purple" variant="subtle" fontFamily="mono">
                    {routeSheet.routeNumber}
                  </Badge>
                )}
              </HStack>
              {!routeSheet && (
                <Can perform="workOrders:edit">
                  <Button
                    size="xs"
                    colorPalette="blue"
                    variant="outline"
                    onClick={() => showNotification("La creacion de hoja de ruta se integrara con el endpoint en Fase 9.")}
                  >
                    <LuPlus style={{ marginRight: "4px" }} />
                    Crear hoja de ruta
                  </Button>
                </Can>
              )}
            </Flex>
          }
          description="Secuencia ordenada de procesos tecnicos, maquinas asignadas y tiempos de ejecucion"
        >
          {routeSheet ? (
            <VStack align="stretch" gap={4}>
              {routeSheet.instructions && (
                <Box
                  p={3}
                  bg="purple.50"
                  borderWidth="1px"
                  borderColor="purple.200"
                  borderRadius="md"
                >
                  <HStack gap={2} align="flex-start">
                    <Box pt={0.5} color="purple.700">
                      <LuLayers size={16} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="purple.900" mb={0.5}>
                        Instrucciones tecnicas de fabricacion:
                      </Text>
                      <Text fontSize="xs" color="purple.800">
                        {routeSheet.instructions}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              )}

              {operations.length > 0 ? (
                <Box overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row bg="gray.50">
                        <Table.ColumnHeader fontSize="xs">Paso / Codigo</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs">Operacion y descripcion</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs">Estacion / Maquina</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs">Cronograma planificado</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs">Cronograma real</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" textAlign="center">Estado</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {operations.map((op) => {
                        const status = getOperationBadge(op);
                        return (
                          <Table.Row key={op.id}>
                            <Table.Cell fontSize="xs" fontFamily="mono" fontWeight="bold" color="purple.700">
                              {op.operationNumber}
                            </Table.Cell>
                            <Table.Cell fontSize="xs">
                              <Text fontWeight="semibold" color="gray.800">
                                {op.name}
                              </Text>
                              {op.description && (
                                <Text fontSize="2xs" color="gray.500">
                                  {op.description}
                                </Text>
                              )}
                              {op.notes && (
                                <Text fontSize="2xs" color="blue.600" fontStyle="italic" mt={0.5}>
                                  Nota: {op.notes}
                                </Text>
                              )}
                            </Table.Cell>
                            <Table.Cell fontSize="xs" color="gray.700">
                              {op.machine || "Puesto manual"}
                            </Table.Cell>
                            <Table.Cell fontSize="xs" whiteSpace="nowrap" color="gray.600">
                              {op.plannedStart ? formatDate(op.plannedStart) : "—"} al{" "}
                              {op.plannedEnd ? formatDate(op.plannedEnd) : "—"}
                            </Table.Cell>
                            <Table.Cell fontSize="xs" whiteSpace="nowrap" color="gray.600">
                              {op.actualStart ? formatDate(op.actualStart) : "Sin iniciar"}{" "}
                              {op.actualEnd ? `— ${formatDate(op.actualEnd)}` : ""}
                            </Table.Cell>
                            <Table.Cell fontSize="xs" textAlign="center">
                              <Badge size="xs" colorPalette={status.color} variant="subtle">
                                {status.label}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>
              ) : (
                <Box py={4} textAlign="center">
                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No hay operaciones individuales cargadas para esta hoja de ruta.
                  </Text>
                </Box>
              )}
            </VStack>
          ) : (
            <Box py={6} textAlign="center">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                No se emitio una hoja de ruta de produccion para esta orden de trabajo.
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Tarea 2.2: Controles de calidad embebidos */}
      <Box mt={6}>
        <Card
          title={
            <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={2}>
              <Text fontWeight="bold" fontSize="md" color="gray.800">
                Controles de calidad realizados
              </Text>
              <Can perform="quality:create">
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  onClick={() => setIsQualityModalOpen(true)}
                >
                  <LuPlus style={{ marginRight: "4px" }} />
                  Registrar control
                </Button>
              </Can>
            </Flex>
          }
          description="Ensayos dimensionales, metrologia y pruebas tecnicas aplicadas sobre esta pieza"
        >
          {qualityControls.length > 0 ? (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontSize="xs">Fecha</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Especificacion / Ensayo</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Valor esperado</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Valor medido</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Unidad</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Observaciones</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {qualityControls.map((qc) => (
                    <Table.Row key={qc.id}>
                      <Table.Cell fontSize="xs" whiteSpace="nowrap">
                        {formatDate(qc.performedAt)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontWeight="medium" color="gray.800">
                        {qc.specification}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" color="gray.600">
                        {qc.expectedValue}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" fontWeight="bold" color="green.700">
                        {qc.measuredValue}
                      </Table.Cell>
                      <Table.Cell fontSize="xs">
                        <Badge size="xs" variant="surface" colorPalette="gray">
                          {qc.unit}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.500">
                        {qc.observations || "—"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Box py={6} textAlign="center">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                No se registraron controles de calidad para esta orden de trabajo.
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Tarea 2.3: Entregas y remitos despachados */}
      <Box mt={6}>
        <Card
          title={
            <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={2}>
              <Text fontWeight="bold" fontSize="md" color="gray.800">
                Entregas y remitos despachados
              </Text>
              <Can perform="deliveries:create">
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  onClick={() => setIsDeliveryModalOpen(true)}
                >
                  <LuPlus style={{ marginRight: "4px" }} />
                  Registrar entrega
                </Button>
              </Can>
            </Flex>
          }
          description="Historial de despachos parciales o finales efectuados para esta orden"
        >
          {deliveries.length > 0 ? (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontSize="xs">Remito / ID</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Fecha despacho</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="right">
                      Cantidad
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Cliente destinatario</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Notas de remito</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {deliveries.map((del) => (
                    <Table.Row key={del.id}>
                      <Table.Cell fontSize="xs" fontFamily="mono" fontWeight="bold" color="blue.700">
                        #REM-{del.id}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" whiteSpace="nowrap">
                        {formatDate(del.deliveryDate)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" fontWeight="semibold" textAlign="right">
                        {del.quantity} u.
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.800">
                        {del.client?.businessName || client?.businessName || "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.500">
                        {del.notes || "—"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Box py={6} textAlign="center">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                No se registraron entregas ni remitos despachados para esta orden de trabajo.
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Tarea 3.7: Documentacion tecnica y comercial asociada */}
      <Box mt={6}>
        <Card
          title={
            <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={2}>
              <HStack gap={2}>
                <Text fontWeight="bold" fontSize="md" color="gray.800">
                  Documentacion asociada al expediente
                </Text>
                <Badge colorPalette="blue" variant="subtle">
                  {documents.length} adjuntos
                </Badge>
              </HStack>
              <Button
                size="xs"
                colorPalette="blue"
                variant="outline"
                onClick={handleAttachDocument}
              >
                <LuUpload style={{ marginRight: "4px" }} />
                Adjuntar documento
              </Button>
            </Flex>
          }
          description="Planos constructivos, certificados de colada, ordenes de compra y protocolos de ensayos"
        >
          {documents.length > 0 ? (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontSize="xs">Tipo de documento</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Nombre del archivo</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Descripcion tecnica</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Version</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Tamaño</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">Fecha carga</Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="right">Accion</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {documents.map((doc) => (
                    <Table.Row key={doc.id}>
                      <Table.Cell fontSize="xs">
                        <Badge
                          size="xs"
                          variant="subtle"
                          colorPalette={
                            doc.documentTypeId === 1
                              ? "blue"
                              : doc.documentTypeId === 2
                                ? "teal"
                                : doc.documentTypeId === 3
                                  ? "green"
                                  : doc.documentTypeId === 5
                                    ? "purple"
                                    : "gray"
                          }
                        >
                          {doc.documentType?.name || "Documento"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" fontWeight="medium" color="blue.700">
                        {doc.fileName}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.600">
                        {doc.description || "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" color="gray.600">
                        v{doc.version}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" color="gray.500">
                        {formatFileSize(doc.fileSize)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" whiteSpace="nowrap" color="gray.500">
                        {formatDate(doc.uploadedAt)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" textAlign="right">
                        <Button
                          size="2xs"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Descargar documento"
                        >
                          <LuDownload style={{ marginRight: "4px" }} />
                          Descargar
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Box py={6} textAlign="center">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                No hay documentacion tecnica ni planos adjuntos a este expediente.
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Modal de edicion de OT */}
      <WorkOrderFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => setIsFormOpen(open)}
        workOrder={workOrder}
        clients={MOCK_CLIENTS}
        requests={MOCK_REQUESTS}
        quotations={MOCK_QUOTATIONS}
        onSave={handleSave}
      />

      {/* Modal para registrar Control de Calidad directamente desde la OT */}
      <QualityFormModal
        open={isQualityModalOpen}
        onOpenChange={({ open }) => setIsQualityModalOpen(open)}
        workOrders={workOrder ? [workOrder] : []}
        defaultWorkOrderId={workOrder?.id}
        onSave={handleSaveQualityControl}
      />

      {/* Modal para registrar Entrega directamente desde la OT */}
      <DeliveryFormModal
        open={isDeliveryModalOpen}
        onOpenChange={({ open }) => setIsDeliveryModalOpen(open)}
        workOrders={workOrder ? [workOrder] : []}
        clients={MOCK_CLIENTS}
        defaultWorkOrderId={workOrder?.id}
        defaultClientId={workOrder?.clientId}
        onSave={handleSaveDelivery}
      />
    </Box>
  );
}
