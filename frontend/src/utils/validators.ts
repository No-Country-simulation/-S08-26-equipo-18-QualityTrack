export type ValidatorFn<T = unknown> = (value: T) => string | null;

export function onlyDigits(value: string | number): string {
  return String(value).replace(/\D/g, "");
}

export function isValidCuit(value: string | number): boolean {
  return /^[\d.\s-]+$/.test(String(value)) && onlyDigits(value).length === 11;
}

/**
 * Validadores comunes reutilizables para formularios (Issue #43).
 * Retornan un string con el mensaje de error o null si el valor es valido.
 */
export const validators = {
  required(message = "Este campo es obligatorio"): ValidatorFn {
    return (value) => {
      if (value === null || value === undefined) return message;
      if (typeof value === "string" && !value.trim()) return message;
      if (Array.isArray(value) && value.length === 0) return message;
      return null;
    };
  },

  email(message = "Ingresa un correo electronico valido"): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value.trim()) ? null : message;
    };
  },

  cuit(message = "El CUIT debe tener 11 digitos numericos"): ValidatorFn<string | number> {
    return (value) => {
      if (!value) return null;
      return isValidCuit(value) ? null : message;
    };
  },

  phone(message?: string): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      const trimmed = String(value).trim();
      if (!/^\+?[\d\s\-()]+$/.test(trimmed)) {
        return message || 'El telefono solo puede contener numeros, espacios, guiones y el prefijo "+"';
      }
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 7) {
        return "El telefono debe tener al menos 7 digitos";
      }
      if (digits.length > 15) {
        return "El telefono no puede superar los 15 digitos numericos";
      }
      return null;
    };
  },

  alphabetic(message = "Solo se permiten letras y espacios"): ValidatorFn<string> {
    return (value) => {
      if (!value || !String(value).trim()) return null;
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
      return regex.test(String(value).trim()) ? null : message;
    };
  },

  minLength(min: number, message?: string): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      const msg = message || `Debe tener al menos ${min} caracteres`;
      return value.trim().length >= min ? null : msg;
    };
  },

  maxLength(max: number, message?: string): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      const msg = message || `No puede superar los ${max} caracteres`;
      return value.trim().length <= max ? null : msg;
    };
  },

  positiveNumber(message = "Debe ser un numero mayor a 0"): ValidatorFn<number | string> {
    return (value) => {
      if (value === null || value === undefined || value === "") return null;
      const num = Number(value);
      return !isNaN(num) && num > 0 ? null : message;
    };
  },

  date(message = "Ingresa una fecha valida y completa"): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      const trimmed = String(value).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return message;
      }
      const [y, m, d] = trimmed.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      if (
        dateObj.getFullYear() !== y ||
        dateObj.getMonth() !== m - 1 ||
        dateObj.getDate() !== d
      ) {
        return message;
      }
      return null;
    };
  },

  dateAfterOrEqual(
    getCompareDate: () => string | undefined,
    message = "La fecha debe ser igual o posterior a la fecha inicial",
  ): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      const compare = getCompareDate();
      if (!compare || !compare.trim()) return null;
      if (value < compare) {
        return message;
      }
      return null;
    };
  },

  pattern(regex: RegExp, message: string): ValidatorFn<string> {
    return (value) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    };
  },
};

/**
 * Ejecuta una lista de validadores sobre un valor y devuelve el primer error encontrado.
 */
export function validateField<T>(value: T, rules: ValidatorFn<T>[] = []): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}
