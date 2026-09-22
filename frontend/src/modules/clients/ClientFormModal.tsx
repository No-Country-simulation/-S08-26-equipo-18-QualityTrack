import { useEffect } from "react";
import { HStack, SimpleGrid, VStack } from "@chakra-ui/react";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Textarea } from "../../components/Textarea";
import { Alert } from "../../components/Alert";
import { useForm } from "../../hooks/useForm";
import { validators } from "../../utils/validators";
import type { Client, CreateClientDto } from "../../services/clientService";

export interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  client?: Client | null;
  onSave: (clientData: CreateClientDto) => Promise<void> | void;
}

interface ClientFormValues {
  businessName: string;
  taxId: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes: string;
}

const DEFAULT_VALUES: ClientFormValues = {
  businessName: "",
  taxId: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  notes: "",
};

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSave,
}: ClientFormModalProps) {
  const isEditing = Boolean(client);

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
  } = useForm<ClientFormValues>({
    initialValues: DEFAULT_VALUES,
    rules: {
      businessName: [validators.required("La razon social es obligatoria")],
      taxId: [
        validators.required("El CUIT es obligatorio"),
        validators.cuit("El CUIT debe tener 11 digitos numericos"),
      ],
      contactName: [validators.required("El nombre de contacto es obligatorio")],
      email: [
        validators.required("El email es obligatorio"),
        validators.email("Ingresa un correo electronico valido"),
      ],
    },
    onSubmit: async (formValues) => {
      const numericTaxId = Number(formValues.taxId.replace(/\D/g, ""));
      await onSave({
        businessName: formValues.businessName.trim(),
        taxId: numericTaxId,
        contactName: formValues.contactName.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        address: formValues.address.trim(),
        city: formValues.city.trim(),
        province: formValues.province.trim(),
        notes: formValues.notes.trim() || undefined,
      });
      onOpenChange({ open: false });
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          businessName: client.businessName,
          taxId: String(client.taxId),
          contactName: client.contactName,
          email: client.email,
          phone: client.phone || "",
          address: client.address || "",
          city: client.city || "",
          province: client.province || "",
          notes: client.notes || "",
        });
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [open, client, reset]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}
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
            {isEditing ? "Guardar Cambios" : "Crear Cliente"}
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
            label="Razon Social"
            required
            error={touched.businessName ? errors.businessName : null}
          >
            <Input
              placeholder="Ej: Metalurgica Andina S.A."
              value={values.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              onBlur={() => handleBlur("businessName")}
            />
          </FormField>

          <FormField
            label="CUIT (11 digitos)"
            required
            error={touched.taxId ? errors.taxId : null}
            helperText="Sin guiones ni espacios"
          >
            <Input
              placeholder="Ej: 30712345678"
              value={values.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
              onBlur={() => handleBlur("taxId")}
            />
          </FormField>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Persona de Contacto"
            required
            error={touched.contactName ? errors.contactName : null}
          >
            <Input
              placeholder="Ej: Carlos Mendez"
              value={values.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
              onBlur={() => handleBlur("contactName")}
            />
          </FormField>

          <FormField
            label="Correo Electronico"
            required
            error={touched.email ? errors.email : null}
          >
            <Input
              type="email"
              placeholder="contacto@empresa.com.ar"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
            />
          </FormField>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField label="Telefono">
            <Input
              placeholder="+54 11 4522-8900"
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
            />
          </FormField>

          <FormField label="Ciudad">
            <Input
              placeholder="Ej: Rosario"
              value={values.city}
              onChange={(e) => handleChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
            />
          </FormField>

          <FormField label="Provincia">
            <Input
              placeholder="Ej: Santa Fe"
              value={values.province}
              onChange={(e) => handleChange("province", e.target.value)}
              onBlur={() => handleBlur("province")}
            />
          </FormField>
        </SimpleGrid>

        <FormField label="Direccion">
          <Input
            placeholder="Av. Industrial 4500"
            value={values.address}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={() => handleBlur("address")}
          />
        </FormField>

        <FormField label="Notas u Observaciones">
          <Textarea
            placeholder="Informacion adicional sobre el cliente, requerimientos especiales de calidad, etc."
            value={values.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
            rows={3}
          />
        </FormField>
      </VStack>
    </Modal>
  );
}

export default ClientFormModal;

