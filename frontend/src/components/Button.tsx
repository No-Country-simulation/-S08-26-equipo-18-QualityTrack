import {Button as ChakraButton, type ButtonProps} from "@chakra-ui/react"

export function Button(props: ButtonProps) {
return <ChakraButton {...props} />
}

export type {ButtonProps}