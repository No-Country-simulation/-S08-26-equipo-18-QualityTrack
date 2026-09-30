import type { DocumentType } from "../../services/documentService";

export const MOCK_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 1,
    name: "Plano de ingenieria",
    description: "Planos de despiece, ensambles y tolerancias geometricas (CAD / PDF).",
  },
  {
    id: 2,
    name: "Certificado de materia prima",
    description: "Certificado de colada, composicion quimica y propiedades mecanicas del proveedor de acero.",
  },
  {
    id: 3,
    name: "Orden de compra del cliente",
    description: "Comprobante formal y condiciones de contratacion emitidas por el cliente.",
  },
  {
    id: 4,
    name: "Especificacion tecnica",
    description: "Pliegos de condiciones tecnicas, normas aplicables y requisitos del proyecto.",
  },
  {
    id: 5,
    name: "Informe de calidad y ensayos",
    description: "Reporte de ensayos dimensionales, rugosimetria, dureza y control por particulas magneticas.",
  },
  {
    id: 6,
    name: "Remito de despacho",
    description: "Documento oficial de entrega y recepcion firmado en planta receptora.",
  },
];
