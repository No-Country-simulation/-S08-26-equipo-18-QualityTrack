import AppRoutes from './routes/AppRoutes'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from './theme/theme'

function App() {
    return (
        <ChakraProvider value={system}>
        <AppRoutes/>
        </ChakraProvider>
    )
}

export default App
