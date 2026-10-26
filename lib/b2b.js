// Formulario B2B: opciones y validación compartidas por el navegador y la ruta /api/b2b.

export const BUSINESS_TYPES = [
  { id: 'estanco', name: 'Estanco' },
  { id: 'smoke-shop', name: 'Smoke shop' },
  { id: 'distribuidor', name: 'Distribuidor' },
  { id: 'otro', name: 'Otro' },
];

export const VOLUMES = [
  { id: 'lt50', name: 'Menos de 50' },
  { id: '50-200', name: '50–200' },
  { id: '200-500', name: '200–500' },
  { id: 'gt500', name: 'Más de 500' },
];

export const PROVINCES = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 'Burgos',
  'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada',
  'Guadalajara', 'Gipuzkoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'La Rioja', 'Las Palmas', 'León', 'Lleida',
  'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra', 'Salamanca',
  'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid',
  'Bizkaia', 'Zamora', 'Zaragoza',
];

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

// NIF de persona física (DNI), NIE o CIF de persona jurídica
export function isValidTaxId(raw) {
  const v = String(raw || '').toUpperCase().replace(/[\s.-]/g, '');
  if (/^\d{8}[A-Z]$/.test(v)) return DNI_LETTERS[+v.slice(0, 8) % 23] === v[8];
  if (/^[XYZ]\d{7}[A-Z]$/.test(v)) {
    const n = 'XYZ'.indexOf(v[0]) + v.slice(1, 8);
    return DNI_LETTERS[+n % 23] === v[8];
  }
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(v)) {
    const d = v.slice(1, 8).split('').map(Number);
    let sum = d[1] + d[3] + d[5];
    [d[0], d[2], d[4], d[6]].forEach((x) => { const y = x * 2; sum += Math.floor(y / 10) + (y % 10); });
    const digit = (10 - (sum % 10)) % 10;
    const letter = 'JABCDEFGHI'[digit];
    const c = v[8];
    if ('PQRSNW'.includes(v[0])) return c === letter;
    if ('ABEH'.includes(v[0])) return c === String(digit);
    return c === letter || c === String(digit);
  }
  return false;
}

const str = (v) => String(v ?? '').trim();

// Devuelve { errors, lead }. `errors` usa los mismos nombres que los campos del formulario.
export function validateLead(input) {
  const d = input || {};
  const lead = {
    business: str(d.business),
    taxId: str(d.taxId).toUpperCase().replace(/[\s.-]/g, ''),
    type: str(d.type),
    contact: str(d.contact),
    email: str(d.email),
    phone: str(d.phone),
    province: str(d.province),
    volume: str(d.volume),
    branding: d.branding === 'si' || d.branding === 'no' ? d.branding : null,
    surcharge: str(d.surcharge),
    message: str(d.message).slice(0, 2000),
    privacy: d.privacy === true || d.privacy === 'on',
  };
  const errors = {};
  if (lead.business.length < 2) errors.business = 'Indica el nombre del negocio.';
  if (!isValidTaxId(lead.taxId)) errors.taxId = 'El NIF/CIF no es válido.';
  if (!BUSINESS_TYPES.some((t) => t.id === lead.type)) errors.type = 'Elige el tipo de negocio.';
  if (lead.contact.length < 2) errors.contact = 'Indica la persona de contacto.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.email = 'El email no es válido.';
  if (!/^\+?[\d\s()-]{9,16}$/.test(lead.phone)) errors.phone = 'El teléfono no es válido.';
  if (!PROVINCES.includes(lead.province)) errors.province = 'Elige la provincia.';
  if (!VOLUMES.some((o) => o.id === lead.volume)) errors.volume = 'Elige el volumen estimado.';
  if (lead.surcharge !== 'si' && lead.surcharge !== 'no') errors.surcharge = 'Indica si estás en recargo de equivalencia.';
  if (!lead.privacy) errors.privacy = 'Debes aceptar la política de privacidad.';
  return { errors, lead };
}
