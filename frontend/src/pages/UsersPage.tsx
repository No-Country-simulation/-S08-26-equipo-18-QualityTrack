import { useCallback, useEffect, useState } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Can } from "../components/Can";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { UserFormModal } from "../modules/users/UserFormModal";
import { ApiError } from "../services/api";
import { userService } from "../services/userService";
import type { CreateUserDto } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import type { AuthUser, Role } from "../types/auth";

type UserRow = AuthUser & Record<string, unknown>;
const columns: ColumnDef<UserRow>[] = [
  { header: "Nombre", accessorKey: "firstName", sortable: true },
  { header: "Apellido", accessorKey: "lastName", sortable: true },
  { header: "Email", accessorKey: "email", sortable: true },
  { header: "Rol", cell: (user) => user.role.name },
];

export default function UsersPage() {
  const actorId = useAuthStore((state) => state.user?.id);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AuthUser | null>(null);

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

  return (
    <Box>
      <Heading mb={2}>Usuarios</Heading>
      <Text mb={4} color="gray.600">
        Administrá las cuentas y asigná los roles existentes.
      </Text>
      {notification && (
        <Box mb={4}>
          <Alert status="success" title={notification} />
        </Box>
      )}
      <DataTable<UserRow>
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRetry={load}
        searchFields={["firstName", "lastName", "email"]}
        searchPlaceholder="Buscar por nombre, apellido o email..."
        emptyTitle="No hay usuarios cargados"
        toolbarActions={
          <Can perform="users:manage">
            <Button
              disabled={loading || Boolean(error)}
              onClick={() => {
                setSelected(null);
                setNotification(null);
                setOpen(true);
              }}
            >
              Nuevo usuario
            </Button>
          </Can>
        }
        actions={(user) => (
          <Can perform="users:manage">
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
                setNotification(null);
                setOpen(true);
              }}
            >
              Cambiar rol
            </Button>
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
      />
    </Box>
  );
}
