import { ENV } from '../config/env'
import type { AuthSession, LoginCredentials } from '../types/auth'

/**
 * Capa de acceso a autenticación.
 *
 * Hoy simula la respuesta del backend (no hay API todavía), pero la firma
 * `login(credentials): Promise<AuthSession>` y los errores que lanza son
 * los que se esperan de la integración real, para que el store y la UI
 * no necesiten cambios cuando `ENV.API_URL` quede conectado.
 *
 * Para conectar la API real, reemplazar el cuerpo de `login` por:
 *
 *   const res = await fetch(`${ENV.API_URL}/auth/login`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(credentials),
 *   })
 *   if (!res.ok) throw new AuthError('Credenciales inválidas')
 *   return res.json()
 */
export class AuthError extends Error {}

const MOCK_LATENCY_MS = 600

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
    void ENV.API_URL
    await delay(MOCK_LATENCY_MS)

    if (!credentials.email || !credentials.password) {
        throw new AuthError('Correo y contraseña son obligatorios.')
    }

    if (credentials.password.length < 6) {
        throw new AuthError('Correo electrónico o contraseña incorrectos.')
    }

    const [namePart] = credentials.email.split('@')
    const [firstName = 'Operador', lastName = 'Planta'] = namePart
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))

    return {
        user: {
            id: 1,
            firstName,
            lastName,
            email: credentials.email,
            role: { id: 1, name: 'Administrador', description: 'Acceso total al sistema' },
        },
        token: 'mock-jwt-token',
    }
}

export async function logout(): Promise<void> {
    await delay(150)
}
