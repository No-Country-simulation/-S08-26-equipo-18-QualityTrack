import type { IconType } from "react-icons";
import { Link as RouterLink, NavLink } from "react-router-dom";
import { Box, Flex, IconButton, Link, Stack, Text } from "@chakra-ui/react";
import {
  LuBuilding2,
  LuChevronLeft,
  LuCircleDollarSign,
  LuFileText,
  LuLayoutDashboard,
  LuMenu,
  LuShieldCheck,
  LuTruck,
  LuWrench,
} from "react-icons/lu";
import { Can } from "../components/Can";
import type { Permission } from "../types/permissions";

const SIDEBAR_WIDTH_EXPANDED = "250px";
const SIDEBAR_WIDTH_COLLAPSED = "72px";

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: IconType;
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LuLayoutDashboard },
  {
    label: "Clientes",
    to: "/clients",
    icon: LuBuilding2,
    permission: "clients:view",
  },
  {
    label: "Solicitudes",
    to: "/requests",
    icon: LuFileText,
    permission: "requests:view",
  },
  {
    label: "Cotizaciones",
    to: "/quotations",
    icon: LuCircleDollarSign,
    permission: "quotations:view",
  },
  {
    label: "Órdenes de trabajo",
    to: "/work-orders",
    icon: LuWrench,
    permission: "workOrders:view",
  },
  {
    label: "Calidad",
    to: "/quality",
    icon: LuShieldCheck,
    permission: "quality:view",
  },
  {
    label: "Entregas",
    to: "/deliveries",
    icon: LuTruck,
    permission: "deliveries:view",
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <Flex
      as="nav"
      direction="column"
      w={collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}
      flexShrink={0}
      bg="white"
      borderRightWidth="1px"
      borderColor="border.subtle"
      transition="width 0.2s ease"
      overflow="hidden"
      position="sticky"
      top={0}
      h="100vh"
    >
      {/* Cabecera del Sidebar */}
      <Flex
        align="center"
        justify={collapsed ? "center" : "space-between"}
        h="64px"
        px={collapsed ? 0 : 4}
        borderBottomWidth="1px"
        borderColor="border.subtle"
        flexShrink={0}
      >
        {!collapsed && (
          <Link
            asChild
            fontWeight="bold"
            fontSize="md"
            color="gray.800"
            textDecoration="none"
          >
            <RouterLink to="/dashboard">
              Quality
              <Text as="span" color="brand.600">
                Track
              </Text>
            </RouterLink>
          </Link>
        )}

        <IconButton
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          onClick={onToggle}
          variant="ghost"
          size="sm"
          color="gray.500"
        >
          {collapsed ? <LuMenu size={18} /> : <LuChevronLeft size={18} />}
        </IconButton>
      </Flex>

      {/* Lista de navegación */}
      <Stack gap={1} px={collapsed ? 2 : 3} py={4} flex="1" overflowY="auto">
        {NAV_ITEMS.map((item) => (
          <Can key={item.to} perform={item.permission}>
            <NavLink to={item.to} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Flex
                  align="center"
                  gap={3}
                  px={collapsed ? 0 : 3}
                  py={2.5}
                  borderRadius="lg"
                  fontSize="sm"
                  fontWeight={isActive ? "semibold" : "medium"}
                  color={isActive ? "brand.700" : "gray.600"}
                  bg={isActive ? "brand.50" : "transparent"}
                  justify={collapsed ? "center" : "flex-start"}
                  _hover={{
                    bg: isActive ? "brand.50" : "gray.100",
                    color: isActive ? "brand.700" : "gray.900",
                  }}
                  transition="background-color 0.15s ease"
                >
                  <item.icon size={20} />
                  {!collapsed && (
                    <Text as="span" whiteSpace="nowrap">
                      {item.label}
                    </Text>
                  )}
                </Flex>
              )}
            </NavLink>
          </Can>
        ))}
      </Stack>

      {/* Pie de versión */}
      {!collapsed && (
        <Box
          px={4}
          py={3}
          borderTopWidth="1px"
          borderColor="border.subtle"
          flexShrink={0}
        >
          <Text fontSize="xs" color="gray.400" fontFamily="mono">
            v1.0.0 · MES
          </Text>
        </Box>
      )}
    </Flex>
  );
}
