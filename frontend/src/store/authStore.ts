import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import * as authService from '../services/authService'
import { ApiError, registerAuthHandlers } from '../services/api'
import type { AuthUser, LoginCredentials } from '../types/auth'

interface AuthState {
    user: AuthUser | null
    accessToken: string | null
    refreshToken: string | null
    rememberMe: boolean
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    login: (credentials: LoginCredentials) => Promise<void>
    logout: () => Promise<void>
    restoreSession: () => Promise<void>
    clearSession: () => void
    clearError: () => void
}

const STORAGE_KEY = 'qualitytrack-auth'

/**
 * Con "Recordarme" la sesión se guarda en localStorage y sobrevive al cierre del
 * navegador; sin él, en sessionStorage y termina al cerrar la pestaña.
 * El destino se decide con el propio `rememberMe` del estado que se guarda.
 */
const sessionAwareStorage: StateStorage = {
    getItem: (name) => sessionStorage.getItem(name) ?? localStorage.getItem(name),
    setItem: (name, value) => {
        const remember = readRememberMe(value)
        const target = remember ? localStorage : sessionStorage
        const other = remember ? sessionStorage : localStorage
        other.removeItem(name)
        target.setItem(name, value)
    },
    removeItem: (name) => {
        localStorage.removeItem(name)
        sessionStorage.removeItem(name)
    },
}

function readRememberMe(serialized: string): boolean {
    try {
        return Boolean(JSON.parse(serialized)?.state?.rememberMe)
    } catch {
        return false
    }
}

const signedOutState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    rememberMe: false,
    isAuthenticated: false,
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            ...signedOutState,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null })
                try {
                    const session = await authService.login(credentials)
                    set({
                        user: session.user,
                        accessToken: session.accessToken,
                        refreshToken: session.refreshToken,
                        rememberMe: credentials.rememberMe ?? false,
                        isAuthenticated: true,
                        isLoading: false,
                    })
                } catch (err) {
                    const message =
                        err instanceof Error ? err.message : 'No se pudo iniciar sesión.'
                    set({ isLoading: false, error: message, isAuthenticated: false })
                    throw err
                }
            },

            logout: async () => {
                try {
                    await authService.logout()
                } catch {
                    // La sesión local se cierra igual: sin el token de refresco en el
                    // navegador, la sesión del servidor ya no se puede usar.
                } finally {
                    get().clearSession()
                }
            },

            restoreSession: async () => {
                if (!get().accessToken) {
                    return
                }
                try {
                    const user = await authService.getCurrentUser()
                    set({ user, isAuthenticated: true })
                } catch (err) {
                    // Un fallo de red no cierra la sesión: puede ser el servidor caído.
                    if (err instanceof ApiError && err.status === 401) {
                        get().clearSession()
                    }
                }
            },

            clearSession: () => {
                set({ ...signedOutState, error: null })
                useAuthStore.persist.clearStorage()
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => sessionAwareStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                rememberMe: state.rememberMe,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
)

registerAuthHandlers({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onTokensRefreshed: (tokens) =>
        useAuthStore.setState({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
    onSessionExpired: () => useAuthStore.getState().clearSession(),
})

// Con "Recordarme" varias pestañas comparten la sesión: si otra pestaña renueva
// los tokens o cierra sesión, esta se entera y no usa un token ya invalidado.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.storageArea === localStorage) {
            void useAuthStore.persist.rehydrate()
        }
    })
}
