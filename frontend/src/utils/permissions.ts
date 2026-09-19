import {
    type AppRole,
    type Permission,
    ROLE_PERMISSIONS,
} from '../types/permissions'

/**
 * Normaliza el nombre del rol: minúsculas, sin espacios ni tildes.
 * Soporta sinónimos como 'operador' u 'operario' mapeándolos a 'produccion'.
 */
export function normalizeRole(role?: string): string {
    if (!role) return ''
    const clean = role
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

    if (clean === 'operario' || clean === 'operador' || clean === 'taller') {
        return 'produccion'
    }
    if (clean === 'admin') {
        return 'administrador'
    }

    return clean
}

/**
 * Verifica si el rol del usuario coincide con alguno de los roles permitidos.
 */
export function hasRole(
    userRole: string | undefined,
    allowedRoles: AppRole | AppRole[],
): boolean {
    const normalizedUserRole = normalizeRole(userRole)
    if (!normalizedUserRole) return false

    // Administrador tiene acceso a todo
    if (normalizedUserRole === 'administrador') return true

    const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    return rolesList.some((role) => normalizeRole(role) === normalizedUserRole)
}

/**
 * Verifica si el rol del usuario cuenta con los permisos solicitados.
 */
export function hasPermission(
    userRole: string | undefined,
    permission: Permission | Permission[],
): boolean {
    const normalizedUserRole = normalizeRole(userRole)
    if (!normalizedUserRole) return false

    // Administrador cuenta con todos los permisos del sistema
    if (normalizedUserRole === 'administrador') return true

    const rolePermissions = ROLE_PERMISSIONS[normalizedUserRole] || []
    const requiredPermissions = Array.isArray(permission) ? permission : [permission]

    return requiredPermissions.every((perm) => rolePermissions.includes(perm))
}

