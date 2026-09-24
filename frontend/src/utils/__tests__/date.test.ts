import { describe, expect, it } from "vitest";
import { formatDate, toDateIso } from "../date";

describe("date utils", () => {
  describe("toDateIso", () => {
    it("debe retornar undefined para valores nulos o vacios", () => {
      expect(toDateIso(undefined)).toBeUndefined();
      expect(toDateIso("")).toBeUndefined();
      expect(toDateIso("   ")).toBeUndefined();
    });

    it("debe convertir formato YYYY-MM-DD agregando mediodia UTC para evitar desfasaje", () => {
      const result = toDateIso("2026-04-10");
      expect(result).toBe("2026-04-10T12:00:00.000Z");
    });

    it("debe procesar cadenas ISO completas validas", () => {
      const fullIso = "2026-04-10T15:30:00.000Z";
      expect(toDateIso(fullIso)).toBe(fullIso);
    });

    it("debe retornar undefined para fechas invalidas", () => {
      expect(toDateIso("fecha-invalida")).toBeUndefined();
    });
  });

  describe("formatDate", () => {
    it("debe retornar raya para valores inexistentes", () => {
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("debe formatear una fecha ISO segura al formato DD/MM/AAAA en es-AR", () => {
      const iso = "2026-04-10T12:00:00.000Z";
      expect(formatDate(iso)).toBe("10/04/2026");
    });

    it("debe devolver la cadena original si la fecha no es parseable", () => {
      expect(formatDate("invalido")).toBe("invalido");
    });
  });
});
