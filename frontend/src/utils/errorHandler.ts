import { ApiError } from '../services/api'

export interface ErrorReportContext {
    componentStack?: string | null
    route?: string
    action?: string
    [key: string]: unknown
}

/**
 * Normaliza cualquier tipo de error (API, red, JavaScript, desconocido)
 * y devuelve un mensaje claro, seguro y comprensible para el usuario final.
 * Evita exponer detalles tecnicos sensibles en pantalla.
 */
export function getErrorMessage(error: unknown): string {
    if (!error) {
        return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
    }

    // 1. Errores HTTP controlados del cliente API
    if (error instanceof ApiError) {
        switch (error.status) {
            case 400:
                return 'Los datos enviados son invalidos. Por favor, verifica la informacion.'
            case 401:
                return 'Tu sesion ha expirado o no es valida. Por favor, inicia sesion nuevamente.'
            case 403:
                return 'No tienes los permisos necesarios para realizar esta accion.'
            case 404:
                return 'El recurso solicitado no fue encontrado o ha sido eliminado.'
            case 409:
                return 'Existe un conflicto con el registro actual. Es posible que ya exista.'
            case 422:
                return 'No se pudo procesar la solicitud debido a inconsistencias en los datos.'
            case 500:
            case 502:
            case 503:
            case 504:
                return 'El servidor experimento un problema interno. Intenta nuevamente en unos momentos.'
            default:
                return error.message || 'Ocurrio un error al comunicarse con el servidor.'
        }
    }

    // 2. Errores de conexion de red o servidor no disponible
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'No se pudo establecer conexion con el servidor. Verifica tu conexion de red o el estado del sistema MES.'
    }

    // 3. Instancias estandar de Error de JavaScript
    if (error instanceof Error) {
        // En desarrollo se puede mostrar el mensaje; en produccion se priorizan mensajes amigables
        return error.message || 'Ha ocurrido un error inesperado en la aplicacion.'
    }

    // 4. Mensajes enviados directamente como texto
    if (typeof error === 'string') {
        return error
    }

    // Fallback general
    return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
}

/**
 * Registra los errores en consola durante desarrollo y prepara la infraestructura
 * para integraciones futuras con servicios de monitoreo y telemetria (ej. Sentry, Datadog).
 */
export function logError(error: unknown, context?: ErrorReportContext | string): void {
    const isDevelopment = import.meta.env.DEV

    if (isDevelopment) {
        console.group('[QualityTrack Error Handler]')
        console.error('Detalle del error:', error)
        if (context) {
            console.info('Contexto:', context)
        }
        console.groupEnd()
    }

    // Punto de extension preparado para proveedores de telemetria en produccion
}

