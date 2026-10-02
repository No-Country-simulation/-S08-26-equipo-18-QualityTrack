import { api } from "./api";
import type { AuthUser, Role } from "../types/auth";

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
}

export const userService = {
  list: () => api.get<AuthUser[]>("/users"),
  roles: () => api.get<Role[]>("/roles"),
  create: (data: CreateUserDto) => api.post<AuthUser>("/users", data),
  changeRole: (id: number, roleId: number) =>
    api.patch<AuthUser>(`/users/${id}/role`, { roleId }),
};
