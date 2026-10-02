import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { act, cleanup, renderWithProviders, screen } from '../../test/test-utils'
import QualityPage from '../QualityPage'
import WorkOrderDetailPage from '../WorkOrderDetailPage'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { MOCK_WORK_ORDERS } from '../../test/mocks/mockWorkOrders'

describe('Acciones de calidad con roles no administradores', () => {
    beforeEach(() => {
        vi.spyOn(api, 'get').mockImplementation(async function getFixture<T>(endpoint: string): Promise<T> {
            let data: unknown = []
            if (endpoint === '/work-orders/1') data = MOCK_WORK_ORDERS[0]
            if (endpoint === '/work-orders') data = [MOCK_WORK_ORDERS[0]]
            if (endpoint === '/clients') data = { items: [], total: 0, page: 1, limit: 100 }
            if (endpoint.startsWith('/approvals/')) data = null
            return data as T
        })
    })

    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
        useAuthStore.setState({ user: null, isAuthenticated: false })
    })

    it.each([
        { role: 'Calidad', canInspect: true },
        { role: 'Producción', canInspect: false },
    ])('$role: permiso consistente en listado y detalle de OT', async ({ role, canInspect }) => {
        useAuthStore.setState({
            isAuthenticated: true,
            user: {
                id: 10,
                firstName: 'Usuario',
                lastName: 'Prueba',
                email: 'usuario@example.test',
                role: { id: 4, name: role },
            },
        })

        const listing = renderWithProviders(<QualityPage />)
        await act(async () => {})
        expect(api.get).toHaveBeenCalledWith('/work-orders')
        if (canInspect) {
            expect(screen.getByRole('button', { name: 'Nuevo control' })).toBeEnabled()
        } else {
            expect(screen.queryByRole('button', { name: 'Nuevo control' })).not.toBeInTheDocument()
        }
        listing.unmount()

        renderWithProviders(
            <MemoryRouter initialEntries={['/work-orders/1']}>
                <Routes>
                    <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
                </Routes>
            </MemoryRouter>,
        )
        await act(async () => {})
        expect(api.get).toHaveBeenCalledWith('/work-orders/1')
        if (canInspect) {
            expect(screen.getByRole('button', { name: 'Registrar control' })).toBeEnabled()
        } else {
            expect(screen.queryByRole('button', { name: 'Registrar control' })).not.toBeInTheDocument()
        }
    }, 15_000)
})
