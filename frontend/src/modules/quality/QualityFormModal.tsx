import { useEffect } from "react";
import { HStack, SimpleGrid, VStack } from "@chakra-ui/react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import { useForm } from "../../hooks/useForm";
import { validators } from "../../utils/validators";
import type {
  CreateQualityControlDto,
  QualityControl,
} from "../../services/qualityService";
import type { WorkOrder } from "../../services/workOrderService";

export interface QualityFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  control?: QualityControl | null;
  workOrders: WorkOrder[];
  onSave: (data: CreateQualityControlDto) => Promise<void> | void;
}

interface QualityFormValues {
  workOrderId: string;
  specification: string;
  expectedValue: string;
  measuredValue: string;
  unit: string;
  performedAt: string;
  observations: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

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
  specification: "",
  expectedValue: "",
  measuredValue: "",
  unit: "mm",
  performedAt: getTodayDateString(),
  observations: "",
};

export function QualityFormModal({
  open,
  onOpenChange,
  control,
  workOrders,
  onSave,
}: QualityFormModalProps) {
  const isEditing = Boolean(control);

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
    initialValues: DEFAULT_VALUES,
    rules: {
      workOrderId: [
        validators.required("Debes seleccionar una orden de trabajo"),
      ],
      specification: [
        validators.required("La especificacion o ensayo es obligatorio"),
      ],
      expectedValue: [
        validators.required("El valor esperado o tolerancia es obligatorio"),
      ],
      measuredValue: [
        validators.required("El valor medido en la inspeccion es obligatorio"),
      ],
      unit: [validators.required("La unidad de medida es obligatoria")],
      performedAt: [
        validators.required("La fecha de inspeccion es obligatoria"),
      ],
    },
    onSubmit: async (formValues) => {
      const numericWoId = Number(formValues.workOrderId);
      const performedAtIso = new Date(formValues.performedAt).toISOString();

      await onSave({
        workOrderId: numericWoId,
        specification: formValues.specification.trim(),
        expectedValue: formValues.expectedValue.trim(),
        measuredValue: formValues.measuredValue.trim(),
        unit: formValues.unit,
        performedAt: performedAtIso,
        observations: formValues.observations.trim() || undefined,
      });

      onOpenChange({ open: false });
    },
  });

  useEffect(() => {
    if (open) {
      if (control) {
        reset({
          workOrderId: String(control.workOrderId),
          specification: control.specification || "",
          expectedValue: control.expectedValue || "",
          measuredValue: control.measuredValue || "",
          unit: control.unit || "mm",
          performedAt: control.performedAt
            ? control.performedAt.split("T")[0]
            : getTodayDateString(),
          observations: control.observations || "",
        });
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [open, control, reset]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar control de calidad" : "Nuevo control de calidad"}
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
              value={values.workOrderId}
              onChange={(e) => handleChange("workOrderId", e.target.value)}
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
            required
            error={touched.performedAt ? errors.performedAt : null}
          >
            <Input
              type="date"
              value={values.performedAt}
              onChange={(e) => handleChange("performedAt", e.target.value)}
              onBlur={() => handleBlur("performedAt")}
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 2: Especificacion tecnica */}
        <FormField
          label="Especificacion o ensayo tecnico"
          required
          error={touched.specification ? errors.specification : null}
          helperText="Ej: Diametro de pista h7, Dureza superficial, Estanqueidad"
        >
          <Input
            placeholder="Ej: Control dimensional de diametro exterior segun plano"
            value={values.specification}
            onChange={(e) => handleChange("specification", e.target.value)}
            onBlur={() => handleBlur("specification")}
          />
        </FormField>

        {/* Fila 3: Valor esperado, Valor medido y Unidad */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField
            label="Valor esperado / tolerancia"
            required
            error={touched.expectedValue ? errors.expectedValue : null}
            helperText="Criterio de aceptacion"
          >
            <Input
              placeholder="Ej: 45.000 ± 0.015"
              value={values.expectedValue}
              onChange={(e) => handleChange("expectedValue", e.target.value)}
              onBlur={() => handleBlur("expectedValue")}
            />
          </FormField>

          <FormField
            label="Valor medido"
            required
            error={touched.measuredValue ? errors.measuredValue : null}
            helperText="Lectura obtenida"
          >
            <Input
              placeholder="Ej: 45.008"
              value={values.measuredValue}
              onChange={(e) => handleChange("measuredValue", e.target.value)}
              onBlur={() => handleBlur("measuredValue")}
            />
          </FormField>

          <FormField
            label="Unidad de medida"
            required
            error={touched.unit ? errors.unit : null}
          >
            <Select
              value={values.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              onBlur={() => handleBlur("unit")}
            >
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

