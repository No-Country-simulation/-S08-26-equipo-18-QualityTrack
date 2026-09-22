import { describe, expect, it } from 'vitest'
import { ApiError } from '../../services/api'
import { getErrorMessage } from '../errorHandler'

describe('Utilidad de manejo de errores (getErrorMessage)', () => {
    it('debe devolver mensaje adecuado para errores HTTP de ApiError (400, 401, 403, 404, 500)', () => {
        const error400 = new ApiError('Solicitud invalida', 400)
        expect(getErrorMessage(error400)).toBe('Los datos enviados son invalidos. Por favor, verifica la informacion.')

        const error401 = new ApiError('No autorizado', 401)
        expect(getErrorMessage(error401)).toBe('Tu sesion ha expirado o no es valida. Por favor, inicia sesion nuevamente.')

        const error403 = new ApiError('Acceso denegado', 403)
        expect(getErrorMessage(error403)).toBe('No tienes los permisos necesarios para realizar esta accion.')

        const error404 = new ApiError('No encontrado', 404)
        expect(getErrorMessage(error404)).toBe('El recurso solicitado no fue encontrado o ha sido eliminado.')

        const error500 = new ApiError('Internal Server Error', 500)
        expect(getErrorMessage(error500)).toBe('El servidor experimento un problema interno. Intenta nuevamente en unos momentos.')
    })

    it('debe identificar errores de red o fallo de conexion con el backend', () => {
        const networkError = new TypeError('Failed to fetch')
        expect(getErrorMessage(networkError)).toBe(
            'No se pudo establecer conexion con el servidor. Verifica tu conexion de red o el estado del sistema MES.',
        )
    })

    it('debe retornar el mensaje de una instancia estandar de Error', () => {
        const genericError = new Error('Error al calcular dimensiones de la pieza')
        expect(getErrorMessage(genericError)).toBe('Error al calcular dimensiones de la pieza')
    })

    it('debe devolver un texto seguro si se pasa un string o valor nulo', () => {
        expect(getErrorMessage('Mensaje directo')).toBe('Mensaje directo')
        expect(getErrorMessage(null)).toBe('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.')
        expect(getErrorMessage(undefined)).toBe('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.')
    })
})

