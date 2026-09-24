import { useEffect } from "react";
import { HStack, SimpleGrid, VStack } from "@chakra-ui/react";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import { Alert } from "../../components/Alert";
import { useForm } from "../../hooks/useForm";
import { toDateIso, validators } from "../../utils";
import type { Client } from "../../services/clientService";
import type { CreateRequestDto, Request } from "../../services/requestService";

export interface RequestFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  request?: Request | null;
  clients: Client[];
  onSave: (requestData: CreateRequestDto) => Promise<void> | void;
}

interface RequestFormValues {
  requestNumber: string;
  title: string;
  description: string;
  clientId: string;
  receivedAt: string;
  requestedDeliveryDate: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const DEFAULT_VALUES: RequestFormValues = {
  requestNumber: "",
  title: "",
  description: "",
  clientId: "",
  receivedAt: getTodayDateString(),
  requestedDeliveryDate: "",
};

export function RequestFormModal({
  open,
  onOpenChange,
  request,
  clients,
  onSave,
}: RequestFormModalProps) {
  const isEditing = Boolean(request);

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
  } = useForm<RequestFormValues>({
    initialValues: DEFAULT_VALUES,
    rules: {
      requestNumber: [
        validators.required("El numero de solicitud es obligatorio"),
      ],
      title: [validators.required("El titulo de la solicitud es obligatorio")],
      description: [
        validators.required("La descripcion tecnica es obligatoria"),
      ],
      clientId: [validators.required("Debes seleccionar un cliente")],
      receivedAt: [validators.required("La fecha de recepcion es obligatoria")],
    },
    onSubmit: async (formValues) => {
      const numericClientId = Number(formValues.clientId);
      const receivedAtIso = toDateIso(formValues.receivedAt) ?? new Date().toISOString();
      const requestedDeliveryDateIso = toDateIso(formValues.requestedDeliveryDate);

      await onSave({
        requestNumber: formValues.requestNumber.trim(),
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        clientId: numericClientId,
        receivedAt: receivedAtIso,
        requestedDeliveryDate: requestedDeliveryDateIso,
      });
      onOpenChange({ open: false });
    },
  });

  useEffect(() => {
    if (open) {
      if (request) {
        reset({
          requestNumber: request.requestNumber,
          title: request.title,
          description: request.description,
          clientId: String(request.clientId),
          receivedAt: request.receivedAt
            ? request.receivedAt.split("T")[0]
            : getTodayDateString(),
          requestedDeliveryDate: request.requestedDeliveryDate
            ? request.requestedDeliveryDate.split("T")[0]
            : "",
        });
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [open, request, reset]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  const clientOptions = clients.map((c) => ({
    value: String(c.id),
    label: `${c.businessName}`,
  }));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar solicitud" : "Nueva solicitud"}
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
            {isEditing ? "Guardar cambios" : "Crear solicitud"}
          </Button>
        </HStack>
      }
    >
      <VStack gap={3} align="stretch">
        {submitError && (
          <Alert
            status="error"
            title="Error al guardar"
            description={submitError}
          />
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Nro. de solicitud"
            required
            error={touched.requestNumber ? errors.requestNumber : null}
            helperText="Codigo interno de trazabilidad (ej: SOL-2026-001)"
          >
            <Input
              placeholder="SOL-2026-001"
              value={values.requestNumber}
              onChange={(e) => handleChange("requestNumber", e.target.value)}
              onBlur={() => handleBlur("requestNumber")}
            />
          </FormField>

          <FormField
            label="Cliente solicitante"
            required
            error={touched.clientId ? errors.clientId : null}
          >
            <Select
              value={values.clientId}
              onChange={(e) => handleChange("clientId", e.target.value)}
              onBlur={() => handleBlur("clientId")}
            >
              <option value="">-- Seleccionar cliente --</option>
              {clientOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </SimpleGrid>

        <FormField
          label="Titulo / asunto de la solicitud"
          required
          error={touched.title ? errors.title : null}
        >
          <Input
            placeholder="Ej: Fabricacion de ejes estriados para reductor"
            value={values.title}
            onChange={(e) => handleChange("title", e.target.value)}
            onBlur={() => handleBlur("title")}
          />
        </FormField>

        <FormField
          label="Descripcion tecnica y requerimientos"
          required
          error={touched.description ? errors.description : null}
        >
          <Textarea
            placeholder="Detalles de planos, cantidad de piezas, material requerido, tolerancias especiales..."
            value={values.description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            rows={3}
          />
        </FormField>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Fecha de recepcion"
            required
            error={touched.receivedAt ? errors.receivedAt : null}
          >
            <Input
              type="date"
              value={values.receivedAt}
              onChange={(e) => handleChange("receivedAt", e.target.value)}
              onBlur={() => handleBlur("receivedAt")}
            />
          </FormField>

          <FormField
            label="Fecha de entrega deseada"
            error={
              touched.requestedDeliveryDate
                ? errors.requestedDeliveryDate
                : null
            }
            helperText="Plazo estimado por el cliente"
          >
            <Input
              type="date"
              value={values.requestedDeliveryDate}
              onChange={(e) =>
                handleChange("requestedDeliveryDate", e.target.value)
              }
              onBlur={() => handleBlur("requestedDeliveryDate")}
            />
          </FormField>
        </SimpleGrid>
      </VStack>
    </Modal>
  );
}

export default RequestFormModal;
