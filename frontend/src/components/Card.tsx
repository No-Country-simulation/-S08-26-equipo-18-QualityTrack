import {Card as ChakraCard, type CardRootProps} from "@chakra-ui/react"

export interface CardProps extends Omit<CardRootProps, 'title'> {
    title?: React.ReactNode
    description?: React.ReactNode
    footer?:React.ReactNode
}

export function Card ({ title, description, footer, children, ...props }: CardProps) {
        return (
        <ChakraCard.Root {...props}>
            {(title || description) && (
                <ChakraCard.Header>
                    {title && <ChakraCard.Title>{title}</ChakraCard.Title>}
                    {description && <ChakraCard.Description>{description}</ChakraCard.Description>}
                </ChakraCard.Header>
            )}
            <ChakraCard.Body>{children}</ChakraCard.Body>
            {footer && <ChakraCard.Footer>{footer}</ChakraCard.Footer>}
        </ChakraCard.Root>
    )
}