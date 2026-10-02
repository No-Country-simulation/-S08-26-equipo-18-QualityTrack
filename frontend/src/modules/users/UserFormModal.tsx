import { useEffect } from "react";
import { HStack, Text, VStack } from "@chakra-ui/react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { useForm } from "../../hooks/useForm";
import { validators } from "../../utils/validators";
import type { Role } from "../../types/auth";
import type {
  CreateUserDto,
  ManagedUser,
  UpdateUserDto,
} from "../../services/userService";

const DEFAULT = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: "",
  dni: "",
};

const LABELS = {
  firstName: "Nombre",
  lastName: "Apellido",
  email: "Email",
  password: "Contraseña",
  dni: "DNI",
};

interface Props {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  roles: Role[];
  user?: ManagedUser | null;
  editProfile?: boolean;
  onUpdate: (id: number, data: UpdateUserDto) => Promise<void>;
  onCreate: (data: CreateUserDto) => Promise<void>;
  onChangeRole: (id: number, roleId: number) => Promise<void>;
}

export function UserFormModal({
  open,
  onOpenChange,
  roles,
  user,
  onCreate,
  onChangeRole,
  editProfile = false,
  onUpdate,
}: Props) {
  const editing = Boolean(user);
  const editingRole = editing && !editProfile;
  const submitLabel = editingRole
    ? "Guardar rol"
    : editing
      ? "Guardar datos"
      : "Crear usuario";
  const form = useForm({
    initialValues: DEFAULT,
    resetOnSuccess: true,
    rules: {
      ...(!editingRole
        ? {
            firstName: [validators.required(), validators.maxLength(255)],
            lastName: [validators.required(), validators.maxLength(255)],
            email: [
              validators.required(),
              validators.email(),
              validators.maxLength(255),
            ],
            dni: [
              (value: string) =>
                /^[\d.\s]+$/.test(value) &&
                /^\d{7,8}$/.test(value.replace(/[.\s]/g, ""))
                  ? null
                  : "El DNI debe tener 7 u 8 dígitos numéricos",
            ],
            ...(!editing
              ? {
                  password: [
                    (value: string) =>
                      value.length ? null : "La contraseña es obligatoria",
                    (value: string) =>
                      new TextEncoder().encode(value).length <= 72
                        ? null
                        : "La contraseña no puede superar los 72 bytes UTF-8",
                  ],
                }
              : {}),
          }
        : {}),
      ...(!editProfile
        ? {
            roleId: [
              (value: string) =>
                roles.some((role) => String(role.id) === value)
                  ? null
                  : "Seleccioná un rol existente",
            ],
          }
        : {}),
    },
    onSubmit: async (values) => {
      if (user && editingRole)
        await onChangeRole(user.id, Number(values.roleId));
      else if (user)
        await onUpdate(user.id, {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          dni: values.dni.replace(/[.\s]/g, ""),
        });
      else
        await onCreate({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          roleId: Number(values.roleId),
          dni: values.dni.replace(/[.\s]/g, ""),
        });
      onOpenChange({ open: false });
    },
  });
  const { reset } = form;
  const userId = user?.id;
  const roleId = user?.role.id;
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const email = user?.email ?? "";
  const dni = user?.dni ?? "";
  useEffect(() => {
    reset(
      open
        ? {
            ...DEFAULT,
            firstName,
            lastName,
            email,
            dni,
            roleId: roleId ? String(roleId) : "",
          }
        : DEFAULT,
    );
  }, [
    open,
    userId,
    roleId,
    firstName,
    lastName,
    email,
    dni,
    editProfile,
    reset,
  ]);

  return (
    <Modal
      open={open}
      onOpenChange={(details) => {
        if (!form.isSubmitting) onOpenChange(details);
      }}
      title={
        editingRole
          ? "Cambiar rol"
          : editing
            ? "Editar datos del usuario"
            : "Nuevo usuario"
      }
      footer={
        <HStack justify="flex-end">
          <Button
            variant="outline"
            disabled={form.isSubmitting}
            onClick={() => onOpenChange({ open: false })}
          >
            Cancelar
          </Button>
          <Button
            aria-label={submitLabel}
            loading={form.isSubmitting}
            onClick={() => void form.handleSubmit()}
          >
            {submitLabel}
          </Button>
        </HStack>
      }
    >
      <VStack align="stretch" gap={3}>
        {form.submitError && (
          <Alert
            status="error"
            title="No se pudo guardar"
            description={form.submitError}
          />
        )}
        {editingRole && user ? (
          <Text>
            {user.firstName} {user.lastName} · {user.email}
          </Text>
        ) : (
          <>
            {(
              [
                "firstName",
                "lastName",
                "email",
                "dni",
                ...(!editing ? ["password" as const] : []),
              ] as const
            ).map((key) => (
              <FormField
                key={key}
                label={LABELS[key]}
                required
                error={form.touched[key] ? form.errors[key] : null}
                helperText={
                  key === "password"
                    ? "Hasta 72 caracteres simples; letras acentuadas y símbolos pueden ocupar más espacio."
                    : key === "dni"
                      ? "7 u 8 dígitos; podés escribirlo con puntos. Completá los DNI pendientes al editar."
                      : undefined
                }
              >
                <Input
                  aria-label={LABELS[key]}
                  inputMode={key === "dni" ? "numeric" : undefined}
                  type={
                    key === "password"
                      ? "password"
                      : key === "email"
                        ? "email"
                        : "text"
                  }
                  maxLength={key === "password" ? 72 : key === "dni" ? 12 : 255}
                  autoComplete={key === "password" ? "new-password" : "off"}
                  {...form.register(key)}
                />
              </FormField>
            ))}
          </>
        )}
        {!editProfile && (
          <FormField
            label="Rol"
            required
            error={form.touched.roleId ? form.errors.roleId : null}
          >
            <Select aria-label="Rol" {...form.register("roleId")}>
              <option value="">Seleccioná un rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </VStack>
    </Modal>
  );
}
