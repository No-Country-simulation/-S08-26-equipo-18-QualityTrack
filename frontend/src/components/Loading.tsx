import { Spinner as ChakraSpinner, type SpinnerProps } from '@chakra-ui/react'

export function Loading(props: SpinnerProps) {
    return <ChakraSpinner {...props} />
}

export type { SpinnerProps as LoadingProps }

