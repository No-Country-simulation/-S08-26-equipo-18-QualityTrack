import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '../theme/theme'

/**
 * Renderiza componentes dentro del ChakraProvider del proyecto para pruebas visuales.
 */
export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) {
    return render(ui, {
        wrapper: ({ children }) => (
            <ChakraProvider value={system}>{children}</ChakraProvider>
        ),
        ...options,
    })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

