import { useEffect, useRef, useState } from "react";
import { HStack, Text, VStack, Input } from "@chakra-ui/react";
import { Modal } from "../../components/Modal";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import {
  documentService,
  type Document,
  type DocumentConfig,
  type DocumentType,
} from "../../services/documentService";
import type { WorkOrder } from "../../services/workOrderService";
import { errorMessage } from "../../utils/errorMessage";
export function DocumentUploadModal({
  open,
  onOpenChange,
  workOrder,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  onUploaded: (document: Document) => void;
}) {
  const [types, setTypes] = useState<DocumentType[]>([]),
    [config, setConfig] = useState<DocumentConfig | null>(null);
  const [typeId, setTypeId] = useState(""),
    [source, setSource] = useState("workOrder"),
    [description, setDescription] = useState(""),
    [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [sourceError, setSourceError] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const generation = useRef(0),
    busy = useRef(false),
    fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setTypeId("");
      setSource("workOrder");
      setDescription("");
      setFile(null);
      setError(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [open, workOrder.id]);
  useEffect(() => {
    const version = ++generation.current;
    if (!open) return;
    setLoading(true);
    setSourceError(null);
    setConfig(null);
    setTypes([]);
    void Promise.all([
      documentService.getDocumentTypes(),
      documentService.getConfig(),
    ])
      .then(([types, config]) => {
        if (version === generation.current) {
          setTypes(types);
          setConfig(config);
        }
      })
      .catch((e) => {
        if (version === generation.current) setSourceError(errorMessage(e));
      })
      .finally(() => {
        if (version === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [open, workOrder.id, retry]);
  const submit = async () => {
    if (busy.current || loading || !config || sourceError) return;
    setError(null);
    if (!file || !file.size) {
      setError("Seleccioná un archivo no vacío.");
      return;
    }
    if (file.size > config.maxFileSize) {
      setError("El archivo supera el tamaño permitido.");
      return;
    }
    if (
      !config.allowedExtensions.includes(
        file.name.split(".").pop()?.toLowerCase() ?? "",
      )
    ) {
      setError("El formato no está permitido.");
      return;
    }
    if (!types.some((t) => String(t.id) === typeId)) {
      setError("Seleccioná un tipo de documento.");
      return;
    }
    if (description.trim().length > 5000) {
      setError("La descripción admite hasta 5000 caracteres.");
      return;
    }
    const target =
      source === "workOrder"
        ? workOrder.id
        : source === "request"
          ? workOrder.requestId
          : workOrder.quotationId;
    if (!target) {
      setError("Este origen no está documentado.");
      return;
    }
    const version = generation.current;
    busy.current = true;
    setPending(true);
    const form = new FormData();
    form.append(`${source}Id`, String(target));
    form.append("documentTypeId", typeId);
    if (description.trim()) form.append("description", description.trim());
    form.append("file", file);
    try {
      const doc = await documentService.upload(form);
      if (version === generation.current) {
        onUploaded(doc);
        onOpenChange(false);
      }
    } catch (e) {
      if (version === generation.current) setError(errorMessage(e));
    } finally {
      busy.current = false;
      if (version === generation.current) setPending(false);
    }
  };
  return (
    <Modal
      open={open}
      onOpenChange={(d) => {
        if (!pending) onOpenChange(d.open);
      }}
      title="Adjuntar documento"
      size="lg"
      footer={
        <HStack justify="flex-end">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            colorPalette="blue"
            disabled={
              loading || Boolean(sourceError) || !config || !types.length
            }
            loading={pending}
            onClick={() => void submit()}
          >
            Guardar documento
          </Button>
        </HStack>
      }
    >
      <VStack align="stretch" gap={4}>
        {loading && <Text>Cargando tipos y formatos permitidos…</Text>}
        {sourceError && (
          <>
            <Alert
              status="error"
              title="No se pudo preparar la carga"
              description={sourceError}
            />
            <Button onClick={() => setRetry((v) => v + 1)}>
              Reintentar configuración
            </Button>
          </>
        )}
        {error && (
          <Alert
            status="error"
            title="No se pudo adjuntar"
            description={error}
          />
        )}
        <FormField label="Vincular a" required>
          <Select
            aria-label="Origen del documento"
            value={source}
            disabled={pending}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="workOrder">OT-{workOrder.workOrderNumber}</option>
            {workOrder.requestId && (
              <option value="request">
                Solicitud {workOrder.request?.requestNumber}
              </option>
            )}
            {workOrder.quotationId && (
              <option value="quotation">
                Cotización {workOrder.quotation?.quotationNumber}
              </option>
            )}
          </Select>
        </FormField>
        <FormField label="Tipo de documento" required>
          <Select
            aria-label="Tipo de documento"
            value={typeId}
            disabled={loading || pending}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">Seleccionar tipo</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Archivo"
          required
          helperText={
            config
              ? `Formatos: ${config.allowedExtensions.join(", ")}. Máximo ${(config.maxFileSize / 1024 / 1024).toLocaleString("es-AR")} MiB.`
              : undefined
          }
        >
          <Input
            ref={fileInput}
            aria-label="Archivo del documento"
            type="file"
            disabled={pending || loading}
            accept={config?.allowedExtensions.map((e) => `.${e}`).join(",")}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </FormField>
        <FormField label="Descripción">
          <Textarea
            aria-label="Descripción del documento"
            value={description}
            maxLength={5000}
            disabled={pending}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
      </VStack>
    </Modal>
  );
}
