import { describe, expect, it } from "vitest";
import { WORK_ORDER_STATUS_CONFIG } from "../StatusBadge";
import { WORK_ORDER_PRIORITY_CONFIG } from "../PriorityBadge";
import { formatDate, WORK_ORDER_COLUMNS } from "../workOrderColumns";

describe("workOrders module", () => {
  describe("formatDate", () => {
    it("debe retornar un guion cuando la fecha es indefinida o vacia", () => {
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("debe formatear una fecha ISO valida", () => {
      const formatted = formatDate("2026-03-15T08:00:00Z");
      expect(formatted).toMatch(/15\/03\/2026|03\/15\/2026/);
    });
  });

  describe("WORK_ORDER_COLUMNS", () => {
    it("debe definir las 6 columnas del listado", () => {
      const headers = WORK_ORDER_COLUMNS.map((col) => col.header);
      expect(headers).toContain("Nro. OT");
      expect(headers).toContain("Titulo");
      expect(headers).toContain("Prioridad");
      expect(headers).toContain("Estado");
      expect(headers).toContain("Inicio planificado");
      expect(headers).toContain("Fin planificado");
    });
  });

  describe("WORK_ORDER_STATUS_CONFIG", () => {
    it("debe tener configuraciones en sentence case para todos los estados", () => {
      expect(WORK_ORDER_STATUS_CONFIG.PENDING.label).toBe("Pendiente");
      expect(WORK_ORDER_STATUS_CONFIG.APPROVED.label).toBe("Aprobada");
      expect(WORK_ORDER_STATUS_CONFIG.IN_PROGRESS.label).toBe("En progreso");
      expect(WORK_ORDER_STATUS_CONFIG.COMPLETED.label).toBe("Completada");
      expect(WORK_ORDER_STATUS_CONFIG.CANCELLED.label).toBe("Cancelada");
    });
  });

  describe("WORK_ORDER_PRIORITY_CONFIG", () => {
    it("debe tener configuraciones en sentence case para todas las prioridades", () => {
      expect(WORK_ORDER_PRIORITY_CONFIG.LOW.label).toBe("Baja");
      expect(WORK_ORDER_PRIORITY_CONFIG.MEDIUM.label).toBe("Media");
      expect(WORK_ORDER_PRIORITY_CONFIG.HIGH.label).toBe("Alta");
      expect(WORK_ORDER_PRIORITY_CONFIG.URGENT.label).toBe("Urgente");
    });
  });
});

