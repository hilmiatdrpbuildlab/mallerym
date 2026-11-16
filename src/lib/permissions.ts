export type Role = 'super_admin' | 'editor' | 'corredor' | 'viewer';
export type Permission =
	| 'dashboard:read'
	| 'property:write'
	| 'property:publish'
	| 'post:write'
	| 'content:write'
	| 'media:write'
	| 'lead:read'
	| 'lead:write'
	| 'settings:write'
	| 'user:manage'
	| 'audit:read';

// Deny by default: cualquier permiso no listado aquí se rechaza.
const MATRIX: Record<Role, Permission[]> = {
	super_admin: [
		'dashboard:read',
		'property:write',
		'property:publish',
		'post:write',
		'content:write',
		'media:write',
		'lead:read',
		'lead:write',
		'settings:write',
		'user:manage',
		'audit:read'
	],
	editor: [
		'dashboard:read',
		'property:write',
		'property:publish',
		'post:write',
		'content:write',
		'media:write',
		'lead:read'
	],
	corredor: ['dashboard:read', 'property:write', 'media:write', 'lead:read', 'lead:write'],
	viewer: ['dashboard:read']
};

export const ROLE_LABEL: Record<Role, string> = {
	super_admin: 'Super administrador',
	editor: 'Editor',
	corredor: 'Corredora',
	viewer: 'Solo lectura'
};

export function can(role: Role | undefined | null, perm: Permission): boolean {
	return !!role && MATRIX[role].includes(perm);
}
