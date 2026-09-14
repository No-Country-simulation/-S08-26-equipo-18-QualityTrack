import {Dialog as ChakraDialog, type DialogRootProps} from "@chakra-ui/react"

export interface ModalProps extends DialogRootProps {
    title?: React.ReactNode
    children: React.ReactNode
    footer?: React.ReactNode
}

export function Modal ({ title, children, footer, ...props}: ModalProps) {
    return (
        <ChakraDialog.Root {...props}>
            <ChakraDialog.Backdrop />
            <ChakraDialog.Positioner>
                <ChakraDialog.Content>
                    {title && (
                        <ChakraDialog.Header>
                            <ChakraDialog.Title>{title}</ChakraDialog.Title>
                        </ChakraDialog.Header>
                    )}
                    <ChakraDialog.Body>{children}</ChakraDialog.Body>
                    {footer && <ChakraDialog.Footer>{footer}</ChakraDialog.Footer>}
                    <ChakraDialog.CloseTrigger />
                </ChakraDialog.Content>
            </ChakraDialog.Positioner>
        </ChakraDialog.Root>
    )
}