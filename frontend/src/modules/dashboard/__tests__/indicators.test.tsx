import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
  act,
  cleanup,
} from "../../../test/test-utils";
import { api, ApiError } from "../../../services/api";
import { DashboardIndicators } from "../DashboardIndicators";
import { TraceabilityTimelineCard } from "../TraceabilityTimelineCard";
import { documentsForOrder, requestsWithoutQuotation } from "../indicators";
import { MOCK_WORK_ORDERS } from "../../../test/mocks/mockWorkOrders";
import { MOCK_REQUESTS } from "../../../test/mocks/mockRequests";
import { MOCK_QUOTATIONS } from "../../../test/mocks/mockQuotations";
import { MOCK_DOCUMENTS } from "../../../test/mocks/mockDocuments";
import { MOCK_DELIVERIES } from "../../../test/mocks/mockDeliveries";
import { MOCK_QUALITY_CONTROLS } from "../../../test/mocks/mockQualityControls";

const order = { ...MOCK_WORK_ORDERS[0], requestId: 11, quotationId: 12 };
const request = { ...MOCK_REQUESTS[0], id: 11 };
const quote = { ...MOCK_QUOTATIONS[0], id: 12, requestId: 11 };
const document = {
  ...MOCK_DOCUMENTS[0],
  id: 13,
  workOrderId: null,
  requestId: 11,
  quotationId: null,
};
const fixture: Record<string, unknown> = {
  "/work-orders": [order],
  "/requests": [request, { ...request, id: 21 }],
  "/quotations": [quote],
  "/documents": [document],
  "/quality": [{ ...MOCK_QUALITY_CONTROLS[0], workOrderId: order.id }],
  "/deliveries": [{ ...MOCK_DELIVERIES[0], workOrderId: order.id }],
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function show(roleName = "Administrador") {
  return renderWithProviders(
    <MemoryRouter>
      <DashboardIndicators roleName={roleName} />
    </MemoryRouter>,
  );
}
function success() {
  return vi.spyOn(api, "get").mockImplementation(async function response<T>(
    path: string,
  ): Promise<T> {
    if (!(path in fixture)) throw Error(`Unexpected API ${path}`);
    return fixture[path] as T;
  });
}

it("counts each source document once and excludes foreign or incoherent OT references", () => {
  const direct = {
    ...document,
    id: 14,
    workOrderId: order.id,
    requestId: null,
  };
  const shared = { ...document, id: 15, quotationId: 12 };
  const other = { ...shared, id: 16, workOrderId: 999 };
  const incoherent = { ...direct, id: 17, requestId: 999 };
  const orphan = { ...document, id: 18, requestId: null };
  expect(
    documentsForOrder(order, [
      document,
      document,
      direct,
      shared,
      other,
      incoherent,
      orphan,
    ]).map((d) => d.id),
  ).toEqual([13, 14, 15]);
  expect(
    documentsForOrder(
      {
        ...order,
        requestId: null,
        request: null,
        quotationId: null,
        quotation: null,
      },
      [direct, document, shared],
    ),
  ).toEqual([direct]);
});

it("pending quotations counts unquoted requests even with multiple rejected/accepted versions", () => {
  expect(
    requestsWithoutQuotation(
      [request, { ...request, id: 21 }],
      [quote, { ...quote, id: 22, decisionStatus: "rejected" }],
    ),
  ).toBe(1);
  expect(requestsWithoutQuotation([], [])).toBe(0);
});

it("uses real API rows and labels all five elements as partial coverage", async () => {
  success();
  show();
  expect(
    await screen.findByText("Cobertura parcial del expediente"),
  ).toBeInTheDocument();
  expect(screen.getByText("1 con 5 de 5")).toBeInTheDocument();
  expect(screen.getByText(/No evalúa aprobación interna/)).toBeInTheDocument();
  expect(
    screen.queryByText(/expedientes completos|inspeccion conforme|REM-|QC-/i),
  ).not.toBeInTheDocument();
  expect(screen.getByTitle("1 documentos adjuntos")).toBeInTheDocument();
  const pending = screen.getByText("Pendientes de cotización").parentElement!;
  expect(pending).toHaveTextContent("1");
});

it.each([
  [
    "Administrador",
    [
      "/work-orders",
      "/documents",
      "/requests",
      "/quotations",
      "/quality",
      "/deliveries",
    ],
  ],
  [
    "Supervisor",
    [
      "/work-orders",
      "/documents",
      "/requests",
      "/quotations",
      "/quality",
      "/deliveries",
    ],
  ],
  ["Calidad", ["/work-orders", "/documents", "/quality", "/deliveries"]],
  ["Producción", ["/work-orders", "/documents", "/requests", "/quality"]],
  ["Administración", ["/requests", "/quotations", "/deliveries"]],
])("only queries APIs authorized for %s", async (role, expected) => {
  const get = success();
  show(role);
  await waitFor(() =>
    expect(screen.queryByText("Cargando indicadores…")).not.toBeInTheDocument(),
  );
  expect(get.mock.calls.map((c) => c[0]).sort()).toEqual([...expected].sort());
  if (role === "Producción" || role === "Administración") {
    expect(
      screen.queryByText("Cobertura parcial del expediente"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Cobertura parcial no disponible para este rol"),
    ).toBeInTheDocument();
  }
});

it.each([400, 403, 409, 500, 0])(
  "a %s query error never becomes verified zero or full coverage and can be retried",
  async (status) => {
    const get = success();
    get.mockImplementation(async function response<T>(
      path: string,
    ): Promise<T> {
      if (path === "/deliveries" || path === "/quotations")
        throw new ApiError("Consulta rechazada", status);
      return fixture[path] as T;
    });
    show();
    expect(
      await screen.findByText("Algunos indicadores no están disponibles"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cobertura parcial no disponible"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pendientes de cotización").parentElement,
    ).toHaveTextContent("—");
    expect(
      screen.getByText("Entregas registradas").parentElement,
    ).toHaveTextContent("—");
    get.mockImplementation(async function response<T>(
      path: string,
    ): Promise<T> {
      return fixture[path] as T;
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar indicadores" }),
    );
    expect(await screen.findByText("1 con 5 de 5")).toBeInTheDocument();
  },
);

it("empty successful responses remain empty with no demonstration records", async () => {
  vi.spyOn(api, "get").mockResolvedValue([]);
  show();
  expect(await screen.findByText("No hay OT registradas.")).toBeInTheDocument();
  expect(screen.queryByText(order.title)).not.toBeInTheDocument();
  expect(
    screen.queryByText("Algunos indicadores no están disponibles"),
  ).not.toBeInTheDocument();
});

it("timeline shows the most recent records in chronological order without inventing a conformity decision", () => {
  const quality = {
    ...MOCK_QUALITY_CONTROLS[0],
    performedAt: "2026-10-02T15:00:00Z",
  };
  const delivery = {
    ...MOCK_DELIVERIES[0],
    deliveryDate: "2026-10-01T15:00:00Z",
  };
  renderWithProviders(
    <MemoryRouter>
      <TraceabilityTimelineCard
        qualityControls={[quality]}
        deliveries={[delivery]}
        limit={1}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText(`Inspección #${quality.id}`)).toBeInTheDocument();
  expect(screen.getByText(/Inspección registrada/)).toBeInTheDocument();
  expect(screen.queryByText(`Entrega #${delivery.id}`)).not.toBeInTheDocument();
  expect(screen.queryByText(/conforme/i)).not.toBeInTheDocument();
});

it("late responses from the prior role cannot restore restricted data", async () => {
  let resolve!: (rows: unknown) => void;
  const late = new Promise((r) => {
    resolve = r;
  });
  vi.spyOn(api, "get").mockImplementation(async (path) =>
    path === "/quotations" ? late : [],
  );
  const view = show();
  view.rerender(
    <MemoryRouter>
      <DashboardIndicators roleName="Calidad" />
    </MemoryRouter>,
  );
  await screen.findByText("No hay OT registradas.");
  await act(async () => resolve([quote]));
  expect(
    screen.queryByText(`Cotizacion ${quote.quotationNumber}`),
  ).not.toBeInTheDocument();
});
