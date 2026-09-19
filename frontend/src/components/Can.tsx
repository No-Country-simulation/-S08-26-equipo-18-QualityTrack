import React from "react";
import type { AppRole, Permission } from "../types/permissions";
import { usePermissions } from "../hooks/usePermissions";

export interface CanProps {
  /**
   * Permiso o lista de permisos requeridos (ej: 'workOrders:edit').
   */
  perform?: Permission | Permission[];
  /**
   * Rol o lista de roles permitidos directamente (ej: ['Supervisor', 'Administrador']).
   */
  role?: AppRole | AppRole[];
  /**
   * Elemento alternativo a mostrar si no tiene permisos (default: null).
   */
  fallback?: React.ReactNode;
  /**
   * Contenido a renderizar si el usuario cuenta con los permisos requeridos.
   */
  children: React.ReactNode;
}

/**
 * Componente declarativo de permisos visuales (Issue #45).
 * Renderiza `children` solo si el usuario cuenta con los permisos o roles especificados.
 */
export function Can({
  perform,
  role,
  fallback = null,
  children,
}: CanProps): React.ReactElement | null {
  const { can, hasRole } = usePermissions();

  let isAllowed = true;

  if (perform) {
    isAllowed = can(perform);
  }

  if (isAllowed && role) {
    isAllowed = hasRole(role);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Alias de Can para semántica alternativa.
 */
export const PermissionGate = Can;

export default Can;
