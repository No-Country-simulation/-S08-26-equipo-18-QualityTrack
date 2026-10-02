import { useCallback, useEffect, useRef, useState } from "react";
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
  LuCheck,
  LuClock,
  LuFileSpreadsheet,
  LuFileText,
  LuPencil,
  LuPlus,
  LuShieldCheck,
  LuWrench,
  LuX,
} from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { usePermissions } from "../hooks/usePermissions";
import { Can } from "../components/Can";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { Textarea } from "../components/Textarea";
import {
  formatDate,
  PriorityBadge,
  StatusBadge,
  WorkOrderFormModal,
} from "../modules/workOrders";
import { QualityFormModal } from "../modules/quality";
import { DeliveryFormModal } from "../modules/deliveries";
import { formatCurrency } from "../modules/quotations/quotationColumns";

import type { Client } from "../services/clientService";
import { deliveryService } from "../services/deliveryService";
import type {
  CreateDeliveryDto,
  Delivery,
} from "../services/deliveryService";
import { qualityService } from "../services/qualityService";
import type {
  CreateQualityControlDto,
  QualityControl,
} from "../services/qualityService";
import { workOrderService } from "../services/workOrderService";
import type {
  CreateWorkOrderDto, UpdateWorkOrderDto,
  WorkOrder,
} from "../services/workOrderService";
import { approvalService } from "../services/approvalService";
import type { Approval } from "../services/approvalService";
import type { Request } from "../services/requestService";

import type { Quotation } from "../services/quotationService";

import { DocumentsPanel } from "../modules/documents/DocumentsPanel";
import { ProductionPanel } from "../modules/production/ProductionPanel";

import { errorMessage } from "../utils/errorMessage";
import { ApiError } from "../services/api";

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canViewDeliveries = can("deliveries:view");

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<
    "APPROVED" | "REJECTED"
  >("APPROVED");
  const [decisionComments, setDecisionComments] = useState("");

  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableRequests, setAvailableRequests] = useState<Request[]>([]);
  const [availableQuotations, setAvailableQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadVersion = useRef(0);
  const activeRoute = useRef(id);
  activeRoute.current = id;

  const [notification, setNotification] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const loadWorkOrderData = useCallback(async () => {
    const version = ++loadVersion.current;
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    setSectionErrors([]);
    setWorkOrder(null); setApproval(null);
    setQualityControls([]); setDeliveries([]);
    setAvailableClients([]); setAvailableRequests([]); setAvailableQuotations([]);
    try {
      const activeWo = await workOrderService.getById(id);
      if (version !== loadVersion.current) return;
      setWorkOrder(activeWo);
      setAvailableClients(activeWo.client ? [activeWo.client] : []);
      setAvailableRequests(activeWo.request ? [activeWo.request] : []);
      setAvailableQuotations(activeWo.quotation ? [activeWo.quotation] : []);
      const failures: string[] = [];
      await Promise.all([
        qualityService.getByWorkOrder(activeWo.id).then(data => { if (version === loadVersion.current) setQualityControls(data); }).catch(error => { failures.push("calidad: " + errorMessage(error)); }),
        canViewDeliveries && deliveryService.getByWorkOrder(activeWo.id).then(data => { if (version === loadVersion.current) setDeliveries(data); }).catch(error => { failures.push("entregas: " + errorMessage(error)); }),
        approvalService.getByWorkOrder(activeWo.id).then(data => { if (version === loadVersion.current) setApproval(data ?? null); }).catch(error => { failures.push("aprobación: " + errorMessage(error)); }),
      ]);
      if (version === loadVersion.current) setSectionErrors(failures);
    } catch (error) {
      if (version === loadVersion.current) {
        setNotFound(error instanceof ApiError && error.status === 404);
        setLoadError(errorMessage(error));
      }
    } finally { if (version === loadVersion.current) setLoading(false); }
  }, [id, canViewDeliveries]);

  useEffect(() => {
    setIsFormOpen(false); setIsQualityModalOpen(false); setIsDeliveryModalOpen(false);
    setIsApprovalModalOpen(false); setActionError(null); setNotification(null);
    void loadWorkOrderData();
    return () => { loadVersion.current++; };
  }, [loadWorkOrderData]);

  const showNotification = (
    message: string,
    status: "success" | "error" = "success",
  ) => {
    setNotification({ status, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenApprovalModal = (decision: "APPROVED" | "REJECTED") => {
    setActionError(null);
    setPendingDecision(decision);
    setDecisionComments("");
    setIsApprovalModalOpen(true);
  };

  const decisionBusy = useRef(false);
  const [decisionPending, setDecisionPending] = useState(false);
  const handleConfirmDecision = async () => {
    if (!workOrder || decisionBusy.current) return;
    decisionBusy.current = true; setDecisionPending(true);
    const isApproved = pendingDecision === "APPROVED";
    try {
      if (approval?.id) {
        const decided = await approvalService.decide(approval.id, {
          status: pendingDecision,
          comments:
            decisionComments.trim() || undefined,
        });
        if (activeRoute.current !== id) return;
        setApproval(decided);
      } else {
        const created = await approvalService.create({
          workOrderId: workOrder.id,
          status: pendingDecision,
          comments:
            decisionComments.trim() || undefined,
        });
        if (activeRoute.current !== id) return;
        setApproval(created);
      }
    } catch (error) {
      if (activeRoute.current !== id) return;
      setActionError(errorMessage(error));
      return;
    } finally { decisionBusy.current = false; setDecisionPending(false); }
    setWorkOrder(prev => prev ? { ...prev, status: isApproved ? "APPROVED" : "CANCELLED" } : prev);
    setIsApprovalModalOpen(false);
    showNotification(
      isApproved
        ? "Orden de trabajo aprobada con exito."
        : "Orden de trabajo rechazada.",
      isApproved ? "success" : "error",
    );
  };

  const handleBack = () => {
    navigate("/work-orders");
  };

  // Resolucion de entidades vinculadas para trazabilidad completa
  const client: Client | undefined =
    workOrder?.client ||
    availableClients.find((c) => c.id === workOrder?.clientId);
  const linkedRequest =
    workOrder?.request ||
    availableRequests.find((r) => r.id === workOrder?.requestId);
  const linkedQuotation =
    workOrder?.quotation ||
    availableQuotations.find((q) => q.id === workOrder?.quotationId);

  const handleSave = async (formData: CreateWorkOrderDto | UpdateWorkOrderDto) => {
    if (!workOrder) return;
    const updated = await workOrderService.update(workOrder.id, formData);
    if (activeRoute.current !== id) return;
    setWorkOrder(updated);
    showNotification("Orden de trabajo actualizada con éxito.");
  };

  const handleSaveQualityControl = async (data: CreateQualityControlDto) => {
    const created = await qualityService.create(data);
    if (activeRoute.current !== id) return;
    setQualityControls(prev => [created, ...prev]);
    showNotification("Control de calidad registrado con éxito.");
  };

  const handleSaveDelivery = async (data: CreateDeliveryDto) => {
    const created = await deliveryService.create(data);
    if (activeRoute.current !== id) return;
    setDeliveries(prev => [created, ...prev]);
    showNotification("Entrega registrada con éxito.");
  };

  if (loading || (workOrder && workOrder.id !== Number(id))) return <Box aria-busy="true" p={6}><Text>Cargando orden de trabajo...</Text></Box>;

  if (!workOrder) {
    return (
      <Box p={6}>
        <Alert
          status="error"
          title={!notFound && loadError ? "No se pudo cargar la orden de trabajo" : "Orden de trabajo no encontrada"}
          description={loadError ?? `No se encontro ningun registro para el identificador #${id}.`}
        />
        <Button mt={4} onClick={() => void loadWorkOrderData()}>Reintentar</Button>
        <Button mt={4} variant="outline" onClick={handleBack}>
          <LuArrowLeft style={{ marginRight: "6px" }} />
          Volver al listado
        </Button>
      </Box>
    );
  }

  return (
    <Box aria-busy={loading}>
      {!workOrder.quotationId && <Box mb={4}><Alert status="info" title="Origen histórico no documentado" description="Esta OT conserva sus datos anteriores. Su cliente, solicitud y cotización no se completan con referencias inventadas." /></Box>}
      {sectionErrors.length > 0 && <Box mb={4}><Alert status="error" title="Hay secciones no disponibles" description={sectionErrors.join("; ")} /><Button mt={2} onClick={() => void loadWorkOrderData()}>Reintentar carga</Button></Box>}
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
              disabled={["COMPLETED", "CANCELLED"].includes(workOrder.status)}
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
                {approval ? (
                  <Badge
                    colorPalette={
                      approval.status === "APPROVED"
                        ? "green"
                        : approval.status === "REJECTED"
                        ? "red"
                        : "yellow"
                    }
                    variant="subtle"
                  >
                    {approval.status === "APPROVED"
                      ? "Aprobada"
                      : approval.status === "REJECTED"
                      ? "Rechazada"
                      : "Pendiente aprobacion"}
                  </Badge>
                ) : (
                  <Badge colorPalette="yellow" variant="subtle">
                    Pendiente aprobacion
                  </Badge>
                )}
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
          <Text>Ultima actualizacion: {formatDate(workOrder.updatedAt ?? undefined)}</Text>
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

      {/* Tarea 4.2: Gobernanza y aprobacion formal */}
      <Box mt={6}>
        <Card
          title={
            <Flex
              justify="space-between"
              align="center"
              w="full"
              wrap="wrap"
              gap={2}
            >
              <HStack gap={2}>
                <LuShieldCheck color="#2563EB" size={20} />
                <Text fontWeight="bold" fontSize="md" color="gray.800">
                  Gobernanza y aprobacion formal
                </Text>
              </HStack>
              <Badge
                colorPalette={
                  approval?.status === "APPROVED"
                    ? "green"
                    : approval?.status === "REJECTED"
                    ? "red"
                    : "yellow"
                }
                size="md"
              >
                {approval?.status === "APPROVED"
                  ? "Dictamen: Aprobada"
                  : approval?.status === "REJECTED"
                  ? "Dictamen: Rechazada"
                  : "Dictamen: Pendiente de revision"}
              </Badge>
            </Flex>
          }
          description="Dictamen formal de aprobacion tecnica y comercial requerido para la liberacion y avance en planta"
        >
          <VStack align="stretch" gap={4}>
            {approval && approval.status !== "PENDING" ? (
              <Box
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor={
                  approval.status === "APPROVED" ? "green.200" : "red.200"
                }
                bg={approval.status === "APPROVED" ? "green.50" : "red.50"}
              >
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4} mb={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Dictamen:
                    </Text>
                    <HStack gap={1.5} mt={0.5}>
                      {approval.status === "APPROVED" ? (
                        <LuCheck size={16} color="#16A34A" />
                      ) : (
                        <LuX size={16} color="#DC2626" />
                      )}
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={
                          approval.status === "APPROVED"
                            ? "green.800"
                            : "red.800"
                        }
                      >
                        {approval.status === "APPROVED"
                          ? "Aprobada"
                          : "Rechazada"}
                      </Text>
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Responsable de aprobacion:
                    </Text>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="gray.800"
                      mt={0.5}
                    >
                      {approval.decidedBy?.name || "Responsable no informado"}
                    </Text>
                    {approval.decidedBy?.role && (
                      <Text fontSize="xs" color="gray.500">
                        {approval.decidedBy.role}
                      </Text>
                    )}
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Fecha y hora de dictamen:
                    </Text>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="gray.800"
                      mt={0.5}
                    >
                      {approval.decisionAt
                        ? formatDate(approval.decisionAt)
                        : "No registrada"}
                    </Text>
                  </Box>
                </SimpleGrid>

                {approval.comments && (
                  <Box
                    pt={3}
                    borderTopWidth="1px"
                    borderColor={
                      approval.status === "APPROVED" ? "green.200" : "red.200"
                    }
                  >
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      mb={1}
                      fontWeight="medium"
                    >
                      Fundamentos y resolucion:
                    </Text>
                    <Text
                      fontSize="xs"
                      color="gray.800"
                      fontStyle="italic"
                      bg="whiteAlpha.700"
                      p={2.5}
                      borderRadius="sm"
                    >
                      "{approval.comments}"
                    </Text>
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor="yellow.200"
                bg="yellow.50"
              >
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="yellow.900"
                  mb={1}
                >
                  Orden pendiente de aprobacion formal
                </Text>
                <Text fontSize="xs" color="yellow.800" mb={3}>
                  Esta orden requiere la revision tecnica y comercial de
                  supervisores o administracion antes de su liberacion definitiva
                  para produccion.
                </Text>
                {approval?.comments && (
                  <Text
                    fontSize="xs"
                    color="gray.700"
                    fontStyle="italic"
                    mb={2}
                  >
                    Nota preliminar: {approval.comments}
                  </Text>
                )}
              </Box>
            )}

            {/* Acciones de dictamen protegidas con permisos */}
            <Can perform="workOrders:approve">
              <HStack
                justify="flex-end"
                gap={2}
                pt={2}
                borderTopWidth="1px"
                borderColor="gray.100"
              >
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  disabled={!workOrder.quotationId || Boolean(approval && approval.status !== "PENDING") || workOrder.status !== "PENDING"}
                  onClick={() => handleOpenApprovalModal("REJECTED")}
                >
                  <LuX style={{ marginRight: "6px" }} />
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  colorPalette="green"
                  disabled={!workOrder.quotationId || Boolean(approval && approval.status !== "PENDING") || workOrder.status !== "PENDING"}
                  onClick={() => handleOpenApprovalModal("APPROVED")}
                >
                  <LuCheck style={{ marginRight: "6px" }} />
                  Aprobar orden
                </Button>
              </HStack>
            </Can>
          </VStack>
        </Card>
      </Box>

      <ProductionPanel key={workOrder.id} workOrder={workOrder} onOrderChanged={setWorkOrder} />

      {/* Tarea 2.2: Controles de calidad embebidos */}
      <Box mt={6}>
        <Card
          title={
            <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={2}>
              <Text fontWeight="bold" fontSize="md" color="gray.800">
                Controles de calidad realizados
              </Text>
              <Can perform="quality:inspect">
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  disabled={!workOrder.quotationId || workOrder.status === "CANCELLED"}
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
          {sectionErrors.some(e => e.startsWith("calidad:")) ? <Alert status="error" title="Controles de calidad no disponibles" description="No se pudo consultar esta sección. Reintentá la carga."/> : qualityControls.length > 0 ? (
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
                        {formatDate(qc.performedAt ?? undefined)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontWeight="medium" color="gray.800">
                        {qc.specification}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" color="gray.600">
                        {qc.expectedValue ?? "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono" fontWeight="bold" color="green.700">
                        {qc.measuredValue ?? "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs">
                        <Badge size="xs" variant="surface" colorPalette="gray">
                          {qc.unit || "—"}
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
      <Can perform="deliveries:view"><Box mt={6}>
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
                  disabled={!workOrder.quotationId || workOrder.status === "CANCELLED"}
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
          {sectionErrors.some(e => e.startsWith("entregas:")) ? <Alert status="error" title="Entregas no disponibles" description="No se pudo consultar esta sección. Reintentá la carga."/> : deliveries.length > 0 ? (
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
                        {del.client?.businessName || "Destinatario no documentado"}
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
      </Box></Can>

      <DocumentsPanel key={workOrder.id} workOrder={workOrder}/>

      {/* Modal de edicion de OT */}
      <WorkOrderFormModal
        open={isFormOpen}
        onOpenChange={({ open }) => { if (activeRoute.current === id) setIsFormOpen(open); }}
        workOrder={workOrder}
        clients={availableClients}
        requests={availableRequests}
        quotations={availableQuotations}
        onSave={handleSave}
      />

      {/* Modal para registrar Control de Calidad directamente desde la OT */}
      <QualityFormModal
        open={isQualityModalOpen}
        onOpenChange={({ open }) => { if (activeRoute.current === id) setIsQualityModalOpen(open); }}
        workOrders={workOrder ? [workOrder] : []}
        defaultWorkOrderId={workOrder?.id}
        onSave={handleSaveQualityControl}
      />

      {/* Modal para registrar Entrega directamente desde la OT */}
      <DeliveryFormModal
        open={isDeliveryModalOpen}
        onOpenChange={({ open }) => { if (activeRoute.current === id) setIsDeliveryModalOpen(open); }}
        workOrders={workOrder ? [workOrder] : []}
        defaultWorkOrderId={workOrder?.id}
        onSave={handleSaveDelivery}
      />

      {/* Modal para registrar decision de aprobacion / rechazo (Tarea 4.2) */}
      <Modal
        open={isApprovalModalOpen}
        onOpenChange={({ open }) => { if (!decisionPending) setIsApprovalModalOpen(open); }}
        title={
          pendingDecision === "APPROVED"
            ? "Aprobar orden de trabajo"
            : "Rechazar orden de trabajo"
        }
        footer={
          <HStack justify="flex-end" gap={2}>
            <Button
              variant="outline"
              size="sm"
              disabled={decisionPending}
              onClick={() => setIsApprovalModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              colorPalette={pendingDecision === "APPROVED" ? "green" : "red"}
              disabled={decisionPending} loading={decisionPending}
              onClick={handleConfirmDecision}
            >
              {pendingDecision === "APPROVED"
                ? "Confirmar aprobacion"
                : "Confirmar rechazo"}
            </Button>
          </HStack>
        }
      >
        <VStack gap={4} align="stretch" py={2}>
          {actionError && <Alert status="error" title="No se pudo guardar" description={actionError} />}
          <Text fontSize="sm" color="gray.600">
            {pendingDecision === "APPROVED"
              ? `¿Desea registrar la aprobacion formal para la orden OT-${workOrder.workOrderNumber}? Esto autorizara la prosecucion de las operaciones de mecanizado en planta.`
              : `¿Desea rechazar la orden OT-${workOrder.workOrderNumber}? Indique los motivos tecnicos o comerciales.`}
          </Text>
          <FormField
            label="Comentarios u observaciones del dictamen"
            helperText="Ingrese detalles sobre especificaciones validadas, condicion comercial u orden de compra."
          >
            <Textarea
              value={decisionComments}
              onChange={(e) => setDecisionComments(e.target.value)}
              placeholder={
                pendingDecision === "APPROVED"
                  ? "Ej: Se valida plano tecnico v2 y se verifica recepcion de orden de compra #4491..."
                  : "Ej: Se rechaza por discrepancia en tolerancias dimensionales..."
              }
              rows={4}
            />
          </FormField>
        </VStack>
      </Modal>

    </Box>
  );
}
