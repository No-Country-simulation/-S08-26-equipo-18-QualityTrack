import { Box, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import {
  LuArrowDown,
  LuArrowUp,
  LuArrowUpDown,
  LuChevronLeft,
  LuChevronRight,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { useDataTable } from "../hooks/useDataTable";
import { ApiStateBoundary } from "./ApiStateBoundary";
import { Button } from "./Button";
import { Input } from "./Input";
import { Table } from "./Table";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data?: T[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchFields?: (keyof T)[];
  searchPlaceholder?: string;
  actions?: (item: T) => React.ReactNode;
  toolbarActions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  initialPageSize?: number;
}

/**
 * Componente universal de Tablas y Listados para QualityTrack (Issue #44).
 * Incluye buscador reactivo, ordenamiento por columnas, paginación y acciones por fila.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data = [],
  loading = false,
  error = null,
  onRetry,
  searchFields = [],
  searchPlaceholder = "Buscar en los registros...",
  actions,
  toolbarActions,
  emptyTitle = "No hay registros disponibles",
  emptyDescription = "Todavía no se han cargado datos para esta sección.",
  initialPageSize = 10,
}: DataTableProps<T>) {
  const tableData = data ?? [];

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
    paginatedData,
  } = useDataTable<T>({
    data: tableData,
    searchFields,
    initialPageSize,
  });

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      overflow="hidden"
    >
      {/* Barra de herramientas superior */}
      <Flex
        p={4}
        gap={3}
        align="center"
        justify="space-between"
        wrap="wrap"
        borderBottomWidth="1px"
        borderColor="border.subtle"
        bg="white"
      >
        <Flex
          align="center"
          gap={2}
          flex="1"
          minW={{ base: "100%", md: "280px" }}
          maxW="420px"
        >
          <Box position="relative" w="100%">
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color="gray.400"
              pointerEvents="none"
            >
              <LuSearch size={16} />
            </Box>
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              pl={9}
              pr={searchTerm ? 8 : 3}
              size="sm"
              borderRadius="lg"
            />
            {searchTerm && (
              <IconButton
                aria-label="Limpiar búsqueda"
                variant="ghost"
                size="2xs"
                position="absolute"
                right={2}
                top="50%"
                transform="translateY(-50%)"
                onClick={() => setSearchTerm("")}
                color="gray.400"
              >
                <LuX size={14} />
              </IconButton>
            )}
          </Box>
        </Flex>

        {toolbarActions && (
          <HStack gap={2} wrap="wrap">
            {toolbarActions}
          </HStack>
        )}
      </Flex>

      {/* Cuerpo de la tabla con ApiStateBoundary */}
      <ApiStateBoundary
        loading={loading}
        error={error}
        data={tableData}
        onRetry={onRetry}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      >
        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline" borderWidth={0}>
            <Table.Header bg="gray.50">
              <Table.Row>
                {columns.map((col, index) => {
                  const isSorted =
                    col.accessorKey && sortField === col.accessorKey;
                  return (
                    <Table.ColumnHeader
                      key={index}
                      w={col.width}
                      textAlign={col.align || "left"}
                      py={3}
                      px={4}
                      fontWeight="semibold"
                      color="gray.600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                      cursor={
                        col.sortable && col.accessorKey ? "pointer" : "default"
                      }
                      onClick={() =>
                        col.sortable &&
                        col.accessorKey &&
                        handleSort(col.accessorKey)
                      }
                      _hover={col.sortable ? { bg: "gray.100" } : undefined}
                    >
                      <Flex
                        align="center"
                        gap={1.5}
                        justify={
                          col.align === "right"
                            ? "flex-end"
                            : col.align === "center"
                              ? "center"
                              : "flex-start"
                        }
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <Box color={isSorted ? "brand.600" : "gray.400"}>
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <LuArrowUp size={14} />
                              ) : (
                                <LuArrowDown size={14} />
                              )
                            ) : (
                              <LuArrowUpDown size={13} />
                            )}
                          </Box>
                        )}
                      </Flex>
                    </Table.ColumnHeader>
                  );
                })}

                {actions && (
                  <Table.ColumnHeader
                    textAlign="right"
                    py={3}
                    px={4}
                    fontWeight="semibold"
                    color="gray.600"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    Acciones
                  </Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {paginatedData.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={columns.length + (actions ? 1 : 0)}
                    textAlign="center"
                    py={8}
                    color="gray.500"
                  >
                    No se encontraron resultados para "{searchTerm}".
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedData.map((item, rowIndex) => (
                  <Table.Row
                    key={rowIndex}
                    _hover={{ bg: "gray.50" }}
                    transition="background-color 0.15s ease"
                  >
                    {columns.map((col, colIndex) => {
                      const cellValue = col.cell
                        ? col.cell(item)
                        : col.accessorKey
                          ? String(item[col.accessorKey] ?? "—")
                          : "—";

                      return (
                        <Table.Cell
                          key={colIndex}
                          textAlign={col.align || "left"}
                          px={4}
                          py={3.5}
                          fontSize="sm"
                          color="gray.700"
                        >
                          {cellValue}
                        </Table.Cell>
                      );
                    })}

                    {actions && (
                      <Table.Cell textAlign="right" px={4} py={3.5}>
                        <Flex justify="flex-end" gap={1}>
                          {actions(item)}
                        </Flex>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Barra de paginación inferior */}
        <Flex
          p={3.5}
          px={4}
          align="center"
          justify="space-between"
          borderTopWidth="1px"
          borderColor="border.subtle"
          bg="white"
          fontSize="xs"
          color="gray.600"
          wrap="wrap"
          gap={2}
        >
          <Text>
            Mostrando{" "}
            <Text as="span" fontWeight="semibold" color="gray.800">
              {startIndex}
            </Text>{" "}
            a{" "}
            <Text as="span" fontWeight="semibold" color="gray.800">
              {endIndex}
            </Text>{" "}
            de{" "}
            <Text as="span" fontWeight="semibold" color="gray.800">
              {totalItems}
            </Text>{" "}
            registros
            {searchTerm && ` (filtrados de ${tableData.length})`}
          </Text>

          <HStack gap={1.5}>
            <Button
              size="xs"
              variant="outline"
              onClick={prevPage}
              disabled={!canPrevPage}
            >
              <LuChevronLeft size={14} /> Anterior
            </Button>

            <Text px={2} fontWeight="medium">
              Página {currentPage} de {totalPages}
            </Text>

            <Button
              size="xs"
              variant="outline"
              onClick={nextPage}
              disabled={!canNextPage}
            >
              Siguiente <LuChevronRight size={14} />
            </Button>
          </HStack>
        </Flex>
      </ApiStateBoundary>
    </Box>
  );
}

export default DataTable;
