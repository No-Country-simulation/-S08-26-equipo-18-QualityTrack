import { Textarea as ChakraTextarea, type TextareaProps } from "@chakra-ui/react";

export function Textarea (props: TextareaProps) {
    return <ChakraTextarea {...props} />
}

export type {TextareaProps}