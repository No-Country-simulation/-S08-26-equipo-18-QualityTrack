import { api } from "./api";
import type { AuthUser, Role } from "../types/auth";

export interface ManagedUser extends AuthUser {
  dni: string | null;
  isActive: boolean;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  dni: string;
}

export type UpdateUserDto = Pick<
  CreateUserDto,
  "firstName" | "lastName" | "email" | "dni"
>;

export const userService = {
  list: () => api.get<ManagedUser[]>("/users"),
  roles: () => api.get<Role[]>("/roles"),
  create: (data: CreateUserDto) => api.post<ManagedUser>("/users", data),
  update: (id: number, data: UpdateUserDto) =>
    api.patch<ManagedUser>(`/users/${id}`, data),
  setStatus: (id: number, isActive: boolean) =>
    api.patch<ManagedUser>(`/users/${id}/status`, { isActive }),
  changeRole: (id: number, roleId: number) =>
    api.patch<ManagedUser>(`/users/${id}/role`, { roleId }),
};
