import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Can } from "../../components/Can";
import { Table } from "../../components/Table";
import {
  documentService,
  saveDocumentFile,
  type Document,
} from "../../services/documentService";
import type { WorkOrder } from "../../services/workOrderService";
import { errorMessage } from "../../utils/errorMessage";
import { formatDate } from "../../utils";
import { DocumentUploadModal } from "./DocumentUploadModal";
export function DocumentsPanel({ workOrder }: { workOrder: WorkOrder }) {
  const [documents, setDocuments] = useState<Document[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [downloadError, setDownloadError] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [downloading, setDownloading] = useState<number | null>(null);
  const generation = useRef(0),
    busy = useRef(false);
  const load = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true);
    setError(null);
    setDocuments([]);
    try {
      const docs = await documentService.getByWorkOrder(workOrder.id);
      if (version === generation.current) setDocuments(docs);
    } catch (e) {
      if (version === generation.current) setError(errorMessage(e));
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [workOrder.id]);
  useEffect(() => {
    setOpen(false);
    setDownloadError(null);
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);
  const download = async (doc: Document) => {
    if (busy.current) return;
    busy.current = true;
    const version = generation.current;
    setDownloading(doc.id);
    setDownloadError(null);
    try {
      const blob = await documentService.download(doc.id);
      if (version === generation.current) saveDocumentFile(blob, doc.fileName);
    } catch (e) {
      if (version === generation.current) setDownloadError(errorMessage(e));
    } finally {
      busy.current = false;
      if (version === generation.current) setDownloading(null);
    }
  };
  return (
    <Box mt={6}>
      <Card
        title={
          <HStack justify="space-between" w="full">
            <Text fontWeight="bold">Documentación asociada al expediente</Text>
            <Can perform="workOrders:edit">
              <Button
                size="xs"
                variant="outline"
                disabled={loading || Boolean(error)}
                onClick={() => setOpen(true)}
              >
                Adjuntar documento
              </Button>
            </Can>
          </HStack>
        }
        description="Adjuntos de esta OT y de su solicitud y cotización de origen."
      >
        {downloadError && (
          <Alert
            status="error"
            title="No se pudo descargar"
            description={downloadError}
          />
        )}
        {loading ? (
          <Text aria-busy="true">Cargando documentos…</Text>
        ) : error ? (
          <>
            <Alert
              status="error"
              title="Documentos no disponibles"
              description={error}
            />
            <Button onClick={() => void load()}>Reintentar documentos</Button>
          </>
        ) : documents.length ? (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  {[
                    "Origen",
                    "Tipo",
                    "Archivo",
                    "Descripción",
                    "Responsable",
                    "Fecha",
                    "Tamaño",
                    "Acción",
                  ].map((h) => (
                    <Table.ColumnHeader key={h}>{h}</Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {documents.map((doc) => (
                  <Table.Row key={doc.id}>
                    <Table.Cell>
                      {doc.workOrderId
                        ? "OT"
                        : doc.quotationId
                          ? "Cotización"
                          : "Solicitud"}
                    </Table.Cell>
                    <Table.Cell>
                      {doc.documentType?.name ?? "No documentado"}
                    </Table.Cell>
                    <Table.Cell>
                      {doc.fileName}
                      <Text fontSize="xs">Versión {doc.version}</Text>
                    </Table.Cell>
                    <Table.Cell>{doc.description || "—"}</Table.Cell>
                    <Table.Cell>
                      {doc.uploadedBy
                        ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                        : "No documentado"}
                    </Table.Cell>
                    <Table.Cell>{formatDate(doc.uploadedAt)}</Table.Cell>
                    <Table.Cell>
                      {(doc.fileSize / 1024).toLocaleString("es-AR", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      KiB
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="xs"
                        disabled={
                          downloading !== null ||
                          doc.downloadAvailable === false
                        }
                        loading={downloading === doc.id}
                        onClick={() => void download(doc)}
                        aria-label={`Descargar ${doc.fileName}`}
                      >
                        Descargar
                      </Button>
                      {doc.downloadAvailable === false && (
                        <Text fontSize="xs">
                          Archivo histórico no disponible
                        </Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        ) : (
          <Text>No hay documentos asociados a este expediente.</Text>
        )}
      </Card>
      <DocumentUploadModal
        key={workOrder.id}
        open={open}
        onOpenChange={setOpen}
        workOrder={workOrder}
        onUploaded={(doc) => {
          setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
        }}
      />
    </Box>
  );
}
