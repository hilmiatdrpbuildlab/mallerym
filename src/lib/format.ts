export type Operation = 'venta' | 'arriendo_anual' | 'arriendo_temporal';
export type Availability = 'disponible' | 'reservada' | 'vendida' | 'arrendada';
export type PricePeriod = 'total' | 'mes' | 'noche' | 'dia';
export type Currency = 'UF' | 'CLP';

const nf = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export const fmtNumber = (n: number) => nf.format(n);
export const fmtUF = (n: number) => `${nf2.format(n)} UF`;
export const fmtCLP = (n: number) => `$${nf.format(n)}`;
export const fmtM2 = (n: number | null | undefined) => (n ? `${nf.format(n)} m²` : '');

export function fmtPrice(amount: number, currency: Currency) {
	return currency === 'UF' ? fmtUF(amount) : fmtCLP(amount);
}

export const PERIOD_LABEL: Record<PricePeriod, string> = {
	total: '',
	mes: 'mensual',
	noche: 'por noche',
	dia: 'por día'
};

export const OPERATION_LABEL: Record<Operation, string> = {
	venta: 'Venta',
	arriendo_anual: 'Arriendo',
	arriendo_temporal: 'Arriendo temporal'
};

export const OPERATION_SLUG: Record<string, Operation> = {
	venta: 'venta',
	arriendo: 'arriendo_anual',
	'arriendo-temporal': 'arriendo_temporal'
};
export const OPERATION_TO_SLUG: Record<Operation, string> = {
	venta: 'venta',
	arriendo_anual: 'arriendo',
	arriendo_temporal: 'arriendo-temporal'
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
	disponible: 'Disponible',
	reservada: 'Reservada',
	vendida: 'Vendida',
	arrendada: 'Arrendada'
};

export const LEAD_TYPE_LABEL: Record<string, string> = {
	consulta_propiedad: 'Consulta por propiedad',
	quiero_vender: 'Quiere vender',
	quiero_arrendar: 'Quiere arrendar su propiedad',
	diseno: 'Diseño de interiores',
	general: 'Consulta general'
};

export const LEAD_STATUS_LABEL: Record<string, string> = {
	nuevo: 'Nuevo',
	contactado: 'Contactado',
	visita: 'Visita',
	negociacion: 'Negociación',
	cerrado: 'Cerrado',
	spam: 'Spam'
};

export const CHANNEL_LABEL: Record<string, string> = {
	whatsapp: 'WhatsApp',
	correo: 'Correo',
	telefono: 'Teléfono'
};

const df = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
const dfs = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
const dft = new Intl.DateTimeFormat('es-CL', {
	day: '2-digit',
	month: 'short',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: 'America/Santiago'
});
export const fmtDate = (d: Date | string | null | undefined) => (d ? df.format(new Date(d)) : '');
export const fmtDateShort = (d: Date | string | null | undefined) => (d ? dfs.format(new Date(d)) : '');
export const fmtDateTime = (d: Date | string | null | undefined) => (d ? dft.format(new Date(d)) : '');

export function slugify(input: string): string {
	return input
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 90);
}

/** "+56 9 7621 7727" → "56976217727" */
export const phoneDigits = (p: string | null | undefined) => (p ?? '').replace(/\D/g, '');

export function waLink(phone: string, text?: string) {
	const base = `https://wa.me/${phoneDigits(phone)}`;
	return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function readingTime(text: string) {
	const words = text.trim().split(/\s+/).length;
	return Math.max(1, Math.round(words / 200));
}
