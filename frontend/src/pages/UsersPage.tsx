import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Heading, HStack, Text } from "@chakra-ui/react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { UserFormModal } from "../modules/users/UserFormModal";
import { ApiError } from "../services/api";
import { userService } from "../services/userService";
import type {
  CreateUserDto,
  ManagedUser,
  UpdateUserDto,
} from "../services/userService";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types/auth";

type UserRow = ManagedUser & Record<string, unknown>;
const columns: ColumnDef<UserRow>[] = [
  { header: "Nombre", accessorKey: "firstName", sortable: true },
  { header: "Apellido", accessorKey: "lastName", sortable: true },
  { header: "Email", accessorKey: "email", sortable: true },
  { header: "DNI", cell: (user) => user.dni ?? "Pendiente" },
  { header: "Rol", cell: (user) => user.role.name },
  {
    header: "Estado",
    cell: (user) => (
      <Badge colorPalette={user.isActive ? "green" : "gray"}>
        {user.isActive ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
];

export default function UsersPage() {
  const actorId = useAuthStore((state) => state.user?.id);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [status, setStatus] = useState<"active" | "inactive" | "all">("active");
  const [statusCandidate, setStatusCandidate] = useState<ManagedUser | null>(
    null,
  );
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, existingRoles] = await Promise.all([
        userService.list(),
        userService.roles(),
      ]);
      setUsers(data as UserRow[]);
      setRoles(existingRoles);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar los usuarios.",
      );
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const created = async (data: CreateUserDto) => {
    const user = await userService.create(data);
    setUsers((current) => [...current, user as UserRow]);
    setNotification("Usuario creado.");
  };
  const changed = async (id: number, roleId: number) => {
    const user = await userService.changeRole(id, roleId);
    setUsers((current) =>
      current.map((row) => (row.id === id ? (user as UserRow) : row)),
    );
    setNotification("Rol actualizado. Se aplica a las sesiones vigentes.");
  };
  const updated = async (id: number, data: UpdateUserDto) => {
    const user = await userService.update(id, data);
    setUsers((current) =>
      current.map((row) => (row.id === id ? (user as UserRow) : row)),
    );
    if (id === actorId) {
      // La sesión conserva únicamente identidad/rol, sin cachear el DNI.
      useAuthStore.setState({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    }
    setNotification("Datos del usuario actualizados.");
  };
  const changeStatus = async () => {
    if (!statusCandidate || statusPending) return;
    setStatusPending(true);
    setStatusError(null);
    try {
      const user = await userService.setStatus(
        statusCandidate.id,
        !statusCandidate.isActive,
      );
      setUsers((current) =>
        current.map((row) => (row.id === user.id ? (user as UserRow) : row)),
      );
      setStatusCandidate(null);
      setNotification(
        user.isActive
          ? "Usuario reactivado. Debe iniciar sesión nuevamente."
          : "Usuario desactivado. Se cerraron sus sesiones.",
      );
    } catch (err) {
      setStatusError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cambiar el estado del usuario.",
      );
    } finally {
      setStatusPending(false);
    }
  };

  return (
    <Box>
      <Heading mb={2}>Usuarios</Heading>
      <Text mb={4} color="gray.600">
        Administrá los datos, roles y estado de las cuentas.
      </Text>
      {notification && (
        <Box mb={4}>
          <Alert status="success" title={notification} />
        </Box>
      )}
      <DataTable<UserRow>
        columns={columns}
        data={users.filter(
          (user) => status === "all" || user.isActive === (status === "active"),
        )}
        loading={loading}
        error={error}
        onRetry={load}
        searchFields={["firstName", "lastName", "email", "dni"]}
        searchPlaceholder="Buscar por nombre, apellido, email o DNI..."
        emptyTitle={
          status === "inactive"
            ? "No hay usuarios inactivos"
            : "No hay usuarios cargados"
        }
        toolbarActions={
          <HStack wrap="wrap">
            {(["active", "inactive", "all"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={status === value ? "solid" : "outline"}
                onClick={() => setStatus(value)}
              >
                {
                  { active: "Activos", inactive: "Inactivos", all: "Todos" }[
                    value
                  ]
                }
              </Button>
            ))}
            <Can perform="users:manage">
              <Button
                disabled={loading || Boolean(error)}
                onClick={() => {
                  setSelected(null);
                  setEditProfile(false);
                  setNotification(null);
                  setOpen(true);
                }}
              >
                Nuevo usuario
              </Button>
            </Can>
          </HStack>
        }
        actions={(user) => (
          <Can perform="users:manage">
            <HStack wrap="wrap">
              <Button
                size="xs"
                variant="outline"
                aria-label={`Editar datos de ${user.email}`}
                onClick={() => {
                  setSelected(user);
                  setEditProfile(true);
                  setNotification(null);
                  setOpen(true);
                }}
              >
                Editar datos
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={user.id === actorId}
                title={
                  user.id === actorId
                    ? "No podés quitarte el rol Administrador"
                    : "Cambiar rol"
                }
                aria-label={`Cambiar rol de ${user.email}`}
                onClick={() => {
                  setSelected(user);
                  setEditProfile(false);
                  setNotification(null);
                  setOpen(true);
                }}
              >
                Cambiar rol
              </Button>
              <Button
                size="xs"
                variant="outline"
                colorPalette={user.isActive ? "red" : "green"}
                disabled={user.id === actorId}
                title={
                  user.id === actorId
                    ? "No podés desactivar tu propia cuenta"
                    : undefined
                }
                aria-label={`${user.isActive ? "Desactivar" : "Reactivar"} a ${user.email}`}
                onClick={() => {
                  setStatusCandidate(user);
                  setStatusError(null);
                  setNotification(null);
                }}
              >
                {user.isActive ? "Desactivar" : "Reactivar"}
              </Button>
            </HStack>
          </Can>
        )}
      />
      <UserFormModal
        open={open}
        onOpenChange={({ open: next }) => setOpen(next)}
        roles={roles}
        user={selected}
        onCreate={created}
        onChangeRole={changed}
        editProfile={editProfile}
        onUpdate={updated}
      />
      <ConfirmDialog
        open={Boolean(statusCandidate)}
        onOpenChange={({ open: next }) => {
          if (!next && !statusPending) setStatusCandidate(null);
        }}
        title={
          statusCandidate?.isActive ? "Desactivar usuario" : "Reactivar usuario"
        }
        description={
          statusCandidate?.isActive
            ? `¿Desactivar a ${statusCandidate.firstName} ${statusCandidate.lastName}? No podrá acceder y se cerrarán todas sus sesiones. Sus datos e historial se conservan.`
            : `¿Reactivar a ${statusCandidate?.firstName} ${statusCandidate?.lastName}? Podrá iniciar sesión nuevamente; sus sesiones anteriores seguirán cerradas.`
        }
        confirmText={statusCandidate?.isActive ? "Desactivar" : "Reactivar"}
        confirmColorPalette={statusCandidate?.isActive ? "red" : "green"}
        isLoading={statusPending}
        error={statusError}
        onConfirm={() => void changeStatus()}
      />
    </Box>
  );
}
