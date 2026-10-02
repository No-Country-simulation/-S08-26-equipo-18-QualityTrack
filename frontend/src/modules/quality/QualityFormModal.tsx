import { useEffect, useRef, useState } from "react";
import { HStack, SimpleGrid, VStack } from "@chakra-ui/react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import { useForm } from "../../hooks/useForm";
import { toDateIso, validators } from "../../utils";
import type {
  CreateQualityControlDto,
  QualityControl,
} from "../../services/qualityService";
import type { WorkOrder } from "../../services/workOrderService";
import { routeSheetService } from "../../services/routeSheetService";
import {
  operationService,
  type Operation,
} from "../../services/operationService";
import { errorMessage } from "../../utils/errorMessage";
import { businessDateInput, qualityDecimalError } from "./qualityValidation";

export interface QualityFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  control?: QualityControl | null;
  workOrders: WorkOrder[];
  defaultWorkOrderId?: number;
  onSave: (data: CreateQualityControlDto) => Promise<void> | void;
}

interface QualityFormValues {
  workOrderId: string;
  operationId: string;
  specification: string;
  expectedValue: string;
  measuredValue: string;
  unit: string;
  performedAt: string;
  observations: string;
}

const COMMON_UNITS = [
  { value: "mm", label: "mm (Milimetros)" },
  { value: "HRC", label: "HRC (Dureza Rockwell C)" },
  { value: "µm", label: "µm (Micrometros / Rugosidad Ra)" },
  { value: "PSI", label: "PSI (Presion / Estanqueidad)" },
  { value: "Nm", label: "Nm (Torque / Par de apriete)" },
  { value: "kg", label: "kg (Kilogramos / Peso)" },
  { value: "visual", label: "visual (Inspeccion visual)" },
];

const DEFAULT_VALUES: QualityFormValues = {
  workOrderId: "",
  operationId: "",
  specification: "",
  expectedValue: "",
  measuredValue: "",
  unit: "",
  performedAt: "",
  observations: "",
};

export function QualityFormModal({
  open,
  onOpenChange,
  control,
  workOrders,
  defaultWorkOrderId,
  onSave,
}: QualityFormModalProps) {
  const isEditing = Boolean(control);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsError, setOperationsError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const sourceVersion = useRef(0);

  const initialWorkOrderId = defaultWorkOrderId
    ? String(defaultWorkOrderId)
    : workOrders.length === 1
      ? String(workOrders[0].id)
      : "";

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
  } = useForm<QualityFormValues>({
    initialValues: {
      ...DEFAULT_VALUES,
      workOrderId: initialWorkOrderId,
    },
    rules: {
      workOrderId: [
        validators.required("Debes seleccionar una orden de trabajo"),
      ],
      specification: [
        validators.required("La especificacion o ensayo es obligatorio"),
        validators.maxLength(5000),
      ],
      expectedValue: [qualityDecimalError],
      measuredValue: [qualityDecimalError],
      unit: [validators.maxLength(20)],
      observations: [validators.maxLength(5000)],
      performedAt: [
        validators.date(
          "La fecha de inspeccion debe estar completa (DD/MM/AAAA)",
        ),
      ],
    },
    onSubmit: async (formValues) => {
      const numericWoId = Number(formValues.workOrderId);
      if (operationsError || operationsLoading)
        throw new Error("Esperá a que se carguen las operaciones de esta OT.");
      if (
        formValues.operationId &&
        !operations.some((o) => String(o.id) === formValues.operationId)
      )
        throw new Error("Seleccioná una operación de esta OT.");
      const performedAtIso =
        control?.performedAt &&
        businessDateInput(control.performedAt) === formValues.performedAt
          ? control.performedAt
          : toDateIso(formValues.performedAt);

      await onSave({
        workOrderId: numericWoId,
        operationId: formValues.operationId
          ? Number(formValues.operationId)
          : null,
        specification: formValues.specification.trim(),
        expectedValue: formValues.expectedValue.trim() || null,
        measuredValue: formValues.measuredValue.trim() || null,
        unit: formValues.unit || null,
        ...(isEditing
          ? { performedAt: performedAtIso ?? null }
          : performedAtIso
            ? { performedAt: performedAtIso }
            : {}),
        observations: formValues.observations.trim() || null,
      });

      onOpenChange({ open: false });
    },
  });

  useEffect(() => {
    if (open) {
      if (control) {
        reset({
          workOrderId: String(control.workOrderId),
          operationId: control.operationId ? String(control.operationId) : "",
          specification: control.specification || "",
          expectedValue: control.expectedValue || "",
          measuredValue: control.measuredValue || "",
          unit: control.unit || "",
          performedAt: businessDateInput(control.performedAt),
          observations: control.observations || "",
        });
      } else {
        reset({
          ...DEFAULT_VALUES,
          performedAt: "",
          workOrderId: initialWorkOrderId,
        });
      }
    }
  }, [open, control, initialWorkOrderId, reset]);
  useEffect(() => {
    const version = ++sourceVersion.current;
    setOperations([]);
    setOperationsError(null);
    setOperationsLoading(false);
    if (!open || !values.workOrderId) return;
    setOperationsLoading(true);
    void routeSheetService
      .getByWorkOrder(values.workOrderId)
      .then((sheets) =>
        Promise.all(sheets.map((s) => operationService.getByRouteSheet(s.id))),
      )
      .then((rows) => {
        if (version === sourceVersion.current) setOperations(rows.flat());
      })
      .catch((e) => {
        if (version === sourceVersion.current)
          setOperationsError(errorMessage(e));
      })
      .finally(() => {
        if (version === sourceVersion.current) setOperationsLoading(false);
      });
    return () => {
      sourceVersion.current++;
    };
  }, [open, values.workOrderId, retry]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(details) => {
        if (!isSubmitting) onOpenChange(details);
      }}
      title={
        isEditing ? "Editar control de calidad" : "Nuevo control de calidad"
      }
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
            disabled={
              operationsLoading ||
              Boolean(operationsError) ||
              !workOrders.length
            }
          >
            {isEditing ? "Guardar cambios" : "Registrar control"}
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

        {/* Fila 1: Orden de Trabajo y Fecha de Control */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Orden de trabajo vinculada"
            required
            error={touched.workOrderId ? errors.workOrderId : null}
            helperText="Selecciona la pieza u orden inspeccionada"
          >
            <Select
              aria-label="Orden de trabajo vinculada"
              disabled={isEditing || Boolean(defaultWorkOrderId)}
              value={values.workOrderId}
              onChange={(e) => {
                handleChange("workOrderId", e.target.value);
                handleChange("operationId", "");
              }}
              onBlur={() => handleBlur("workOrderId")}
            >
              <option value="">-- Seleccionar orden de trabajo --</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={String(wo.id)}>
                  OT-{wo.workOrderNumber} — {wo.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Fecha de inspeccion"
            helperText="Opcional; si se omite en el alta, se registra la fecha y hora del servidor."
            error={touched.performedAt ? errors.performedAt : null}
          >
            <Input
              aria-label="Fecha de inspeccion"
              type="date"
              value={values.performedAt}
              onChange={(e) => handleChange("performedAt", e.target.value)}
              onBlur={() => handleBlur("performedAt")}
            />
          </FormField>
        </SimpleGrid>
        {operationsError && (
          <Alert
            status="error"
            title="No se pudieron cargar las operaciones"
            description={operationsError}
          />
        )}
        {operationsError && (
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            Reintentar operaciones
          </Button>
        )}
        <FormField
          label="Operación vinculada"
          helperText={
            operationsLoading
              ? "Cargando operaciones…"
              : "Opcional. Solo se ofrecen operaciones de esta OT."
          }
        >
          <Select
            aria-label="Operación vinculada"
            value={values.operationId}
            disabled={
              operationsLoading || Boolean(operationsError) || isSubmitting
            }
            onChange={(e) => handleChange("operationId", e.target.value)}
          >
            <option value="">Sin operación específica</option>
            {operations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.operationNumber} — {o.name}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Fila 2: Especificacion tecnica */}
        <FormField
          label="Especificacion o ensayo tecnico"
          required
          error={touched.specification ? errors.specification : null}
          helperText="Ej: Diametro de pista h7, Dureza superficial, Estanqueidad"
        >
          <Input
            aria-label="Especificación o ensayo"
            maxLength={5000}
            placeholder="Ej: Control dimensional de diametro exterior segun plano"
            value={values.specification}
            onChange={(e) => handleChange("specification", e.target.value)}
            onBlur={() => handleBlur("specification")}
          />
        </FormField>

        {/* Fila 3: Valor esperado, Valor medido y Unidad */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField
            label="Valor esperado"
            error={touched.expectedValue ? errors.expectedValue : null}
            helperText="Opcional. La tolerancia textual se escribe en especificación."
          >
            <Input
              aria-label="Valor esperado"
              placeholder="Ej: 45.0000"
              value={values.expectedValue}
              onChange={(e) => handleChange("expectedValue", e.target.value)}
              onBlur={() => handleBlur("expectedValue")}
            />
          </FormField>

          <FormField
            label="Valor medido"
            error={touched.measuredValue ? errors.measuredValue : null}
            helperText="Lectura obtenida"
          >
            <Input
              aria-label="Valor medido"
              placeholder="Ej: 45.008"
              value={values.measuredValue}
              onChange={(e) => handleChange("measuredValue", e.target.value)}
              onBlur={() => handleBlur("measuredValue")}
            />
          </FormField>

          <FormField
            label="Unidad de medida"
            error={touched.unit ? errors.unit : null}
          >
            <Select
              aria-label="Unidad de medida"
              value={values.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              onBlur={() => handleBlur("unit")}
            >
              <option value="">Sin unidad</option>
              {values.unit &&
                !COMMON_UNITS.some((u) => u.value === values.unit) && (
                  <option value={values.unit}>{values.unit}</option>
                )}
              {COMMON_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
          </FormField>
        </SimpleGrid>

        {/* Fila 4: Observaciones */}
        <FormField
          label="Observaciones y dictamen del inspector"
          helperText="Instrumentos utilizados, trazabilidad de calibracion o detalles relevantes..."
        >
          <Textarea
            aria-label="Observaciones"
            maxLength={5000}
            placeholder="Medicion realizada en banco. Instrumento calibrado..."
            value={values.observations}
            onChange={(e) => handleChange("observations", e.target.value)}
            onBlur={() => handleBlur("observations")}
            rows={3}
          />
        </FormField>
      </VStack>
    </Modal>
  );
}

export default QualityFormModal;
