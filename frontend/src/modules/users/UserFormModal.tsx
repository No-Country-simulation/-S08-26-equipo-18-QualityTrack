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
import type { AuthUser, Role } from "../../types/auth";
import type { CreateUserDto } from "../../services/userService";

const DEFAULT = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: "",
};

interface Props {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  roles: Role[];
  user?: AuthUser | null;
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
}: Props) {
  const editing = Boolean(user);
  const form = useForm({
    initialValues: DEFAULT,
    resetOnSuccess: true,
    rules: {
      ...(!editing
        ? {
            firstName: [validators.required(), validators.maxLength(255)],
            lastName: [validators.required(), validators.maxLength(255)],
            email: [
              validators.required(),
              validators.email(),
              validators.maxLength(255),
            ],
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
      roleId: [
        (value: string) =>
          roles.some((role) => String(role.id) === value)
            ? null
            : "Seleccioná un rol existente",
      ],
    },
    onSubmit: async (values) => {
      if (user) await onChangeRole(user.id, Number(values.roleId));
      else
        await onCreate({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          roleId: Number(values.roleId),
        });
      onOpenChange({ open: false });
    },
  });
  const { reset } = form;
  const userId = user?.id;
  const roleId = user?.role.id;
  useEffect(() => {
    reset({ ...DEFAULT, roleId: open && roleId ? String(roleId) : "" });
  }, [open, userId, roleId, reset]);

  return (
    <Modal
      open={open}
      onOpenChange={(details) => {
        if (!form.isSubmitting) onOpenChange(details);
      }}
      title={editing ? "Cambiar rol" : "Nuevo usuario"}
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
            aria-label={editing ? "Guardar rol" : "Crear usuario"}
            loading={form.isSubmitting}
            onClick={() => void form.handleSubmit()}
          >
            {editing ? "Guardar rol" : "Crear usuario"}
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
        {user ? (
          <Text>
            {user.firstName} {user.lastName} · {user.email}
          </Text>
        ) : (
          <>
            {(["firstName", "lastName", "email", "password"] as const).map(
              (key) => (
                <FormField
                  key={key}
                  label={
                    {
                      firstName: "Nombre",
                      lastName: "Apellido",
                      email: "Email",
                      password: "Contraseña",
                    }[key]
                  }
                  required
                  error={form.touched[key] ? form.errors[key] : null}
                  helperText={
                    key === "password"
                      ? "Hasta 72 caracteres simples; letras acentuadas y símbolos pueden ocupar más espacio."
                      : undefined
                  }
                >
                  <Input
                    aria-label={
                      {
                        firstName: "Nombre",
                        lastName: "Apellido",
                        email: "Email",
                        password: "Contraseña",
                      }[key]
                    }
                    type={
                      key === "password"
                        ? "password"
                        : key === "email"
                          ? "email"
                          : "text"
                    }
                    maxLength={key === "password" ? 72 : 255}
                    autoComplete={key === "password" ? "new-password" : "off"}
                    {...form.register(key)}
                  />
                </FormField>
              ),
            )}
          </>
        )}
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
      </VStack>
    </Modal>
  );
}
