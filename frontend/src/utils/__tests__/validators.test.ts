import { describe, expect, it } from 'vitest'
import { validators } from '../validators'

describe('Motor de validadores (Prueba de lógica y validaciones)', () => {
    it('required: debe retornar error para valores vacíos y null para válidos', () => {
        const validate = validators.required('Campo requerido')
        expect(validate('')).toBe('Campo requerido')
        expect(validate('   ')).toBe('Campo requerido')
        expect(validate(null)).toBe('Campo requerido')
        expect(validate('Acero SAE 1045')).toBeNull()
    })

    it('email: debe validar formato de correo electrónico', () => {
        const validate = validators.email('Email inválido')
        expect(validate('invalido')).toBe('Email inválido')
        expect(validate('invalido@')).toBe('Email inválido')
        expect(validate('admin@qualitytrack.com')).toBeNull()
    })

    it('cuit: debe validar 11 números', () => {
        const validate = validators.cuit('CUIT inválido')
        expect(validate('123')).toBe('CUIT inválido')
        expect(validate('30712345678')).toBeNull()
    })

    it('positiveNumber: debe aceptar números positivos y rechazar negativos o cero', () => {
        const validate = validators.positiveNumber('Debe ser mayor a cero')
        expect(validate(-5)).toBe('Debe ser mayor a cero')
        expect(validate(0)).toBe('Debe ser mayor a cero')
        expect(validate(25)).toBeNull()
    })
})

