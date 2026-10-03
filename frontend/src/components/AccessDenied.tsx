import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuHouse, LuShieldAlert } from "react-icons/lu";
import { Button } from "./Button";

export interface AccessDeniedProps {
  title?: string;
  message?: string;
  redirectTo?: string;
}

export function AccessDenied({
  title = "Acceso no autorizado",
  message = "No tienes los permisos necesarios para acceder a esta seccion. Contacta al administrador si necesitas acceso a este modulo.",
  redirectTo = "/dashboard",
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <Flex
      minH="60vh"
      w="full"
      align="center"
      justify="center"
      p={{ base: 4, md: 8 }}
    >
      <Box
        maxW="md"
        w="full"
        bg="white"
        p={{ base: 6, md: 8 }}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
        textAlign="center"
      >
        <VStack gap={4}>
          <Flex
            w={16}
            h={16}
            align="center"
            justify="center"
            borderRadius="full"
            bg="red.50"
            color="red.600"
          >
            <LuShieldAlert size={32} />
          </Flex>

          <Heading size="lg" color="gray.800">
            {title}
          </Heading>

          <Text color="gray.600" fontSize="sm">
            {message}
          </Text>

          <Box pt={2}>
            <Button
              colorScheme="blue"
              onClick={() => navigate(redirectTo)}
            >
              <LuHouse style={{ marginRight: "8px" }} />
              Volver al Dashboard
            </Button>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}

export default AccessDenied;
