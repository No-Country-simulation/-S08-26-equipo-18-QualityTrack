import { Alert as ChakraAlert, type AlertRootProps } from "@chakra-ui/react";

export interface AlertProps extends Omit<AlertRootProps, 'title'> {
    title: React.ReactNode
    description?: React.ReactNode
}

export function Alert ({ title, description, ...props }: AlertProps) {
    return ( 
        <ChakraAlert.Root {...props}>
        <ChakraAlert.Indicator />
        <ChakraAlert.Title> {title} </ChakraAlert.Title>
        {description && <ChakraAlert.Description> {description} </ChakraAlert.Description>}
        </ChakraAlert.Root>
    )
}
