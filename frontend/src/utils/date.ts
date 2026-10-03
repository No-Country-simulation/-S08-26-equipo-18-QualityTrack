/**
 * Utilidades para manejo seguro de fechas y zonas horarias en QualityTrack.
 */

/**
 * Convierte una cadena de fecha a formato ISO seguro evitando desfasajes de zona horaria.
 * Si la fecha viene en formato simple "YYYY-MM-DD" (desde un input type="date"),
 * le asigna las 12:00:00 UTC para asegurar que ninguna zona horaria (UTC-11 a UTC+11)
 * cruce la medianoche al renderizarse en fecha local en el navegador del usuario.
 */
export function toDateIso(dateString?: string): string | undefined {
  if (!dateString || !dateString.trim()) {
    return undefined;
  }
  const trimmed = dateString.trim();

  // Formato YYYY-MM-DD tipico de input HTML type="date"
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`).toISOString();
  }

  // Si ya incluye tiempo o es un ISO string completo
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

/**
 * Formatea un timestamp ISO o fecha a formato legible en español argentino (DD/MM/AAAA).
 */
export function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}
