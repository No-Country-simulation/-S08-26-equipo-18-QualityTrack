import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../test/test-utils'
import { Button } from '../Button'

describe('Componente Button (Prueba de UI básica)', () => {
    it('debe renderizar el texto correctamente', () => {
        renderWithProviders(<Button>Guardar Cambios</Button>)
        expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
    })

    it('debe responder al evento de click del usuario', async () => {
        const handleClick = vi.fn()
        const user = userEvent.setup()

        renderWithProviders(<Button onClick={handleClick}>Hacer Clic</Button>)
        const button = screen.getByRole('button', { name: /hacer clic/i })

        await user.click(button)
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('debe deshabilitar el botón cuando loading es true', () => {
        renderWithProviders(<Button loading>Procesando</Button>)
        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
    })
})

