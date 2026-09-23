import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  QUOTATION_COLUMNS,
} from "../quotationColumns";

describe("quotationColumns", () => {
  describe("formatDate", () => {
    it("debe retornar un guion cuando no se proporciona fecha", () => {
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("debe formatear una fecha ISO correctamente al formato DD/MM/AAAA", () => {
      const formatted = formatDate("2026-03-31T23:59:59Z");
      expect(formatted).toMatch(/31\/03\/2026|03\/31\/2026/);
    });
  });

  describe("formatCurrency", () => {
    it("debe formatear importes en ARS y USD", () => {
      expect(formatCurrency(2850000, "ARS")).toContain("ARS");
      expect(formatCurrency("4500.00", "USD")).toContain("USD");
      expect(formatCurrency("4500.00", "USD")).toContain("4.500,00");
    });

    it("debe devolver guion para valores nulos o invalidos", () => {
      expect(formatCurrency(undefined)).toBe("—");
      expect(formatCurrency("")).toBe("—");
      expect(formatCurrency("invalido")).toBe("—");
    });
  });

  describe("QUOTATION_COLUMNS", () => {
    it("debe definir las 7 columnas requeridas del listado", () => {
      const headers = QUOTATION_COLUMNS.map((col) => col.header);
      expect(headers).toContain("Nro. cotizacion");
      expect(headers).toContain("Cliente");
      expect(headers).toContain("Solicitud");
      expect(headers).toContain("Version");
      expect(headers).toContain("Subtotal");
      expect(headers).toContain("Moneda");
      expect(headers).toContain("Valida hasta");
    });
  });
});

