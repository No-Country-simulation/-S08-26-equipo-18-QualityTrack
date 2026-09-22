import { describe, expect, it } from 'vitest'
import { config, ENV, getEnvVariable } from '../appConfig'

describe('Modulo de configuracion global (Issue #41)', () => {
    it('debe contener los metadatos basicos de la aplicacion', () => {
        expect(config.app.name).toBe('QualityTrack')
        expect(config.app.version).toBe('1.0.0')
        expect(config.app.description).toBe('MES & Control de Calidad')
    })

    it('debe definir las banderas de entorno correctamente', () => {
        expect(typeof config.env.mode).toBe('string')
        expect(typeof config.env.isDev).toBe('boolean')
        expect(typeof config.env.isProd).toBe('boolean')
        expect(typeof config.env.isTest).toBe('boolean')
        expect(config.env.isTest).toBe(true)
    })

    it('debe contener la configuracion de la API con valores por defecto seguros', () => {
        expect(config.api.baseUrl).toBeDefined()
        expect(typeof config.api.baseUrl).toBe('string')
        expect(config.api.baseUrl.length).toBeGreaterThan(0)
        expect(config.api.timeoutMs).toBe(15000)
    })

    it('debe definir parametros de paginacion coherentes para las tablas', () => {
        expect(config.pagination.defaultPageSize).toBe(10)
        expect(Array.isArray(config.pagination.pageSizeOptions)).toBe(true)
        expect(config.pagination.pageSizeOptions).toContain(config.pagination.defaultPageSize)
    })

    it('debe definir opciones de formateo regional para Argentina', () => {
        expect(config.format.locale).toBe('es-AR')
        expect(config.format.currency).toBe('ARS')
        expect(config.format.dateFormat).toBe('DD/MM/YYYY')
    })

    it('debe mantener compatibilidad retroactiva con el objeto ENV', () => {
        expect(ENV.API_URL).toBe(config.api.baseUrl)
    })

    it('debe retornar el fallback cuando la variable de entorno no existe', () => {
        const fallback = getEnvVariable('VITE_VARIABLE_INEXISTENTE', 'valor_por_defecto')
        expect(fallback).toBe('valor_por_defecto')
    })

    it('debe ser un objeto inmutable (Object.isFrozen)', () => {
        expect(Object.isFrozen(config)).toBe(true)
        expect(Object.isFrozen(config.app)).toBe(true)
        expect(Object.isFrozen(config.api)).toBe(true)
        expect(Object.isFrozen(config.env)).toBe(true)
        expect(Object.isFrozen(config.pagination)).toBe(true)
        expect(Object.isFrozen(config.format)).toBe(true)
    })
})

