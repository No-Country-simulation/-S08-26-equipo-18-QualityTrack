/** La estrategia visual en el Frontend tiene como único objetivo la experiencia de usuario (UX):
 * adaptar la interfaz gráfica ocultando o deshabilitando botones, vistas y acciones según
 * el rol del usuario para evitar frustración y errores innecesarios.
 */

export type AppRole =
    | 'Administrador'
    | 'Supervisor'
    | 'Producción'
    | 'Calidad'
    | 'Administración'
    | (string & {})

export type Permission =
    // Clientes
    | 'clients:view'
    | 'clients:create'
    | 'clients:edit'
    | 'clients:delete'
    // Solicitudes
    | 'requests:view'
    | 'requests:create'
    | 'requests:edit'
    | 'requests:delete'
    // Cotizaciones
    | 'quotations:view'
    | 'quotations:create'
    | 'quotations:edit'
    | 'quotations:delete'
    | 'quotations:approve'
    // Órdenes de Trabajo (OT)
    | 'workOrders:view'
    | 'workOrders:create'
    | 'workOrders:edit'
    | 'workOrders:delete'
    | 'workOrders:assign'
    | 'workOrders:execute'
    // Control de Calidad
    | 'quality:view'
    | 'quality:inspect'
    | 'quality:approve'
    // Entregas
    | 'deliveries:view'
    | 'deliveries:create'
    | 'deliveries:edit'
    // Usuarios / Sistema
    | 'users:view'
    | 'users:manage'

/**
 * Matriz de permisos predeterminada por cada rol del negocio.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    administrador: [
        'clients:view',
        'clients:create',
        'clients:edit',
        'clients:delete',
        'requests:view',
        'requests:create',
        'requests:edit',
        'requests:delete',
        'quotations:view',
        'quotations:create',
        'quotations:edit',
        'quotations:delete',
        'quotations:approve',
        'workOrders:view',
        'workOrders:create',
        'workOrders:edit',
        'workOrders:delete',
        'workOrders:assign',
        'workOrders:execute',
        'quality:view',
        'quality:inspect',
        'quality:approve',
        'deliveries:view',
        'deliveries:create',
        'deliveries:edit',
        'users:view',
        'users:manage',
    ],
    supervisor: [
        'clients:view',
        'clients:create',
        'clients:edit',
        'requests:view',
        'requests:create',
        'requests:edit',
        'quotations:view',
        'quotations:create',
        'quotations:edit',
        'quotations:approve',
        'workOrders:view',
        'workOrders:create',
        'workOrders:edit',
        'workOrders:assign',
        'workOrders:execute',
        'quality:view',
        'deliveries:view',
        'deliveries:create',
        'deliveries:edit',
        'users:view',
    ],
    produccion: [
        'requests:view',
        'workOrders:view',
        'workOrders:execute',
        'quality:view',
    ],
    calidad: [
        'workOrders:view',
        'quality:view',
        'quality:inspect',
        'quality:approve',
        'deliveries:view',
    ],
    administracion: [
        'clients:view',
        'clients:create',
        'clients:edit',
        'requests:view',
        'requests:create',
        'requests:edit',
        'quotations:view',
        'quotations:create',
        'quotations:edit',
        'deliveries:view',
        'deliveries:create',
        'deliveries:edit',
    ],
}

