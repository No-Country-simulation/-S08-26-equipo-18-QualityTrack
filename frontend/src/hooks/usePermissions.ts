import { useCallback, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import type { AppRole, Permission } from '../types/permissions'
import { hasPermission, hasRole, normalizeRole } from '../utils/permissions'

export interface UsePermissionsReturn {
    user: ReturnType<typeof useAuthStore.getState>['user']
    roleName: string | undefined
    normalizedRole: string
    can: (permission: Permission | Permission[]) => boolean
    hasRole: (allowedRoles: AppRole | AppRole[]) => boolean
    isAdmin: boolean
    isSupervisor: boolean
    isProduction: boolean
    isQuality: boolean
    isAdministration: boolean
}

/**
 * Hook para evaluar permisos y roles de usuario en tiempo real (Issue #45).
 */
export function usePermissions(): UsePermissionsReturn {
    const user = useAuthStore((state) => state.user)
    const roleName = user?.role?.name

    const normalizedRole = useMemo(() => normalizeRole(roleName), [roleName])

    const can = useCallback(
        (permission: Permission | Permission[]) => hasPermission(roleName, permission),
        [roleName],
    )

    const checkRole = useCallback(
        (allowedRoles: AppRole | AppRole[]) => hasRole(roleName, allowedRoles),
        [roleName],
    )

    const isAdmin = normalizedRole === 'administrador'
    const isSupervisor = normalizedRole === 'supervisor'
    const isProduction = normalizedRole === 'produccion'
    const isQuality = normalizedRole === 'calidad'
    const isAdministration = normalizedRole === 'administracion'

    return {
        user,
        roleName,
        normalizedRole,
        can,
        hasRole: checkRole,
        isAdmin,
        isSupervisor,
        isProduction,
        isQuality,
        isAdministration,
    }
}

export default usePermissions

