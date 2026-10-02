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
import { api, ApiError } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "../../layouts/Sidebar";
import ProtectedRoute from "../../routes/guards/ProtectedRoute";
import UsersPage from "../UsersPage";
import type { AuthUser } from "../../types/auth";
import type { ManagedUser } from "../../services/userService";

const roles = [
  "Administrador",
  "Supervisor",
  "Producción",
  "Calidad",
  "Administración",
].map((name, i) => ({ id: i + 1, name }));
const admin: ManagedUser = {
  dni: null,
  isActive: true,
  id: 1,
  firstName: "Admin",
  lastName: "Account",
  email: "admin@example.test",
  role: roles[0],
};
const other: ManagedUser = {
  dni: "12345678",
  isActive: true,
  id: 2,
  firstName: "Ana",
  lastName: "Cuenta",
  email: "ana@example.test",
  role: roles[1],
};
beforeEach(() =>
  useAuthStore.setState({
    isAuthenticated: true,
    isLoading: false,
    user: admin,
  }),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
});
const click = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

function setup(users: ManagedUser[] = [admin, other]) {
  const get = vi.spyOn(api, "get").mockImplementation(async function response<
    T,
  >(endpoint: string): Promise<T> {
    return (endpoint === "/users" ? users : roles) as T;
  });
  renderWithProviders(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
  return get;
}

async function fill() {
  await click(screen.getByRole("button", { name: "Nuevo usuario" }));
  const dialog = await screen.findByRole("dialog");
  for (const [label, value] of [
    ["Nombre", " Nueva "],
    ["Apellido", " Cuenta "],
    ["Email", " NEW@EXAMPLE.TEST "],
    ["DNI", "31.444.555"],
    ["Contraseña", " contraseña "],
  ]) {
    fireEvent.change(within(dialog).getByLabelText(label), {
      target: { value },
    });
  }
  fireEvent.change(within(dialog).getByLabelText("Rol"), {
    target: { value: "4" },
  });
  return dialog;
}

describe("Administración real de usuarios", () => {
  it("edita datos personales y exige completar el DNI pendiente sin cambiar contraseña ni rol", async () => {
    setup([admin, { ...other, dni: null }]);
    const patch = vi
      .spyOn(api, "patch")
      .mockResolvedValue({
        ...other,
        firstName: "Editada",
        email: "edited@example.test",
        dni: "31444555",
      });
    await screen.findByText("ana@example.test");
    await click(
      screen.getByRole("button", { name: `Editar datos de ${other.email}` }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Nombre")).toHaveValue(
      other.firstName,
    );
    expect(within(dialog).getByLabelText("DNI")).toHaveValue("");
    expect(
      within(dialog).queryByLabelText("Contraseña"),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Rol")).not.toBeInTheDocument();
    await click(within(dialog).getByRole("button", { name: "Guardar datos" }));
    expect(patch).not.toHaveBeenCalled();
    expect(
      screen.getByText("El DNI debe tener 7 u 8 dígitos numéricos"),
    ).toBeInTheDocument();
    for (const [label, value] of [
      ["Nombre", " Editada "],
      ["Email", " EDITED@EXAMPLE.TEST "],
      ["DNI", "31.444.555"],
    ]) {
      fireEvent.change(within(dialog).getByLabelText(label), {
        target: { value },
      });
    }
    await click(within(dialog).getByRole("button", { name: "Guardar datos" }));
    expect(patch).toHaveBeenCalledWith("/users/2", {
      firstName: "Editada",
      lastName: other.lastName,
      email: "edited@example.test",
      dni: "31444555",
    });
    expect(
      await screen.findByText("Datos del usuario actualizados."),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "31444555" })).toBeInTheDocument();
  });

  it.each([409, 500])(
    "un error al editar (%s) conserva el borrador y la fila",
    async (status) => {
      setup();
      vi.spyOn(api, "patch").mockRejectedValue(
        new ApiError("Email o DNI duplicado", status),
      );
      await screen.findByText("ana@example.test");
      await click(
        screen.getByRole("button", { name: `Editar datos de ${other.email}` }),
      );
      const dialog = await screen.findByRole("dialog");
      fireEvent.change(within(dialog).getByLabelText("Nombre"), {
        target: { value: "Borrador" },
      });
      await click(
        within(dialog).getByRole("button", { name: "Guardar datos" }),
      );
      expect(
        await screen.findByText("Email o DNI duplicado"),
      ).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Nombre")).toHaveValue("Borrador");
      expect(
        screen.queryByText("Datos del usuario actualizados."),
      ).not.toBeInTheDocument();
      await click(within(dialog).getByRole("button", { name: "Cancelar" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(
        screen.getByRole("cell", { name: other.firstName }),
      ).toBeInTheDocument();
    },
  );

  it("editar mi cuenta actualiza la identidad de la sesión sin guardar el DNI en ella", async () => {
    setup();
    vi.spyOn(api, "patch").mockResolvedValue({
      ...admin,
      firstName: "Renombrado",
      email: "renamed@example.test",
      dni: "31222333",
    });
    await screen.findByText(admin.email);
    expect(
      screen.getByRole("button", { name: `Desactivar a ${admin.email}` }),
    ).toBeDisabled();
    await click(
      screen.getByRole("button", { name: `Editar datos de ${admin.email}` }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("DNI"), {
      target: { value: "31222333" },
    });
    await click(within(dialog).getByRole("button", { name: "Guardar datos" }));
    await screen.findByText("Datos del usuario actualizados.");
    expect(useAuthStore.getState().user?.email).toBe("renamed@example.test");
    expect(Object.hasOwn(useAuthStore.getState().user!, "dni")).toBe(false);
  });

  it("desactiva con confirmación, conserva el registro y permite reactivarlo desde Inactivos", async () => {
    setup();
    const patch = vi
      .spyOn(api, "patch")
      .mockResolvedValueOnce({ ...other, isActive: false })
      .mockResolvedValueOnce(other);
    await screen.findByText(other.email);
    await click(
      screen.getByRole("button", { name: `Desactivar a ${other.email}` }),
    );
    let dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/Sus datos e historial se conservan/),
    ).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
    await click(within(dialog).getByRole("button", { name: "Desactivar" }));
    expect(patch).toHaveBeenCalledWith("/users/2/status", { isActive: false });
    await screen.findByText("Usuario desactivado. Se cerraron sus sesiones.");
    expect(
      screen.queryByRole("cell", { name: other.email }),
    ).not.toBeInTheDocument();
    await click(screen.getByRole("button", { name: "Inactivos" }));
    expect(screen.getByRole("cell", { name: other.email })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "12345678" })).toBeInTheDocument();
    await click(
      screen.getByRole("button", { name: `Reactivar a ${other.email}` }),
    );
    dialog = await screen.findByRole("dialog");
    await click(within(dialog).getByRole("button", { name: "Reactivar" }));
    expect(patch).toHaveBeenLastCalledWith("/users/2/status", {
      isActive: true,
    });
    await screen.findByText(
      "Usuario reactivado. Debe iniciar sesión nuevamente.",
    );
    await click(screen.getByRole("button", { name: "Activos" }));
    expect(screen.getByRole("cell", { name: other.email })).toBeInTheDocument();
  });

  it.each([409, 500])(
    "una baja rechazada (%s) conserva la cuenta activa y muestra el error en la confirmación",
    async (status) => {
      setup();
      const patch = vi
        .spyOn(api, "patch")
        .mockRejectedValue(new ApiError("No se pudo desactivar", status));
      await screen.findByText(other.email);
      await click(
        screen.getByRole("button", { name: `Desactivar a ${other.email}` }),
      );
      const dialog = await screen.findByRole("dialog");
      await click(within(dialog).getByRole("button", { name: "Desactivar" }));
      expect(
        await screen.findByText("No se pudo desactivar"),
      ).toBeInTheDocument();
      expect(patch).toHaveBeenCalledOnce();
      expect(
        screen.queryByText("Usuario desactivado. Se cerraron sus sesiones."),
      ).not.toBeInTheDocument();
      await click(within(dialog).getByRole("button", { name: "Cancelar" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(
        screen.getByRole("button", { name: `Desactivar a ${other.email}` }),
      ).toBeEnabled();
    },
  );

  it("rechaza DNI no numérico y protege la confirmación de doble envío", async () => {
    setup();
    await screen.findByText(other.email);
    const post = vi.spyOn(api, "post");
    let dialog = await fill();
    fireEvent.change(within(dialog).getByLabelText("DNI"), {
      target: { value: "ab31444555" },
    });
    await click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    expect(post).not.toHaveBeenCalled();
    await click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    let resolve!: (user: ManagedUser) => void;
    const patch = vi.spyOn(api, "patch").mockImplementation(
      () =>
        new Promise<ManagedUser>((done) => {
          resolve = done;
        }) as never,
    );
    await click(
      screen.getByRole("button", { name: `Desactivar a ${other.email}` }),
    );
    dialog = await screen.findByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Desactivar" });
    await click(submit);
    expect(submit).toBeDisabled();
    await click(submit);
    expect(patch).toHaveBeenCalledOnce();
    await act(async () => resolve({ ...other, isActive: false }));
    await screen.findByText("Usuario desactivado. Se cerraron sus sesiones.");
  });

  it.each([...roles.slice(1), { id: 99, name: "constructor" }])(
    "$name no ve el menú ni accede a la ruta",
    async (role) => {
      useAuthStore.setState({ user: { ...other, role } });
      const get = vi.spyOn(api, "get");
      renderWithProviders(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => {}} />
          <ProtectedRoute requiredPermission="users:view">
            <UsersPage />
          </ProtectedRoute>
        </MemoryRouter>,
      );
      expect(
        screen.queryByRole("link", { name: "Usuarios" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Acceso no autorizado")).toBeInTheDocument();
      expect(get).not.toHaveBeenCalled();
    },
  );

  it("Administrador ve el menú y la ruta", async () => {
    vi.spyOn(api, "get").mockResolvedValue([]);
    renderWithProviders(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggle={() => {}} />
        <ProtectedRoute requiredPermission="users:view">
          <UsersPage />
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute(
      "href",
      "/users",
    );
    expect(
      await screen.findByText("No hay usuarios cargados"),
    ).toBeInTheDocument();
  });

  it("muestra un error de lectura, bloquea el alta y permite reintentar", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockRejectedValue(new ApiError("Servidor no disponible", 500));
    renderWithProviders(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("Servidor no disponible"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nuevo usuario" }),
    ).toBeDisabled();
    get.mockImplementation(async function response<T>(
      endpoint: string,
    ): Promise<T> {
      return (endpoint === "/users" ? [] : roles) as T;
    });
    await click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(
      await screen.findByText("No hay usuarios cargados"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo usuario" })).toBeEnabled();
  });

  it("crea con rol existente, normaliza los datos y conserva los espacios de la contraseña", async () => {
    setup([]);
    const post = vi.spyOn(api, "post").mockResolvedValue({
      ...other,
      email: "new@example.test",
      role: roles[3],
    });
    await screen.findByText("No hay usuarios cargados");
    const dialog = await fill();
    await click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/users", {
        firstName: "Nueva",
        lastName: "Cuenta",
        email: "new@example.test",
        password: " contraseña ",
        roleId: 4,
        dni: "31444555",
      }),
    );
    expect(await screen.findByText("Usuario creado.")).toBeInTheDocument();
    expect(screen.getByText("new@example.test")).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "Nuevo usuario" }));
    expect(
      within(await screen.findByRole("dialog")).getByLabelText("Contraseña"),
    ).toHaveValue("");
  });

  it.each([403, 409, 500, 0])(
    "un alta rechazada (%s) conserva el formulario sin éxito ni filas ficticias",
    async (status) => {
      setup([]);
      const post = vi
        .spyOn(api, "post")
        .mockRejectedValue(new ApiError("Alta rechazada", status));
      await screen.findByText("No hay usuarios cargados");
      const dialog = await fill();
      await click(
        within(dialog).getByRole("button", { name: "Crear usuario" }),
      );
      expect(await screen.findByText("Alta rechazada")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Nombre")).toHaveValue(" Nueva ");
      expect(screen.queryByText("Usuario creado.")).not.toBeInTheDocument();
      expect(post).toHaveBeenCalledOnce();
    },
  );

  it("rechaza contraseñas de más de 72 bytes y un rol vacío antes de llamar a la API", async () => {
    setup([]);
    const post = vi.spyOn(api, "post");
    await screen.findByText("No hay usuarios cargados");
    const dialog = await fill();
    fireEvent.change(within(dialog).getByLabelText("Contraseña"), {
      target: { value: "é".repeat(37) },
    });
    fireEvent.change(within(dialog).getByLabelText("Rol"), {
      target: { value: "" },
    });
    await click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    expect(
      screen.getByText(/no puede superar los 72 bytes/),
    ).toBeInTheDocument();
    expect(screen.getByText("Seleccioná un rol existente")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("cambia solo el rol y no permite editar el propio", async () => {
    setup();
    const patch = vi
      .spyOn(api, "patch")
      .mockResolvedValue({ ...other, role: roles[3] });
    await screen.findByText("ana@example.test");
    expect(
      screen.getByRole("button", { name: `Cambiar rol de ${admin.email}` }),
    ).toBeDisabled();
    await click(
      screen.getByRole("button", { name: `Cambiar rol de ${other.email}` }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByLabelText("Contraseña"),
    ).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Rol"), {
      target: { value: "4" },
    });
    await click(within(dialog).getByRole("button", { name: "Guardar rol" }));
    expect(patch).toHaveBeenCalledWith("/users/2/role", { roleId: 4 });
    expect(
      await screen.findByText(
        "Rol actualizado. Se aplica a las sesiones vigentes.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Calidad")).toBeInTheDocument();
  });

  it("un cambio de rol rechazado conserva la fila y permite reintentar", async () => {
    setup();
    vi.spyOn(api, "patch").mockRejectedValue(
      new ApiError("Cambio rechazado", 409),
    );
    await screen.findByText("ana@example.test");
    await click(
      screen.getByRole("button", { name: `Cambiar rol de ${other.email}` }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Rol"), {
      target: { value: "4" },
    });
    await click(within(dialog).getByRole("button", { name: "Guardar rol" }));
    expect(await screen.findByText("Cambio rechazado")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Rol")).toHaveValue("4");
    await click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("cell", { name: "Supervisor" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Rol actualizado. Se aplica a las sesiones vigentes."),
    ).not.toBeInTheDocument();
  });

  it("bloquea el envío duplicado y limpia la contraseña al cancelar y reabrir", async () => {
    setup([]);
    let resolve!: (user: AuthUser) => void;
    const post = vi.spyOn(api, "post").mockImplementation(
      () =>
        new Promise<AuthUser>((done) => {
          resolve = done;
        }) as never,
    );
    await screen.findByText("No hay usuarios cargados");
    let dialog = await fill();
    await click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    const submit = within(dialog).getByRole("button", {
      name: "Crear usuario",
    });
    expect(submit).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
    await click(submit);
    expect(post).toHaveBeenCalledOnce();
    await act(async () => {
      resolve({ ...other, email: "new@example.test" });
    });
    await screen.findByText("Usuario creado.");
    dialog = await fill();
    await click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await click(screen.getByRole("button", { name: "Nuevo usuario" }));
    expect(
      within(await screen.findByRole("dialog")).getByLabelText("Contraseña"),
    ).toHaveValue("");
  });
});
