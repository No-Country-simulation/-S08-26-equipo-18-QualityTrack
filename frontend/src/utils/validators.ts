export type ValidatorFn<T = unknown> = (value: T) => string | null

/**
 * Validadores comunes reutilizables para formularios (Issue #43).
 * Retornan un string con el mensaje de error o null si el valor es válido.
 */
export const validators = {
    required(message = 'Este campo es obligatorio'): ValidatorFn {
        return (value) => {
            if (value === null || value === undefined) return message
            if (typeof value === 'string' && !value.trim()) return message
            if (Array.isArray(value) && value.length === 0) return message
            return null
        }
    },

    email(message = 'Ingresa un correo electrónico válido'): ValidatorFn<string> {
        return (value) => {
            if (!value) return null
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(value.trim()) ? null : message
        }
    },

    cuit(message = 'El CUIT debe tener 11 dígitos numéricos'): ValidatorFn<string | number> {
        return (value) => {
            if (!value) return null
            const clean = String(value).replace(/\D/g, '')
            return clean.length === 11 ? null : message
        }
    },

    minLength(min: number, message?: string): ValidatorFn<string> {
        return (value) => {
            if (!value) return null
            const msg = message || `Debe tener al menos ${min} caracteres`
            return value.trim().length >= min ? null : msg
        }
    },

    maxLength(max: number, message?: string): ValidatorFn<string> {
        return (value) => {
            if (!value) return null
            const msg = message || `No puede superar los ${max} caracteres`
            return value.trim().length <= max ? null : msg
        }
    },

    positiveNumber(message = 'Debe ser un número mayor a 0'): ValidatorFn<number | string> {
        return (value) => {
            if (value === null || value === undefined || value === '') return null
            const num = Number(value)
            return !isNaN(num) && num > 0 ? null : message
        }
    },

    date(message = 'Ingresa una fecha válida y completa'): ValidatorFn<string> {
        return (value) => {
            if (!value) return null
            const trimmed = String(value).trim()
            if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                return message
            }
            const [y, m, d] = trimmed.split('-').map(Number)
            const dateObj = new Date(y, m - 1, d)
            if (
                dateObj.getFullYear() !== y ||
                dateObj.getMonth() !== m - 1 ||
                dateObj.getDate() !== d
            ) {
                return message
            }
            return null
        }
    },

    dateAfterOrEqual(getCompareDate: () => string | undefined, message = 'La fecha debe ser igual o posterior a la fecha inicial'): ValidatorFn<string> {
        return (value) => {
            if (!value) return null
            const compare = getCompareDate()
            if (!compare || !compare.trim()) return null
            if (value < compare) {
                return message
            }
            return null
        }
    },

    pattern(regex: RegExp, message: string): ValidatorFn<string> {
        return (value) => {
            if (!value) return null
            return regex.test(value) ? null : message
        }
    },
}

/**
 * Ejecuta una lista de validadores sobre un valor y devuelve el primer error encontrado.
 */
export function validateField<T>(value: T, rules: ValidatorFn<T>[] = []): string | null {
    for (const rule of rules) {
        const error = rule(value)
        if (error) return error
    }
    return null
}

