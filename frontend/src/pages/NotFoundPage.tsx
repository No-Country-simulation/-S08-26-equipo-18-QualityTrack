import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuFileQuestion, LuHouse } from "react-icons/lu";
import { Button } from "../components/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Flex
      minH="100vh"
      w="full"
      align="center"
      justify="center"
      bg="gray.50"
      px={4}
    >
      <Box
        maxW="lg"
        w="full"
        bg="white"
        p={{ base: 6, md: 10 }}
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
            bg="blue.50"
            color="blue.600"
          >
            <LuFileQuestion size={32} />
          </Flex>

          <Text
            fontSize="5xl"
            fontWeight="black"
            lineHeight="1"
            color="blue.600"
            fontFamily="mono"
            letterSpacing="tight"
          >
            404
          </Text>

          <Heading size="lg" color="gray.800">
            Pagina no encontrada
          </Heading>

          <Text color="gray.600" fontSize="sm" maxW="sm">
            La direccion a la que intentaste acceder no existe o fue
            trasladada dentro del sistema QualityTrack.
          </Text>

          <Box pt={2}>
            <Button
              colorScheme="blue"
              onClick={() => navigate("/dashboard")}
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