import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { requirePermission } from '$lib/server/auth/rbac';
import { verifyReauth } from '$lib/server/reauth';
import { audit } from '$lib/server/security/audit';

export const trailingSlash = 'always';

// Neutraliza inyección de fórmulas en Excel/Sheets (=, +, -, @) y escapa comillas
const cell = (v: unknown) => {
	let s = v === null || v === undefined ? '' : String(v);
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return `"${s.replace(/"/g, '""')}"`;
};

export const POST: RequestHandler = async (event) => {
	requirePermission(event, 'lead:write');
	const form = await event.request.formData();
	if (!(await verifyReauth(event, form.get('code')))) error(403, 'Código MFA inválido. La exportación no se realizó.');
	const res = await db.execute(sql`SELECT l.created_at, l.type, l.status, l.first_name, l.last_name, l.email, l.phone,
		l.preferred_channel, l.comuna, p.title AS property, l.message, l.source_page
		FROM leads l LEFT JOIN properties p ON p.id = l.property_id WHERE l.status <> 'spam' ORDER BY l.created_at DESC`);
	const rows = res.rows as Record<string, unknown>[];
	const header = ['fecha', 'tipo', 'estado', 'nombre', 'apellidos', 'correo', 'telefono', 'canal', 'comuna', 'propiedad', 'mensaje', 'origen'];
	const csv = [header.join(','), ...rows.map((r) => Object.values(r).map(cell).join(','))].join('\r\n');
	await audit(event, 'lead.export', 'lead', null, { rows: rows.length });
	return new Response('﻿' + csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="leads-mallerym-${new Date().toISOString().slice(0, 10)}.csv"`,
			'Cache-Control': 'no-store'
		}
	});
};
