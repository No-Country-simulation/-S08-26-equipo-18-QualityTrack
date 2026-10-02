import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderWithProviders, screen, waitFor } from '../../test/test-utils'
import { QualityFormModal } from '../quality/QualityFormModal'
import { DeliveryFormModal } from '../deliveries/DeliveryFormModal'
import { ClientFormModal } from '../clients/ClientFormModal'
import { MOCK_WORK_ORDERS } from '../../test/mocks/mockWorkOrders'
import { MOCK_CLIENTS } from '../../test/mocks/mockClients'
import { MOCK_QUALITY_CONTROLS } from '../../test/mocks/mockQualityControls'
import { MOCK_DELIVERIES } from '../../test/mocks/mockDeliveries'
import { api, ApiError } from '../../services/api'

beforeEach(() => vi.spyOn(api, "get").mockResolvedValue([]))
afterEach(() => vi.restoreAllMocks())

describe('Inicialización estable de modales reales', () => {
  it('calidad conserva lo escrito y reinicia al cambiar registro o reabrir', async () => {
    const onSave = vi.fn()
    const warning = vi.spyOn(console, 'error')
    const props = { open: true, onOpenChange: vi.fn(), onSave, workOrders: [MOCK_WORK_ORDERS[0]] }
    const view = renderWithProviders(<QualityFormModal {...props} />)
    const field = screen.getByPlaceholderText(/Control dimensional/)
    fireEvent.change(field, { target: { value: 'Ensayo que no se borra' } })
    view.rerender(<QualityFormModal {...props} workOrders={[MOCK_WORK_ORDERS[0]]} />)
    await act(async () => {})
    expect(field).toHaveValue('Ensayo que no se borra')
    view.rerender(<QualityFormModal {...props} control={MOCK_QUALITY_CONTROLS[0]} />)
    expect(field).toHaveValue(MOCK_QUALITY_CONTROLS[0].specification)
    view.rerender(<QualityFormModal {...props} open={false} />)
    view.rerender(<QualityFormModal {...props} />)
    expect(screen.getByPlaceholderText(/Control dimensional/)).toHaveValue('')
    expect(warning.mock.calls.flat().join(' ')).not.toMatch(/Maximum update depth/)
  })

  it('entrega conserva cantidad/notas y reinicia al cambiar registro o reabrir', async () => {
    const props = { open: true, onOpenChange: vi.fn(), onSave: vi.fn(), workOrders: [MOCK_WORK_ORDERS[0]], clients: [MOCK_CLIENTS[0]] }
    const view = renderWithProviders(<DeliveryFormModal {...props} />)
    const field = screen.getByPlaceholderText('Ej: 50')
    fireEvent.change(field, { target: { value: '12' } })
    view.rerender(<DeliveryFormModal {...props} workOrders={[MOCK_WORK_ORDERS[0]]} />)
    await act(async () => {})
    expect(field).toHaveValue(12)
    view.rerender(<DeliveryFormModal {...props} delivery={MOCK_DELIVERIES[0]} />)
    expect(field).toHaveValue(MOCK_DELIVERIES[0].quantity)
    view.rerender(<DeliveryFormModal {...props} open={false} />)
    view.rerender(<DeliveryFormModal {...props} />)
    expect(screen.getByPlaceholderText('Ej: 50')).toHaveValue(null)
  })
})

describe('Contrato del formulario de clientes', () => {
  it('envía null para borrar los cinco opcionales y permite longitudes válidas del servidor', async () => {
    const onSave = vi.fn()
    renderWithProviders(<ClientFormModal open onOpenChange={vi.fn()} client={MOCK_CLIENTS[0]} onSave={onSave} />)
    for (const placeholder of [/Carlos Mendez/, /Av\. Industrial/, /Rosario/, /Santa Fe/, /Informacion adicional/]) {
      fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value: '' } })
    }
    fireEvent.change(screen.getByPlaceholderText(/Metalurgica Andina/), { target: { value: 'B'.repeat(1000) } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    const data = onSave.mock.calls[0][0]
    expect(data.businessName).toHaveLength(1000)
    for (const field of ['contactName', 'address', 'city', 'province', 'notes']) expect(JSON.parse(JSON.stringify(data))[field]).toBeNull()
  })

  it('rechaza letras en CUIT y conserva el formulario ante un conflicto', async () => {
    const onSave = vi.fn().mockRejectedValue(new ApiError('CUIT duplicado', 409))
    const onOpenChange = vi.fn()
    renderWithProviders(<ClientFormModal open onOpenChange={onOpenChange} client={MOCK_CLIENTS[0]} onSave={onSave} />)
    const tax = screen.getByPlaceholderText('Ej: 20432906505')
    fireEvent.change(tax, { target: { value: 'abc30712345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(onSave).not.toHaveBeenCalled()
    fireEvent.change(tax, { target: { value: '30-71234567-8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('CUIT duplicado')).toBeInTheDocument()
    expect(tax).toHaveValue('30-71234567-8')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
