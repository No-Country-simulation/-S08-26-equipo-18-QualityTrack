import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Textarea } from "../../components/Textarea";
import { useForm } from "../../hooks/useForm";
import { formatCurrency } from "./quotationColumns";
import { toDateIso, validators } from "../../utils";
import type { Client } from "../../services/clientService";
import type {
  CreateQuotationDto,
  Quotation,
} from "../../services/quotationService";
import type { Request } from "../../services/requestService";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface QuotationFormModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  quotation?: Quotation | null;
  clients: Client[];
  requests: Request[];
  onSave: (quotationData: CreateQuotationDto) => Promise<void> | void;
}

interface QuotationFormValues {
  quotationNumber: string;
  version: string;
  clientId: string;
  requestId: string;
  currency: string;
  validUntil: string;
  description: string;
  subtotal: string;
  taxAmount: string;
}

const DEFAULT_VALUES: QuotationFormValues = {
  quotationNumber: "",
  version: "1",
  clientId: "",
  requestId: "",
  currency: "ARS",
  validUntil: "",
  description: "",
  subtotal: "0.00",
  taxAmount: "0.00",
};

export function QuotationFormModal({
  open,
  onOpenChange,
  quotation,
  clients,
  requests,
  onSave,
}: QuotationFormModalProps) {
  const isEditing = Boolean(quotation);

  // Estado para los items de linea dinamicos
  const [items, setItems] = useState<LineItem[]>([]);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [itemError, setItemError] = useState<string | null>(null);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    reset,
  } = useForm<QuotationFormValues>({
    initialValues: DEFAULT_VALUES,
    rules: {
      quotationNumber: [
        validators.required("El numero de cotizacion es obligatorio"),
      ],
      clientId: [validators.required("Debes seleccionar un cliente")],
      requestId: [validators.required("Debes seleccionar una solicitud")],
      description: [
        validators.required("La descripcion de la cotizacion es obligatoria"),
      ],
      subtotal: [validators.required("El subtotal es obligatorio")],
    },
    onSubmit: async (formValues) => {
      if (items.length === 0) {
        setItemError("Debes agregar al menos un item a la cotizacion");
        return;
      }
      setItemError(null);

      const numericClientId = Number(formValues.clientId);
      const numericRequestId = Number(formValues.requestId);
      const numericVersion = parseInt(formValues.version, 10) || 1;
      const validUntilIso = toDateIso(formValues.validUntil);

      await onSave({
        quotationNumber: formValues.quotationNumber.trim(),
        version: numericVersion,
        clientId: numericClientId,
        requestId: numericRequestId,
        currency: formValues.currency,
        validUntil: validUntilIso,
        description: formValues.description.trim(),
        subtotal: Number(formValues.subtotal || 0).toFixed(2),
        taxAmount: Number(formValues.taxAmount || 0).toFixed(2),
        items: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
      });
      onOpenChange({ open: false });
    },
  });

  // Al abrir el modal o cambiar la cotizacion seleccionada
  useEffect(() => {
    if (open) {
      setItemError(null);
      setNewItemDesc("");
      setNewItemQty("1");
      setNewItemPrice("");

      if (quotation) {
        reset({
          quotationNumber: quotation.quotationNumber,
          version: String(quotation.version || 1),
          clientId: String(quotation.clientId),
          requestId: String(quotation.requestId),
          currency: quotation.currency || "ARS",
          validUntil: quotation.validUntil
            ? quotation.validUntil.split("T")[0]
            : "",
          description: quotation.description || "",
          subtotal: quotation.subtotal || "0.00",
          taxAmount: quotation.taxAmount || "0.00",
        });
        if (quotation.items && quotation.items.length > 0) {
          setItems(
            quotation.items.map((it, idx) => ({
              id: String(it.id ?? idx + 1),
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              subtotal: it.subtotal,
            })),
          );
        } else {
          setItems([]);
        }
      } else {
        reset(DEFAULT_VALUES);
        setItems([]);
      }
    }
  }, [open, quotation, reset]);

  // Recalculo automatico de subtotal e IVA al modificar los items de linea
  const recalculateFromItems = (currentItems: LineItem[]) => {
    if (currentItems.length > 0) {
      const totalSub = currentItems.reduce((acc, it) => acc + it.subtotal, 0);
      const calculatedTax = totalSub * 0.21;
      setValue("subtotal", totalSub.toFixed(2));
      setValue("taxAmount", calculatedTax.toFixed(2));
    }
  };

  const handleAddItem = () => {
    if (!newItemDesc.trim()) {
      setItemError("Ingresa una descripcion para el item.");
      return;
    }
    const qty = parseFloat(newItemQty);
    const price = parseFloat(newItemPrice);

    if (isNaN(qty) || qty <= 0) {
      setItemError("La cantidad debe ser un numero mayor a 0.");
      return;
    }
    if (isNaN(price) || price < 0) {
      setItemError("El precio unitario debe ser un valor valido.");
      return;
    }

    const itemSubtotal = qty * price;
    const newItem: LineItem = {
      id: `${Date.now()}-${Math.random()}`,
      description: newItemDesc.trim(),
      quantity: qty,
      unitPrice: price,
      subtotal: itemSubtotal,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    recalculateFromItems(updatedItems);

    setNewItemDesc("");
    setNewItemQty("1");
    setNewItemPrice("");
    setItemError(null);
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = items.filter((it) => it.id !== id);
    setItems(updatedItems);
    recalculateFromItems(updatedItems);
  };

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  // Filtrado de solicitudes segun cliente seleccionado
  const clientRequests = values.clientId
    ? requests.filter((r) => String(r.clientId) === values.clientId)
    : requests;
  const availableRequests =
    clientRequests.length > 0 ? clientRequests : requests;

  const totalCalculated =
    Number(values.subtotal || 0) + Number(values.taxAmount || 0);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar cotizacion" : "Nueva cotizacion"}
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
            {isEditing ? "Guardar cambios" : "Crear cotizacion"}
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

        {/* Fila 1: Nro. de cotizacion y Version */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <Box gridColumn={{ base: "span 1", md: "span 2" }}>
            <FormField
              label="Nro. de cotizacion"
              required
              error={touched.quotationNumber ? errors.quotationNumber : null}
              helperText="Codigo interno de cotizacion (ej: COT-2026-006)"
            >
              <Input
                placeholder="COT-2026-006"
                value={values.quotationNumber}
                onChange={(e) => handleChange("quotationNumber", e.target.value)}
                onBlur={() => handleBlur("quotationNumber")}
              />
            </FormField>
          </Box>

          <FormField
            label="Version"
            required
            helperText="Revision de oferta"
          >
            <Input
              type="number"
              min={1}
              value={values.version}
              onChange={(e) => handleChange("version", e.target.value)}
              onBlur={() => handleBlur("version")}
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 2: Cliente y Solicitud vinculada */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
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
              {clients.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.businessName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Solicitud vinculada"
            required
            error={touched.requestId ? errors.requestId : null}
          >
            <Select
              value={values.requestId}
              onChange={(e) => handleChange("requestId", e.target.value)}
              onBlur={() => handleBlur("requestId")}
            >
              <option value="">-- Seleccionar solicitud --</option>
              {availableRequests.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.requestNumber} - {r.title}
                </option>
              ))}
            </Select>
          </FormField>
        </SimpleGrid>

        {/* Fila 3: Moneda y Validez */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FormField label="Moneda comercial" required>
            <Select
              value={values.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              onBlur={() => handleBlur("currency")}
            >
              <option value="ARS">ARS - Pesos argentinos</option>
              <option value="USD">USD - Dolares estadounidenses</option>
            </Select>
          </FormField>

          <FormField
            label="Fecha de validez"
            helperText="Plazo limite de vigencia de la oferta"
          >
            <Input
              type="date"
              value={values.validUntil}
              onChange={(e) => handleChange("validUntil", e.target.value)}
              onBlur={() => handleBlur("validUntil")}
            />
          </FormField>
        </SimpleGrid>

        {/* Fila 4: Descripcion tecnica y comercial */}
        <FormField
          label="Descripcion de la cotizacion"
          required
          error={touched.description ? errors.description : null}
          helperText="Detalles de alcance, condiciones comerciales y plazo de ejecucion..."
        >
          <Textarea
            placeholder="Alcance del trabajo, normas de fabricacion aplicadas, condiciones de entrega..."
            value={values.description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            rows={2}
          />
        </FormField>

        {/* Seccion: Items de linea de la cotizacion */}
        <Box
          p={3}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          bg="gray.50"
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" fontWeight="bold" color="gray.800">
              Items de la cotizacion
            </Text>
            <Text fontSize="xs" color="gray.500">
              Agrega las lineas de detalle para calcular el subtotal
            </Text>
          </Flex>

          {itemError && (
            <Box mb={2}>
              <Alert status="warning" title={itemError} />
            </Box>
          )}

          {/* Formulario rapido para agregar item */}
          <SimpleGrid columns={{ base: 1, md: 12 }} gap={2} mb={3}>
            <Box gridColumn={{ base: "span 1", md: "span 6" }}>
              <Input
                placeholder="Descripcion del item (ej: Eje estriado SAE 4140)"
                size="sm"
                bg="white"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
              />
            </Box>
            <Box gridColumn={{ base: "span 1", md: "span 2" }}>
              <Input
                type="number"
                placeholder="Cant."
                size="sm"
                bg="white"
                min={1}
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
              />
            </Box>
            <Box gridColumn={{ base: "span 1", md: "span 2" }}>
              <Input
                type="number"
                placeholder="Precio u."
                size="sm"
                bg="white"
                min={0}
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </Box>
            <Box gridColumn={{ base: "span 1", md: "span 2" }}>
              <Button
                size="sm"
                colorPalette="blue"
                variant="outline"
                w="full"
                onClick={handleAddItem}
              >
                <LuPlus style={{ marginRight: "4px" }} />
                Agregar
              </Button>
            </Box>
          </SimpleGrid>

          {/* Tabla de items agregados */}
          {items.length > 0 ? (
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              overflow="hidden"
              bg="white"
            >
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row bg="gray.100">
                    <Table.ColumnHeader fontSize="xs">
                      Descripcion
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="right">
                      Cant.
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="right">
                      Precio unit.
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="right">
                      Subtotal
                    </Table.ColumnHeader>
                    <Table.ColumnHeader fontSize="xs" textAlign="center">
                      Accion
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {items.map((it) => (
                    <Table.Row key={it.id}>
                      <Table.Cell fontSize="xs">{it.description}</Table.Cell>
                      <Table.Cell fontSize="xs" textAlign="right">
                        {it.quantity}
                      </Table.Cell>
                      <Table.Cell
                        fontSize="xs"
                        fontFamily="mono"
                        textAlign="right"
                      >
                        {it.unitPrice.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </Table.Cell>
                      <Table.Cell
                        fontSize="xs"
                        fontFamily="mono"
                        fontWeight="semibold"
                        textAlign="right"
                      >
                        {it.subtotal.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => handleRemoveItem(it.id)}
                          title="Eliminar item"
                          aria-label="Eliminar item"
                        >
                          <LuTrash2 size={12} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Text fontSize="xs" color="gray.500" fontStyle="italic">
              No hay items agregados. Puedes ingresar los importes directamente
              abajo si lo deseas.
            </Text>
          )}
        </Box>

        {/* Fila 5: Importes monetarios y Totales */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <FormField
            label="Subtotal neto"
            required
            error={touched.subtotal ? errors.subtotal : null}
          >
            <Input
              type="number"
              step="0.01"
              value={values.subtotal}
              onChange={(e) => handleChange("subtotal", e.target.value)}
              onBlur={() => handleBlur("subtotal")}
            />
          </FormField>

          <FormField label="Impuesto estimado (IVA 21%)">
            <Input
              type="number"
              step="0.01"
              value={values.taxAmount}
              onChange={(e) => handleChange("taxAmount", e.target.value)}
              onBlur={() => handleBlur("taxAmount")}
            />
          </FormField>

          <Box
            p={3}
            bg="blue.50"
            borderWidth="1px"
            borderColor="blue.200"
            borderRadius="md"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Text fontSize="xs" color="blue.700" fontWeight="medium">
              Total estimado
            </Text>
            <Text
              fontFamily="mono"
              fontSize="md"
              fontWeight="bold"
              color="blue.900"
            >
              {formatCurrency(totalCalculated, values.currency)}
            </Text>
          </Box>
        </SimpleGrid>
      </VStack>
    </Modal>
  );
}

export default QuotationFormModal;

