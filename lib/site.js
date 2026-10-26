// Datos del producto y de la tienda. Todo lo que está a `null` es un dato pendiente:
// la web lo muestra como marcador [ ... ] hasta que se rellene aquí.

export const SITE = {
  brand: null, // nombre comercial; mientras esté a null se usa `product`
  product: 'Estuche 3D',
  // URL pública definitiva (para canonical y datos estructurados), p. ej. 'https://mitienda.es'
  siteUrl: null,
  madeIn: 'España',
  warrantyYears: 3,
  makeDays: null, // días laborables de fabricación
  shippingDays: null, // días de envío
  returnDays: 14, // desistimiento para productos estándar
  price: {
    currency: 'EUR',
    base: null, // precio del estuche estándar
    finish: { mate: 0, texturizado: null }, // suplemento por acabado
  },
  specs: {
    dimensions: null, // p. ej. '86 × 72 × 31 mm'
    weight: null, // p. ej. '68 g'
    capacityGrams: null, // gramos de tabaco
    papers: null, // nº de papeles
    filters: null, // nº de filtros
    material: 'PETG / ASA',
    gasket: 'Junta de TPU',
  },
  manufacturer: {
    name: null,
    address: null,
    email: null,
    phone: null,
  },
  catalogPdf: null, // ruta en /public, p. ej. '/catalogo.pdf'
  printerVideo: null, // ruta en /public, p. ej. '/media/impresora.mp4'
  // Solo valoraciones reales: { name, rating (1-5), text, date }
  reviews: [],
  // Tiendas que lo venden: { name, logo, url }
  retailers: [],
};

export const formatPrice = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: SITE.price.currency }).format(n);

export const FAQ = [
  {
    q: '¿Cuánto tarda en llegar?',
    a: `Cada estuche se imprime bajo pedido. La fabricación tarda ${SITE.makeDays ?? '[X]'} días laborables y el envío, ${SITE.shippingDays ?? '[X]'} días más.`,
  },
  {
    q: '¿Cómo lo limpio y lo cuido?',
    a: 'Pásale un paño húmedo con jabón neutro y sécalo bien. No lo metas en el lavavajillas ni uses disolventes como la acetona, que dañan la superficie.',
  },
  {
    q: '¿Qué garantía tiene?',
    a: `${SITE.warrantyYears} años de garantía frente a defectos de fabricación, tanto en los estuches estándar como en los personalizados.`,
  },
  {
    q: '¿Puedo devolverlo?',
    a: `Los estuches estándar se pueden devolver en ${SITE.returnDays} días naturales desde la entrega, sin dar explicaciones. Los personalizados se fabrican según tus especificaciones y no admiten devolución por desistimiento, aunque sí están cubiertos por la garantía.`,
  },
  {
    q: '¿Vendéis al por mayor?',
    a: 'Sí. Si tienes un estanco, una tienda o eres distribuidor, rellena el formulario de tiendas y te enviaremos las tarifas por volumen.',
  },
  {
    q: '¿Mantiene la humedad?',
    a: 'Sí. El cierre lleva una junta de TPU que sella la tapa y ayuda a conservar la humedad del contenido.',
  },
];
