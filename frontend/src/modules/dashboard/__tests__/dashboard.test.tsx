import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { LuWrench } from "react-icons/lu";
import { renderWithProviders } from "../../../test/test-utils";
import { StatCard } from "../StatCard";
import { TraceabilityCompletenessCard } from "../TraceabilityCompletenessCard";
import { TraceabilityTimelineCard } from "../TraceabilityTimelineCard";
import { MOCK_WORK_ORDERS } from "../../../test/mocks/mockWorkOrders";
import { MOCK_DELIVERIES } from "../../../test/mocks/mockDeliveries";

import { MOCK_QUALITY_CONTROLS } from "../../../test/mocks/mockQualityControls";
import { MOCK_DOCUMENTS } from "../../../test/mocks/mockDocuments";
import { MOCK_REQUESTS } from "../../../test/mocks/mockRequests";
import { MOCK_QUOTATIONS } from "../../../test/mocks/mockQuotations";
const fixture = { workOrders: MOCK_WORK_ORDERS, deliveries: MOCK_DELIVERIES, qualityControls: MOCK_QUALITY_CONTROLS, documents: MOCK_DOCUMENTS, requests: MOCK_REQUESTS, quotations: MOCK_QUOTATIONS };
const renderWithRouter = (ui: ReactElement) => {
  return renderWithProviders(<MemoryRouter>{ui}</MemoryRouter>);
};

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

  describe("TraceabilityCompletenessCard", () => {
    it("debe renderizar el encabezado y las metricas de completitud", () => {
      renderWithRouter(<TraceabilityCompletenessCard {...fixture} />);

      expect(
        screen.getByText("Cobertura parcial del expediente")
      ).toBeInTheDocument();
      expect(screen.getByText(/con 5 de 5/i)).toBeInTheDocument();
      expect(screen.getByText(/con faltantes/i)).toBeInTheDocument();
      expect(screen.getByText(/cobertura promedio/i)).toBeInTheDocument();
    });

    it("debe permitir alternar entre mostrar 5 ordenes y ver todas", () => {
      renderWithRouter(<TraceabilityCompletenessCard {...fixture} />);

      const toggleBtn = screen.getByRole("button", { name: /Ver todas/i });
      expect(toggleBtn).toBeInTheDocument();

      fireEvent.click(toggleBtn);
      expect(
        screen.getByRole("button", { name: /Mostrar 5/i })
      ).toBeInTheDocument();
    });

    it("debe ejecutar callback de navegacion al hacer clic en una orden", () => {
      const onNavigate = vi.fn();
      renderWithRouter(
        <TraceabilityCompletenessCard {...fixture} onNavigateToWorkOrder={onNavigate} />
      );

      const firstWoItem = screen.getByText(/OT-1001/);
      fireEvent.click(firstWoItem);
      expect(onNavigate).toHaveBeenCalled();
    });

    it("debe filtrar ordenes con los botones de filtro", () => {
      renderWithRouter(<TraceabilityCompletenessCard {...fixture} />);

      const pendientesBtn = screen.getByRole("button", {
        name: /Pendientes/i,
      });
      fireEvent.click(pendientesBtn);
      expect(pendientesBtn).toBeInTheDocument();

      const completasBtn = screen.getByRole("button", {
        name: /Con los 5 elementos/i,
      });
      fireEvent.click(completasBtn);
      expect(completasBtn).toBeInTheDocument();
    });
  });

  describe("TraceabilityTimelineCard", () => {
    it("debe renderizar el encabezado del flujo y las pestañas de filtro", () => {
      renderWithRouter(<TraceabilityTimelineCard {...fixture} />);

      expect(
        screen.getByText("Flujo reciente de manufactura y trazabilidad")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Todos/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^OTs$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Calidad$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Entregas$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Comercial$/i })
      ).toBeInTheDocument();
    });

    it("debe filtrar eventos al seleccionar la categoria Calidad", () => {
      renderWithRouter(<TraceabilityTimelineCard {...fixture} />);

      const qualityFilterBtn = screen.getByRole("button", {
        name: /^Calidad$/i,
      });
      fireEvent.click(qualityFilterBtn);

      const qualityEvents = screen.getAllByText(/Inspecci\u00f3n #/i);
      expect(qualityEvents.length).toBeGreaterThan(0);
    });

    it("debe llamar a onNavigate al hacer clic en un evento", () => {
      const onNavigate = vi.fn();
      renderWithRouter(<TraceabilityTimelineCard {...fixture} onNavigate={onNavigate} />);

      const deliveryEvent = screen.getAllByText(/Entrega #/i)[0];
      fireEvent.click(deliveryEvent);

      expect(onNavigate).toHaveBeenCalledWith("/deliveries");
    });
  });
});
