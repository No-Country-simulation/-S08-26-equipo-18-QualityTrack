import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Checkbox,
    Field,
    Flex,
    Heading,
    HStack,
    Input,
    InputGroup,
    Link,
    Separator,
    Text,
} from '@chakra-ui/react'
import { Button } from '../components/Button'
import { useAuthStore } from '../store/authStore'
import {
    ArrowRightIcon,
    BadgeScanIcon,
    EyeIcon,
    EyeOffIcon,
    LockIcon,
    MailIcon,
    ShieldCheckIcon,
} from '../components/icons'

const gridBackground = {
    backgroundColor: 'gray.50',
    backgroundImage: `
        linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
        radial-gradient(circle at 50% 25%, rgba(37, 99, 235, 0.05) 0%, transparent 70%)
    `,
    backgroundSize: '32px 32px, 32px 32px, 100% 100%',
}

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, isLoading, error, clearError } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        clearError()
        try {
            await login({ email, password, rememberMe })
            navigate('/dashboard', { replace: true })
        } catch {
            // el error queda expuesto vía el store (state.error)
        }
    }

    return (
        <Flex direction="column" minH="100vh" css={gridBackground}>
            {/* TopBar */}
            <Flex as="header" w="full" px={6} py={4} justify="space-between" align="center" zIndex={1}>
                <HStack gap={2} fontSize="xs" fontWeight="semibold" color="gray.500" letterSpacing="wide" textTransform="uppercase">
                    <Box w={2} h={2} borderRadius="sm" bg="gray.400" />
                    <Text>Terminal de Control MES / SCADA</Text>
                </HStack>

                <HStack
                    gap={2.5}
                    bg="whiteAlpha.900"
                    borderWidth="1px"
                    borderColor="gray.200"
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    boxShadow="xs"
                >
                    <Box position="relative" w={2} h={2}>
                        <Box position="absolute" inset={0} borderRadius="full" bg="emerald.400" opacity={0.75} animation="pulse 2s infinite" />
                        <Box position="relative" w={2} h={2} borderRadius="full" bg="emerald.500" />
                    </Box>
                    <Text fontSize="xs" fontWeight="medium" color="gray.600">
                        Estado Servidor MES:{' '}
                        <Text as="span" color="emerald.700" fontWeight="semibold">
                            Operativo
                        </Text>{' '}
                        <Text as="span" color="gray.400">
                            (Ping 12ms)
                        </Text>
                    </Text>
                </HStack>
            </Flex>

            {/* Login Card */}
            <Flex as="main" flex="1" align="center" justify="center" px={4} py={8}>
                <Box
                    w="full"
                    maxW="448px"
                    bg="white"
                    borderRadius="xl"
                    boxShadow="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                    overflow="hidden"
                >
                    <Box h="1.5" w="full" bgGradient="to-r" gradientFrom="brand.700" gradientVia="brand.600" gradientTo="accent.400" />

                    <Box p={{ base: 8, sm: 9 }}>
                        {/* Header */}
                        <Flex direction="column" align="center" textAlign="center" mb={7}>
                            <Flex
                                mb={4}
                                w="56px"
                                h="56px"
                                borderRadius="lg"
                                bg="brand.600"
                                color="white"
                                align="center"
                                justify="center"
                                fontWeight="bold"
                                fontSize="lg"
                                boxShadow="sm"
                            >
                                QT
                            </Flex>
                            <Heading as="h1" size="sm" fontWeight="medium" color="gray.700" letterSpacing="tight">
                                Portal de Trazabilidad &amp; Control de Planta
                            </Heading>
                            <HStack
                                mt={2.5}
                                gap={1.5}
                                px={2.5}
                                py={0.5}
                                borderRadius="md"
                                fontSize="11px"
                                fontWeight="medium"
                                bg="gray.100"
                                color="gray.600"
                                borderWidth="1px"
                                borderColor="gray.200"
                            >
                                <Text as="span">v4.8 • Servidor Local Planta Norte</Text>
                            </HStack>
                        </Flex>

                        {/* Form */}
                        <Box as="form" onSubmit={handleSubmit}>
                            <Flex direction="column" gap={4}>
                                <Field.Root required>
                                    <Field.Label
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        textTransform="uppercase"
                                        letterSpacing="wide"
                                        color="gray.700"
                                    >
                                        Correo electrónico corporativo
                                    </Field.Label>
                                    <InputGroup startElement={<MailIcon boxSize={5} color="gray.400" />}>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="ej. cmendoza@qualitytrack-plant.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            bg="white"
                                            borderColor="gray.300"
                                            _focusVisible={{ borderColor: 'brand.600', boxShadow: '0 0 0 1px var(--chakra-colors-brand-600)' }}
                                        />
                                    </InputGroup>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        textTransform="uppercase"
                                        letterSpacing="wide"
                                        color="gray.700"
                                    >
                                        Contraseña de acceso
                                    </Field.Label>
                                    <InputGroup
                                        startElement={<LockIcon boxSize={5} color="gray.400" />}
                                        endElement={
                                            <Box
                                                as="button"
                                                aria-label="Mostrar u ocultar contraseña"
                                                onClick={() => setShowPassword((v) => !v)}
                                                color={showPassword ? 'brand.600' : 'gray.400'}
                                                _hover={{ color: 'gray.600' }}
                                                display="flex"
                                                alignItems="center"
                                            >
                                                {showPassword ? <EyeOffIcon boxSize={5} /> : <EyeIcon boxSize={5} />}
                                            </Box>
                                        }
                                    >
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            placeholder="••••••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            bg="white"
                                            borderColor="gray.300"
                                            _focusVisible={{ borderColor: 'brand.600', boxShadow: '0 0 0 1px var(--chakra-colors-brand-600)' }}
                                        />
                                    </InputGroup>
                                </Field.Root>

                                {error && (
                                    <Text fontSize="xs" color="red.600" fontWeight="medium">
                                        {error}
                                    </Text>
                                )}

                                <Flex align="center" justify="space-between" pt={1}>
                                    <Checkbox.Root
                                        size="sm"
                                        colorPalette="brand"
                                        checked={rememberMe}
                                        onCheckedChange={(d) => setRememberMe(!!d.checked)}
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label fontSize="xs" color="gray.600">
                                            Recordarme en este equipo de planta
                                        </Checkbox.Label>
                                    </Checkbox.Root>

                                    <Link href="#recuperar-credenciales" fontSize="xs" fontWeight="medium" color="brand.600" _hover={{ color: 'brand.800' }}>
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </Flex>

                                <Button
                                    type="submit"
                                    w="full"
                                    colorPalette="brand"
                                    loading={isLoading}
                                    loadingText="Verificando credenciales..."
                                    mt={2}
                                    boxShadow="sm"
                                >
                                    Iniciar Sesión en QualityTrack
                                    <ArrowRightIcon boxSize={4} />
                                </Button>
                            </Flex>
                        </Box>

                        {/* Divider */}
                        <HStack my={6} gap={3}>
                            <Separator flex="1" />
                            <Text fontSize="11px" textTransform="uppercase" letterSpacing="wide" color="gray.400" fontWeight="medium" whiteSpace="nowrap">
                                O acceso por dispositivo físico
                            </Text>
                            <Separator flex="1" />
                        </HStack>

                        {/* RFID */}
                        <Button
                            type="button"
                            w="full"
                            variant="outline"
                            borderColor="gray.300"
                            bg="gray.50"
                            color="gray.700"
                            fontSize="xs"
                            fontWeight="semibold"
                            _hover={{ bg: 'gray.100' }}
                        >
                            <BadgeScanIcon boxSize={4} color="brand.600" />
                            Pasar tarjeta de operador RFID / Escanear Código
                        </Button>

                        {/* Notice */}
                        <Box mt={5} p={2.5} borderRadius="md" bg="gray.50" borderWidth="1px" borderColor="gray.200">
                            <Text fontSize="11px" lineHeight="relaxed" color="gray.500" textAlign="center">
                                <Text as="span" fontWeight="semibold" color="gray.700">
                                    Acceso restringido:
                                </Text>{' '}
                                Sistema exclusivo para personal de planta y administración. Las credenciales son administradas centralmente.
                            </Text>
                        </Box>
                    </Box>

                    {/* Security ribbon */}
                    <HStack bg="gray.50" px={6} py={3} borderTopWidth="1px" borderColor="gray.200" justify="center" color="gray.500" gap={1.5} fontSize="11px">
                        <ShieldCheckIcon boxSize={3.5} color="brand.600" flexShrink={0} />
                        <Text>Conexión cifrada TLS 1.3 • Certificación ISO/IEC 27001 &amp; ISO 9001</Text>
                    </HStack>
                </Box>
            </Flex>

            {/* Footer */}
            <Box as="footer" w="full" py={4} px={6} textAlign="center" fontSize="xs" color="gray.500" borderTopWidth="1px" borderColor="gray.200" bg="whiteAlpha.400">
                <Text>
                    QualityTrack Precision Traceability Systems © 2024. Todos los derechos reservados.
                    <Text as="span" mx={2} color="gray.300" display={{ base: 'none', sm: 'inline' }}>
                        |
                    </Text>
                    <Text as="span" display={{ base: 'block', sm: 'inline' }} fontWeight="medium" color="gray.600">
                        Soporte de TI de Planta: <Text as="span" color="brand.700">Int. 4402</Text>
                    </Text>
                </Text>
            </Box>
        </Flex>
    )
}
