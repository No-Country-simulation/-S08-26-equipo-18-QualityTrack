import { describe, expect, it } from "vitest";
import { DELIVERY_COLUMNS, formatDate } from "../deliveryColumns";

describe("deliveries module", () => {
  describe("formatDate", () => {
    it("debe retornar un guion cuando no se proporciona fecha", () => {
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("debe formatear una fecha ISO valida al formato regional", () => {
      const formatted = formatDate("2026-02-28T14:00:00Z");
      expect(formatted).toMatch(/28\/02\/2026/);
    });
  });

  describe("DELIVERY_COLUMNS", () => {
    it("debe definir las 6 columnas del listado de entregas y remitos", () => {
      const headers = DELIVERY_COLUMNS.map((col) => col.header);
      expect(headers).toContain("Nro. remito");
      expect(headers).toContain("Orden de trabajo");
      expect(headers).toContain("Cliente destinatario");
      expect(headers).toContain("Fecha de entrega");
      expect(headers).toContain("Cantidad");
      expect(headers).toContain("Notas / transporte");
    });
  });
});
