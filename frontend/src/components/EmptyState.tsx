import { EmptyState as ChakraEmptyState, type EmptyStateRootProps} from "@chakra-ui/react";

export interface EmptyStateProps extends Omit<EmptyStateRootProps, 'title'> {
    title: string
    description?: string
    icon?: React.ReactNode
    action?: React.ReactNode
}

export function EmptyState ({title, description, icon, action, ...props}: EmptyStateProps) {
    return <ChakraEmptyState.Root {...props}>
        <ChakraEmptyState.Content>
            {icon && <ChakraEmptyState.Indicator> {icon} </ChakraEmptyState.Indicator>}
            {title && <ChakraEmptyState.Title> {title} </ChakraEmptyState.Title>}
            {description && <ChakraEmptyState.Description> {description} </ChakraEmptyState.Description>}
            {action}
        </ChakraEmptyState.Content>
    </ChakraEmptyState.Root>
}