import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../test/test-utils'
import { ErrorBoundary } from '../ErrorBoundary'

// Componente que falla intencionalmente para la prueba
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Fallo critico simulado en componente')
    }
    return <div>Contenido de planta operativo</div>
}

describe('Componente ErrorBoundary', () => {
    // Silenciamos console.error intencional durante la prueba de rotura
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'group').mockImplementation(() => {})
        vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('debe renderizar los hijos con normalidad si no hay errores', () => {
        renderWithProviders(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={false} />
            </ErrorBoundary>,
        )

        expect(screen.getByText('Contenido de planta operativo')).toBeInTheDocument()
    })

    it('debe capturar el error y mostrar la interfaz de contingencia sin romper la app', () => {
        renderWithProviders(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={true} />
            </ErrorBoundary>,
        )

        expect(screen.getByRole('heading', { name: /ocurrio un error inesperado/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument()
    })

    it('debe permitir reiniciar el estado al hacer clic en Reintentar', async () => {
        let shouldThrow = true
        const user = userEvent.setup()

        const { rerender } = renderWithProviders(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={shouldThrow} />
            </ErrorBoundary>,
        )

        expect(screen.getByRole('heading', { name: /ocurrio un error inesperado/i })).toBeInTheDocument()

        // Simulamos que el error se soluciono
        shouldThrow = false
        rerender(
            <ErrorBoundary>
                <BrokenComponent shouldThrow={shouldThrow} />
            </ErrorBoundary>,
        )

        const retryButton = screen.getByRole('button', { name: /reintentar/i })
        await user.click(retryButton)

        expect(screen.getByText('Contenido de planta operativo')).toBeInTheDocument()
    })
})

