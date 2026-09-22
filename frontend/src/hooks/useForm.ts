import { useCallback, useState } from "react";
import { ApiError } from "../services/api";
import { validateField, type ValidatorFn } from "../utils/validators";

export type ValidationRules<T> = Partial<{
  [K in keyof T]: ValidatorFn<any>[];
}>;

export interface UseFormOptions<T> {
  initialValues: T;
  rules?: ValidationRules<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  submitError: string | null;
  handleChange: (name: keyof T, value: unknown) => void;
  handleBlur: (name: keyof T) => void;
  setValue: (name: keyof T, value: unknown) => void;
  setFieldError: (name: keyof T, error: string | null) => void;
  handleSubmit: (e?: React.SubmitEvent | React.SyntheticEvent) => Promise<void>;
  reset: (newValues?: T) => void;
  register: (name: keyof T) => {
    name: keyof T;
    value: string | number | readonly string[] | undefined;
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => void;
    onBlur: () => void;
  };
}

/**
 * Hook universal para gestión y validación de formularios (Issue #43).
 * Maneja valores reactivos, validaciones instantáneas por campo, estados de envío y captura de errores de backend.
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  rules = {},
  onSubmit,
  onSuccess,
  resetOnSuccess = false,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Valida un solo campo según sus reglas configuradas
  const validateSingleField = useCallback(
    (name: keyof T, value: unknown) => {
      const fieldRules = rules[name];
      if (!fieldRules || fieldRules.length === 0) return null;
      return validateField(value as T[keyof T], fieldRules);
    },
    [rules],
  );

  // Valida todos los campos del formulario
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field of Object.keys(rules) as (keyof T)[]) {
      const error = validateSingleField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [rules, values, validateSingleField]);

  const handleChange = useCallback(
    (name: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Si el campo ya había sido tocado, validamos en tiempo real
      if (touched[name]) {
        const error = validateSingleField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      }
    },
    [touched, validateSingleField],
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateSingleField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
    },
    [values, validateSingleField],
  );

  const setValue = useCallback((name: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string | null) => {
    setErrors((prev) => ({ ...prev, [name]: error || undefined }));
  }, []);

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setSubmitError(null);
    },
    [initialValues],
  );

  const handleSubmit = async (e?: React.SubmitEvent | React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(values) as (keyof T)[]) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    const isValid = validateAll();
    if (!isValid) {
      setSubmitError("Por favor revisa los campos señalados antes de guardar.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(values);
      onSuccess?.();
      if (resetOnSuccess) {
        reset();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Si el backend devolvió mensajes específicos en su objeto de datos
        const backendData = err.data as Record<string, unknown> | undefined;
        if (Array.isArray(backendData?.message)) {
          setSubmitError(backendData.message.join(", "));
        } else {
          setSubmitError(
            err.message ||
              "Ocurrió un error al procesar la solicitud en el servidor.",
          );
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Ocurrió un error inesperado al guardar el formulario.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = (name: keyof T) => ({
    name,
    value:
      (values[name] as string | number | readonly string[] | undefined) ?? "",
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    setValue,
    setFieldError,
    handleSubmit,
    reset,
    register,
  };
}

export default useForm;
