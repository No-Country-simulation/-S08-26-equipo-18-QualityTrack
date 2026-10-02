import { useEffect } from "react";
import { Box, HStack, SimpleGrid, VStack } from "@chakra-ui/react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import { useForm } from "../../hooks/useForm";
import { toDateIso, validators } from "../../utils";
import type { Client } from "../../services/clientService";
import type { Request } from "../../services/requestService";
import type { Quotation } from "../../services/quotationService";
import type {
  CreateWorkOrderDto,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from "../../services/workOrderService";

export interface WorkOrderFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  workOrder?: WorkOrder | null;
  nextWorkOrderNumber?: number;
  clients?: Client[];
  requests?: Request[];
  quotations?: Quotation[];
  onSave: (data: CreateWorkOrderDto) => Promise<void> | void;
}

interface WorkOrderFormValues {
  workOrderNumber: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  clientId: string;
  requestId: string;
  quotationId: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const getFutureDateString = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
};

const DEFAULT_VALUES: WorkOrderFormValues = {
  workOrderNumber: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "PENDING",
  clientId: "",
  requestId: "",
  quotationId: "",
  plannedStartDate: getTodayDateString(),
  plannedEndDate: getFutureDateString(14),
  actualStartDate: "",
  actualEndDate: "",
};

export function WorkOrderFormModal({
  open,
  onOpenChange,
  workOrder,
  nextWorkOrderNumber,
  clients = [],
  requests = [],
  quotations = [],
  onSave,
}: WorkOrderFormModalProps) {
  const isEditing = Boolean(workOrder);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = useForm<WorkOrderFormValues>({
    initialValues: DEFAULT_VALUES,
    rules: {
      workOrderNumber: [
        validators.required("El numero de orden de trabajo es obligatorio"),
      ],
      title: [validators.required("El titulo de la orden es obligatorio")],
      description: [
        validators.required("La descripcion tecnica es obligatoria"),
      ],
      clientId: [validators.required("Debes seleccionar un cliente")],
      plannedStartDate: [
        validators.required("La fecha de inicio planificada es obligatoria"),
        validators.date("La fecha de inicio debe estar completa (DD/MM/AAAA)"),
      ],
      plannedEndDate: [
        validators.required("La fecha de fin planificada es obligatoria"),
        validators.date("La fecha de fin debe estar completa (DD/MM/AAAA)"),
        validators.dateAfterOrEqual(
          (): string => values.plannedStartDate,
          "La fecha de fin no puede ser anterior a la fecha de inicio"
        ),
      ],
      actualStartDate: [
        validators.date("La fecha de inicio real debe estar completa (DD/MM/AAAA)"),
      ],
      actualEndDate: [
        validators.date("La fecha de fin real debe estar completa (DD/MM/AAAA)"),
        validators.dateAfterOrEqual(
          (): string => values.actualStartDate,
          "La fecha de fin real no puede ser anterior a la fecha de inicio real"
        ),
      ],
    },
    onSubmit: async (formValues) => {
      const numericWoNumber = parseInt(formValues.workOrderNumber, 10);
      const plannedStartIso = toDateIso(formValues.plannedStartDate) ?? new Date().toISOString();
      const plannedEndIso = toDateIso(formValues.plannedEndDate) ?? new Date().toISOString();
      const actualStartIso = toDateIso(formValues.actualStartDate);
      const actualEndIso = toDateIso(formValues.actualEndDate);

      await onSave({
        workOrderNumber: numericWoNumber,
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        priority: formValues.priority,
        status: formValues.status,
        clientId: Number(formValues.clientId),
        requestId: formValues.requestId ? Number(formValues.requestId) : undefined,
        quotationId: formValues.quotationId ? Number(formValues.quotationId) : undefined,
        plannedStartDate: plannedStartIso,
        plannedEndDate: plannedEndIso,
        actualStartDate: actualStartIso,
        actualEndDate: actualEndIso,
      });

      onOpenChange({ open: false });
    },
  });

  useEffect(() => {
    if (open) {
      if (workOrder) {
        reset({
          workOrderNumber: String(workOrder.workOrderNumber),
          title: workOrder.title,
          description: workOrder.description,
          priority: workOrder.priority,
          status: workOrder.status,
          clientId: workOrder.clientId ? String(workOrder.clientId) : "",
          requestId: workOrder.requestId ? String(workOrder.requestId) : "",
          quotationId: workOrder.quotationId ? String(workOrder.quotationId) : "",
          plannedStartDate: workOrder.plannedStartDate
            ? workOrder.plannedStartDate.split("T")[0]
            : getTodayDateString(),
          plannedEndDate: workOrder.plannedEndDate
            ? workOrder.plannedEndDate.split("T")[0]
            : getFutureDateString(14),
          actualStartDate: workOrder.actualStartDate
            ? workOrder.actualStartDate.split("T")[0]
            : "",
          actualEndDate: workOrder.actualEndDate
            ? workOrder.actualEndDate.split("T")[0]
            : "",
        });
      } else {
        reset({
          ...DEFAULT_VALUES,
          workOrderNumber: String(nextWorkOrderNumber || 1001),
        });
      }
    }
  }, [open, workOrder, nextWorkOrderNumber, reset]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar orden de trabajo" : "Nueva orden de trabajo"}
      size="xl"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            colorPalette="blue"
            onClick={() => handleSubmit()}
            loading={isSubmitting}
          >
            {isEditing ? "Guardar cambios" : "Crear orden de trabajo"}
          </Button>
        </HStack>
      }
    >
      <VStack gap={4} align="stretch">
        {submitError && (
          <Alert
            status="error"
            title="Error al guardar"
            description={submitError}
          />
        )}

        {/* Fila 1: Numero de OT y Titulo */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField
            label="Nro. de orden de trabajo"
            required
            error={touched.workOrderNumber ? errors.workOrderNumber : null}
            helperText={
              isEditing
                ? "Identificador inmutable de trazabilidad de planta"
                : "Generado automaticamente por el sistema"
            }
          >
            <Input
              type="number"
              placeholder="1007"
              value={values.workOrderNumber}
              disabled
              readOnly
              cursor="not-allowed"
              bg="gray.100"
              color="gray.700"
              onChange={(e) => handleChange("workOrderNumber", e.target.value)}
              onBlur={() => handleBlur("workOrderNumber")}
            />
          </FormField>

          <Box gridColumn={{ base: "span 1", md: "span 2" }}>
            <FormField
              label="Titulo de la orden"
              required
              error={touched.title ? errors.title : null}
            >
              <Input
                placeholder="Ej: Fabricacion de pernos de anclaje M24"
                value={values.title}
                onChange={(e) => handleChange("title", e.target.value)}
                onBlur={() => handleBlur("title")}
              />
            </FormField>
          </Box>
        </SimpleGrid>

        {/* Fila 1b: Relaciones de trazabilidad */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField
            label="Cliente"
            required
            error={touched.clientId ? errors.clientId : null}
          >
            <Select
              value={values.clientId}
              onChange={(e) => {
                handleChange("clientId", e.target.value);
                handleChange("requestId", "");
                handleChange("quotationId", "");
              }}
              onBlur={() => handleBlur("clientId")}
            >
              <option value="">-- Seleccionar cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.businessName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Solicitud de origen"
            helperText="Opcional: solicitud que origino esta OT"
          >
            <Select
              value={values.requestId}
              onChange={(e) => {
                handleChange("requestId", e.target.value);
                handleChange("quotationId", "");
              }}
              onBlur={() => handleBlur("requestId")}
            >
              <option value="">-- Sin solicitud vinculada --</option>
              {requests
                .filter((r) =>
                  values.clientId ? String(r.clientId) === values.clientId : true
                )
                .map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.requestNumber} - {r.title}
                  </option>
                ))}
            </Select>
          </FormField>

          <FormField
            label="Cotizacion aprobada"
            helperText="Opcional: cotizacion que dio origen a esta OT"
          >
            <Select
              value={values.quotationId}
              onChange={(e) => handleChange("quotationId", e.target.value)}
              onBlur={() => handleBlur("quotationId")}
            >
              <option value="">-- Sin cotizacion vinculada --</option>
              {quotations
                .filter((q) =>
                  values.requestId
                    ? String(q.requestId) === values.requestId
                    : values.clientId
                      ? String(q.clientId) === values.clientId
                      : true
                )
                .map((q) => (
                  <option key={q.id} value={String(q.id)}>
                    {q.quotationNumber} - {q.description.substring(0, 40)}
                  </option>
                ))}
            </Select>
          </FormField>
        </SimpleGrid>

        {/* Fila 2: Prioridad y Estado */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField label="Prioridad operativa" required>
            <Select
              value={values.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              onBlur={() => handleBlur("priority")}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </Select>
          </FormField>

          <FormField label="Estado de ejecucion" required>
            <Select
              value={values.status}
              onChange={(e) => handleChange("status", e.target.value)}
              onBlur={() => handleBlur("status")}
            >
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobada</option>
              <option value="IN_PROGRESS">En progreso</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </Select>
          </FormField>
        </SimpleGrid>

        {/* Fila 3: Fechas planificadas */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Fecha inicio planificada"
            required
            error={touched.plannedStartDate ? errors.plannedStartDate : null}
          >
            <Input
              type="date"
              value={values.plannedStartDate}
              onChange={(e) => handleChange("plannedStartDate", e.target.value)}
              onBlur={() => handleBlur("plannedStartDate")}
            />
          </FormField>

          <FormField
            label="Fecha fin planificada"
            required
            error={touched.plannedEndDate ? errors.plannedEndDate : null}
          >
            <Input
              type="date"
              value={values.plannedEndDate}
              onChange={(e) => handleChange("plannedEndDate", e.target.value)}
              onBlur={() => handleBlur("plannedEndDate")}
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 4: Fechas reales (opcionales para seguimiento) */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Fecha inicio real"
            error={touched.actualStartDate ? errors.actualStartDate : null}
            helperText="Registro de inicio efectivo en planta"
          >
            <Input
              type="date"
              value={values.actualStartDate}
              onChange={(e) => handleChange("actualStartDate", e.target.value)}
              onBlur={() => handleBlur("actualStartDate")}
            />
          </FormField>

          <FormField
            label="Fecha fin real"
            error={touched.actualEndDate ? errors.actualEndDate : null}
            helperText="Registro de finalizacion y cierre"
          >
            <Input
              type="date"
              value={values.actualEndDate}
              onChange={(e) => handleChange("actualEndDate", e.target.value)}
              onBlur={() => handleBlur("actualEndDate")}
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 5: Descripcion tecnica */}
        <FormField
          label="Descripcion tecnica y especificaciones"
          required
          error={touched.description ? errors.description : null}
          helperText="Detalles de materiales, planos, procesos CNC y requerimientos tecnicos..."
        >
          <Textarea
            placeholder="Especificaciones de mecanizado, tolerancias, ruta de proceso y planos..."
            value={values.description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            rows={3}
          />
        </FormField>
      </VStack>
    </Modal>
  );
}

export default WorkOrderFormModal;
