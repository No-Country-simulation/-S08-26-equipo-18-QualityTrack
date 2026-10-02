import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  act,
  cleanup,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "../../test/test-utils";
import RequestsPage from "../RequestsPage";
import QuotationsPage from "../QuotationsPage";
import { QuotationFormModal } from "../../modules/quotations/QuotationFormModal";
import { RequestFormModal } from "../../modules/requests/RequestFormModal";
import { api, ApiError } from "../../services/api";
import { clientService } from "../../services/clientService";
import { MOCK_CLIENTS } from "../../test/mocks/mockClients";
import { MOCK_REQUESTS } from "../../test/mocks/mockRequests";
import { MOCK_QUOTATIONS } from "../../test/mocks/mockQuotations";
import { useAuthStore } from "../../store/authStore";

const client = { ...MOCK_CLIENTS[0], isActive: true };
const request = { ...MOCK_REQUESTS[0], clientId: client.id, client };
const quote = {
  ...MOCK_QUOTATIONS[0],
  clientId: client.id,
  client,
  requestId: request.id,
  request,
  decisionStatus: "pending" as const,
  subtotal: "20.00",
  taxAmount: "4.20",
  items: [
    {
      id: 1,
      description: "Detalle persistido",
      quantity: 2,
      unitPrice: 10,
      subtotal: 20,
      notes: "Condición original",
    },
  ],
};
const click = async (target: HTMLElement) =>
  act(async () => {
    fireEvent.click(target);
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

describe("Origen comercial y aceptación persistida", () => {
  it("Producción lee solicitudes sin consultar clientes ni ofrecer escrituras", async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        role: { id: 3, name: "Producción" },
      },
    });
    const get = vi.spyOn(api, "get").mockResolvedValue([request]);
    renderWithProviders(
      <MemoryRouter>
        <RequestsPage />
      </MemoryRouter>,
    );
    await screen.findByText(request.title);
    expect(get).toHaveBeenCalledExactlyOnceWith("/requests");
    expect(
      screen.queryByRole("button", { name: "Nueva solicitud" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar solicitud" }),
    ).not.toBeInTheDocument();
  });

  it("carga todas las páginas de clientes activos para los selectores", async () => {
    const list = vi
      .spyOn(clientService, "list")
      .mockResolvedValueOnce({
        items: [client],
        total: 101,
        page: 1,
        limit: 100,
      })
      .mockResolvedValueOnce({
        items: [{ ...client, id: 101 }],
        total: 101,
        page: 2,
        limit: 100,
      });
    const records = await clientService.listActive();
    expect(records.map((record) => record.id)).toEqual([client.id, 101]);
    expect(list).toHaveBeenNthCalledWith(1, {
      page: 1,
      limit: 100,
      status: "active",
    });
    expect(list).toHaveBeenNthCalledWith(2, {
      page: 2,
      limit: 100,
      status: "active",
    });
  });

  it("no ofrece clientes inactivos ni solicitudes ajenas y limpia el origen al cambiar cliente", async () => {
    const second = { ...client, id: 99, businessName: "Segundo cliente" };
    const third = {
      ...client,
      id: 98,
      businessName: "Cliente sin solicitudes",
    };
    const inactive = {
      ...client,
      id: 97,
      businessName: "Inactivo",
      isActive: false,
    };
    renderWithProviders(
      <QuotationFormModal
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        clients={[client, second, third, inactive]}
        requests={[
          request,
          { ...request, id: 99, clientId: 99, requestNumber: "SOL-SEGUNDA" },
        ]}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const selects = within(dialog).getAllByRole("combobox");
    expect(selects[1]).toBeDisabled();
    expect(
      within(selects[0]).queryByRole("option", { name: "Inactivo" }),
    ).not.toBeInTheDocument();
    fireEvent.change(selects[0], { target: { value: String(client.id) } });
    fireEvent.change(selects[1], { target: { value: String(request.id) } });
    fireEvent.change(selects[0], { target: { value: "99" } });
    expect(selects[1]).toHaveValue("");
    expect(
      within(selects[1]).queryByText(
        `${request.requestNumber} - ${request.title}`,
      ),
    ).not.toBeInTheDocument();
    expect(
      within(selects[1]).getByRole("option", { name: /SOL-SEGUNDA/ }),
    ).toBeInTheDocument();
    fireEvent.change(selects[0], { target: { value: "98" } });
    expect(within(selects[1]).getAllByRole("option")).toHaveLength(1);
  });

  it("envía ítems sin totales ni autor y recalcula cero al quitar el último", async () => {
    const save = vi.fn();
    renderWithProviders(
      <QuotationFormModal
        open
        onOpenChange={vi.fn()}
        onSave={save}
        clients={[client]}
        requests={[request]}
      />,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByPlaceholderText("COT-2026-006"), {
      target: { value: "COT-REAL" },
    });
    const selects = within(dialog).getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: String(client.id) } });
    fireEvent.change(selects[1], { target: { value: String(request.id) } });
    fireEvent.change(
      within(dialog).getByPlaceholderText(/Alcance del trabajo/),
      { target: { value: "Condiciones reales" } },
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText(/Descripcion del item/),
      { target: { value: "Línea exacta" } },
    );
    fireEvent.change(within(dialog).getByPlaceholderText("Cant."), {
      target: { value: "0.5" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("Precio u."), {
      target: { value: "0.01" },
    });
    await click(within(dialog).getByRole("button", { name: "Agregar" }));
    expect(within(dialog).getByLabelText("Subtotal neto")).toHaveValue(0.01);
    expect(within(dialog).getByLabelText("Subtotal neto")).toHaveAttribute(
      "readonly",
    );
    await click(within(dialog).getByRole("button", { name: "Eliminar item" }));
    expect(within(dialog).getByLabelText("Subtotal neto")).toHaveValue(0);
    await click(
      within(dialog).getByRole("button", { name: "Crear cotizacion" }),
    );
    expect(save).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Debes agregar al menos un item a la cotizacion"),
    ).toBeInTheDocument();
    fireEvent.change(
      within(dialog).getByPlaceholderText(/Descripcion del item/),
      { target: { value: "Línea final" } },
    );
    fireEvent.change(within(dialog).getByPlaceholderText("Precio u."), {
      target: { value: "10.01" },
    });
    await click(within(dialog).getByRole("button", { name: "Agregar" }));
    await click(
      within(dialog).getByRole("button", { name: "Crear cotizacion" }),
    );
    expect(save).toHaveBeenCalledOnce();
    const data = save.mock.calls[0][0];
    expect(data.validUntil).toBeNull();
    expect(data.items).toEqual([
      {
        description: "Línea final",
        quantity: 1,
        unitPrice: 10.01,
        notes: null,
      },
    ]);
    for (const field of [
      "subtotal",
      "taxAmount",
      "createdById",
      "decisionStatus",
    ])
      expect(data).not.toHaveProperty(field);
  });

  it("rechaza cantidades con exponentes, demasiados decimales y versiones fraccionarias", async () => {
    const save = vi.fn();
    renderWithProviders(
      <QuotationFormModal
        open
        onOpenChange={vi.fn()}
        onSave={save}
        clients={[client]}
        requests={[request]}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Descripcion del item/), {
      target: { value: "Ítem" },
    });
    fireEvent.change(screen.getByPlaceholderText("Precio u."), {
      target: { value: "1.001" },
    });
    await click(screen.getByRole("button", { name: "Agregar" }));
    expect(
      await screen.findByText(/requieren valores sin exponentes/),
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it("guardar una solicitud bloquea doble envío y cierre y conserva campos si falla", async () => {
    let reject!: (error: Error) => void;
    const save = vi.fn(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    const close = vi.fn();
    renderWithProviders(
      <RequestFormModal
        open
        request={request}
        clients={[client]}
        onSave={save}
        onOpenChange={close}
      />,
    );
    const button = screen.getByRole("button", { name: "Guardar cambios" });
    await click(button);
    await click(button);
    expect(save).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    const closeTrigger = screen
      .getByRole("dialog")
      .querySelector('[data-part="close-trigger"]');
    if (closeTrigger) await click(closeTrigger as HTMLElement);
    expect(close).not.toHaveBeenCalled();
    await act(async () => reject(new ApiError("No guardado", 409)));
    expect(await screen.findByText("No guardado")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: Fabricacion/)).toHaveValue(
      request.title,
    );
  });

  it.each(["accepted", "rejected"] as const)(
    "registra %s con confirmación y conserva el estado ante error",
    async (status) => {
      vi.spyOn(api, "get").mockImplementation(async function fixtures<T>(
        endpoint: string,
      ): Promise<T> {
        return (
          endpoint === "/clients"
            ? { items: [client], total: 1, limit: 100, page: 1 }
            : endpoint === "/requests"
              ? [request]
              : [quote]
        ) as T;
      });
      const patch = vi
        .spyOn(api, "patch")
        .mockRejectedValueOnce(new ApiError("Decisión no guardada", 500))
        .mockResolvedValueOnce({
          ...quote,
          decisionStatus: status,
          decidedById: 1,
          decidedBy: { id: 1, firstName: "Test", lastName: "Admin" },
          decidedAt: "2026-10-02T15:00:00.000Z",
        });
      renderWithProviders(
        <MemoryRouter>
          <QuotationsPage />
        </MemoryRouter>,
      );
      const action = await screen.findByRole("button", {
        name: `${status === "accepted" ? "Registrar aceptación" : "Registrar rechazo"} de ${quote.quotationNumber}`,
      });
      expect(
        screen.queryByRole("button", { name: "Eliminar cotizacion" }),
      ).not.toBeInTheDocument();
      await click(action);
      expect(patch).not.toHaveBeenCalled();
      await click(screen.getByRole("button", { name: "Registrar decisión" }));
      expect(
        await screen.findByText("Decisión no guardada"),
      ).toBeInTheDocument();
      expect(screen.getByText("Pendiente")).toBeInTheDocument();
      await click(screen.getByRole("button", { name: "Registrar decisión" }));
      await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
      expect(patch).toHaveBeenLastCalledWith(
        `/quotations/${quote.id}/decision`,
        { status },
      );
      expect(
        await screen.findByText(
          status === "accepted" ? "Aceptada" : "Rechazada",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Editar cotizacion" }),
      ).toBeDisabled();
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await click(
        screen.getByRole("button", {
          name: `Ver detalle de ${quote.quotationNumber}`,
        }),
      );
      const detail = await screen.findByRole("dialog");
      expect(
        within(detail).getByLabelText("Descripcion de la cotizacion"),
      ).toHaveAttribute("readonly");
      expect(
        within(detail).getByText("Condición original"),
      ).toBeInTheDocument();
      expect(
        within(detail).queryByRole("button", { name: "Agregar" }),
      ).not.toBeInTheDocument();
      expect(
        within(detail).queryByRole("button", { name: "Guardar cambios" }),
      ).not.toBeInTheDocument();
    },
  );

  it("Administración puede crear cotizaciones pero no registra decisiones", async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        role: { id: 2, name: "Administración" },
      },
    });
    vi.spyOn(api, "get").mockImplementation(async function fixtures<T>(
      endpoint: string,
    ): Promise<T> {
      return (
        endpoint === "/clients"
          ? { items: [client], total: 1, limit: 100, page: 1 }
          : endpoint === "/requests"
            ? [request]
            : [quote]
      ) as T;
    });
    renderWithProviders(
      <MemoryRouter>
        <QuotationsPage />
      </MemoryRouter>,
    );
    await screen.findByText(quote.quotationNumber);
    expect(
      screen.getByRole("button", { name: "Nueva cotizacion" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /Registrar aceptación/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar rechazo/ }),
    ).not.toBeInTheDocument();
  });
});
