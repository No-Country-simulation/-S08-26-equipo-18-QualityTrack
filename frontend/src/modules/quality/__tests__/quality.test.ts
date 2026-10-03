import { describe, expect, it } from "vitest";
import { formatDate, QUALITY_COLUMNS } from "../qualityColumns";

describe("quality module", () => {
  describe("formatDate", () => {
    it("debe retornar un guion cuando no se proporciona fecha", () => {
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("debe formatear una fecha ISO valida al formato regional", () => {
      const formatted = formatDate("2026-03-03T10:00:00Z");
      expect(formatted).toMatch(/03\/03\/2026|3\/3\/2026/);
    });
  });

  describe("QUALITY_COLUMNS", () => {
    it("debe definir las 7 columnas del listado de calidad", () => {
      const headers = QUALITY_COLUMNS.map((col) => col.header);
      expect(headers).toContain("Nro. control");
      expect(headers).toContain("Orden de trabajo");
      expect(headers).toContain("Especificacion");
      expect(headers).toContain("Valor medido");
      expect(headers).toContain("Valor esperado");
      expect(headers).toContain("Unidad");
      expect(headers).toContain("Fecha de control");
    });
  });
});

