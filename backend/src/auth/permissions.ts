// Política de las acciones implementadas. Se amplía junto con cada API nueva.
export type Permission = 'clients:view' | 'clients:create' | 'clients:edit' | 'clients:delete' | 'users:view' | 'users:manage'
    | 'requests:view' | 'requests:create' | 'requests:edit' | 'quotations:view' | 'quotations:create' | 'quotations:edit' | 'quotations:approve' | 'workOrders:view' | 'workOrders:create' | 'workOrders:edit' | 'workOrders:approve' | 'workOrders:plan' | 'workOrders:assign' | 'workOrders:execute' | 'quality:view' | 'quality:inspect' | 'deliveries:view' | 'deliveries:create' | 'deliveries:edit';

const COMMERCIAL: readonly Permission[] = ['requests:view', 'requests:create', 'requests:edit', 'quotations:view', 'quotations:create', 'quotations:edit'];

const ROLE_PERMISSIONS: ReadonlyMap<string, readonly Permission[]> = new Map([
    ['administrador', ['clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'users:view', 'users:manage', ...COMMERCIAL, 'quotations:approve', 'workOrders:view', 'workOrders:create', 'workOrders:edit', 'workOrders:approve', 'workOrders:plan', 'workOrders:assign', 'workOrders:execute', 'quality:view', 'quality:inspect', 'deliveries:view', 'deliveries:create', 'deliveries:edit']],
    ['supervisor', ['clients:view', 'clients:create', 'clients:edit', ...COMMERCIAL, 'quotations:approve', 'workOrders:view', 'workOrders:create', 'workOrders:edit', 'workOrders:approve', 'workOrders:plan', 'workOrders:assign', 'workOrders:execute', 'quality:view', 'deliveries:view', 'deliveries:create', 'deliveries:edit']],
    ['calidad', ['workOrders:view', 'quality:view', 'quality:inspect', 'deliveries:view']],
    ['administracion', ['clients:view', 'clients:create', 'clients:edit', ...COMMERCIAL, 'deliveries:view', 'deliveries:create', 'deliveries:edit']],
    ['produccion', ['requests:view', 'workOrders:view', 'workOrders:execute', 'quality:view']],
]);

export function hasPermission(roleName: string, permission: Permission): boolean {
    const role = roleName.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
    return ROLE_PERMISSIONS.get(role)?.includes(permission) ?? false;
}
