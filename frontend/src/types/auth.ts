/**
 * Tipos alineados al DER del backend (entidades ROLE y USER) para que el
 * store y el servicio de autenticación no requieran cambios de forma
 * cuando se conecte la API real.
 */
export interface Role {
    id: number
    name: string
    description?: string
}

export interface AuthUser {
    id: number
    firstName: string
    lastName: string
    email: string
    role: Role
}

export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface AuthSession {
    user: AuthUser
    /** Token de acceso (JWT) devuelto por el backend. */
    token: string
}
