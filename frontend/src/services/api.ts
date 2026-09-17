import { ENV } from '../config/env'
import { useAuthStore } from '../store/authStore';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${ENV.API_URL}${cleanEndpoint}`
    const token = useAuthStore.getState().token

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
    ...options,
    headers,
    })

    if (response.status === 204) {
    return null as T
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
    if (response.status === 401) {
        useAuthStore.getState().logout()
    }

    const message =
        (typeof data?.message === 'string' ? data.message : null) ||
        response.statusText ||
        'Error en la petición'

    throw new ApiError(message, response.status, data)
}

    return data as T

}

export const api = {

    get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return request<T>(endpoint, { ...options, method: 'GET' })
    },

    post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
        return request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
        return request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
        return request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return request<T>(endpoint, { ...options, method: 'DELETE' })
    },
}


export async function checkHealth(): Promise<{ status: string }> {
    return api.get<{ status: string }>('/health')
}

export default api