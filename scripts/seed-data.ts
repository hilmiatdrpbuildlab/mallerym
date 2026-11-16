/*
 * Normalización de los 29 listados del sitio antiguo: los datos que antes estaban incrustados en el
 * título (precio, m², terreno) pasan a campos. Fuente: páginas /propiedades/{slug}/ del sitio antiguo
 * (texto e imágenes) — ver snapshots-situs-lama/03-propiedades y 04-propiedad-detalle.
 */

export type SeedProperty = {
	slug: string;
	title: string;
	operation: 'venta' | 'arriendo_anual' | 'arriendo_temporal';
	type: string;
	location: string;
	condominium?: string;
	price: { amount: number; currency: 'UF' | 'CLP'; period?: 'total' | 'mes' | 'noche' | 'dia'; from?: boolean };
	specs?: Partial<{
		builtM2: number;
		terraceM2: number;
		landM2: number;
		bedrooms: number;
		bathrooms: number;
		parking: number;
		floors: number;
		guests: number;
		minNights: number;
	}>;
	featured?: boolean;
	/** Listado duplicado: se archiva y su slug redirige (301) al canónico. */
	duplicateOf?: string;
	agent?: 'cecilia' | 'alicia';
	note?: string;
};

export const PROPERTY_TYPES = [
	{ id: 1, slug: 'casa', name: 'Casa', plural: 'Casas' },
	{ id: 2, slug: 'departamento', name: 'Departamento', plural: 'Departamentos' },
	{ id: 3, slug: 'parcela', name: 'Parcela', plural: 'Parcelas' },
	{ id: 4, slug: 'sitio', name: 'Sitio', plural: 'Sitios' },
	{ id: 5, slug: 'loteo', name: 'Loteo', plural: 'Loteos' },
	{ id: 6, slug: 'cabana', name: 'Cabaña', plural: 'Cabañas' },
	{ id: 7, slug: 'tiny-house', name: 'Tiny house', plural: 'Tiny houses' },
	{ id: 8, slug: 'bus-cabana', name: 'Bus-cabaña', plural: 'Buses-cabaña' }
];

// Coordenadas aproximadas a nivel de sector (nunca la dirección exacta).
export const LOCATIONS = [
	{ slug: 'maitencillo', comuna: 'Puchuncaví', sector: 'Maitencillo', lat: -32.649, lng: -71.437 },
	{ slug: 'zapallar', comuna: 'Zapallar', sector: 'Zapallar', lat: -32.553, lng: -71.448 },
	{ slug: 'papudo', comuna: 'Papudo', sector: 'Papudo', lat: -32.513, lng: -71.448 },
	{ slug: 'puchuncavi', comuna: 'Puchuncaví', sector: 'Puchuncaví', lat: -32.725, lng: -71.413 },
	{ slug: 'el-paso', comuna: 'Puchuncaví', sector: 'El Paso', lat: -32.69, lng: -71.42 },
	{ slug: 'pucalan', comuna: 'Puchuncaví', sector: 'Pucalán', lat: -32.74, lng: -71.37 },
	{ slug: 'el-rungue', comuna: 'Puchuncaví', sector: 'El Rungue', lat: -32.675, lng: -71.395 },
	{ slug: 'concon', comuna: 'Concón', sector: 'Concón', lat: -32.93, lng: -71.5 }
];

export const FEATURES: { id: number; slug: string; name: string; group: string; re: RegExp }[] = [
	{ id: 1, slug: 'piscina', name: 'Piscina', group: 'exterior', re: /piscina/i },
	{ id: 2, slug: 'quincho', name: 'Quincho / parrilla', group: 'exterior', re: /quincho|parrilla/i },
	{ id: 3, slug: 'terraza', name: 'Terraza / deck', group: 'exterior', re: /terraza|deck/i },
	{ id: 4, slug: 'jardin', name: 'Jardín', group: 'exterior', re: /jard[ií]n/i },
	{ id: 5, slug: 'riego-automatico', name: 'Riego automático', group: 'exterior', re: /riego autom/i },
	{ id: 6, slug: 'vista-al-mar', name: 'Vista al mar', group: 'exterior', re: /vistas? (?:lejana )?al mar|primera l[ií]nea|1ra l[ií]nea/i },
	{ id: 7, slug: 'vista-al-valle', name: 'Vista al valle', group: 'exterior', re: /vistas? al valle|vista a un valle/i },
	{ id: 8, slug: 'estacionamiento', name: 'Estacionamiento', group: 'exterior', re: /estacionamiento/i },
	{ id: 9, slug: 'paneles-solares', name: 'Paneles solares', group: 'exterior', re: /paneles solares/i },
	{ id: 10, slug: 'chimenea', name: 'Chimenea / Bosca', group: 'interior', re: /chimenea|bosca/i },
	{ id: 11, slug: 'losa-radiante', name: 'Losa radiante', group: 'interior', re: /losa radiante/i },
	{ id: 12, slug: 'cocina-isla', name: 'Cocina con isla', group: 'interior', re: /\bisla\b/i },
	{ id: 13, slug: 'dormitorio-en-suite', name: 'Dormitorio en suite', group: 'interior', re: /en suite/i },
	{ id: 14, slug: 'amoblada', name: 'Se entrega amoblada', group: 'interior', re: /amoblad/i },
	{ id: 15, slug: 'internet', name: 'Internet / Starlink', group: 'interior', re: /starlink|internet/i },
	{ id: 16, slug: 'seguridad-24-7', name: 'Seguridad 24/7', group: 'condominio', re: /24\/7|conserjer/i },
	{ id: 17, slug: 'porton-automatico', name: 'Portón automático', group: 'condominio', re: /port[oó]n (?:autom|el[eé]ctr)/i },
	{ id: 18, slug: 'luz-soterrada', name: 'Luz soterrada', group: 'condominio', re: /soterrad/i },
	{ id: 19, slug: 'cancha-tenis', name: 'Cancha de tenis', group: 'condominio', re: /tenis/i },
	{ id: 20, slug: 'rol-propio', name: 'Rol propio', group: 'condominio', re: /rol propio/i }
];

export const PROPERTIES: SeedProperty[] = [
	// Orden = más reciente primero (según "Nuevas propiedades disponibles" del sitio antiguo)
	{
		slug: 'departamento-arriendo-temporal-en-papudo-135-000-por-noche',
		title: 'Departamento en Condominio Vistamar, Papudo',
		operation: 'arriendo_temporal',
		type: 'departamento',
		location: 'papudo',
		condominium: 'Vistamar',
		price: { amount: 130000, currency: 'CLP', period: 'noche' },
		specs: { bedrooms: 3, bathrooms: 2, guests: 6, parking: 1, floors: 1 },
		agent: 'alicia',
		note: 'El slug antiguo dice $135.000 y el título $130.000: se usa el título.'
	},
	{
		slug: 'cabana-arriendo-ano-corrido-en-pucalan-590-000-mensual',
		title: 'Casa en arriendo año corrido en Pucalán',
		operation: 'arriendo_anual',
		type: 'casa',
		location: 'pucalan',
		price: { amount: 590000, currency: 'CLP', period: 'mes' },
		specs: { bedrooms: 3, bathrooms: 2 },
		agent: 'alicia'
	},
	{
		slug: 'arriendo-temporal-en-entorno-campestre-muy-cerca-del-mar-180-000-por-noche',
		title: 'Cabañas en entorno campestre muy cerca del mar, El Paso',
		operation: 'arriendo_temporal',
		type: 'cabana',
		location: 'el-paso',
		price: { amount: 180000, currency: 'CLP', period: 'noche' },
		specs: { bedrooms: 2, bathrooms: 2, guests: 6 },
		agent: 'alicia'
	},
	{
		slug: 'arriendo-ano-corrido-casa-en-cond-polo-maitencillo-2-250-000-mensual',
		title: 'Casa en Cond. Polo de Maitencillo — arriendo año corrido',
		operation: 'arriendo_anual',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Polo de Maitencillo',
		price: { amount: 2200000, currency: 'CLP', period: 'mes' },
		specs: { builtM2: 202, terraceM2: 130, landM2: 1080, bedrooms: 4, bathrooms: 3 },
		agent: 'cecilia'
	},
	{
		slug: 'arriendo-ano-corrido-casa-en-cond-polo-maitencillo-330-000-noche',
		title: 'Casa en Cond. Polo de Maitencillo — arriendo temporal',
		operation: 'arriendo_temporal',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Polo de Maitencillo',
		price: { amount: 330000, currency: 'CLP', period: 'noche' },
		specs: { builtM2: 202, terraceM2: 130, landM2: 1080, bedrooms: 4, bathrooms: 3, minNights: 3 },
		agent: 'cecilia'
	},
	{
		slug: 'arriendo-temporal-parcela-en-maitencillo-280-000-diario',
		title: 'Casa y cabaña en parcela de 5.000 m², Maitencillo sur',
		operation: 'arriendo_temporal',
		type: 'parcela',
		location: 'maitencillo',
		condominium: 'Sector Lomas',
		price: { amount: 300000, currency: 'CLP', period: 'dia' },
		specs: { landM2: 5000, guests: 10 },
		agent: 'cecilia',
		note: 'Disponible segunda quincena de enero y febrero 2027. Slug antiguo $280.000, título $300.000.'
	},
	{
		slug: 'departamento-av-del-mar',
		title: 'Departamento en primera línea, Av. del Mar',
		operation: 'arriendo_temporal',
		type: 'departamento',
		location: 'maitencillo',
		price: { amount: 230000, currency: 'CLP', period: 'dia' },
		specs: { bedrooms: 3, bathrooms: 3, parking: 1 },
		agent: 'alicia'
	},
	{
		slug: 'departamento-olas-de-marbella',
		title: 'Departamento Olas de Marbella, primera línea',
		operation: 'arriendo_temporal',
		type: 'departamento',
		location: 'maitencillo',
		condominium: 'Olas — Marbella Resort',
		price: { amount: 220000, currency: 'CLP', period: 'dia' },
		specs: { bedrooms: 3, bathrooms: 3, parking: 1, minNights: 2 },
		agent: 'alicia'
	},
	{
		slug: 'casas-nuevas-en-santa-maria-de-maitencillo-130m2-desde-11-600uf',
		title: 'Casas nuevas en Santa María de Maitencillo',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Santa María de Maitencillo',
		price: { amount: 11600, currency: 'UF', from: true },
		specs: { builtM2: 130, landM2: 400, bedrooms: 3, bathrooms: 3, floors: 2, parking: 2 },
		featured: true,
		agent: 'cecilia'
	},
	{
		slug: 'casas-santa-maria-de-maitencillo-130m2-desde-11-600uf',
		title: 'Casas Santa María de Maitencillo (duplicado)',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Santa María de Maitencillo',
		price: { amount: 11600, currency: 'UF', from: true },
		specs: { builtM2: 130, landM2: 400, bedrooms: 3, bathrooms: 3, floors: 2 },
		duplicateOf: 'casas-nuevas-en-santa-maria-de-maitencillo-130m2-desde-11-600uf'
	},
	{
		slug: 'casa-en-cond-polo-maitencillo-232m2t-1-080m2-16-600uf',
		title: 'Casa en Cond. Polo de Maitencillo con vista al valle',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Polo de Maitencillo',
		price: { amount: 16600, currency: 'UF' },
		specs: { builtM2: 202, terraceM2: 130, landM2: 1080, bedrooms: 4, bathrooms: 3 },
		agent: 'cecilia'
	},
	{
		slug: 'casa-en-cond-polo-maitencillo-sector-c-180m270m2t-750m2-12-900uf',
		title: 'Casa en Cond. Polo de Maitencillo, sector C',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Polo de Maitencillo',
		price: { amount: 12900, currency: 'UF' },
		specs: { builtM2: 180, terraceM2: 70, landM2: 750, bedrooms: 3, bathrooms: 3, parking: 2, floors: 1 },
		agent: 'cecilia'
	},
	{
		slug: 'casa-en-cond-polo-maitencillo-sector-c-180m270m2t-750m2-13-700uf',
		title: 'Casa en Cond. Polo de Maitencillo, sector C (duplicado)',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Polo de Maitencillo',
		price: { amount: 12900, currency: 'UF' },
		specs: { builtM2: 180, terraceM2: 70, landM2: 750, bedrooms: 3, bathrooms: 3, parking: 2 },
		duplicateOf: 'casa-en-cond-polo-maitencillo-sector-c-180m270m2t-750m2-12-900uf'
	},
	{
		slug: 'casa-cond-maitenes-14-900uf',
		title: 'Casa moderna en Condominio Maitenes',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Maitenes',
		price: { amount: 14900, currency: 'UF' },
		specs: { builtM2: 208, terraceM2: 40, landM2: 855, bedrooms: 3, bathrooms: 3 },
		agent: 'cecilia'
	},
	{
		slug: 'casa-en-condominio-altavista-zapallar-12-800-uf',
		title: 'Casa mediterránea en Condominio Altavista, Zapallar',
		operation: 'venta',
		type: 'casa',
		location: 'zapallar',
		condominium: 'Altavista',
		price: { amount: 12800, currency: 'UF' },
		specs: { bedrooms: 5, bathrooms: 3 },
		agent: 'alicia'
	},
	{
		slug: 'lomas-blancas',
		title: 'Casa en Condominio Lomas Blancas',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Lomas Blancas',
		price: { amount: 11000, currency: 'UF' },
		specs: { builtM2: 120, landM2: 1130, bedrooms: 4, bathrooms: 3, floors: 1 },
		agent: 'cecilia'
	},
	{
		slug: 'departamento-etapa-1-condominio-costamai-120m2-terrazas-9-990uf',
		title: 'Departamento en primera línea, Condominio Costamai',
		operation: 'venta',
		type: 'departamento',
		location: 'maitencillo',
		condominium: 'Costamai — Etapa 1',
		price: { amount: 9990, currency: 'UF' },
		specs: { builtM2: 120, bedrooms: 3, bathrooms: 2 },
		agent: 'alicia'
	},
	{
		slug: 'casa-en-cond-la-divisa-7-750uf',
		title: 'Cabaña en Condominio La Divisa',
		operation: 'venta',
		type: 'cabana',
		location: 'maitencillo',
		condominium: 'La Divisa',
		price: { amount: 7750, currency: 'UF' },
		specs: { bedrooms: 3, bathrooms: 3 },
		agent: 'cecilia'
	},
	{
		slug: 'casa-en-sector-el-medano-7-500uf',
		title: 'Casa nueva en sector El Médano',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		price: { amount: 7500, currency: 'UF' },
		specs: { bedrooms: 3, bathrooms: 2 },
		agent: 'alicia'
	},
	{
		slug: 'dos-increibles-casas-en-condominios-las-hermanas-el-mirador-260m2-c-u-5-000m2-19-800uf',
		title: 'Dos casas autosustentables en Condominios Las Hermanas',
		operation: 'venta',
		type: 'casa',
		location: 'maitencillo',
		condominium: 'Las Hermanas — El Mirador',
		price: { amount: 16800, currency: 'UF' },
		specs: { builtM2: 520, landM2: 5000 },
		agent: 'cecilia',
		note: 'Dos casas espejo de 260 m² c/u. El texto antiguo menciona 9.900 UF por casa; el título 16.800 UF: confirmar.'
	},
	{
		slug: 'parcela-en-condominios-las-hermanas-el-mirador-5000m2-7-650uf',
		title: 'Parcela de 5.000 m² en Condominios Las Hermanas',
		operation: 'venta',
		type: 'parcela',
		location: 'maitencillo',
		condominium: 'Las Hermanas — El Mirador',
		price: { amount: 7650, currency: 'UF' },
		specs: { landM2: 5000 },
		agent: 'cecilia',
		note: 'El texto antiguo dice 8.500 UF y el título 7.650 UF: confirmar.'
	},
	{
		slug: 'sitio-maitencillo-sur-via-f124-2-700m2-9-900uf',
		title: 'Sitio con vista al mar, Maitencillo sur (vía F124)',
		operation: 'venta',
		type: 'sitio',
		location: 'maitencillo',
		price: { amount: 9900, currency: 'UF' },
		specs: { landM2: 2700 },
		agent: 'alicia'
	},
	{
		slug: 'sitio-1-la-divisa-882m2-3800uf',
		title: 'Sitio 1 en Condominio La Divisa',
		operation: 'venta',
		type: 'sitio',
		location: 'maitencillo',
		condominium: 'La Divisa',
		price: { amount: 3800, currency: 'UF' },
		specs: { landM2: 882 },
		agent: 'cecilia'
	},
	{
		slug: '512',
		title: 'Sitio emboscado en Condominio La Divisa',
		operation: 'venta',
		type: 'sitio',
		location: 'maitencillo',
		condominium: 'La Divisa',
		price: { amount: 3500, currency: 'UF' },
		specs: { landM2: 1000 },
		agent: 'cecilia',
		note: 'Slug antiguo sin nombre (/propiedades/512/): se mantiene para no romper enlaces compartidos.'
	},
	{
		slug: 'sitio-las-cruces-maitencillo-1-000m2-m85',
		title: 'Sitio en sector Las Cañas / Las Cruces, El Médano',
		operation: 'venta',
		type: 'sitio',
		location: 'maitencillo',
		price: { amount: 85000000, currency: 'CLP' },
		specs: { landM2: 1000 },
		agent: 'alicia'
	},
	{
		slug: 'lotes-raices-del-mauco-concon-desde-1079-uf',
		title: 'Sitios Raíces del Mauco, Concón',
		operation: 'venta',
		type: 'loteo',
		location: 'concon',
		condominium: 'Raíces del Mauco',
		price: { amount: 1079, currency: 'UF', from: true },
		specs: { landM2: 1000 },
		agent: 'cecilia'
	},
	{
		slug: 'lo-paez-10-maravillosos-lotes',
		title: '10 lotes en Lo Páez, camino a El Rincón, Puchuncaví',
		operation: 'venta',
		type: 'loteo',
		location: 'puchuncavi',
		price: { amount: 68000000, currency: 'CLP', from: true },
		specs: { landM2: 20000 },
		agent: 'alicia'
	},
	{
		slug: 'tiny-houses-9-000-000',
		title: 'Tiny houses listas para instalar',
		operation: 'venta',
		type: 'tiny-house',
		location: 'el-rungue',
		price: { amount: 9000000, currency: 'CLP' },
		specs: { builtM2: 14.7, bedrooms: 1, bathrooms: 1 },
		agent: 'alicia'
	},
	{
		slug: 'buses-cabanas-desde-10-500-000',
		title: 'Buses acondicionados como cabañas',
		operation: 'venta',
		type: 'bus-cabana',
		location: 'el-rungue',
		price: { amount: 9500000, currency: 'CLP', from: true },
		specs: { bedrooms: 3, bathrooms: 1 },
		agent: 'alicia'
	}
];

export const POST_CATEGORIES = [
	{ id: 1, slug: 'diseno-de-interiores', name: 'Diseño de interiores', wp: [92] },
	{ id: 2, slug: 'paisajismo', name: 'Paisajismo', wp: [98] },
	{ id: 3, slug: 'proyectos', name: 'Proyectos', wp: [97] },
	{ id: 4, slug: 'tendencias', name: 'Tendencias', wp: [66] }
];

export const SERVICES = [
	{
		slug: 'compra',
		title: 'Compra',
		summary:
			'Te asesoramos en la búsqueda y adquisición de propiedades según tus necesidades y presupuesto, con negociación y acompañamiento hasta la firma.',
		body: `Asesoramos en la búsqueda y adquisición de propiedades según tus necesidades y presupuesto. Realizamos la negociación para asegurar una compra **informada, segura y al mejor precio**, y te acompañamos durante todo el proceso hasta la firma final.

Conocemos el litoral de Papudo a Valparaíso: condominios, plusvalía, conectividad y la realidad de cada sector (agua, luz, accesos). Esa información la ponemos sobre la mesa antes de que tomes una decisión.`,
		includes: [
			'Búsqueda dirigida según tu presupuesto y estilo de vida',
			'Visitas coordinadas y acompañadas',
			'Estudio de títulos con nuestra asesora legal',
			'Negociación de precio y condiciones',
			'Acompañamiento hasta la firma de la escritura'
		],
		steps: [
			{ title: 'Conversemos', text: 'Definimos qué buscas, para cuándo y con qué presupuesto (UF o CLP).' },
			{ title: 'Selección y visitas', text: 'Te presentamos opciones filtradas y coordinamos las visitas.' },
			{ title: 'Revisión legal', text: 'Estudio de títulos y documentos antes de comprometerte.' },
			{ title: 'Negociación y firma', text: 'Negociamos por ti y te acompañamos hasta la notaría.' }
		],
		faq: [
			{
				q: '¿Trabajan solo en Maitencillo?',
				a: 'Nuestro foco es Maitencillo y alrededores, pero cubrimos desde Papudo a Valparaíso por la costa, Catapilco y Puchuncaví. Para Santiago trabajamos con un partner.'
			},
			{
				q: '¿Cómo se calcula el precio en UF?',
				a: 'La mayoría de las ventas se publican en UF. En cada ficha mostramos una estimación en pesos con el valor UF del día, solo como referencia.'
			},
			{
				q: '¿Incluyen revisión legal?',
				a: 'Sí. Nuestra asesora legal revisa títulos, escrituras y contratos antes de la promesa de compraventa.'
			}
		],
		ctaLabel: 'Quiero comprar',
		leadType: 'general' as const
	},
	{
		slug: 'venta',
		title: 'Venta',
		summary:
			'Nos encargamos de todo el proceso de venta en forma integral: marketing digital, fotografía, asesoría legal y acompañamiento personalizado.',
		body: `Nos encargamos de todo el proceso de venta en forma integral. Brindamos además **asesoría legal y acompañamiento personalizado** para garantizar una venta segura, ágil y al mejor valor de mercado.

Cada propiedad recibe fotografía profesional, una ficha completa y difusión en redes sociales con publicidad segmentada para llegar a compradores reales.`,
		includes: [
			'Tasación comercial según el mercado del litoral',
			'Fotografía y ficha profesional',
			'Marketing digital y publicidad segmentada',
			'Filtro de interesados y visitas acompañadas',
			'Gestión legal hasta la firma'
		],
		steps: [
			{ title: 'Visita y tasación', text: 'Conocemos tu propiedad y te proponemos un precio realista.' },
			{ title: 'Preparación', text: 'Fotografía, ficha y, si lo deseas, home staging con nuestra diseñadora.' },
			{ title: 'Difusión', text: 'Publicación en el sitio, redes y campañas segmentadas.' },
			{ title: 'Cierre', text: 'Negociación, promesa y escritura con apoyo legal.' }
		],
		faq: [
			{
				q: '¿Qué necesito para publicar mi propiedad?',
				a: 'Basta con conversar: nosotras te pedimos los documentos necesarios (dominio vigente, certificados) y coordinamos la sesión de fotos.'
			},
			{
				q: '¿Pueden ayudarme a preparar la casa para la venta?',
				a: 'Sí, nuestra diseñadora de interiores ofrece home staging para destacar cada espacio.'
			}
		],
		ctaLabel: 'Quiero vender mi propiedad',
		leadType: 'quiero_vender' as const
	},
	{
		slug: 'arriendo',
		title: 'Arriendo',
		summary:
			'Publicamos, mostramos y arrendamos tu propiedad por ti — anual o temporal — y ayudamos a quienes buscan arrendar a encontrar un lugar cómodo y seguro.',
		body: `Uno de nuestros objetivos es ahorrarte tiempo y estrés en publicar, mostrar y arrendar tu propiedad: **nosotras lo hacemos por ti**.

Si estás buscando dónde arrendar, te ayudamos a encontrar un lugar que cumpla todos tus requerimientos y en el que te sientas cómodo y seguro — por temporada, por días o año corrido.`,
		includes: [
			'Arriendo año corrido y temporal (por noche o por día)',
			'Publicación y difusión',
			'Filtro de arrendatarios',
			'Contrato y entrega con inventario',
			'Coordinación de aseo y check-in en arriendos temporales'
		],
		steps: [
			{ title: 'Evaluación', text: 'Definimos el tipo de arriendo y el valor adecuado para tu propiedad.' },
			{ title: 'Publicación', text: 'Fotografía, ficha y difusión en nuestros canales.' },
			{ title: 'Selección', text: 'Filtramos interesados y coordinamos visitas.' },
			{ title: 'Contrato y entrega', text: 'Preparamos el contrato y entregamos la propiedad con inventario.' }
		],
		faq: [
			{
				q: '¿Arriendan por temporada de verano?',
				a: 'Sí, gestionamos arriendos temporales por noche o por día, con mínimos de estadía según cada propiedad.'
			},
			{
				q: '¿Cómo veo la disponibilidad?',
				a: 'Escríbenos por WhatsApp desde la ficha de la propiedad: te respondemos con las fechas disponibles.'
			}
		],
		ctaLabel: 'Quiero arrendar mi propiedad',
		leadType: 'quiero_arrendar' as const
	},
	{
		slug: 'diseno',
		title: 'Diseño de interiores',
		summary:
			'Diseño y decoración de interiores para potenciar cada propiedad con estilo y funcionalidad, más inspiración en nuestro blog.',
		body: `Descubre nuestro blog de diseño y decoración de interiores, donde compartimos inspiración, ideas y consejos para transformar tus espacios.

Además, conoce los servicios de diseño que ofrecemos para ayudarte a **potenciar cada propiedad con estilo y funcionalidad**: desde home staging para vender más rápido hasta proyectos residenciales y de arriendo turístico.`,
		includes: [
			'Home staging para venta o arriendo',
			'Proyectos residenciales y de oficina',
			'Decoración de propiedades para arriendo temporal (Airbnb)',
			'Asesoría en materiales, mobiliario e iluminación'
		],
		steps: [
			{ title: 'Diagnóstico', text: 'Conocemos el espacio, tu estilo de vida y el objetivo del proyecto.' },
			{ title: 'Propuesta', text: 'Concepto, paleta, mobiliario y presupuesto.' },
			{ title: 'Implementación', text: 'Coordinamos compras, instalación y ambientación.' }
		],
		faq: [
			{
				q: '¿El home staging sirve si vendo con ustedes?',
				a: 'Sí, y es una de las herramientas que más acelera una venta: las fotos y visitas muestran el potencial real de cada espacio.'
			}
		],
		ctaLabel: 'Quiero asesoría de diseño',
		leadType: 'diseno' as const
	}
];
