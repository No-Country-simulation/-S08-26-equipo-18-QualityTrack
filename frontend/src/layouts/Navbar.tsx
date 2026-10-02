import {
  Avatar,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Separator,
  Text,
} from "@chakra-ui/react";
import { LuBell, LuLogOut } from "react-icons/lu";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "QT";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Usuario";
  const roleName = user?.role?.name ?? "Operador";

  return (
    <Flex
      as="header"
      h="64px"
      align="center"
      justify="space-between"
      px={6}
      bg="white"
      borderBottomWidth="1px"
      borderColor="border.subtle"
      position="sticky"
      top={0}
      zIndex={10}
    >
      {/* Identificación del producto; no simula un monitor del backend. */}
      <HStack gap={2.5}>
        <Text fontSize="xs" color="gray.500" fontWeight="medium">
          QualityTrack · gestión de planta
        </Text>
      </HStack>

      {/* Acciones del usuario: Alertas + Menú de Perfil */}
      <HStack gap={3}>
        {/* Botón de alertas */}
        <IconButton
          aria-label="Alertas del sistema"
          variant="ghost"
          size="sm"
          color="gray.500"
          _hover={{ bg: "gray.100", color: "gray.700" }}
        >
          <LuBell size={18} />
        </IconButton>

        <Box h={6} w="1px" bg="border.subtle" />

        {/* Menú de Perfil y Logout */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <HStack
              gap={2.5}
              px={2}
              py={1.5}
              borderRadius="lg"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              transition="background-color 0.15s ease"
            >
              <Avatar.Root size="sm" colorPalette="brand">
                <Avatar.Fallback name={fullName}>{initials}</Avatar.Fallback>
              </Avatar.Root>
              <Box textAlign="left" display={{ base: "none", sm: "block" }}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="gray.800"
                  lineHeight={1.2}
                >
                  {fullName}
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight={1.2}>
                  {roleName}
                </Text>
              </Box>
            </HStack>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="220px">
                <Box px={3} py={2}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.800">
                    {fullName}
                  </Text>
                  <Text fontSize="xs" color="gray.500" truncate>
                    {user?.email}
                  </Text>
                </Box>
                <Separator />
                <Menu.Item
                  value="logout"
                  color="red.600"
                  cursor="pointer"
                  onClick={() => logout()}
                >
                  <LuLogOut size={16} />
                  Cerrar sesión
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </HStack>
    </Flex>
  );
}
