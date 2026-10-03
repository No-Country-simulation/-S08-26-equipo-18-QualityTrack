import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../test/test-utils";
import { ProductionPanel } from "../../modules/production/ProductionPanel";
import { api, ApiError } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { MOCK_WORK_ORDERS } from "../../test/mocks/mockWorkOrders";
import type { WorkOrder } from "../../services/workOrderService";

const wo: WorkOrder = {
  ...MOCK_WORK_ORDERS[0],
  id: 1,
  quotationId: 2,
  status: "APPROVED",
};
const person = {
  id: 20,
  firstName: "Ana",
  lastName: "Real",
  role: "Producción",
  isActive: true,
};
const material = {
  id: 7,
  materialCode: "MAT-REAL",
  name: "Acero real",
  specification: "ASTM",
  manufacturer: "Fabricante",
};
const sheet = {
  id: 3,
  workOrderId: 1,
  routeNumber: "HR-000003",
  instructions: "Plano real",
  createdAt: "2026-10-01T10:00:00Z",
};
const operation = {
  id: 4,
  routeSheetId: 3,
  operationNumber: "OP-001",
  name: "Torneado real",
  actualStart: null,
  actualEnd: null,
};

it('editar una partida conserva la precisión de una fecha sin cambios y limpia opcionales explícitamente', async () => {
  const receivedAt='2026-10-01T10:00:32.123Z';
  const assignment={id:9,workOrderId:1,materialId:7,material,materialName:material.name,quantity:'2.50',unit:'kg',lotNumber:'LOTE',receivedAt};
  fixtures({'/work-orders/1/materials':[assignment]});
  const put=vi.spyOn(api,'put').mockRejectedValue(new ApiError('Reintentar',409));
  renderWithProviders(<ProductionPanel workOrder={wo} onOrderChanged={vi.fn()}/>);
  await ready();await click('Editar partida LOTE');
  await waitFor(()=>expect(screen.getByRole('button',{name:'Guardar'})).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Unidad'),{target:{value:''}});
  await submit();
  expect(put).toHaveBeenCalledWith('/work-order-materials/9',expect.objectContaining({receivedAt,unit:null}));
  expect(screen.getByLabelText('Material del catálogo')).toBeDisabled();
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
function fixtures(extra: Record<string, unknown> = {}) {
  return vi.spyOn(api, "get").mockImplementation(async function <T>(
    path: string,
  ): Promise<T> {
    return (extra[path] ??
      (path === "/materials"
        ? [material]
        : path === "/work-order-users/available"
          ? [person]
          : [])) as T;
  });
}
async function click(name: string) {
  await act(async () =>
    fireEvent.click(await screen.findByRole("button", { name })),
  );
}
async function submit() {
  await act(async () =>
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Guardar" })
        .closest('[role="dialog"]')!
        .querySelector("form")!,
    ),
  );
}
async function ready() {
  await waitFor(() =>
    expect(screen.queryByText("Cargando producción…")).not.toBeInTheDocument(),
  );
}

it("asigna un material del catálogo por ID y conserva el lote escrito ante un error de API", async () => {
  fixtures();
  const post = vi
    .spyOn(api, "post")
    .mockRejectedValue(new ApiError("No se guardó la partida", 409));
  renderWithProviders(
    <ProductionPanel workOrder={wo} onOrderChanged={vi.fn()} />,
  );
  await ready();
  await click("Asignar material");
  await waitFor(() =>
    expect(
      screen.getByRole("option", { name: "MAT-REAL · Acero real" }),
    ).toBeInTheDocument(),
  );
  fireEvent.change(screen.getByLabelText("Material del catálogo"), {
    target: { value: "7" },
  });
  fireEvent.change(screen.getByLabelText("Cantidad"), {
    target: { value: "2.50" },
  });
  fireEvent.change(screen.getByLabelText("Lote"), {
    target: { value: "LOT-REAL" },
  });
  await submit();
  expect(
    await screen.findByText("No se guardó la partida"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Lote")).toHaveValue("LOT-REAL");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith("/work-order-materials", {
    workOrderId: 1,
    materialId: 7,
    quantity: "2.50",
    lotNumber: "LOT-REAL",
    unit: null,
    certificateNumber: null,
    receivedAt: null,
    notes: null,
  });
  expect(screen.queryByLabelText("Origen / Proveedor")).not.toBeInTheDocument();
  expect(screen.queryByText("Cambios guardados.")).not.toBeInTheDocument();
});
it("el catálogo requiere código y no crea un material implícitamente al asignar una partida", async () => {
  fixtures({ "/materials": [] });
  const post = vi.spyOn(api, "post").mockResolvedValue(material);
  renderWithProviders(
    <ProductionPanel workOrder={wo} onOrderChanged={vi.fn()} />,
  );
  await ready();
  await click("Crear material en catálogo");
  expect(screen.getByLabelText("Código de material")).toBeRequired();
  fireEvent.change(screen.getByLabelText("Código de material"), {
    target: { value: "MAT-REAL" },
  });
  fireEvent.change(screen.getByLabelText("Nombre del material"), {
    target: { value: "Acero real" },
  });
  await submit();
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(post).toHaveBeenCalledWith("/materials", {
    materialCode: "MAT-REAL",
    name: "Acero real",
    specification: null,
    manufacturer: null,
  });
});
it("Supervisor asigna usuarios reales sin acceder a la administración de cuentas ni enviar rol o turno", async () => {
  useAuthStore.setState({
    user: {
      id: 2,
      firstName: "Test",
      lastName: "Supervisor",
      email: "s@example.test",
      role: { id: 2, name: "Supervisor" },
    },
  });
  const get = fixtures();
  const post = vi
    .spyOn(api, "post")
    .mockResolvedValue({
      id: 8,
      workOrderId: 1,
      userId: 20,
      user: person,
      assignedAt: "2026-10-01T10:00:00Z",
    });
  renderWithProviders(
    <ProductionPanel workOrder={wo} onOrderChanged={vi.fn()} />,
  );
  await ready();
  await click("Asignar personal");
  await screen.findByRole("option", { name: "Ana Real · Producción" });
  fireEvent.change(screen.getByLabelText("Usuario activo"), {
    target: { value: "20" },
  });
  await submit();
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(post).toHaveBeenCalledWith("/work-order-users", {
    workOrderId: 1,
    userId: 20,
  });
  expect(get).not.toHaveBeenCalledWith("/users");
  expect(screen.queryByLabelText("Turno asignado")).not.toBeInTheDocument();
});
it("todas las hojas son consultables y la operación se crea en la hoja seleccionada sin número ni fechas reales", async () => {
  const get = fixtures({
    "/route-sheets/work-order/1": [
      sheet,
      {
        ...sheet,
        id: 5,
        routeNumber: "HR-000005",
        instructions: "Segunda hoja",
      },
    ],
    "/operations/route-sheet/3": [operation],
    "/operations/route-sheet/5": [
      { ...operation, id: 6, routeSheetId: 5, name: "Rectificado real" },
    ],
  });
  const post = vi
    .spyOn(api, "post")
    .mockRejectedValue(new ApiError("No se pudo crear la operación", 400));
  renderWithProviders(
    <ProductionPanel workOrder={wo} onOrderChanged={vi.fn()} />,
  );
  await ready();
  expect(screen.getByText("OP-001 · Torneado real")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Hoja de ruta"), {
    target: { value: "5" },
  });
  expect(screen.getByText("OP-001 · Rectificado real")).toBeInTheDocument();
  expect(screen.queryByText("OP-001 · Torneado real")).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith("/operations/route-sheet/3");
  expect(get).toHaveBeenCalledWith("/operations/route-sheet/5");
  await click("Agregar operación");
  fireEvent.change(screen.getByLabelText("Nombre de la operación"), {
    target: { value: "Pulido" },
  });
  await submit();
  expect(
    await screen.findByText("No se pudo crear la operación"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Nombre de la operación")).toHaveValue("Pulido");
  expect(post).toHaveBeenCalledWith("/operations", {
    routeSheetId: 5,
    name: "Pulido",
    description: null,
    machine: null,
    plannedStart: null,
    plannedEnd: null,
    notes: null,
  });
});
it("Producción registra avance con una única escritura pendiente y consulta el estado real de la OT", async () => {
  useAuthStore.setState({
    user: {
      id: 20,
      firstName: "Ana",
      lastName: "Real",
      email: "p@example.test",
      role: { id: 3, name: "Producción" },
    },
  });
  fixtures({
    "/route-sheets/work-order/1": [sheet],
    "/operations/route-sheet/3": [operation],
    "/work-orders/1": { ...wo, status: "IN_PROGRESS" },
  });
  let resolve!: (value: unknown) => void;
  const patch = vi.spyOn(api, "patch").mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const changed = vi.fn();
  renderWithProviders(
    <ProductionPanel workOrder={wo} onOrderChanged={changed} />,
  );
  await ready();
  expect(
    screen.queryByRole("button", { name: "Crear hoja de ruta" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Asignar personal" }),
  ).not.toBeInTheDocument();
  await click("Registrar ejecución OP-001");
  fireEvent.change(screen.getByLabelText("Inicio real"), {
    target: { value: "2026-10-01T10:00" },
  });
  await submit();
  await act(async () =>
    fireEvent.submit(document.getElementById("production-form")!),
  );
  expect(patch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  await act(async () =>
    resolve({ ...operation, actualStart: "2026-10-01T13:00:00Z" }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ status: "IN_PROGRESS" }),
  );
  expect(patch).toHaveBeenCalledWith("/operations/4/execution", {
    actualStart: new Date("2026-10-01T10:00").toISOString(),
  });
});
it("una baja de asignación conserva la persona y su historial en la ficha", async () => {
  const assignment = {
    id: 8,
    workOrderId: 1,
    userId: 20,
    user: person,
    assignedAt: "2026-10-01T10:00:00Z",
    assignedBy: { ...person, id: 1, firstName: "Responsable" },
  };
  fixtures({ "/work-orders/1/users": [assignment] });
  const patch = vi
    .spyOn(api, "patch")
    .mockResolvedValue({
      ...assignment,
      unassignedAt: "2026-10-02T10:00:00Z",
      unassignedBy: assignment.assignedBy,
    });
  renderWithProviders(
    <ProductionPanel workOrder={wo} onOrderChanged={vi.fn()} />,
  );
  await ready();
  await click("Quitar asignación de Ana Real");
  expect(
    await screen.findByText("Asignación finalizada; el historial se conserva."),
  ).toBeInTheDocument();
  expect(screen.getByText("Ana Real · Producción")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Quitar asignación de Ana Real" }),
  ).not.toBeInTheDocument();
  expect(patch).toHaveBeenCalledWith("/work-order-users/8/unassign", {});
});
it("una respuesta tardía de materiales de A no aparece en la OT B vacía", async () => {
  let resolve!: (value: unknown) => void;
  vi.spyOn(api, "get").mockImplementation(async function <T>(
    path: string,
  ): Promise<T> {
    if (path === "/work-orders/1/materials")
      return new Promise<unknown>((r) => {
        resolve = r;
      }) as Promise<T>;
    return [] as T;
  });
  const view = renderWithProviders(
    <ProductionPanel key={1} workOrder={wo} onOrderChanged={vi.fn()} />,
  );
  view.rerender(
    <ProductionPanel
      key={2}
      workOrder={{ ...wo, id: 2 }}
      onOrderChanged={vi.fn()}
    />,
  );
  await ready();
  await act(async () =>
    resolve([
      {
        id: 9,
        workOrderId: 1,
        materialId: 7,
        material,
        materialName: "Partida de otra OT",
        quantity: "2.50",
      },
    ]),
  );
  expect(screen.queryByText("Partida de otra OT")).not.toBeInTheDocument();
  expect(screen.getByText("No hay materiales asignados.")).toBeInTheDocument();
});
