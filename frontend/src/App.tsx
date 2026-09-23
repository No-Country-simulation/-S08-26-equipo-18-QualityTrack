import { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from './theme/theme'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './store/authStore'

function App() {
    const restoreSession = useAuthStore((state) => state.restoreSession)

    // Una sesión guardada puede haber sido cerrada o vencida mientras la app
    // estaba cerrada: se valida contra el backend al arrancar.
    useEffect(() => {
        void restoreSession()
    }, [restoreSession])

    return (
        <ChakraProvider value={system}>
            <ErrorBoundary>
                <AppRoutes />
            </ErrorBoundary>
        </ChakraProvider>
    )
}

export default App
