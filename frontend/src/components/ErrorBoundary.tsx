import React, { Component, type ReactNode } from 'react'
import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react'
import { LuHouse, LuRefreshCw, LuTriangleAlert } from 'react-icons/lu'
import { Button } from './Button'
import { logError } from '../utils/errorHandler'

export interface ErrorBoundaryFallbackProps {
    error: Error
    resetErrorBoundary: () => void
}

export interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode)
    onReset?: () => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Componente ErrorBoundary para capturar errores de renderizado en React (Issue #42).
 * Evita que fallos imprevistos desmonten toda la aplicacion y muestra una interfaz de contingencia.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        logError(error, { componentStack: errorInfo.componentStack })
    }

    resetErrorBoundary = (): void => {
        this.props.onReset?.()
        this.setState({ hasError: false, error: null })
    }

    handleGoHome = (): void => {
        this.resetErrorBoundary()
        window.location.href = '/dashboard'
    }

    render(): ReactNode {
        const { hasError, error } = this.state
        const { children, fallback } = this.props

        if (hasError && error) {
            // 1. Fallback personalizado si fue provisto
            if (typeof fallback === 'function') {
                return fallback({ error, resetErrorBoundary: this.resetErrorBoundary })
            }
            if (fallback) {
                return fallback
            }

            // 2. Fallback predeterminado de QualityTrack
            const isDev = import.meta.env.DEV

            return (
                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    p={8}
                    minH="360px"
                    w="100%"
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    boxShadow="sm"
                    textAlign="center"
                >
                    <Flex
                        align="center"
                        justify="center"
                        w={14}
                        h={14}
                        borderRadius="full"
                        bg="red.50"
                        color="red.600"
                        mb={4}
                    >
                        <LuTriangleAlert size={28} />
                    </Flex>

                    <Heading size="md" color="gray.800" mb={2}>
                        Ocurrio un error inesperado
                    </Heading>

                    <Text fontSize="sm" color="gray.600" maxW="480px" mb={6}>
                        El sistema encontro una dificultad para procesar esta seccion. Puedes reintentar la accion o regresar al panel principal.
                    </Text>

                    <HStack gap={3} wrap="wrap" justify="center">
                        <Button
                            variant="solid"
                            onClick={this.resetErrorBoundary}
                        >
                            <HStack gap={1.5}>
                                <LuRefreshCw size={16} />
                                <Text as="span">Reintentar</Text>
                            </HStack>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={this.handleGoHome}
                        >
                            <HStack gap={1.5}>
                                <LuHouse size={16} />
                                <Text as="span">Ir al Dashboard</Text>
                            </HStack>
                        </Button>
                    </HStack>

                    {/* Detalle tecnico reservado exclusivamente para entorno de desarrollo */}
                    {isDev && (
                        <Box
                            mt={6}
                            p={3}
                            bg="gray.50"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                            textAlign="left"
                            maxW="600px"
                            w="100%"
                        >
                            <Text fontSize="xs" fontWeight="bold" color="red.700" mb={1}>
                                Informacion tecnica (Solo visible en desarrollo):
                            </Text>
                            <Text fontSize="xs" fontFamily="mono" color="gray.700" whiteSpace="pre-wrap">
                                {error.name}: {error.message}
                            </Text>
                        </Box>
                    )}
                </Flex>
            )
        }

        return children
    }
}

export default ErrorBoundary

