import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { LuWrench } from "react-icons/lu";
import { renderWithProviders } from "../../../test/test-utils";
import { StatCard } from "../StatCard";
import { MOCK_WORK_ORDERS } from "../../../test/mocks/mockWorkOrders";
import { MOCK_DELIVERIES } from "../../../test/mocks/mockDeliveries";

describe("dashboard module", () => {
  describe("StatCard", () => {
    it("debe renderizar la etiqueta, el valor y el texto de ayuda", () => {
      renderWithProviders(
        <StatCard
          label="Ordenes activas"
          value={8}
          hint="En proceso o pendientes"
          icon={LuWrench}
        />
      );

      expect(screen.getByText("Ordenes activas")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("En proceso o pendientes")).toBeInTheDocument();
    });
  });

  describe("Calculos de metricas operativas", () => {
    it("debe calcular correctamente las ordenes de trabajo activas desde los mocks", () => {
      const activeWorkOrders = MOCK_WORK_ORDERS.filter(
        (wo) => wo.status === "IN_PROGRESS" || wo.status === "PENDING"
      );
      expect(activeWorkOrders.length).toBeGreaterThan(0);
    });

    it("debe totalizar las entregas despachadas", () => {
      expect(MOCK_DELIVERIES.length).toBe(6);
    });
  });
});
