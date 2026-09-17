import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <Flex minH="100vh" bg="bg.canvas">
            {/* Sidebar modular */}
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((prev) => !prev)}
            />

            {/* Columna principal */}
            <Flex direction="column" flex="1" minW={0}>
                {/* Navbar modular */}
                <Navbar />

                {/* Contenido inyectado por las rutas */}
                <Box as="main" flex="1" p={6}>
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    )
}
