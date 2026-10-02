import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { act, cleanup, fireEvent, renderWithProviders, screen, waitFor } from '../../test/test-utils'
import WorkOrderDetailPage from '../WorkOrderDetailPage'
import { api, ApiError } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { MOCK_WORK_ORDERS } from '../../test/mocks/mockWorkOrders'

beforeEach(() => useAuthStore.setState({ isAuthenticated: true, user: { id: 1, firstName: 'Test', lastName: 'Admin', email: 'admin@example.test', role: { id: 1, name: 'Administrador' } } }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.getState().clearSession() })

function detail() {
  return renderWithProviders(<MemoryRouter initialEntries={['/work-orders/1']}><Routes><Route path="/work-orders/:id" element={<WorkOrderDetailPage />} /></Routes></MemoryRouter>)
}

it('una OT inexistente no se reemplaza por una ficha de demostración', async () => {
  vi.spyOn(api, 'get').mockRejectedValue(new ApiError('Not Found', 404))
  detail()
  expect(await screen.findByText('No se pudo cargar la orden de trabajo')).toBeInTheDocument()
  expect(screen.queryByText(MOCK_WORK_ORDERS[0].title)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
})

it('aprobación rechazada por API no inventa dictamen ni actor; permite reintentar', async () => {
  vi.spyOn(api, 'get').mockImplementation(async function fixtures<T>(endpoint: string): Promise<T> {
    return (endpoint === '/work-orders/1' ? MOCK_WORK_ORDERS[0] : endpoint === '/clients' ? { items: [], total: 0, page: 1, limit: 100 } : endpoint.startsWith('/approvals/') ? null : []) as T
  })
  const post = vi.spyOn(api, 'post').mockRejectedValueOnce(new ApiError('No se aprobó', 403)).mockResolvedValueOnce({ id: 8, workOrderId: 1, status: 'APPROVED' })
  detail()
  const approve = await screen.findByRole('button', { name: 'Aprobar orden' })
  await act(async () => { fireEvent.click(approve) })
  const confirm = await screen.findByRole('button', { name: 'Confirmar aprobacion' })
  await act(async () => { fireEvent.click(confirm) })
  expect(await screen.findByText('No se aprobó')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.queryByText('Ing. Carlos Mendoza')).not.toBeInTheDocument()
  expect(screen.queryByText(/aprobada con exito/i)).not.toBeInTheDocument()
  await act(async () => { fireEvent.click(confirm) })
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2))
  expect(await screen.findByText('Responsable no informado')).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})
