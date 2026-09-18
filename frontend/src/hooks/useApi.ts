import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../services/api";

export interface UseApiOptions<T> {
  immediate?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export interface UseApiReturn<T, Args extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  retry: () => Promise<T | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Traduce cualquier error técnico a un mensaje claro y amigable en español para el usuario.
 */
export function formatApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "Los datos enviados no son válidos.";
      case 401:
        return "Tu sesión ha expirado o no es válida. Por favor inicia sesión nuevamente.";
      case 403:
        return "No tienes los permisos necesarios para realizar esta operación.";
      case 404:
        return (
          error.message || "El registro o recurso solicitado no fue encontrado."
        );
      case 500:
      case 502:
      case 503:
        return "El servidor de planta no responde o tuvo un fallo interno. Intenta más tarde.";
      default:
        return (
          error.message || `Error en la solicitud (Código ${error.status}).`
        );
    }
  }

  if (error instanceof Error) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      return "No se pudo conectar con el servidor MES. Comprueba tu conexión de red o si el backend está encendido.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado al procesar la solicitud.";
}

/**
 * Hook reutilizable para gestionar el ciclo de vida de cualquier petición asíncrona a la API.
 * Controla automáticamente: cargando, éxito, error amigable y función de reintento.
 */
export function useApi<T, Args extends unknown[] = []>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseApiOptions<T> = {},
): UseApiReturn<T, Args> {
  const { immediate = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  // Guardamos los últimos argumentos usados para poder reintentar
  const lastArgsRef = useRef<Args>([] as unknown as Args);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      lastArgsRef.current = args;
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const message = formatApiErrorMessage(err);
        setError(message);
        onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError],
  );

  const retry = useCallback(async (): Promise<T | null> => {
    return execute(...lastArgsRef.current);
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      void execute(...([] as unknown as Args));
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    setData,
    setError,
  };
}

export default useApi;
