import { api, ApiError } from './api'
import type { AuthSession, AuthUser, LoginCredentials } from '../types/auth'
import { getErrorMessage } from '../utils/errorHandler'

/**
 * Capa de acceso a autenticación contra `/auth` del backend.
 * Los errores salen como `AuthError` con un mensaje listo para mostrar.
 */
export class AuthError extends Error {}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
        return await api.post<AuthSession>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe ?? false,
        })
    } catch (err) {
        throw new AuthError(loginErrorMessage(err))
    }
}

/** Cierra la sesión de este dispositivo en el servidor. */
export async function logout(): Promise<void> {
    await api.post<void>('/auth/logout')
}

/** Devuelve el usuario de la sesión vigente; si venció, el cliente HTTP intenta renovarla. */
export async function getCurrentUser(): Promise<AuthUser> {
    const { user } = await api.get<{ user: AuthUser }>('/auth/me')
    return user
}

function loginErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        // El backend ya devuelve el mismo mensaje para correo inexistente y contraseña incorrecta.
        if (err.status === 401) {
            return err.message
        }
        if (err.status === 400) {
            return 'Revisa el formato del correo electrónico y la contraseña.'
        }
        if (err.status === 0) {
            return err.message
        }
    }
    return getErrorMessage(err)
}
