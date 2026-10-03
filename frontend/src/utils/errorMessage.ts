import { ApiError } from "../services/api";

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404)
      return "El servicio o registro solicitado no está disponible.";
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación. Intentá nuevamente.";
}
