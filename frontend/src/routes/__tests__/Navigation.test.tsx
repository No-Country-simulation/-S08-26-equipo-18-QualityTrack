import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test/test-utils'
import LoginPage from '../../pages/LoginPage'
import ProtectedRoute from '../guards/ProtectedRoute'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser } from '../../types/auth'

describe('Navegación y Rutas (Prueba de infraestructura de routing y control de acceso)', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        })
    })

    it('debe renderizar la página de Login en la ruta /login', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByRole('heading', { name: /portal de trazabilidad/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /iniciar sesión en qualitytrack/i })).toBeInTheDocument()
    })

    it('debe redirigir a /login si el usuario no está autenticado en ruta protegida', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/clients']}>
                <Routes>
                    <Route path="/login" element={<div>Pantalla de Login</div>} />
                    <Route
                        path="/clients"
                        element={
                            <ProtectedRoute requiredPermission="clients:view">
                                <div>Modulo de Clientes</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByText('Pantalla de Login')).toBeInTheDocument()
        expect(screen.queryByText('Modulo de Clientes')).not.toBeInTheDocument()
    })

    it('debe mostrar Acceso no autorizado si el usuario autenticado no cuenta con el permiso requerido', () => {
        const produccionUser: AuthUser = {
            id: 1,
            email: 'operario@qualitytrack.com',
            firstName: 'Carlos',
            lastName: 'Operario',
            role: { id: 2, name: 'Producción' },
            isActive: true,
        }

        useAuthStore.setState({
            user: produccionUser,
            isAuthenticated: true,
        })

        renderWithProviders(
            <MemoryRouter initialEntries={['/clients']}>
                <Routes>
                    <Route
                        path="/clients"
                        element={
                            <ProtectedRoute requiredPermission="clients:view">
                                <div>Modulo de Clientes</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument()
        expect(screen.getByText(/no tienes los permisos necesarios/i)).toBeInTheDocument()
        expect(screen.queryByText('Modulo de Clientes')).not.toBeInTheDocument()
    })

    it('debe permitir acceso al contenido protegido si el usuario cuenta con el permiso requerido', () => {
        const supervisorUser: AuthUser = {
            id: 2,
            email: 'supervisor@qualitytrack.com',
            firstName: 'Elena',
            lastName: 'Supervisora',
            role: { id: 3, name: 'Supervisor' },
            isActive: true,
        }

        useAuthStore.setState({
            user: supervisorUser,
            isAuthenticated: true,
        })

        renderWithProviders(
            <MemoryRouter initialEntries={['/clients']}>
                <Routes>
                    <Route
                        path="/clients"
                        element={
                            <ProtectedRoute requiredPermission="clients:view">
                                <div>Modulo de Clientes</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByText('Modulo de Clientes')).toBeInTheDocument()
        expect(screen.queryByText('Acceso no autorizado')).not.toBeInTheDocument()
    })

    it('debe permitir acceso total a todas las rutas si el rol es Administrador', () => {
        const adminUser: AuthUser = {
            id: 3,
            email: 'admin@qualitytrack.com',
            firstName: 'Super',
            lastName: 'Admin',
            role: { id: 1, name: 'Administrador' },
            isActive: true,
        }

        useAuthStore.setState({
            user: adminUser,
            isAuthenticated: true,
        })

        renderWithProviders(
            <MemoryRouter initialEntries={['/quotations']}>
                <Routes>
                    <Route
                        path="/quotations"
                        element={
                            <ProtectedRoute requiredPermission="quotations:view">
                                <div>Modulo de Cotizaciones</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByText('Modulo de Cotizaciones')).toBeInTheDocument()
    })
})
