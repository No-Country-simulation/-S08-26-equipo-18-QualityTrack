import { useCallback, useEffect, useState } from "react";
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
  LuBoxes,
  LuBuilding2,
  LuCalendar,
  LuCheck,
  LuClock,
  LuDownload,
  LuFileSpreadsheet,
  LuFileText,
  LuLayers,
  LuPencil,
  LuPlus,
  LuShieldCheck,
  LuUpload,
  LuUsers,
  LuWrench,
  LuX,
} from "react-icons/lu";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { Select } from "../components/Select";
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
import { MOCK_CLIENTS } from "../test/mocks/mockClients";
import { MOCK_DELIVERIES } from "../test/mocks/mockDeliveries";
import { MOCK_QUALITY_CONTROLS } from "../test/mocks/mockQualityControls";
import { MOCK_QUOTATIONS } from "../test/mocks/mockQuotations";
import { MOCK_REQUESTS } from "../test/mocks/mockRequests";
import { MOCK_WORK_ORDERS } from "../test/mocks/mockWorkOrders";
import { MOCK_ROUTE_SHEETS } from "../test/mocks/mockRouteSheets";
import { MOCK_OPERATIONS } from "../test/mocks/mockOperations";
import { MOCK_DOCUMENTS } from "../test/mocks/mockDocuments";
import { MOCK_APPROVALS } from "../test/mocks/mockApprovals";
import { MOCK_WORK_ORDER_MATERIALS } from "../test/mocks/mockWorkOrderMaterials";
import {
  MOCK_AVAILABLE_OPERATORS,
  MOCK_WORK_ORDER_USERS,
} from "../test/mocks/mockWorkOrderUsers";
import { clientService } from "../services/clientService";
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
  CreateWorkOrderDto,
  WorkOrder,
} from "../services/workOrderService";
import { routeSheetService } from "../services/routeSheetService";
import type { RouteSheet } from "../services/routeSheetService";
import { operationService } from "../services/operationService";
import type { Operation } from "../services/operationService";
import { documentService } from "../services/documentService";
import type { Document } from "../services/documentService";
import { approvalService } from "../services/approvalService";
import type { Approval } from "../services/approvalService";
import { materialService } from "../services/materialService";
import type { WorkOrderMaterial } from "../services/materialService";
import { workOrderUserService } from "../services/workOrderUserService";
import type { WorkOrderUser } from "../services/workOrderUserService";
import { requestService } from "../services/requestService";
import type { Request } from "../services/requestService";
import { quotationService } from "../services/quotationService";
import type { Quotation } from "../services/quotationService";

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

  const initialApproval = MOCK_APPROVALS.find(
    (a) =>
      String(a.workOrderId) === id ||
      (initialWo && a.workOrderId === initialWo.id),
  );

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(
    initialWo || null,
  );
  const [approval, setApproval] = useState<Approval | null>(
    initialApproval || null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<
    "APPROVED" | "REJECTED"
  >("APPROVED");
  const [decisionComments, setDecisionComments] = useState("");

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
  const [routeSheet, setRouteSheet] = useState<RouteSheet | undefined>(() =>
    MOCK_ROUTE_SHEETS.find(
      (rs) => String(rs.workOrderId) === id || (initialWo && rs.workOrderId === initialWo.id),
    ),
  );

  // Operaciones de mecanizado asociadas
  const [operations, setOperations] = useState<Operation[]>(() =>
    routeSheet
      ? MOCK_OPERATIONS.filter((op) => op.routeSheetId === routeSheet.id)
      : [],
  );

  // Documentacion tecnica y comercial asociada (Tarea 3.7)
  const [documents, setDocuments] = useState<Document[]>(() =>
    MOCK_DOCUMENTS.filter(
      (doc) =>
        String(doc.workOrderId) === id ||
        (initialWo && doc.workOrderId === initialWo.id) ||
        (initialWo?.requestId && doc.requestId === initialWo.requestId) ||
        (initialWo?.quotationId && doc.quotationId === initialWo.quotationId),
    ),
  );

  // Materia prima y materiales vinculados a esta OT (Tarea 5.3)
  const [workOrderMaterials, setWorkOrderMaterials] = useState<
    WorkOrderMaterial[]
  >(() =>
    MOCK_WORK_ORDER_MATERIALS.filter(
      (mat) =>
        String(mat.workOrderId) === id ||
        (initialWo && mat.workOrderId === initialWo.id),
    ),
  );
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({
    materialName: "",
    specification: "",
    lotNumber: "",
    certificateNumber: "",
    supplier: "",
    quantity: "",
    unit: "kg",
    notes: "",
  });

  // Personal operativo asignado a esta OT (Tarea 6.2)
  const [workOrderUsers, setWorkOrderUsers] = useState<WorkOrderUser[]>(() =>
    MOCK_WORK_ORDER_USERS.filter(
      (u) =>
        String(u.workOrderId) === id ||
        (initialWo && u.workOrderId === initialWo.id),
    ),
  );
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    userId: String(MOCK_AVAILABLE_OPERATORS[0].id),
    role: "Operador CNC principal",
    shift: "Turno mañana (06:00 - 14:00)",
    notes: "",
  });

  const [availableClients, setAvailableClients] = useState<Client[]>(MOCK_CLIENTS);
  const [availableRequests, setAvailableRequests] = useState<Request[]>(MOCK_REQUESTS);
  const [availableQuotations, setAvailableQuotations] = useState<Quotation[]>(MOCK_QUOTATIONS);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const loadWorkOrderData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    let activeWo: WorkOrder | null = null;
    try {
      activeWo = await workOrderService.getById(id);
      if (activeWo) {
        setWorkOrder(activeWo);
      }
    } catch {
      const foundMock = MOCK_WORK_ORDERS.find(
        (wo) => String(wo.id) === id || String(wo.workOrderNumber) === id,
      );
      if (foundMock) {
        activeWo = foundMock;
      }
    }

    const currentId = activeWo?.id || Number(id) || id;

    try {
      const qcs = await qualityService.getByWorkOrder(currentId);
      if (qcs && qcs.length > 0) setQualityControls(qcs);
    } catch {
      // Mantiene fallback
    }

    try {
      const dels = await deliveryService.getByWorkOrder(currentId);
      if (dels && dels.length > 0) setDeliveries(dels);
    } catch {
      // Mantiene fallback
    }

    try {
      const sheets = await routeSheetService.getByWorkOrder(currentId);
      if (sheets && sheets.length > 0) {
        setRouteSheet(sheets[0]);
        const ops = await operationService.getByRouteSheet(sheets[0].id);
        if (ops && ops.length > 0) setOperations(ops);
      }
    } catch {
      // Mantiene fallback
    }

    try {
      const docs = await documentService.getByWorkOrder(currentId);
      if (docs && docs.length > 0) setDocuments(docs);
    } catch {
      // Mantiene fallback
    }

    try {
      const mats = await materialService.getByWorkOrder(currentId);
      if (mats && mats.length > 0) setWorkOrderMaterials(mats);
    } catch {
      // Mantiene fallback
    }

    try {
      const users = await workOrderUserService.getByWorkOrder(currentId);
      if (users && users.length > 0) setWorkOrderUsers(users);
    } catch {
      // Mantiene fallback
    }

    try {
      const app = await approvalService.getByWorkOrder(currentId);
      if (app) setApproval(app);
    } catch {
      // Mantiene fallback
    }

    try {
      const clientRes = await clientService.list({ limit: 100, status: "all" });
      if (clientRes.items && clientRes.items.length > 0) {
        setAvailableClients(clientRes.items);
      }
    } catch {
      // Mantiene fallback
    }

    try {
      const reqRes = await requestService.getAll();
      if (reqRes && reqRes.length > 0) setAvailableRequests(reqRes);
    } catch {
      // Mantiene fallback
    }

    try {
      const quotRes = await quotationService.getAll();
      if (quotRes && quotRes.length > 0) setAvailableQuotations(quotRes);
    } catch {
      // Mantiene fallback
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadWorkOrderData();
  }, [loadWorkOrderData]);

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

  const handleOpenApprovalModal = (decision: "APPROVED" | "REJECTED") => {
    setPendingDecision(decision);
    setDecisionComments("");
    setIsApprovalModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!workOrder) return;
    const isApproved = pendingDecision === "APPROVED";
    try {
      if (approval?.id) {
        const decided = await approvalService.decide(approval.id, {
          status: pendingDecision,
          comments:
            decisionComments ||
            (isApproved
              ? "Aprobada formalmente para ejecucion en planta."
              : "Rechazada en revision de ingenieria/administracion."),
        });
        setApproval(decided);
      } else {
        const created = await approvalService.create({
          workOrderId: workOrder.id,
          status: pendingDecision,
          comments:
            decisionComments ||
            (isApproved
              ? "Aprobada formalmente para ejecucion en planta."
              : "Rechazada en revision de ingenieria/administracion."),
        });
        setApproval(created);
      }
    } catch {
      const updatedApproval: Approval = {
        id: approval?.id || Date.now(),
        workOrderId: workOrder.id,
        status: pendingDecision,
        decidedById: 2,
        decidedBy: {
          id: 2,
          name: "Ing. Carlos Mendoza",
          email: "cmendoza@qualitytrack.com",
          role: "Jefe de Planta",
        },
        decisionAt: new Date().toISOString(),
        comments:
          decisionComments ||
          (isApproved
            ? "Aprobada formalmente para ejecucion en planta."
            : "Rechazada en revision de ingenieria/administracion."),
        createdAt: approval?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setApproval(updatedApproval);
    }
    setIsApprovalModalOpen(false);
    showNotification(
      isApproved
        ? "Orden de trabajo aprobada con exito."
        : "Orden de trabajo rechazada.",
      isApproved ? "success" : "error",
    );
  };

  const handleOpenMaterialModal = () => {
    setNewMaterialForm({
      materialName: "",
      specification: "",
      lotNumber: "",
      certificateNumber: "",
      supplier: "",
      quantity: "",
      unit: "kg",
      notes: "",
    });
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!workOrder) return;
    if (!newMaterialForm.materialName.trim()) {
      showNotification(
        "El nombre o aleacion del material es obligatorio.",
        "error",
      );
      return;
    }
    try {
      const created = await materialService.assign({
        workOrderId: workOrder.id,
        materialName: newMaterialForm.materialName.trim(),
        specification: newMaterialForm.specification.trim() || undefined,
        lotNumber: newMaterialForm.lotNumber.trim() || undefined,
        certificateNumber: newMaterialForm.certificateNumber.trim() || undefined,
        supplier: newMaterialForm.supplier.trim() || undefined,
        quantity: newMaterialForm.quantity || "1",
        unit: newMaterialForm.unit || "kg",
        notes: newMaterialForm.notes.trim() || undefined,
      });
      setWorkOrderMaterials((prev) => [...prev, created]);
    } catch {
      const newId =
        workOrderMaterials.length > 0
          ? Math.max(...workOrderMaterials.map((m) => m.id)) + 1
          : 1;
      const newEntry: WorkOrderMaterial = {
        id: newId,
        workOrderId: workOrder.id,
        materialName: newMaterialForm.materialName.trim(),
        specification: newMaterialForm.specification.trim() || undefined,
        lotNumber: newMaterialForm.lotNumber.trim() || undefined,
        certificateNumber: newMaterialForm.certificateNumber.trim() || undefined,
        supplier: newMaterialForm.supplier.trim() || undefined,
        quantity: newMaterialForm.quantity || "1",
        unit: newMaterialForm.unit || "kg",
        receivedAt: new Date().toISOString(),
        notes: newMaterialForm.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWorkOrderMaterials((prev) => [...prev, newEntry]);
    }
    setIsMaterialModalOpen(false);
    showNotification("Partida de materia prima asignada con exito a la orden.");
  };

  const handleOpenUserModal = () => {
    setNewUserForm({
      userId: String(MOCK_AVAILABLE_OPERATORS[0].id),
      role: "Operador CNC principal",
      shift: "Turno mañana (06:00 - 14:00)",
      notes: "",
    });
    setIsUserModalOpen(true);
  };

  const handleAssignUser = async () => {
    if (!workOrder) return;
    const selectedUser = MOCK_AVAILABLE_OPERATORS.find(
      (u) => String(u.id) === newUserForm.userId,
    );
    if (!selectedUser) {
      showNotification("Debe seleccionar un operario valido.", "error");
      return;
    }
    const alreadyAssigned = workOrderUsers.some(
      (u) => u.userId === selectedUser.id && u.role === newUserForm.role,
    );
    if (alreadyAssigned) {
      showNotification(
        `${selectedUser.firstName} ${selectedUser.lastName} ya esta asignado con ese rol en esta orden.`,
        "error",
      );
      return;
    }

    try {
      const created = await workOrderUserService.assign({
        workOrderId: workOrder.id,
        userId: selectedUser.id,
        role: newUserForm.role.trim() || "Operador",
        shift: newUserForm.shift.trim() || undefined,
        notes: newUserForm.notes.trim() || undefined,
      });
      setWorkOrderUsers((prev) => [...prev, { ...created, user: selectedUser }]);
    } catch {
      const newId =
        workOrderUsers.length > 0
          ? Math.max(...workOrderUsers.map((u) => u.id)) + 1
          : 1;

      const newAssignment: WorkOrderUser = {
        id: newId,
        workOrderId: workOrder.id,
        userId: selectedUser.id,
        user: selectedUser,
        role: newUserForm.role.trim() || "Operador",
        shift: newUserForm.shift.trim() || undefined,
        notes: newUserForm.notes.trim() || undefined,
        assignedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setWorkOrderUsers((prev) => [...prev, newAssignment]);
    }
    setIsUserModalOpen(false);
    showNotification(
      `${selectedUser.firstName} ${selectedUser.lastName} asignado con exito a la orden.`,
    );
  };

  const handleRemoveUser = async (assignmentId: number) => {
    try {
      await workOrderUserService.unassign(assignmentId);
    } catch {
      // fallback
    }
    setWorkOrderUsers((prev) => prev.filter((u) => u.id !== assignmentId));
    showNotification("Asignacion de personal removida de la orden.");
  };

  const handleBack = () => {
    navigate("/work-orders");
  };

  // Resolucion de entidades vinculadas para trazabilidad completa
  const client: Client | undefined =
    workOrder?.client ||
    availableClients.find((c) => c.id === workOrder?.clientId) ||
    MOCK_CLIENTS.find((c) => c.id === workOrder?.clientId);
  const linkedRequest =
    workOrder?.request ||
    availableRequests.find((r) => r.id === workOrder?.requestId) ||
    MOCK_REQUESTS.find((r) => r.id === workOrder?.requestId);
  const linkedQuotation =
    workOrder?.quotation ||
    availableQuotations.find((q) => q.id === workOrder?.quotationId) ||
    MOCK_QUOTATIONS.find((q) => q.id === workOrder?.quotationId);

  const handleSave = async (formData: CreateWorkOrderDto) => {
    if (!workOrder) return;
    try {
      const updated = await workOrderService.update(workOrder.id, formData);
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : prev));
      showNotification("Orden de trabajo actualizada con exito.");
    } catch {
      const updated: WorkOrder = {
        ...workOrder,
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      setWorkOrder(updated);
      showNotification("Orden de trabajo actualizada con exito.");
    }
  };

  const handleSaveQualityControl = async (data: CreateQualityControlDto) => {
    try {
      const created = await qualityService.create(data);
      setQualityControls((prev) => [created, ...prev]);
      showNotification("Control de calidad registrado con exito.");
    } catch {
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
    }
  };

  const handleSaveDelivery = async (data: CreateDeliveryDto) => {
    try {
      const created = await deliveryService.create(data);
      setDeliveries((prev) => [created, ...prev]);
      showNotification("Entrega registrada con exito.");
    } catch {
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
    }
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
    <Box aria-busy={loading}>
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
                      {approval.decidedBy?.name || "Ing. Carlos Mendoza"}
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
            <Can perform="workOrders:edit">
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
                  onClick={() => handleOpenApprovalModal("REJECTED")}
                >
                  <LuX style={{ marginRight: "6px" }} />
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  colorPalette="green"
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

      {/* Tarea 5.3: Materia prima y trazabilidad de materiales */}
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
                <LuBoxes color="#2563EB" size={20} />
                <Text fontWeight="bold" fontSize="md" color="gray.800">
                  Materia prima y trazabilidad de materiales
                </Text>
                {workOrderMaterials.length > 0 && (
                  <Badge colorPalette="blue" variant="subtle">
                    {workOrderMaterials.length}{" "}
                    {workOrderMaterials.length === 1 ? "partida" : "partidas"}
                  </Badge>
                )}
              </HStack>
              <Can perform="workOrders:edit">
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  onClick={handleOpenMaterialModal}
                >
                  <LuPlus style={{ marginRight: "4px" }} />
                  Asignar material
                </Button>
              </Can>
            </Flex>
          }
          description="Partidas de materia prima, coladas, certificados de calidad de origen y proveedores para cumplimiento de normas de auditoria"
        >
          {workOrderMaterials.length > 0 ? (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontSize="xs">
                      Material / Aleacion
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Lote / Colada
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Certificado de calidad
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Origen / Proveedor
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Cantidad asignada
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Recepcion
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Observaciones
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {workOrderMaterials.map((mat) => (
                    <Table.Row key={mat.id}>
                      <Table.Cell>
                        <Text
                          fontWeight="semibold"
                          fontSize="xs"
                          color="gray.800"
                        >
                          {mat.materialName}
                        </Text>
                        {mat.specification && (
                          <Text fontSize="2xs" color="gray.500">
                            Norma: {mat.specification}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {mat.lotNumber ? (
                          <Text
                            fontFamily="mono"
                            fontSize="xs"
                            fontWeight="semibold"
                            color="blue.700"
                          >
                            {mat.lotNumber}
                          </Text>
                        ) : (
                          <Text fontSize="xs" color="gray.400">
                            —
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {mat.certificateNumber ? (
                          <Badge
                            colorPalette="green"
                            variant="subtle"
                            size="sm"
                            fontFamily="mono"
                          >
                            {mat.certificateNumber}
                          </Badge>
                        ) : (
                          <Text fontSize="xs" color="gray.400">
                            Sin cert. registrado
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.700">
                        {mat.supplier || "No especificado"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs">
                        <Text fontWeight="semibold" color="gray.800">
                          {mat.quantity} {mat.unit || "kg"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.600">
                        {mat.receivedAt ? formatDate(mat.receivedAt) : "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.600" maxW="240px">
                        <Text title={mat.notes}>
                          {mat.notes || "—"}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Box py={6} textAlign="center">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                No se registraron partidas de materia prima vinculadas a esta
                orden de trabajo.
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Tarea 6.2: Personal tecnico y operarios asignados a la orden */}
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
                <LuUsers color="#2563EB" size={20} />
                <Text fontWeight="bold" fontSize="md" color="gray.800">
                  Personal asignado a la orden
                </Text>
                {workOrderUsers.length > 0 && (
                  <Badge colorPalette="blue" variant="subtle">
                    {workOrderUsers.length}{" "}
                    {workOrderUsers.length === 1 ? "operario" : "operarios"}
                  </Badge>
                )}
              </HStack>
              <Can perform="workOrders:assign">
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  onClick={handleOpenUserModal}
                >
                  <LuPlus style={{ marginRight: "4px" }} />
                  Asignar personal
                </Button>
              </Can>
            </Flex>
          }
          description="Operarios tecnicos, torneros, fresadores e inspectores que intervienen en la ejecucion del trabajo"
        >
          {workOrderUsers.length > 0 ? (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader fontSize="xs">
                      Operario / Tecnico
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Rol en la orden
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Turno de trabajo
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Fecha asignacion
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs">
                      Indicaciones / Tareas
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="right">
                      Acciones
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {workOrderUsers.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell fontSize="xs">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="semibold" color="gray.800">
                            {item.user
                              ? `${item.user.firstName} ${item.user.lastName}`
                              : `Usuario #${item.userId}`}
                          </Text>
                          <Text fontSize="2xs" color="gray.500">
                            {item.user?.email || "—"}
                          </Text>
                        </VStack>
                      </Table.Cell>
                      <Table.Cell fontSize="xs">
                        <Badge
                          size="xs"
                          variant="subtle"
                          colorPalette={
                            item.role?.toLowerCase().includes("inspector") ||
                            item.role?.toLowerCase().includes("calidad")
                              ? "green"
                              : item.role?.toLowerCase().includes("cnc") ||
                                item.role?.toLowerCase().includes("tornero") ||
                                item.role?.toLowerCase().includes("fresador")
                                ? "blue"
                                : item.role?.toLowerCase().includes("supervisor")
                                  ? "purple"
                                  : "gray"
                          }
                        >
                          {item.role || "Operario"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.700">
                        {item.shift || "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" whiteSpace="nowrap" color="gray.600">
                        {formatDate(item.assignedAt)}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color="gray.600">
                        {item.notes || "—"}
                      </Table.Cell>
                      <Table.Cell fontSize="xs" textAlign="right">
                        <Can perform="workOrders:assign">
                          <Button
                            size="2xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => handleRemoveUser(item.id)}
                            title="Remover asignacion"
                          >
                            <LuX style={{ marginRight: "2px" }} />
                            Remover
                          </Button>
                        </Can>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Box py={6} textAlign="center">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                No se registro personal operativo asignado a esta orden de trabajo.
              </Text>
            </Box>
          )}
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
              <Can perform="quality:inspect">
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
        clients={availableClients}
        requests={availableRequests}
        quotations={availableQuotations}
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
        clients={availableClients}
        defaultWorkOrderId={workOrder?.id}
        defaultClientId={workOrder?.clientId}
        onSave={handleSaveDelivery}
      />

      {/* Modal para registrar decision de aprobacion / rechazo (Tarea 4.2) */}
      <Modal
        open={isApprovalModalOpen}
        onOpenChange={({ open }) => setIsApprovalModalOpen(open)}
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
              onClick={() => setIsApprovalModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              colorPalette={pendingDecision === "APPROVED" ? "green" : "red"}
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

      {/* Modal para asignar materia prima a la OT (Tarea 5.3) */}
      <Modal
        open={isMaterialModalOpen}
        onOpenChange={({ open }) => setIsMaterialModalOpen(open)}
        title="Asignar materia prima a la orden"
        footer={
          <HStack justify="flex-end" gap={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaterialModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" colorPalette="blue" onClick={handleSaveMaterial}>
              Guardar partida
            </Button>
          </HStack>
        }
      >
        <VStack gap={3} align="stretch" py={2}>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <FormField
              label="Material / Aleacion"
              required
              helperText="Ej: Acero SAE 4140, Bronce SAE 65, Delrin"
            >
              <Input
                placeholder="Nombre o tipo de material"
                value={newMaterialForm.materialName}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    materialName: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField
              label="Norma / Especificacion"
              helperText="Ej: ASTM A29, DIN 42CrMo4, Plano"
            >
              <Input
                placeholder="Norma tecnica aplicable"
                value={newMaterialForm.specification}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    specification: e.target.value,
                  })
                }
              />
            </FormField>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <FormField
              label="Lote / Numero de colada"
              helperText="Identificacion estampada o etiqueta"
            >
              <Input
                placeholder="Ej: COL-4140-9821"
                value={newMaterialForm.lotNumber}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    lotNumber: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField
              label="Numero de certificado"
              helperText="Certificado de analisis quimico/mecanico"
            >
              <Input
                placeholder="Ej: CERT-MP-2026-0312"
                value={newMaterialForm.certificateNumber}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    certificateNumber: e.target.value,
                  })
                }
              />
            </FormField>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
            <FormField
              label="Origen / Proveedor"
              helperText="Fabricante o provisto por cliente"
            >
              <Input
                placeholder="Ej: Tenaris o Provisto por cliente"
                value={newMaterialForm.supplier}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    supplier: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Cantidad">
              <Input
                placeholder="Ej: 25.5"
                value={newMaterialForm.quantity}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    quantity: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Unidad">
              <Input
                placeholder="Ej: kg, barras, metros"
                value={newMaterialForm.unit}
                onChange={(e) =>
                  setNewMaterialForm({
                    ...newMaterialForm,
                    unit: e.target.value,
                  })
                }
              />
            </FormField>
          </SimpleGrid>

          <FormField
            label="Observaciones de recepcion"
            helperText="Detalles de dureza, tolerancias o remito"
          >
            <Textarea
              placeholder="Detalles sobre estado superficial, dureza verificada, tolerancia de barra..."
              value={newMaterialForm.notes}
              onChange={(e) =>
                setNewMaterialForm({
                  ...newMaterialForm,
                  notes: e.target.value,
                })
              }
              rows={2}
            />
          </FormField>
        </VStack>
      </Modal>

      {/* Modal para asignar personal a la orden (Tarea 6.2) */}
      <Modal
        open={isUserModalOpen}
        onOpenChange={({ open }) => setIsUserModalOpen(open)}
        title="Asignar personal a la orden de trabajo"
        footer={
          <HStack justify="flex-end" gap={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUserModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleAssignUser}
            >
              Asignar personal
            </Button>
          </HStack>
        }
      >
        <VStack gap={4} align="stretch" py={2}>
          <Text fontSize="xs" color="gray.600">
            Seleccione el personal tecnico u operario de planta que intervendra
            en la ejecucion de la orden OT-{workOrder?.workOrderNumber}.
          </Text>

          <FormField
            label="Operario / Tecnico de planta"
            helperText="Seleccione el usuario registrado en el sistema"
          >
            <Select
              value={newUserForm.userId}
              onChange={(e) =>
                setNewUserForm({ ...newUserForm, userId: e.target.value })
              }
            >
              {MOCK_AVAILABLE_OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.firstName} {op.lastName} ({op.role || op.email})
                </option>
              ))}
            </Select>
          </FormField>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <FormField
              label="Rol operativo en la orden"
              helperText="Funcion o puesto para esta pieza"
            >
              <Input
                placeholder="Ej: Operador CNC principal, Tornero..."
                value={newUserForm.role}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, role: e.target.value })
                }
              />
            </FormField>

            <FormField
              label="Turno asignado"
              helperText="Horario previsto de operacion"
            >
              <Select
                value={newUserForm.shift}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, shift: e.target.value })
                }
              >
                <option value="Turno mañana (06:00 - 14:00)">
                  Turno mañana (06:00 - 14:00)
                </option>
                <option value="Turno tarde (14:00 - 22:00)">
                  Turno tarde (14:00 - 22:00)
                </option>
                <option value="Turno noche (22:00 - 06:00)">
                  Turno noche (22:00 - 06:00)
                </option>
                <option value="Jornada completa">Jornada completa</option>
              </Select>
            </FormField>
          </SimpleGrid>

          <FormField
            label="Indicaciones / Tareas asignadas"
            helperText="Maquinas asignadas, precauciones o detalles del proceso"
          >
            <Textarea
              placeholder="Indique las operaciones especificas a cargo, tolerancias criticas a vigilar..."
              value={newUserForm.notes}
              onChange={(e) =>
                setNewUserForm({ ...newUserForm, notes: e.target.value })
              }
              rows={2}
            />
          </FormField>
        </VStack>
      </Modal>
    </Box>
  );
}
