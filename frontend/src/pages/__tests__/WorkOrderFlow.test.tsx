import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  act,
  cleanup,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "../../test/test-utils";
import WorkOrdersPage from "../WorkOrdersPage";
import WorkOrderDetailPage from "../WorkOrderDetailPage";
import { WorkOrderFormModal } from "../../modules/workOrders/WorkOrderFormModal";
import { MOCK_CLIENTS } from "../../test/mocks/mockClients";
import { MOCK_REQUESTS } from "../../test/mocks/mockRequests";
import { MOCK_QUOTATIONS } from "../../test/mocks/mockQuotations";
import { MOCK_WORK_ORDERS } from "../../test/mocks/mockWorkOrders";
import { api, ApiError } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
const client = { ...MOCK_CLIENTS[0], isActive: true };
const request = { ...MOCK_REQUESTS[0], clientId: client.id, client };
const quote = {
  ...MOCK_QUOTATIONS[0],
  clientId: client.id,
  client,
  requestId: request.id,
  request,
  decisionStatus: "accepted" as const,
};
const wo = {
  ...MOCK_WORK_ORDERS[0],
  status: "PENDING" as const,
  clientId: client.id,
  client,
  requestId: request.id,
  request,
  quotationId: quote.id,
  quotation: quote,
};
const click = async (element: HTMLElement) =>
  act(async () => {
    fireEvent.click(element);
  });
beforeEach(() =>
  useAuthStore.setState({
    isAuthenticated: true,
    user: {
      id: 1,
      firstName: "Test",
      lastName: "Admin",
      email: "admin@example.test",
      role: { id: 1, name: "Administrador" },
    },
  }),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
});

it("alta desde el listado carga ofertas reales elegibles y envía solamente la cotización y campos editables", async () => {
  vi.spyOn(api, "get").mockImplementation(async function fixture<T>(
    url: string,
  ): Promise<T> {
    return (
      url === "/work-orders"
        ? []
        : url === "/quotations"
          ? [
              quote,
              {
                ...quote,
                id: 98,
                quotationNumber: "Pendiente",
                decisionStatus: "pending",
              },
              {
                ...quote,
                id: 99,
                quotationNumber: "Inactiva",
                client: { ...client, isActive: false },
              },
              {
                ...quote,
                id: 100,
                quotationNumber: "Mezclada",
                request: { ...request, clientId: 999 },
              },
            ]
          : []
    ) as T;
  });
  const post = vi.spyOn(api, "post").mockResolvedValue(wo);
  renderWithProviders(
    <MemoryRouter>
      <WorkOrdersPage />
    </MemoryRouter>,
  );
  await click(
    await screen.findByRole("button", { name: "Nueva orden de trabajo" }),
  );
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /Pendiente|Inactiva|Mezclada/ }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Cotización aceptada"), {
    target: { value: String(quote.id) },
  });
  fireEvent.change(screen.getByLabelText("Título de la orden"), {
    target: { value: "Trabajo nuevo" },
  });
  fireEvent.change(screen.getByLabelText("Descripción técnica"), {
    target: { value: "Plano real" },
  });
  fireEvent.change(screen.getByLabelText("plannedStartDate"), {
    target: { value: "2026-10-02" },
  });
  fireEvent.change(screen.getByLabelText("plannedEndDate"), {
    target: { value: "2026-10-05" },
  });
  await click(screen.getByRole("button", { name: "Crear orden de trabajo" }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  expect(post.mock.calls[0][1]).toEqual({
    quotationId: quote.id,
    title: "Trabajo nuevo",
    description: "Plano real",
    priority: "MEDIUM",
    plannedStartDate: expect.any(String),
    plannedEndDate: expect.any(String),
  });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole("button", { name: "Eliminar orden de trabajo" }),
  ).not.toBeInTheDocument();
});
it("sin origen elegible explica el requisito y no permite guardar; error de fuentes conserva el listado", async () => {
  const get = vi.spyOn(api, "get").mockImplementation(async function fixture<T>(
    url: string,
  ): Promise<T> {
    return (url === "/work-orders" ? [wo] : []) as T;
  });
  renderWithProviders(
    <MemoryRouter>
      <WorkOrdersPage />
    </MemoryRouter>,
  );
  await click(
    await screen.findByRole("button", { name: "Nueva orden de trabajo" }),
  );
  expect(
    await screen.findByText("No hay cotizaciones elegibles"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Crear orden de trabajo" }),
  ).toBeDisabled();
  await click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  get.mockRejectedValueOnce(new ApiError("No se cargó el origen", 500));
  await click(screen.getByRole("button", { name: "Nueva orden de trabajo" }));
  expect(await screen.findByText("No se cargó el origen")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByText(wo.title)).toBeInTheDocument();
});
it("edición histórica conserva número y falta de origen, no exige ni envía relaciones inventadas", async () => {
  const save = vi.fn().mockRejectedValue(new ApiError("No se guardó", 500));
  renderWithProviders(
    <WorkOrderFormModal
      open
      onOpenChange={vi.fn()}
      workOrder={{
        ...wo,
        quotation: null,
        quotationId: null,
        client: null,
        clientId: null,
        request: null,
        requestId: null,
      }}
      onSave={save}
    />,
  );
  expect(
    screen.getByText("Origen: Origen histórico no documentado"),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Cotización aceptada"),
  ).not.toBeInTheDocument();
  await click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(await screen.findByText("No se guardó")).toBeInTheDocument();
  const sent = save.mock.calls[0][0];
  for (const key of [
    "workOrderNumber",
    "quotationId",
    "clientId",
    "requestId",
    "createdById",
  ])
    expect(sent).not.toHaveProperty(key);
  expect(screen.getByLabelText("Título de la orden")).toHaveValue(wo.title);
});
it("detalle deriva origen de la OT, bloquea doble decisión y actualiza el estado solo tras confirmar el servidor", async () => {
  const approval = {
    id: 8,
    workOrderId: wo.id,
    status: "PENDING",
    decidedBy: null,
    decisionAt: null,
  };
  const get = vi.spyOn(api, "get").mockImplementation(async function fixture<T>(
    url: string,
  ): Promise<T> {
    return (
      url === "/work-orders/1"
        ? { ...wo, id: 1 }
        : url.startsWith("/approvals/")
          ? approval
          : []
    ) as T;
  });
  let resolveDecision!: (value: unknown) => void;
  const put = vi.spyOn(api, "put").mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveDecision = resolve;
      }),
  );
  renderWithProviders(
    <MemoryRouter initialEntries={["/work-orders/1"]}>
      <Routes>
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await click(await screen.findByRole("button", { name: "Aprobar orden" }));
  const dialog = await screen.findByRole("dialog");
  const confirm = within(dialog).getByRole("button", {
    name: "Confirmar aprobacion",
  });
  await click(confirm);
  await click(confirm);
  expect(put).toHaveBeenCalledTimes(1);
  expect(confirm).toBeDisabled();
  expect(
    within(dialog).getByRole("button", { name: "Cancelar" }),
  ).toBeDisabled();
  expect(
    get.mock.calls.some(([url]) =>
      ["/clients", "/requests", "/quotations"].includes(String(url)),
    ),
  ).toBe(false);
  await act(async () =>
    resolveDecision({
      ...approval,
      status: "APPROVED",
      decidedBy: { id: 1, name: "Persona real" },
      decisionAt: "2026-10-02T12:00:00Z",
    }),
  );
  expect(await screen.findByText("Persona real")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Aprobar orden" })).toBeDisabled();
});
