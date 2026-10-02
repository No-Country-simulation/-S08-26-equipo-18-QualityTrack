import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { act, cleanup, fireEvent, renderWithProviders, screen, waitFor, within } from '../../test/test-utils'
import { api, ApiError } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import RequestsPage from '../RequestsPage'
import QuotationsPage from '../QuotationsPage'
import WorkOrdersPage from '../WorkOrdersPage'
import QualityPage from '../QualityPage'
import DeliveriesPage from '../DeliveriesPage'
import DashboardPage from '../DashboardPage'
import { MOCK_CLIENTS } from '../../test/mocks/mockClients'
import { MOCK_REQUESTS } from '../../test/mocks/mockRequests'

beforeEach(() => useAuthStore.setState({ isAuthenticated: true, user: { id: 1, firstName: 'Test', lastName: 'Admin', email: 'admin@example.test', role: { id: 1, name: 'Administrador' } } }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.getState().clearSession() })

const click = async (target: HTMLElement) => { await act(async () => { fireEvent.click(target) }) }

const pages = [
  { name: 'solicitudes', Page: RequestsPage, empty: 'No hay solicitudes registradas' },
  { name: 'cotizaciones', Page: QuotationsPage, empty: 'No hay cotizaciones registradas' },
  { name: 'OT', Page: WorkOrdersPage, empty: 'No hay ordenes de trabajo registradas' },
  { name: 'calidad', Page: QualityPage, empty: 'No hay controles de calidad registrados' },
  { name: 'entregas', Page: DeliveriesPage, empty: 'No hay entregas registradas' },
]

describe('Lecturas reales, sin fallbacks de demostración', () => {
  it.each(pages)('$name: una lista vacía sigue vacía', async ({ Page, empty }) => {
    vi.spyOn(api, 'get').mockImplementation(async function emptyData<T>(endpoint: string): Promise<T> {
      return (endpoint === '/clients' ? { items: [], total: 0, page: 1, limit: 100 } : []) as T
    })
    renderWithProviders(<MemoryRouter><Page /></MemoryRouter>)
    expect(await screen.findByText(empty)).toBeInTheDocument()
    expect(screen.queryByText(MOCK_REQUESTS[0].title)).not.toBeInTheDocument()
    expect(screen.queryByText(MOCK_CLIENTS[0].businessName)).not.toBeInTheDocument()
  })

  it.each(pages)('$name: API ausente muestra error y permite reintentar', async ({ Page, empty }) => {
    const get = vi.spyOn(api, 'get').mockRejectedValue(new ApiError('Not Found', 404))
    renderWithProviders(<MemoryRouter><Page /></MemoryRouter>)
    expect(await screen.findByText(/servicio o registro solicitado no está disponible/)).toBeInTheDocument()
    expect(screen.queryByText(MOCK_REQUESTS[0].title)).not.toBeInTheDocument()
    get.mockImplementation(async function emptyData<T>(endpoint: string): Promise<T> {
      return (endpoint === '/clients' ? { items: [], total: 0, page: 1, limit: 100 } : []) as T
    })
    await click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(await screen.findByText(empty)).toBeInTheDocument()
  })

  it('dashboard informa indisponibilidad sin mostrar métricas ficticias', () => {
    renderWithProviders(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(screen.getByText('Indicadores no disponibles')).toBeInTheDocument()
    expect(screen.queryByText(/Expedientes completos/i)).not.toBeInTheDocument()
  })
})

function realFixtures(empty = false) {
  vi.spyOn(api, 'get').mockImplementation(async function fixtures<T>(endpoint: string): Promise<T> {
    return (endpoint === '/clients' ? { items: [MOCK_CLIENTS[0]], total: 1, page: 1, limit: 100 } : empty ? [] : [MOCK_REQUESTS[0]]) as T
  })
  renderWithProviders(<MemoryRouter><RequestsPage /></MemoryRouter>)
}

describe('Fallos de escritura conservan datos y formulario', () => {
  it.each([401, 403, 409, 500, 0])('update rechazado (%s) no cambia la fila ni muestra éxito', async status => {
    const put = vi.spyOn(api, 'put').mockRejectedValue(new ApiError(`Fallo ${status}`, status))
    realFixtures()
    await click(await screen.findByRole('button', { name: 'Editar solicitud' }))
    const field = await screen.findByPlaceholderText(/Ej: Fabricacion de ejes/)
    fireEvent.change(field, { target: { value: 'Borrador sin guardar' } })
    await click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText(`Fallo ${status}`)).toBeInTheDocument()
    expect(put).toHaveBeenCalledOnce()
    expect(field).toHaveValue('Borrador sin guardar')
    expect(screen.getByText(MOCK_REQUESTS[0].title)).toBeInTheDocument()
    expect(screen.queryByText(/actualizada correctamente/i)).not.toBeInTheDocument()
  })

  it('create fallido no agrega filas; el mismo formulario puede reintentar y guardar', async () => {
    const post = vi.spyOn(api, 'post').mockRejectedValueOnce(new ApiError('No se guardó', 500)).mockResolvedValueOnce({ ...MOCK_REQUESTS[0], title: 'Registro del servidor' })
    realFixtures(true)
    await screen.findByText('No hay solicitudes registradas')
    await click(screen.getByRole('button', { name: 'Nueva solicitud' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Nro. de solicitud')).toHaveAttribute('readonly')
    fireEvent.change(within(dialog).getByPlaceholderText(/Ej: Fabricacion/), { target: { value: 'Registro del servidor' } })
    fireEvent.change(within(dialog).getByPlaceholderText(/Detalles de planos/), { target: { value: 'Detalle persistible' } })
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: '1' } })
    const dates = dialog.querySelectorAll('input[type="date"]')
    fireEvent.change(dates[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dates[1], { target: { value: '2026-02-01' } })
    await click(within(dialog).getByRole('button', { name: 'Crear solicitud' }))
    expect(await screen.findByText('No se guardó')).toBeInTheDocument()
    expect(screen.getByText('No hay solicitudes registradas')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await click(within(dialog).getByRole('button', { name: 'Crear solicitud' }))
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Registro del servidor')).toBeInTheDocument()
  })

  it('las solicitudes no ofrecen borrado de registros de origen', async () => {
    const del = vi.spyOn(api, 'delete')
    realFixtures()
    await screen.findByText(MOCK_REQUESTS[0].title)
    expect(screen.queryByRole('button', { name: 'Eliminar solicitud' })).not.toBeInTheDocument()
    expect(del).not.toHaveBeenCalled()
  })
})
