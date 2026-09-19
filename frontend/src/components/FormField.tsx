import { Box, Flex, Text } from "@chakra-ui/react";
import { LuCircleAlert } from "react-icons/lu";

export interface FormFieldProps {
  label?: React.ReactNode;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Componente universal de campo de formulario (Issue #43).
 * Estandariza la estructura visual de Label, asterisco requerido, Input, texto de ayuda y error.
 */
export function FormField({
  label,
  required = false,
  helperText,
  error,
  children,
}: FormFieldProps) {
  return (
    <Box mb={4} w="100%">
      {label && (
        <Flex align="center" gap={1} mb={1.5}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {label}
          </Text>
          {required && (
            <Text as="span" color="red.500" fontWeight="bold">
              *
            </Text>
          )}
        </Flex>
      )}

      {children}

      {error ? (
        <Flex align="center" gap={1.5} mt={1.5} color="red.600">
          <LuCircleAlert size={14} />
          <Text fontSize="xs" fontWeight="medium">
            {error}
          </Text>
        </Flex>
      ) : helperText ? (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {helperText}
        </Text>
      ) : null}
    </Box>
  );
}

export default FormField;
