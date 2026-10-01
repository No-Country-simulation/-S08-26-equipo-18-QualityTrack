import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import type { AppRole, Permission } from '../../types/permissions'
import AccessDenied from '../../components/AccessDenied'

export interface ProtectedRouteProps {
    /**
     * Permiso o lista de permisos requeridos para acceder a la ruta.
     */
    requiredPermission?: Permission | Permission[]
    /**
     * Rol o lista de roles requeridos para acceder a la ruta.
     */
    requiredRole?: AppRole | AppRole[]
    /**
     * Ruta a la cual redirigir si no cuenta con permisos (opcional).
     * Si no se define, se renderiza el componente AccessDenied o fallback.
     */
    redirectTo?: string
    /**
     * Componente alternativo a mostrar si no cuenta con permisos.
     */
    fallback?: React.ReactNode
    /**
     * Componentes hijos a renderizar si se usa como wrapper.
     */
    children?: React.ReactNode
}

export default function ProtectedRoute({
    requiredPermission,
    requiredRole,
    redirectTo,
    fallback,
    children,
}: ProtectedRouteProps = {}) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const { can, hasRole } = usePermissions()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    let isAuthorized = true

    if (requiredPermission && !can(requiredPermission)) {
        isAuthorized = false
    }

    if (isAuthorized && requiredRole && !hasRole(requiredRole)) {
        isAuthorized = false
    }

    if (!isAuthorized) {
        if (redirectTo) {
            return <Navigate to={redirectTo} replace />
        }
        return <>{fallback ?? <AccessDenied />}</>
    }

    return children ? <>{children}</> : <Outlet />
}
