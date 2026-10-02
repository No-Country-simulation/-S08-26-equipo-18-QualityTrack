import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import {
  act,
  cleanup,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../test/test-utils";
import { DocumentsPanel } from "../../modules/documents/DocumentsPanel";
import { DocumentUploadModal } from "../../modules/documents/DocumentUploadModal";
import WorkOrderDetailPage from "../WorkOrderDetailPage";
import { api, ApiError } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { MOCK_WORK_ORDERS } from "../../test/mocks/mockWorkOrders";
import { MOCK_DOCUMENTS } from "../../test/mocks/mockDocuments";
const wo = MOCK_WORK_ORDERS[0],
  doc = { ...MOCK_DOCUMENTS[0], downloadAvailable: true };
const config = { maxFileSize: 1024, allowedExtensions: ["pdf", "txt"] };
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
function sources() {
  return vi
    .spyOn(api, "get")
    .mockImplementation(async (path) =>
      path === "/documents/types"
        ? [{ id: 7, name: "Tipo real" }]
        : path === "/documents/config"
          ? config
          : [],
    );
}
const ready = () =>
  waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Guardar documento" }),
    ).toBeEnabled(),
  );
const choose = () => {
  fireEvent.change(screen.getByLabelText("Tipo de documento"), {
    target: { value: "7" },
  });
  fireEvent.change(screen.getByLabelText("Archivo del documento"), {
    target: {
      files: [
        new File(["%PDF-1.7\nevidence"], "plano.pdf", {
          type: "application/pdf",
        }),
      ],
    },
  });
};
it("uploads actual multipart bytes to selected commercial origin without fabricated metadata", async () => {
  sources();
  const post = vi.spyOn(api, "post").mockResolvedValue(doc),
    uploaded = vi.fn();
  renderWithProviders(
    <DocumentUploadModal
      open
      onOpenChange={vi.fn()}
      workOrder={wo}
      onUploaded={uploaded}
    />,
  );
  await ready();
  choose();
  fireEvent.change(screen.getByLabelText("Origen del documento"), {
    target: { value: "quotation" },
  });
  fireEvent.change(screen.getByLabelText("Descripción del documento"), {
    target: { value: "Certificado real" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
  await waitFor(() => expect(uploaded).toHaveBeenCalledWith(doc));
  const [path, form, options] = post.mock.calls[0];
  expect(path).toBe("/documents/upload");
  expect(form).toBeInstanceOf(FormData);
  expect([...(form as FormData).keys()].sort()).toEqual([
    "description",
    "documentTypeId",
    "file",
    "quotationId",
  ]);
  expect((form as FormData).get("quotationId")).toBe(String(wo.quotationId));
  expect((form as FormData).get("file")).toBeInstanceOf(File);
  expect(options).toEqual({ headers: { "Content-Type": null } });
});
it("validation and server conflict preserve chosen file and description and prevent duplicate upload", async () => {
  sources();
  const post = vi
      .spyOn(api, "post")
      .mockRejectedValue(new ApiError("Origen en conflicto", 409)),
    close = vi.fn();
  renderWithProviders(
    <DocumentUploadModal
      open
      onOpenChange={close}
      workOrder={wo}
      onUploaded={vi.fn()}
    />,
  );
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
  expect(
    await screen.findByText("Seleccioná un archivo no vacío."),
  ).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  choose();
  fireEvent.change(screen.getByLabelText("Descripción del documento"), {
    target: { value: "Conservar borrador" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
  expect(await screen.findByText("Origen en conflicto")).toBeInTheDocument();
  expect(screen.getByLabelText("Descripción del documento")).toHaveValue(
    "Conservar borrador",
  );
  expect(
    (screen.getByLabelText("Archivo del documento") as HTMLInputElement)
      .files?.[0].name,
  ).toBe("plano.pdf");
  expect(close).not.toHaveBeenCalled();
});
it("upload respects server size and extension configuration", async () => {
  sources();
  const post = vi.spyOn(api, "post");
  renderWithProviders(
    <DocumentUploadModal
      open
      onOpenChange={vi.fn()}
      workOrder={wo}
      onUploaded={vi.fn()}
    />,
  );
  await ready();
  choose();
  fireEvent.change(screen.getByLabelText("Archivo del documento"), {
    target: { files: [new File(["x".repeat(1025)], "large.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
  expect(
    await screen.findByText("El archivo supera el tamaño permitido."),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Archivo del documento"), {
    target: { files: [new File(["small"], "script.exe")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
  expect(
    await screen.findByText("El formato no está permitido."),
  ).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});
it("configuration failure blocks upload and retry retains the draft", async () => {
  const get = sources();
  get.mockRejectedValueOnce(new ApiError("No se cargaron tipos", 503));
  renderWithProviders(
    <DocumentUploadModal
      open
      onOpenChange={vi.fn()}
      workOrder={wo}
      onUploaded={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Descripción del documento"), {
    target: { value: "No perder" },
  });
  expect(await screen.findByText("No se cargaron tipos")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Guardar documento" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Reintentar configuración" }),
  );
  await ready();
  expect(screen.getByLabelText("Descripción del documento")).toHaveValue(
    "No perder",
  );
});
it("download uses the authenticated blob endpoint and creates a browser download with the real filename", async () => {
  const blob = new Blob(["real-file"], { type: "application/pdf" });
  const get = vi
    .spyOn(api, "get")
    .mockImplementation(async (path) =>
      path.endsWith("/download") ? blob : [doc],
    );
  const url = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test"),
    click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  renderWithProviders(<DocumentsPanel workOrder={wo} />);
  fireEvent.click(
    await screen.findByRole("button", { name: `Descargar ${doc.fileName}` }),
  );
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(url).toHaveBeenCalledWith(blob);
  expect(get).toHaveBeenCalledWith(`/documents/${doc.id}/download`, {
    responseType: "blob",
  });
  expect(click.mock.instances[0]).toHaveAttribute("download", doc.fileName);
});
it("download failure is visible and leaves the evidence list intact", async () => {
  vi.spyOn(api, "get").mockImplementation(async (path) => {
    if (path.endsWith("/download"))
      throw new ApiError("Archivo no disponible", 404);
    return [doc];
  });
  renderWithProviders(<DocumentsPanel workOrder={wo} />);
  fireEvent.click(
    await screen.findByRole("button", { name: `Descargar ${doc.fileName}` }),
  );
  expect(
    await screen.findByText(
      "El servicio o registro solicitado no está disponible.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText(doc.fileName)).toBeInTheDocument();
});
it("quality reads source files but cannot upload; legacy missing files have no fake download", async () => {
  role("Calidad");
  vi.spyOn(api, "get").mockResolvedValue([
    {
      ...doc,
      downloadAvailable: false,
      workOrderId: null,
      requestId: wo.requestId,
    },
  ]);
  renderWithProviders(<DocumentsPanel workOrder={wo} />);
  expect(await screen.findByText(doc.fileName)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Adjuntar documento" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: `Descargar ${doc.fileName}` }),
  ).toBeDisabled();
  expect(
    screen.getByText("Archivo histórico no disponible"),
  ).toBeInTheDocument();
});
it("documents distinguish a section error from an empty result and retry clears old data", async () => {
  const get = vi
    .spyOn(api, "get")
    .mockRejectedValueOnce(new ApiError("Sección no disponible", 503))
    .mockResolvedValue([]);
  renderWithProviders(<DocumentsPanel workOrder={wo} />);
  expect(await screen.findByText("Sección no disponible")).toBeInTheDocument();
  expect(
    screen.queryByText("No hay documentos asociados a este expediente."),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Reintentar documentos" }),
  );
  expect(
    await screen.findByText("No hay documentos asociados a este expediente."),
  ).toBeInTheDocument();
  expect(get).toHaveBeenCalledTimes(2);
});
function Nav() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/work-orders/2")}>Ir a B</button>
      <button onClick={() => navigate("/work-orders/404")}>
        Ir a inexistente
      </button>
    </>
  );
}
function detail() {
  return renderWithProviders(
    <MemoryRouter initialEntries={["/work-orders/1"]}>
      <Nav />
      <Routes>
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
it("detail switches from populated A to empty B without retaining related evidence, then clears it for 404", async () => {
  const a = { ...wo, id: 1, title: "Orden A" },
    b = {
      ...MOCK_WORK_ORDERS[1],
      id: 2,
      title: "Orden B",
      quotationId: null,
      quotation: null,
      requestId: null,
      request: null,
      clientId: null,
      client: null,
    };
  vi.spyOn(api, "get").mockImplementation(async (path) => {
    if (path === "/work-orders/1") return a;
    if (path === "/work-orders/2") return b;
    if (path === "/work-orders/404") throw new ApiError("OT inexistente", 404);
    if (path === "/documents/work-order/1") return [doc];
    if (path === "/quality/work-order/1")
      return [{ id: 99, workOrderId: 1, specification: "Ensayo exclusivo A" }];
    if (path.startsWith("/approvals/")) return null;
    return [];
  });
  detail();
  expect(await screen.findByText(doc.fileName)).toBeInTheDocument();
  expect(screen.getByText("Ensayo exclusivo A")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ir a B" }));
  expect(await screen.findByText("Orden B")).toBeInTheDocument();
  await screen.findByText("No hay documentos asociados a este expediente.");
  expect(screen.queryByText(doc.fileName)).not.toBeInTheDocument();
  expect(screen.queryByText("Ensayo exclusivo A")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ir a inexistente" }));
  expect(
    await screen.findByText("Orden de trabajo no encontrada"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Orden B")).not.toBeInTheDocument();
});
it("late responses from A cannot replace B and production never requests forbidden deliveries", async () => {
  role("Producción");
  let resolveA!: (value: unknown) => void;
  const late = new Promise((r) => {
    resolveA = r;
  });
  const get = vi.spyOn(api, "get").mockImplementation(async (path) => {
    if (path === "/work-orders/1") return { ...wo, title: "Orden A" };
    if (path === "/work-orders/2")
      return { ...MOCK_WORK_ORDERS[1], title: "Orden B" };
    if (path === "/quality/work-order/1") return late;
    if (path.startsWith("/approvals/")) return null;
    return [];
  });
  detail();
  await waitFor(() =>
    expect(get).toHaveBeenCalledWith("/quality/work-order/1"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Ir a B" }));
  expect(await screen.findByText("Orden B")).toBeInTheDocument();
  await act(async () =>
    resolveA([{ id: 8, workOrderId: 1, specification: "Respuesta tardía A" }]),
  );
  expect(screen.queryByText("Respuesta tardía A")).not.toBeInTheDocument();
  expect(get.mock.calls.some((c) => c[0].startsWith("/deliveries/"))).toBe(
    false,
  );
});
it("late document responses for A are ignored after the panel changes to B", async () => {
  let resolveA!: (value: unknown) => void;
  const late = new Promise((r) => {
    resolveA = r;
  });
  vi.spyOn(api, "get").mockImplementation(async (path) =>
    path === "/documents/work-order/1" ? late : [],
  );
  const view = renderWithProviders(<DocumentsPanel workOrder={wo} />);
  view.rerender(<DocumentsPanel workOrder={MOCK_WORK_ORDERS[1]} />);
  await screen.findByText("No hay documentos asociados a este expediente.");
  await act(async () => resolveA([doc]));
  expect(screen.queryByText(doc.fileName)).not.toBeInTheDocument();
});
