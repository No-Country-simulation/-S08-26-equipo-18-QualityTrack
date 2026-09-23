import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface UseDataTableOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  initialSortField?: keyof T | null;
  initialSortDirection?: SortDirection;
  initialPageSize?: number;
}

export interface UseDataTableReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortField: keyof T | null;
  sortDirection: SortDirection;
  handleSort: (field: keyof T) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  setPageSize: (size: number) => void;
  paginatedData: T[];
  filteredData: T[];
}

/**
 * Hook universal para tablas y listados de datos (Issue #44).
 * Gestiona de forma automática y reactiva:
 * 1. Búsqueda por texto en múltiples campos.
 * 2. Ordenamiento ascendente / descendente por columna.
 * 3. Paginación con cálculo de páginas e índices.
 * Hook universal para tablas y listados de datos.
 * Gestiona búsqueda multicanal, ordenamiento asc/desc y paginación reactiva.
 */
export function useDataTable<T extends Record<string, unknown>>({
  data = [],
  searchFields = [],
  initialSortField = null,
  initialSortDirection = null,
  initialPageSize = 10,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  // 1. Estados de búsqueda, orden y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof T | null>(initialSortField);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // 2. Filtrado por término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || searchFields.length === 0) {
      return data;
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();

    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(normalizedTerm);
      }),
    );
  }, [data, searchTerm, searchFields]);

  // 3. Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Comparación de números
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      // Comparación de texto
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (sortDirection === "asc") {
        return strA.localeCompare(strB);
      }
      return strB.localeCompare(strA);
    });
  }, [filteredData, sortField, sortDirection]);

  // 4. Cálculos de Paginación
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Asegurar que la página actual no quede fuera de rango
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex =
    totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalItems);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  // 5. Manejadores de eventos
  const handleSort = (field: keyof T) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    // Si ya estaba en 'desc', quitamos el orden
    setSortField(null);
    setSortDirection(null);
  };

  const goToPage = (page: number) => {
    const targetPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(targetPage);
  };

  const nextPage = () => goToPage(validCurrentPage + 1);
  const prevPage = () => goToPage(validCurrentPage - 1);

  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize);
    setCurrentPage(1); // Al cambiar tamaño de página volvemos a la 1
    setCurrentPage(1);
  };

  const handleSetSearchTerm = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Al buscar volvemos a la primera página
    setCurrentPage(1);
  };

  return {
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    currentPage: validCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    canNextPage: validCurrentPage < totalPages,
    canPrevPage: validCurrentPage > 1,
    setPageSize,
    paginatedData,
    filteredData: sortedData,
  };
}

export default useDataTable;
