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
      businessName: [
        validators.required("La razon social es obligatoria"),
        validators.maxLength(
          120,
          "La razon social no puede superar los 120 caracteres",
        ),
      ],
      taxId: [
        validators.required("El CUIT es obligatorio"),
        validators.cuit("El CUIT debe tener exactamente 11 digitos numericos"),
      ],
      contactName: [
        validators.maxLength(
          100,
          "El nombre de contacto no puede superar los 100 caracteres",
        ),
        validators.alphabetic("El contacto solo debe contener letras y espacios"),
      ],
      email: [
        validators.required("El email es obligatorio"),
        validators.email("Ingresa un correo electronico valido"),
        validators.maxLength(
          100,
          "El email no puede superar los 100 caracteres",
        ),
      ],
      phone: [
        validators.required("El telefono es obligatorio"),
        validators.phone(),
        validators.maxLength(
          20,
          "El telefono no puede superar los 20 caracteres",
        ),
      ],
      city: [
        validators.maxLength(
          60,
          "La ciudad no puede superar los 60 caracteres",
        ),
        validators.alphabetic("La ciudad solo debe contener letras y espacios"),
      ],
      province: [
        validators.maxLength(
          60,
          "La provincia no puede superar los 60 caracteres",
        ),
        validators.alphabetic(
          "La provincia solo debe contener letras y espacios",
        ),
      ],
      address: [
        validators.maxLength(
          150,
          "La direccion no puede superar los 150 caracteres",
        ),
      ],
      notes: [
        validators.maxLength(
          500,
          "Las notas no pueden superar los 500 caracteres",
        ),
      ],
    },
    onSubmit: async (formValues) => {
      const optional = (value: string) => value.trim() || undefined;
      await onSave({
        businessName: formValues.businessName.trim(),
        taxId: formValues.taxId.replace(/\D/g, ""),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        contactName: optional(formValues.contactName),
        address: optional(formValues.address),
        city: optional(formValues.city),
        province: optional(formValues.province),
        notes: optional(formValues.notes),
      });
      onOpenChange({ open: false });
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          businessName: client.businessName,
          taxId: client.taxId,
          contactName: client.contactName || "",
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

  // Filtrado de caracteres en tiempo real
  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9-]/g, "");
    handleChange("taxId", cleaned);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9+\s\-()]/g, "");
    handleChange("phone", cleaned);
  };

  const handleContactNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, "");
    handleChange("contactName", cleaned);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, "");
    handleChange("city", cleaned);
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, "");
    handleChange("province", cleaned);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar cliente" : "Nuevo cliente"}
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
            {isEditing ? "Guardar cambios" : "Crear cliente"}
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
            label="Razon social"
            required
            error={touched.businessName ? errors.businessName : null}
          >
            <Input
              placeholder="Ej: Metalurgica Andina S.A."
              value={values.businessName}
              maxLength={120}
              onChange={(e) => handleChange("businessName", e.target.value)}
              onBlur={() => handleBlur("businessName")}
            />
          </FormField>

          <FormField
            label="CUIT (11 digitos)"
            required
            error={touched.taxId ? errors.taxId : null}
            helperText="Sin guiones ni espacios (11 digitos)"
          >
            <Input
              placeholder="Ej: 20432906505"
              value={values.taxId}
              maxLength={13}
              onChange={handleCuitChange}
              onBlur={() => handleBlur("taxId")}
            />
          </FormField>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField
            label="Persona de contacto"
            error={touched.contactName ? errors.contactName : null}
          >
            <Input
              placeholder="Ej: Carlos Mendez"
              value={values.contactName}
              maxLength={100}
              onChange={handleContactNameChange}
              onBlur={() => handleBlur("contactName")}
            />
          </FormField>

          <FormField
            label="Correo electronico"
            required
            error={touched.email ? errors.email : null}
          >
            <Input
              type="email"
              placeholder="contacto@empresa.com.ar"
              value={values.email}
              maxLength={100}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
            />
          </FormField>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField
            label="Telefono"
            required
            error={touched.phone ? errors.phone : null}
          >
            <Input
              placeholder="+54 11 4522-8900"
              value={values.phone}
              maxLength={20}
              onChange={handlePhoneChange}
              onBlur={() => handleBlur("phone")}
            />
          </FormField>

          <FormField
            label="Ciudad"
            error={touched.city ? errors.city : null}
          >
            <Input
              placeholder="Ej: Rosario"
              value={values.city}
              maxLength={60}
              onChange={handleCityChange}
              onBlur={() => handleBlur("city")}
            />
          </FormField>

          <FormField
            label="Provincia"
            error={touched.province ? errors.province : null}
          >
            <Input
              placeholder="Ej: Santa Fe"
              value={values.province}
              maxLength={60}
              onChange={handleProvinceChange}
              onBlur={() => handleBlur("province")}
            />
          </FormField>
        </SimpleGrid>

        <FormField
          label="Direccion"
          error={touched.address ? errors.address : null}
        >
          <Input
            placeholder="Av. Industrial 4500"
            value={values.address}
            maxLength={150}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={() => handleBlur("address")}
          />
        </FormField>

        <FormField
          label="Notas u observaciones"
          error={touched.notes ? errors.notes : null}
        >
          <Textarea
            placeholder="Informacion adicional sobre el cliente, requerimientos especiales de calidad, etc."
            value={values.notes}
            maxLength={500}
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
