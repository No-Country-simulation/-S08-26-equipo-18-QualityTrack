import AppRoutes from './routes/AppRoutes'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from './theme/theme'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
    return (
        <ChakraProvider value={system}>
            <ErrorBoundary>
                <AppRoutes />
            </ErrorBoundary>
        </ChakraProvider>
    )
}

export default App
