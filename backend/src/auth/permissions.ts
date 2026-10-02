// Política de las acciones implementadas. Se amplía junto con cada API nueva.
export type Permission = 'clients:view' | 'clients:create' | 'clients:edit' | 'clients:delete' | 'users:view' | 'users:manage';

const ROLE_PERMISSIONS: ReadonlyMap<string, readonly Permission[]> = new Map([
    ['administrador', ['clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'users:view', 'users:manage']],
    ['supervisor', ['clients:view', 'clients:create', 'clients:edit']],
    ['administracion', ['clients:view', 'clients:create', 'clients:edit']],
]);

export function hasPermission(roleName: string, permission: Permission): boolean {
    const role = roleName.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
    return ROLE_PERMISSIONS.get(role)?.includes(permission) ?? false;
}
