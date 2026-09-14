import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authService from '../services/authService'
import type { AuthUser, LoginCredentials } from '../types/auth'

interface AuthState {
    user: AuthUser | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    login: (credentials: LoginCredentials) => Promise<void>
    logout: () => Promise<void>
    clearError: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null })
                try {
                    const session = await authService.login(credentials)
                    set({
                        user: session.user,
                        token: session.token,
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
                await authService.logout()
                set({ user: null, token: null, isAuthenticated: false, error: null })
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'qualitytrack-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
)
