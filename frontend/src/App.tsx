import './App.css'
import AppRoutes from './routes/AppRoutes'
import {ChakraProvider, defaultSystem } from '@chakra-ui/react'

function App() {
    return (
        <ChakraProvider value={defaultSystem}>
        <AppRoutes/>
        </ChakraProvider>
    )
}

export default App
