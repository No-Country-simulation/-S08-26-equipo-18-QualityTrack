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
import type { Client } from "../../services/clientService";
import type {
  CreateDeliveryDto,
  Delivery,
} from "../../services/deliveryService";
import type { WorkOrder } from "../../services/workOrderService";

export interface DeliveryFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  delivery?: Delivery | null;
  workOrders: WorkOrder[];
  clients: Client[];
  onSave: (data: CreateDeliveryDto) => Promise<void> | void;
}

interface DeliveryFormValues {
  workOrderId: string;
  clientId: string;
  deliveryDate: string;
  quantity: string;
  notes: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const DEFAULT_VALUES: DeliveryFormValues = {
  workOrderId: "",
  clientId: "",
  deliveryDate: getTodayDateString(),
  quantity: "",
  notes: "",
};

export function DeliveryFormModal({
  open,
  onOpenChange,
  delivery,
  workOrders,
  clients,
  onSave,
}: DeliveryFormModalProps) {
  const isEditing = Boolean(delivery);

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
    initialValues: DEFAULT_VALUES,
    rules: {
      workOrderId: [
        validators.required("Debes seleccionar una orden de trabajo"),
      ],
      deliveryDate: [validators.required("La fecha de entrega es obligatoria")],
      quantity: [
        validators.required("La cantidad de piezas es obligatoria"),
        validators.positiveNumber("La cantidad debe ser un numero mayor a 0"),
      ],
    },
    onSubmit: async (formValues) => {
      const dto: CreateDeliveryDto = {
        workOrderId: Number(formValues.workOrderId),
        clientId: formValues.clientId ? Number(formValues.clientId) : undefined,
        deliveryDate: toDateIso(formValues.deliveryDate) ?? new Date().toISOString(),
        quantity: Number(formValues.quantity),
        notes: formValues.notes.trim() || undefined,
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
        clientId: delivery.clientId ? String(delivery.clientId) : "",
        deliveryDate: delivery.deliveryDate
          ? delivery.deliveryDate.split("T")[0]
          : getTodayDateString(),
        quantity: String(delivery.quantity),
        notes: delivery.notes || "",
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, delivery, reset]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
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
            label="Cliente destinatario"
            helperText="Cliente que recibe el despacho"
          >
            <Select
              value={values.clientId}
              onChange={(e) => handleChange("clientId", e.target.value)}
              onBlur={() => handleBlur("clientId")}
            >
              <option value="">-- Seleccionar cliente (opcional) --</option>
              {clients.map((cli) => (
                <option key={cli.id} value={String(cli.id)}>
                  {cli.businessName}
                </option>
              ))}
            </Select>
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
