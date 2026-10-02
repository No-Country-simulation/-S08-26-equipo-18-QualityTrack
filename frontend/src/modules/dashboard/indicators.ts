import type { Document } from "../../services/documentService";
import type { WorkOrder } from "../../services/workOrderService";
import type { Request } from "../../services/requestService";
import type { Quotation } from "../../services/quotationService";

/** Same parent rules as the OT document endpoint; explicit foreign OTs never inherit. */
export function documentsForOrder(
  order: WorkOrder,
  documents: Document[],
): Document[] {
  const quoteId = order.quotationId ?? order.quotation?.id;
  const requestId = order.requestId ?? order.request?.id;
  const unique = new Map<number, Document>();
  for (const doc of documents) {
    const related =
      doc.workOrderId === order.id ||
      (quoteId != null && doc.quotationId === quoteId) ||
      (requestId != null && doc.requestId === requestId);
    if (
      related &&
      (doc.workOrderId == null || doc.workOrderId === order.id) &&
      (doc.quotationId == null || doc.quotationId === quoteId) &&
      (doc.requestId == null || doc.requestId === requestId)
    )
      unique.set(doc.id, doc);
  }
  return [...unique.values()];
}

export function requestsWithoutQuotation(
  requests: Request[],
  quotations: Quotation[],
): number {
  const quoted = new Set(quotations.map((q) => q.requestId));
  return requests.filter((request) => !quoted.has(request.id)).length;
}
