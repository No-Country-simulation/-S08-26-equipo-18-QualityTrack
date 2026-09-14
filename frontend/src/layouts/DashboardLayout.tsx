import { ReactNode, useState } from 'react'
import { Link as RouterLink, NavLink, Outlet } from 'react-router-dom'
import {
    Avatar,
    Box,
    Flex,
    HStack,
    IconButton,
    Link,
    Menu,
    Portal,
    Separator,
    Stack,
    Text,
} from '@chakra-ui/react'
import { useAuthStore } from '../store/authStore'
import {
    ChevronsLeftIcon,
    LogoutIcon,
    MenuIcon,
} from '../components/icons'

const SIDEBAR_WIDTH_EXPANDED = '240px'
const SIDEBAR_WIDTH_COLLAPSED = '72px'

interface NavItem {
    label: string
    to: string
    icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: '📊' },
    { label: 'Clientes', to: '/clients', icon: '🏢' },
    { label: 'Solicitudes', to: '/requests', icon: '📝' },
    { label: 'Cotizaciones', to: '/quotations', icon: '💲' },
    { label: 'Órdenes de trabajo', to: '/work-orders', icon: '🛠️' },
    { label: 'Calidad', to: '/quality', icon: '✅' },
    { label: 'Entregas', to: '/deliveries', icon: '🚚' },
]

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : 'QT'

    return (
        <Flex minH="100vh" bg="bg.canvas">
            {/* Sidebar */}
            <Flex
                as="nav"
                direction="column"
                w={collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}
                flexShrink={0}
                bg="white"
                borderRightWidth="1px"
                borderColor="border.subtle"
                transition="width 0.2s ease"
                overflow="hidden"
                position="sticky"
                top={0}
                h="100vh"
            >
                <Flex
                    align="center"
                    justify={collapsed ? 'center' : 'space-between'}
                    h="64px"
                    px={collapsed ? 0 : 4}
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    flexShrink={0}
                >
                    {!collapsed && (
                        <Link
                            fontWeight="bold"
                            fontSize="sm"
                            letterSpacing="wide"
                            color="gray.800"
                            whiteSpace="nowrap"
                        >
                            <RouterLink to="/dashboard">
                                Quality<Text as="span" color="brand.600">Track</Text>
                            </RouterLink>
                        </Link>
                    )}
                    <IconButton
                        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
                        onClick={() => setCollapsed((prev) => !prev)}
                        variant="ghost"
                        size="sm"
                        color="gray.500"
                    >
                        {collapsed ? <MenuIcon boxSize={4} /> : <ChevronsLeftIcon boxSize={4} />}
                    </IconButton>
                </Flex>

                <Stack gap={0.5} px={collapsed ? 2 : 3} py={4} flex="1" overflowY="auto">
                    {NAV_ITEMS.map((item) => (
                        <Flex
                            key={item.to}
                            as={NavLink}
                            to={item.to}
                            align="center"
                            gap={3}
                            px={collapsed ? 0 : 3}
                            py={2.5}
                            borderRadius="lg"
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600"
                            justify={collapsed ? 'center' : 'flex-start'}
                            _hover={{ bg: 'gray.100', color: 'gray.900' }}
                            css={{
                                '&.active': {
                                    backgroundColor: 'var(--chakra-colors-brand-50)',
                                    color: 'var(--chakra-colors-brand-700)',
                                },
                            }}
                        >
                            <Text as="span" fontSize="md" lineHeight={1}>
                                {item.icon}
                            </Text>
                            {!collapsed && (
                                <Text as="span" whiteSpace="nowrap" overflow="hidden">
                                    {item.label}
                                </Text>
                            )}
                        </Flex>
                    ))}
                </Stack>
            </Flex>

            {/* Main column */}
            <Flex direction="column" flex="1" minW={0}>
                {/* Navbar */}
                <Flex
                    as="header"
                    h="64px"
                    align="center"
                    justify="space-between"
                    px={6}
                    bg="white"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    position="sticky"
                    top={0}
                    zIndex={10}
                >
                    <HStack gap={2.5}>
                        <Box position="relative">
                            <Box
                                position="absolute"
                                inset={0}
                                borderRadius="full"
                                bg="emerald.400"
                                opacity={0.6}
                                animation="pulse 2s infinite"
                            />
                            <Box position="relative" w={2} h={2} borderRadius="full" bg="emerald.500" />
                        </Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">
                            Servidor MES{' '}
                            <Text as="span" color="emerald.700" fontWeight="semibold">
                                Operativo
                            </Text>
                        </Text>
                    </HStack>

                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <HStack
                                gap={2.5}
                                px={2}
                                py={1.5}
                                borderRadius="lg"
                                cursor="pointer"
                                _hover={{ bg: 'gray.100' }}
                            >
                                <Avatar.Root size="sm" colorPalette="brand">
                                    <Avatar.Fallback name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}>
                                        {initials}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                <Box textAlign="left" display={{ base: 'none', sm: 'block' }}>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.800" lineHeight={1.2}>
                                        {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500" lineHeight={1.2}>
                                        {user?.role.name ?? 'Operador'}
                                    </Text>
                                </Box>
                            </HStack>
                        </Menu.Trigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content minW="200px">
                                    <Box px={3} py={2}>
                                        <Text fontSize="xs" color="gray.500">
                                            {user?.email}
                                        </Text>
                                    </Box>
                                    <Separator />
                                    <Menu.Item
                                        value="logout"
                                        color="red.600"
                                        onClick={() => logout()}
                                    >
                                        <LogoutIcon boxSize={4} />
                                        Cerrar sesión
                                    </Menu.Item>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu.Root>
                </Flex>

                {/* Page content */}
                <Box as="main" flex="1" p={6}>
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    )
}
