import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  act,
  cleanup,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../test/test-utils";
import { QualityFormModal } from "../../modules/quality/QualityFormModal";
import { DeliveryFormModal } from "../../modules/deliveries/DeliveryFormModal";
import DeliveriesPage from "../DeliveriesPage";
import QualityPage from "../QualityPage";
import { api, ApiError } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { MOCK_WORK_ORDERS } from "../../test/mocks/mockWorkOrders";
import { MOCK_DELIVERIES } from "../../test/mocks/mockDeliveries";
import { MOCK_QUALITY_CONTROLS } from "../../test/mocks/mockQualityControls";

const wo = MOCK_WORK_ORDERS[0];
function role(name: string) {
  useAuthStore.setState({
    isAuthenticated: true,
    user: {
      id: 1,
      firstName: "Test",
      lastName: "User",
      email: "test@example.test",
      role: { id: 1, name },
    },
  });
}
beforeEach(() => role("Administrador"));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
});
const ready = () =>
  waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Registrar control" }),
    ).toBeEnabled(),
  );
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

it("visual inspection saves without numbers, unit, invented actor or date", async () => {
  vi.spyOn(api, "get").mockResolvedValue([]);
  const onSave = vi.fn();
  renderWithProviders(
    <QualityFormModal
      open
      onOpenChange={vi.fn()}
      workOrders={[wo]}
      onSave={onSave}
    />,
  );
  await ready();
  change("Especificación o ensayo", "Sin fisuras. Inspección visual");
  fireEvent.click(screen.getByRole("button", { name: "Registrar control" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  expect(onSave.mock.calls[0][0]).toEqual({
    workOrderId: wo.id,
    operationId: null,
    specification: "Sin fisuras. Inspección visual",
    expectedValue: null,
    measuredValue: null,
    unit: null,
    observations: null,
  });
});

it("textual tolerance stays in specification and invalid numeric draft is retained", async () => {
  vi.spyOn(api, "get").mockResolvedValue([]);
  const onSave = vi.fn().mockRejectedValue(new ApiError("Conflicto real", 409));
  const onOpenChange = vi.fn();
  renderWithProviders(
    <QualityFormModal
      open
      onOpenChange={onOpenChange}
      workOrders={[wo]}
      onSave={onSave}
    />,
  );
  await ready();
  change("Especificación o ensayo", "Diametro 45 ± 0.01");
  change("Valor esperado", "45 ± 0.01");
  fireEvent.click(screen.getByRole("button", { name: "Registrar control" }));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Valor esperado")).toHaveValue("45 ± 0.01");
  change("Valor esperado", "45.0000");
  change("Valor medido", "-0.0001");
  fireEvent.click(screen.getByRole("button", { name: "Registrar control" }));
  expect(await screen.findByText("Conflicto real")).toBeInTheDocument();
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      specification: "Diametro 45 ± 0.01",
      measuredValue: "-0.0001",
    }),
  );
  expect(onOpenChange).not.toHaveBeenCalled();
});

it("operations from all route sheets are loaded and selection clears when changing OT", async () => {
  const get = vi.spyOn(api, "get").mockImplementation(async (path) => {
    if (path === "/route-sheets/work-order/1") return [{ id: 7 }, { id: 8 }];
    if (path === "/operations/route-sheet/7")
      return [{ id: 70, name: "Torneado", operationNumber: "OP-001" }];
    if (path === "/operations/route-sheet/8")
      return [{ id: 80, name: "Rectificado", operationNumber: "OP-002" }];
    return [];
  });
  renderWithProviders(
    <QualityFormModal
      open
      onOpenChange={vi.fn()}
      workOrders={MOCK_WORK_ORDERS.slice(0, 2)}
      onSave={vi.fn()}
    />,
  );
  change("Orden de trabajo vinculada", "1");
  await ready();
  expect(
    screen.getByRole("option", { name: /Rectificado/ }),
  ).toBeInTheDocument();
  change("Operación vinculada", "80");
  change("Orden de trabajo vinculada", "2");
  await ready();
  expect(screen.getByLabelText("Operación vinculada")).toHaveValue("");
  expect(
    screen.queryByRole("option", { name: /Rectificado/ }),
  ).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith("/route-sheets/work-order/2");
});

it("operation source failure disables save, retry keeps the inspection draft", async () => {
  const get = vi
    .spyOn(api, "get")
    .mockRejectedValueOnce(new ApiError("Sin conexión", 503))
    .mockResolvedValue([]);
  renderWithProviders(
    <QualityFormModal
      open
      onOpenChange={vi.fn()}
      workOrders={[wo]}
      onSave={vi.fn()}
    />,
  );
  change("Especificación o ensayo", "Ensayo en curso");
  expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Registrar control" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Reintentar operaciones" }),
  );
  await ready();
  expect(screen.getByLabelText("Especificación o ensayo")).toHaveValue(
    "Ensayo en curso",
  );
  expect(get).toHaveBeenCalledTimes(2);
});

it("editing quality keeps original timestamp and clears optional numbers explicitly", async () => {
  vi.spyOn(api, "get").mockResolvedValue([]);
  const onSave = vi.fn(),
    performedAt = "2026-10-01T00:30:32.123Z";
  renderWithProviders(
    <QualityFormModal
      open
      onOpenChange={vi.fn()}
      control={{ ...MOCK_QUALITY_CONTROLS[0], operationId: null, performedAt }}
      workOrders={[wo]}
      onSave={onSave}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeEnabled(),
  );
  expect(screen.getByLabelText("Fecha de inspeccion")).toHaveValue(
    "2026-09-30",
  );
  change("Valor esperado", "");
  change("Valor medido", "");
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        performedAt,
        expectedValue: null,
        measuredValue: null,
      }),
    ),
  );
});

it("delivery recipient follows OT, quantity must be integer and payload omits client and actor", async () => {
  const onSave = vi.fn();
  renderWithProviders(
    <DeliveryFormModal
      open
      onOpenChange={vi.fn()}
      workOrders={MOCK_WORK_ORDERS.slice(0, 2)}
      onSave={onSave}
    />,
  );
  change("Orden de trabajo vinculada", "2");
  expect(screen.getByLabelText("Cliente destinatario")).toHaveValue(
    MOCK_WORK_ORDERS[1].client?.businessName,
  );
  expect(screen.getByLabelText("Cliente destinatario")).toHaveAttribute(
    "readonly",
  );
  change("Cantidad de piezas", "1.5");
  fireEvent.click(screen.getByRole("button", { name: "Registrar entrega" }));
  expect(onSave).not.toHaveBeenCalled();
  change("Cantidad de piezas", "2");
  change("Fecha de entrega", "2026-10-02");
  fireEvent.click(screen.getByRole("button", { name: "Registrar entrega" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  expect(onSave.mock.calls[0][0]).toEqual({
    workOrderId: 2,
    deliveryDate: "2026-10-02T12:00:00.000Z",
    quantity: 2,
    notes: null,
  });
});

it("delivery edits preserve timestamp, clear notes, and retain draft after a conflict", async () => {
  const onSave = vi
    .fn()
    .mockRejectedValue(new ApiError("Entrega en conflicto", 409));
  const delivery = {
    ...MOCK_DELIVERIES[0],
    deliveryDate: "2026-10-01T00:30:32.123Z",
  };
  renderWithProviders(
    <DeliveryFormModal
      open
      onOpenChange={vi.fn()}
      delivery={delivery}
      workOrders={MOCK_WORK_ORDERS.slice(0, 2)}
      onSave={onSave}
    />,
  );
  change("Notas de entrega", "");
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(await screen.findByText("Entrega en conflicto")).toBeInTheDocument();
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      deliveryDate: delivery.deliveryDate,
      notes: null,
    }),
  );
  expect(screen.getByLabelText("Orden de trabajo vinculada")).toBeDisabled();
});

it("administration loads delivery sources without general clients or WO requests or forbidden links", async () => {
  role("Administración");
  const get = vi
    .spyOn(api, "get")
    .mockImplementation(async (path) =>
      path === "/deliveries"
        ? [MOCK_DELIVERIES[0]]
        : path === "/deliveries/work-orders"
          ? MOCK_WORK_ORDERS
          : Promise.reject(new Error("Forbidden dependency")),
    );
  renderWithProviders(
    <MemoryRouter>
      <DeliveriesPage />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Nueva entrega" })).toBeEnabled(),
  );
  expect(get.mock.calls.map((c) => c[0]).sort()).toEqual([
    "/deliveries",
    "/deliveries/work-orders",
  ]);
  expect(
    screen.queryByRole("link", { name: "OT-1002" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Editar entrega" }),
  ).toBeInTheDocument();
});

it("quality can read deliveries without edit actions or inaccessible client links", async () => {
  role("Calidad");
  vi.spyOn(api, "get").mockImplementation(async (path) =>
    path === "/deliveries" ? [MOCK_DELIVERIES[0]] : MOCK_WORK_ORDERS,
  );
  renderWithProviders(
    <MemoryRouter>
      <DeliveriesPage />
    </MemoryRouter>,
  );
  expect(await screen.findByText("#REM-1")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Nueva entrega" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Editar entrega" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", {
      name: MOCK_WORK_ORDERS[1].client?.businessName,
    }),
  ).not.toBeInTheDocument();
});

it("inspection history has no physical deletion action", async () => {
  vi.spyOn(api, "get").mockImplementation(async (path) =>
    path === "/quality"
      ? [MOCK_QUALITY_CONTROLS[0]]
      : path === "/work-orders"
        ? MOCK_WORK_ORDERS
        : [],
  );
  renderWithProviders(
    <MemoryRouter>
      <QualityPage />
    </MemoryRouter>,
  );
  await act(async () => {});
  expect(
    await screen.findByRole("button", { name: "Editar control" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Eliminar control" }),
  ).not.toBeInTheDocument();
});
