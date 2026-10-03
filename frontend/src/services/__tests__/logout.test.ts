import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { api, apiClient } from '../api'
import { useAuthStore } from '../../store/authStore'

const originalAdapter = apiClient.defaults.adapter
const originalGlobalAdapter = axios.defaults.adapter

function unauthorized(config: InternalAxiosRequestConfig): never {
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config,
    })
}

function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
    return { config, data, status, statusText: 'OK', headers: {} }
}

describe('Logout y renovación de sesión', () => {
    beforeEach(() => {
        useAuthStore.getState().clearSession()
        useAuthStore.setState({
            accessToken: 'expired-access', refreshToken: 'valid-refresh',
            isAuthenticated: true, rememberMe: true,
        })
    })

    afterEach(() => {
        apiClient.defaults.adapter = originalAdapter
        axios.defaults.adapter = originalGlobalAdapter
        useAuthStore.getState().clearSession()
    })

    it('renueva una vez antes de revocar con access vencido y borra ambos storages', async () => {
        let logoutCalls = 0
        let refreshCalls = 0
        axios.defaults.adapter = async config => {
            refreshCalls++
            expect(config.url).toBe('/auth/refresh')
            expect(JSON.parse(config.data).refreshToken).toBe('valid-refresh')
            return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 })
        }
        apiClient.defaults.adapter = async config => {
            logoutCalls++
            if (config.headers.get('Authorization') === 'Bearer expired-access') unauthorized(config)
            expect(config.headers.get('Authorization')).toBe('Bearer new-access')
            return response(config, null, 204)
        }
        await useAuthStore.getState().logout()
        expect(logoutCalls).toBe(2)
        expect(refreshCalls).toBe(1)
        expect(useAuthStore.getState().accessToken).toBeNull()
        expect(useAuthStore.getState().refreshToken).toBeNull()
        expect(useAuthStore.getState().error).toBeNull()
        expect(localStorage.getItem('qualitytrack-auth')).toBeNull()
        expect(sessionStorage.getItem('qualitytrack-auth')).toBeNull()
    })

    it('access vigente revoca sin renovar', async () => {
        axios.defaults.adapter = async () => { throw new Error('Unexpected refresh') }
        apiClient.defaults.adapter = async config => response(config, null, 204)
        await useAuthStore.getState().logout()
        expect(useAuthStore.getState().error).toBeNull()
        expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it.each(['logout', 'refresh'])('un fallo de red en %s limpia credenciales y avisa que no confirmó revocación', async failure => {
        let calls = 0
        apiClient.defaults.adapter = async config => {
            calls++
            if (failure === 'refresh') unauthorized(config)
            throw new AxiosError('Network error', 'ERR_NETWORK', config)
        }
        axios.defaults.adapter = async config => {
            calls++
            throw new AxiosError('Network error', 'ERR_NETWORK', config)
        }
        await useAuthStore.getState().logout()
        expect(calls).toBe(failure === 'refresh' ? 2 : 1)
        expect(useAuthStore.getState().accessToken).toBeNull()
        expect(useAuthStore.getState().refreshToken).toBeNull()
        expect(useAuthStore.getState().error).toContain('no se pudo confirmar')
        expect(localStorage.getItem('qualitytrack-auth')).toBeNull()
        expect(sessionStorage.getItem('qualitytrack-auth')).toBeNull()
    })

    it('un segundo 401 no produce un bucle de renovación', async () => {
        let refreshCalls = 0
        let logoutCalls = 0
        axios.defaults.adapter = async config => {
            refreshCalls++
            return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 })
        }
        apiClient.defaults.adapter = async config => { logoutCalls++; unauthorized(config) }
        await useAuthStore.getState().logout()
        expect(refreshCalls).toBe(1)
        expect(logoutCalls).toBe(2)
        expect(useAuthStore.getState().error).toContain('no se pudo confirmar')
    })

    it('logout y otra petición con 401 comparten una sola renovación', async () => {
        let refreshCalls = 0
        axios.defaults.adapter = async config => {
            refreshCalls++
            return response(config, { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 })
        }
        const adapter: AxiosAdapter = async config => {
            if (config.headers.get('Authorization') === 'Bearer expired-access') unauthorized(config)
            return response(config, config.url === '/auth/logout' ? null : [], config.url === '/auth/logout' ? 204 : 200)
        }
        apiClient.defaults.adapter = adapter
        await Promise.all([useAuthStore.getState().logout(), api.get('/clients')])
        expect(refreshCalls).toBe(1)
        expect(useAuthStore.getState().refreshToken).toBeNull()
    })
})
