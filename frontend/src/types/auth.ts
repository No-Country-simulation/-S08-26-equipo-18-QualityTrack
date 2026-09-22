/**
 * Tipos alineados al contrato de /auth del backend (entidades ROLE y USER).
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
    /** Token de acceso (JWT, vida corta) que viaja en `Authorization: Bearer`. */
    accessToken: string
    /** Token opaco para renovar la sesión; el backend lo invalida en cada uso. */
    refreshToken: string
    /** Segundos de vida del token de acceso. */
    expiresIn: number
}
