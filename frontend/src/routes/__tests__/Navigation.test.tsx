import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test/test-utils'
import LoginPage from '../../pages/LoginPage'

describe('Navegación y Rutas (Prueba de infraestructura de routing)', () => {
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
})

