import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { config } from '../config/appConfig'

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
    expiresIn: number
}

/**
 * Puente con el store de sesión. El cliente HTTP no importa el store para no
 * crear un ciclo (store → authService → api → store): el store se registra acá.
 */
export interface AuthHandlers {
    getAccessToken: () => string | null
    getRefreshToken: () => string | null
    onTokensRefreshed: (tokens: TokenPair) => void
    onSessionExpired: () => void
}

let authHandlers: AuthHandlers | null = null

export function registerAuthHandlers(handlers: AuthHandlers): void {
    authHandlers = handlers
}

export const apiClient = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeoutMs,
    headers: { 'Content-Type': 'application/json' },
})

// El token se lee en cada petición y no al crear la instancia: puede haber
// cambiado por un refresco hecho por otra petición u otra pestaña.
apiClient.interceptors.request.use((request) => {
    const token = authHandlers?.getAccessToken()
    if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
})

// Estos endpoints no disparan un refresco ante un 401: el login con credenciales
// inválidas o un refresco rechazado no se arreglan renovando.
const ENDPOINTS_WITHOUT_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout']

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
    _retried?: boolean
}

let refreshInFlight: Promise<string | null> | null = null

/**
 * Todas las peticiones que reciben 401 a la vez comparten un único refresco:
 * el backend invalida el token de refresco en cada uso.
 */
function refreshAccessToken(): Promise<string | null> {
    if (!refreshInFlight) {
        refreshInFlight = requestNewTokens().finally(() => {
            refreshInFlight = null
        })
    }
    return refreshInFlight
}

async function requestNewTokens(): Promise<string | null> {
    const refreshToken = authHandlers?.getRefreshToken()
    if (!refreshToken) {
        return null
    }

    try {
        // axios sin interceptores: un 401 acá no debe volver a intentar refrescar.
        const { data } = await axios.post<TokenPair>(
            '/auth/refresh',
            { refreshToken },
            { baseURL: config.api.baseUrl, timeout: config.api.timeoutMs },
        )
        authHandlers?.onTokensRefreshed(data)
        return data.accessToken
    } catch {
        return null
    }
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableRequestConfig | undefined
        const canRefresh =
            error.response?.status === 401 &&
            original !== undefined &&
            !original._retried &&
            !ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => original.url?.startsWith(endpoint))

        if (canRefresh) {
            original._retried = true
            const newAccessToken = await refreshAccessToken()
            if (newAccessToken) {
                original.headers.set('Authorization', `Bearer ${newAccessToken}`)
                return apiClient(original)
            }
            authHandlers?.onSessionExpired()
        }

        throw toApiError(error)
    },
)

function toApiError(error: AxiosError): ApiError {
    if (!error.response) {
        return new ApiError(
            'No se pudo conectar con el servidor. Comprueba tu conexión de red o si el backend está encendido.',
            0,
        )
    }

    const { status, statusText, data } = error.response
    const backendMessage = (data as { message?: unknown } | undefined)?.message
    const message =
        (typeof backendMessage === 'string' ? backendMessage : null) ||
        statusText ||
        'Error en la petición'

    return new ApiError(message, status, data)
}

async function request<T>(options: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.request<T>(options)
    if (response.status === 204) {
        return null as T
    }
    return response.data
}

export const api = {

    get<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...options, url: endpoint, method: 'GET' })
    },

    post<T>(endpoint: string, body?: unknown, options?: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...options, url: endpoint, method: 'POST', data: body })
    },

    put<T>(endpoint: string, body?: unknown, options?: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...options, url: endpoint, method: 'PUT', data: body })
    },

    patch<T>(endpoint: string, body?: unknown, options?: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...options, url: endpoint, method: 'PATCH', data: body })
    },

    delete<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...options, url: endpoint, method: 'DELETE' })
    },
}


export async function checkHealth(): Promise<{ status: string }> {
    return api.get<{ status: string }>('/health')
}

export default api
