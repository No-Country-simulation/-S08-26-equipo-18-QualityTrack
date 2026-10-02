import { useEffect } from "react";
import { HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
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
  UpdateWorkOrderDto,
  WorkOrder,
} from "../../services/workOrderService";
export interface WorkOrderFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  workOrder?: WorkOrder | null;
  clients?: Client[];
  requests?: Request[];
  quotations?: Quotation[];
  onSave: (
    data: CreateWorkOrderDto | UpdateWorkOrderDto,
  ) => Promise<void> | void;
}
const defaults = () => ({
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "PENDING",
  quotationId: "",
  plannedStartDate: new Date().toISOString().slice(0, 10),
  plannedEndDate: "",
  actualStartDate: "",
  actualEndDate: "",
});
export function WorkOrderFormModal({
  open,
  onOpenChange,
  workOrder,
  quotations = [],
  onSave,
}: WorkOrderFormModalProps) {
  const editing = Boolean(workOrder);
  const eligible = quotations.filter(
    (q) =>
      q.decisionStatus === "accepted" &&
      q.client?.isActive &&
      q.request?.clientId === q.clientId,
  );
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
  } = useForm<ReturnType<typeof defaults>>({
    initialValues: defaults(),
    rules: {
      title: [validators.required(), validators.maxLength(500)],
      description: [validators.required(), validators.maxLength(5000)],
      quotationId: [
        (value) =>
          editing || eligible.some((q) => String(q.id) === value)
            ? null
            : "Seleccioná una cotización aceptada de un cliente activo.",
      ],
      plannedStartDate: [validators.required(), validators.date()],
      plannedEndDate: [
        validators.required(),
        validators.date(),
        validators.dateAfterOrEqual((): string => values.plannedStartDate),
      ],
      actualStartDate: [validators.date()],
      actualEndDate: [
        validators.date(),
        validators.dateAfterOrEqual((): string => values.actualStartDate),
      ],
    },
    onSubmit: async (data) => {
      const fields = {
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority as WorkOrder["priority"],
        plannedStartDate: toDateIso(data.plannedStartDate)!,
        plannedEndDate: toDateIso(data.plannedEndDate)!,
      };
      await onSave(
        editing
          ? {
              ...fields,
              status: data.status as WorkOrder["status"],
              actualStartDate: toDateIso(data.actualStartDate) ?? null,
              actualEndDate: toDateIso(data.actualEndDate) ?? null,
            }
          : { ...fields, quotationId: Number(data.quotationId) },
      );
      onOpenChange({ open: false });
    },
  });
  useEffect(() => {
    if (open)
      reset(
        workOrder
          ? {
              title: workOrder.title,
              description: workOrder.description,
              priority: workOrder.priority,
              status: workOrder.status,
              quotationId: String(workOrder.quotationId ?? ""),
              plannedStartDate: workOrder.plannedStartDate?.slice(0, 10) ?? "",
              plannedEndDate: workOrder.plannedEndDate?.slice(0, 10) ?? "",
              actualStartDate: workOrder.actualStartDate?.slice(0, 10) ?? "",
              actualEndDate: workOrder.actualEndDate?.slice(0, 10) ?? "",
            }
          : defaults(),
      );
  }, [open, workOrder, reset]);
  const selected = editing
    ? workOrder?.quotation
    : eligible.find((q) => String(q.id) === values.quotationId);
  const close = () => {
    if (!isSubmitting) onOpenChange({ open: false });
  };
  return (
    <Modal
      open={open}
      onOpenChange={({ open: next }) => {
        if (!isSubmitting) onOpenChange({ open: next });
      }}
      title={editing ? "Editar orden de trabajo" : "Nueva orden de trabajo"}
      size="xl"
      footer={
        <HStack>
          <Button variant="outline" onClick={close} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            aria-label={editing ? "Guardar cambios" : "Crear orden de trabajo"}
            loading={isSubmitting}
            disabled={isSubmitting || (!editing && !eligible.length)}
            onClick={() => handleSubmit()}
          >
            {editing ? "Guardar cambios" : "Crear orden de trabajo"}
          </Button>
        </HStack>
      }
    >
      <VStack align="stretch" gap={4}>
        {submitError && (
          <Alert
            status="error"
            title="Error al guardar"
            description={submitError}
          />
        )}
        <Text>
          Número de OT:{" "}
          {editing
            ? workOrder?.workOrderNumber
            : "Se asignará al guardar en el servidor"}
        </Text>
        {editing ? (
          <Text>
            Origen:{" "}
            {selected
              ? `${selected.quotationNumber} · ${selected.request?.requestNumber} · ${selected.client?.businessName}`
              : "Origen histórico no documentado"}
          </Text>
        ) : (
          <FormField
            label="Cotización aceptada"
            required
            error={touched.quotationId ? errors.quotationId : null}
          >
            <Select
              aria-label="Cotización aceptada"
              value={values.quotationId}
              onChange={(e) => handleChange("quotationId", e.target.value)}
            >
              <option value="">Seleccioná una cotización</option>
              {eligible.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quotationNumber} · {q.client?.businessName} ·{" "}
                  {q.request?.requestNumber}
                </option>
              ))}
            </Select>
          </FormField>
        )}
        {!editing && !eligible.length && (
          <Alert
            status="info"
            title="No hay cotizaciones elegibles"
            description="Se necesita una cotización aceptada de un cliente activo para crear una OT."
          />
        )}
        {!editing && selected && (
          <Text>
            Cliente: {selected.client?.businessName}. Solicitud:{" "}
            {selected.request?.requestNumber}. El origen se deriva de la
            cotización.
          </Text>
        )}
        <FormField
          label="Título de la orden"
          required
          error={touched.title ? errors.title : null}
        >
          <Input
            aria-label="Título de la orden"
            value={values.title}
            onChange={(e) => handleChange("title", e.target.value)}
            onBlur={() => handleBlur("title")}
          />
        </FormField>
        <FormField
          label="Descripción técnica"
          required
          error={touched.description ? errors.description : null}
        >
          <Textarea
            aria-label="Descripción técnica"
            value={values.description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={() => handleBlur("description")}
          />
        </FormField>
        <FormField label="Prioridad">
          <Select
            aria-label="Prioridad"
            value={values.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
          >
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((value, i) => (
              <option key={value} value={value}>
                {["Baja", "Media", "Alta", "Urgente"][i]}
              </option>
            ))}
          </Select>
        </FormField>
        {editing && (
          <FormField
            label="Estado de ejecución"
            helperText="La aprobación se registra desde el detalle de la OT."
          >
            <Select
              aria-label="Estado de ejecución"
              value={values.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value={workOrder!.status}>{workOrder!.status}</option>
              {["IN_PROGRESS", "COMPLETED", "CANCELLED"]
                .filter((s) => s !== workOrder!.status)
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </Select>
          </FormField>
        )}
        <SimpleGrid columns={2} gap={3}>
          {(
            [
              "plannedStartDate",
              "plannedEndDate",
              ...(editing ? ["actualStartDate", "actualEndDate"] : []),
            ] as (keyof typeof values)[]
          ).map((key) => (
            <FormField
              key={key}
              label={
                {
                  plannedStartDate: "Inicio planificado",
                  plannedEndDate: "Fin planificado",
                  actualStartDate: "Inicio real",
                  actualEndDate: "Fin real",
                }[key as "plannedStartDate"]
              }
              error={touched[key] ? errors[key] : null}
            >
              <Input
                type="date"
                aria-label={key}
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
              />
            </FormField>
          ))}
        </SimpleGrid>
      </VStack>
    </Modal>
  );
}
export default WorkOrderFormModal;
