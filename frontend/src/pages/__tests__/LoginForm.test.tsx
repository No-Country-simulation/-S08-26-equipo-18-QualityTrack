import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from '../../test/test-utils'
import LoginPage from '../LoginPage'
import { useAuthStore } from '../../store/authStore'

const originalLogin = useAuthStore.getState().login
afterEach(() => { cleanup(); useAuthStore.setState({ login: originalLogin }); useAuthStore.getState().clearSession() })

it('mostrar/ocultar contraseña no envía login; iniciar sesión sí lo envía', async () => {
  const login = vi.fn().mockResolvedValue(undefined)
  useAuthStore.setState({ login })
  renderWithProviders(<MemoryRouter><LoginPage /></MemoryRouter>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.test' } })
  const password = screen.getByPlaceholderText('••••••••••••')
  fireEvent.change(password, { target: { value: 'password-test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar u ocultar contraseña' }))
  expect(password).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar u ocultar contraseña' }))
  expect(password).toHaveAttribute('type', 'password')
  expect(login).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: /Iniciar sesi/i }))
  await waitFor(() => expect(login).toHaveBeenCalledOnce())
})
