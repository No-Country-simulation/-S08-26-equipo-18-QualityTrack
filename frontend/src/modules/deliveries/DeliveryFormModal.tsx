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
import { toDateIso, validators } from "../../utils";
import type {
  CreateDeliveryDto,
  Delivery,
} from "../../services/deliveryService";
import type { WorkOrder } from "../../services/workOrderService";
import { businessDateInput } from "../quality/qualityValidation";

export interface DeliveryFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  delivery?: Delivery | null;
  workOrders: WorkOrder[];
  defaultWorkOrderId?: number;
  onSave: (data: CreateDeliveryDto) => Promise<void> | void;
}

interface DeliveryFormValues {
  workOrderId: string;
  deliveryDate: string;
  quantity: string;
  notes: string;
}

const getTodayDateString = () => businessDateInput(new Date().toISOString());

const DEFAULT_VALUES: DeliveryFormValues = {
  workOrderId: "",
  deliveryDate: getTodayDateString(),
  quantity: "",
  notes: "",
};

export function DeliveryFormModal({
  open,
  onOpenChange,
  delivery,
  workOrders,
  defaultWorkOrderId,
  onSave,
}: DeliveryFormModalProps) {
  const isEditing = Boolean(delivery);

  const initialWoId =
    defaultWorkOrderId ??
    (workOrders.length === 1 ? workOrders[0].id : undefined);

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
  } = useForm<DeliveryFormValues>({
    initialValues: {
      ...DEFAULT_VALUES,
      workOrderId: initialWoId ? String(initialWoId) : "",
    },
    rules: {
      workOrderId: [
        validators.required("Debes seleccionar una orden de trabajo"),
      ],
      deliveryDate: [
        validators.required("La fecha de entrega es obligatoria"),
        validators.date("La fecha de entrega debe estar completa (DD/MM/AAAA)"),
      ],
      quantity: [
        validators.required("La cantidad de piezas es obligatoria"),
        validators.positiveNumber("La cantidad debe ser un numero mayor a 0"),
        (value: string) =>
          /^\d+$/.test(value) && Number(value) <= 2147483647
            ? null
            : "La cantidad debe ser un entero positivo de hasta 2147483647.",
      ],
      notes: [validators.maxLength(5000)],
    },
    onSubmit: async (formValues) => {
      const selectedWo = workOrders.find(
        (wo) => String(wo.id) === formValues.workOrderId,
      );
      if (
        !delivery &&
        (!selectedWo?.quotationId ||
          !selectedWo.clientId ||
          selectedWo.status === "CANCELLED")
      )
        throw new Error(
          "Seleccioná una OT con origen y destinatario documentados.",
        );
      const deliveryDate =
        delivery &&
        businessDateInput(delivery.deliveryDate) === formValues.deliveryDate
          ? delivery.deliveryDate
          : toDateIso(formValues.deliveryDate);
      if (!deliveryDate) throw new Error("Indicá una fecha válida.");
      if (
        selectedWo &&
        formValues.deliveryDate < businessDateInput(selectedWo.createdAt)
      )
        throw new Error(
          "La entrega no puede ser anterior a la creación de la OT.",
        );
      const dto: CreateDeliveryDto = {
        workOrderId: Number(formValues.workOrderId),
        deliveryDate,
        quantity: Number(formValues.quantity),
        notes: formValues.notes.trim() || null,
      };

      await onSave(dto);
      onOpenChange({ open: false });
    },
  });

  // Cargar datos al abrir modal para edicion o limpiar para alta
  useEffect(() => {
    if (!open) return;

    if (delivery) {
      reset({
        workOrderId: String(delivery.workOrderId),
        deliveryDate: businessDateInput(delivery.deliveryDate),
        quantity: String(delivery.quantity),
        notes: delivery.notes || "",
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        deliveryDate: getTodayDateString(),
        workOrderId: initialWoId ? String(initialWoId) : "",
      });
    }
  }, [open, delivery, initialWoId, reset]);
  const selectedWo = workOrders.find(
    (wo) => String(wo.id) === values.workOrderId,
  );
  const recipient =
    delivery?.client?.businessName ?? selectedWo?.client?.businessName ?? "";
  const selectableOrders = delivery
    ? workOrders
    : workOrders.filter(
        (wo) => wo.quotationId && wo.clientId && wo.status !== "CANCELLED",
      );

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(details) => {
        if (!isSubmitting) onOpenChange(details);
      }}
      title={isEditing ? "Editar entrega" : "Nueva entrega"}
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
            disabled={!delivery && !selectableOrders.length}
          >
            {isEditing ? "Guardar cambios" : "Registrar entrega"}
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

        {/* Fila 1: Orden de Trabajo y Cliente Destinatario */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Orden de trabajo vinculada"
            required
            error={touched.workOrderId ? errors.workOrderId : null}
            helperText="Selecciona la OT a despachar"
          >
            <Select
              aria-label="Orden de trabajo vinculada"
              disabled={isEditing || Boolean(defaultWorkOrderId)}
              value={values.workOrderId}
              onChange={(e) => {
                const selectedWoId = e.target.value;
                handleChange("workOrderId", selectedWoId);
              }}
              onBlur={() => handleBlur("workOrderId")}
            >
              <option value="">-- Seleccionar orden de trabajo --</option>
              {selectableOrders.map((wo) => (
                <option key={wo.id} value={String(wo.id)}>
                  OT-{wo.workOrderNumber} — {wo.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Cliente destinatario"
            helperText="Se obtiene del origen de la OT y no se puede cambiar en la entrega."
          >
            <Input
              aria-label="Cliente destinatario"
              readOnly
              value={recipient}
              placeholder="Seleccioná una OT con origen documentado"
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 2: Fecha de Entrega y Cantidad de Piezas */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Fecha de entrega"
            required
            error={touched.deliveryDate ? errors.deliveryDate : null}
            helperText="Fecha de despacho o emision del remito"
          >
            <Input
              aria-label="Fecha de entrega"
              type="date"
              value={values.deliveryDate}
              onChange={(e) => handleChange("deliveryDate", e.target.value)}
              onBlur={() => handleBlur("deliveryDate")}
            />
          </FormField>

          <FormField
            label="Cantidad de piezas"
            required
            error={touched.quantity ? errors.quantity : null}
            helperText="Unidades fisicas despachadas (mayor a 0)"
          >
            <Input
              aria-label="Cantidad de piezas"
              min={1}
              max={2147483647}
              step={1}
              type="number"
              placeholder="Ej: 50"
              value={values.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              onBlur={() => handleBlur("quantity")}
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 3: Observaciones y datos de transporte */}
        <FormField
          label="Notas y datos de transporte"
          helperText="Expreso, chofer, nro. de remito fiscal o condiciones de embalaje"
        >
          <Textarea
            aria-label="Notas de entrega"
            maxLength={5000}
            placeholder="Ej: Despacho por Expreso Camionera del Sur. Remito 0001-0004523."
            rows={3}
            value={values.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
          />
        </FormField>
      </VStack>
    </Modal>
  );
}

export default DeliveryFormModal;
