// Carrito local (fase 1): vive en localStorage y se comunica por eventos de window.
// En la fase 2 `items` se enviará tal cual a la pasarela de pago; `attrs` es el pedido exacto para producción.
import { BODY_COLORS, LID_COLORS, ACCENT_COLORS, PATTERNS, FINISHES, DEFAULT_LOOK } from './pitillera.js';
import { SITE } from './site.js';

export const CART_KEY = 'estuche-cart';
export const LOOK_KEY = 'estuche-look';
export const CART_EVENT = 'estuche:cart';
export const LOOK_EVENT = 'estuche:look';

const byHex = (list, hex) => list.find((o) => o.hex === hex) || list[0];
const byId = (list, id) => list.find((o) => o.id === id) || list[0];

export function lookParts(look) {
  return {
    body: byHex(BODY_COLORS, look.body),
    lid: byHex(LID_COLORS, look.lid),
    accent: byHex(ACCENT_COLORS, look.accent),
    pattern: byId(PATTERNS, look.pattern),
    finish: byId(FINISHES, look.finish),
  };
}

export function describeLook(look) {
  const p = lookParts(look);
  const relief = p.pattern.id === 'liso' ? '' : ` en ${p.accent.name.toLowerCase()}`;
  return `Cuerpo ${p.body.name.toLowerCase()} · tapa ${p.lid.name.toLowerCase()} · ${p.pattern.name.toLowerCase()}${relief} · ${p.finish.name.toLowerCase()}`;
}

// precio unitario o null si falta algún dato de tarifa
export function priceFor(look) {
  const base = SITE.price.base;
  const extra = SITE.price.finish[look.finish];
  return base == null || extra == null ? null : base + extra;
}

export function itemFromLook(look, custom) {
  const p = lookParts(look);
  const sku = custom
    ? ['EST-C', p.body.id, p.lid.id, p.pattern.id, p.pattern.id === 'liso' ? 'na' : p.accent.id, p.finish.id].join('-').toUpperCase()
    : 'EST-STD';
  return {
    sku,
    custom,
    name: custom ? `${SITE.product} personalizado` : SITE.product,
    attrs: {
      model: 'estuche-v1',
      body: { id: p.body.id, hex: p.body.hex },
      lid: { id: p.lid.id, hex: p.lid.hex },
      pattern: p.pattern.id,
      accent: p.pattern.id === 'liso' ? null : { id: p.accent.id, hex: p.accent.hex },
      finish: p.finish.id,
    },
    look: { ...look },
    unitPrice: priceFor(look),
    qty: 1,
  };
}

export const standardItem = () => itemFromLook(DEFAULT_LOOK, false);

export function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}

export function writeCart(items, open = false) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { items, open } }));
}

export function addToCart(item) {
  const items = readCart();
  const same = items.find((i) => i.sku === item.sku);
  if (same) same.qty += 1;
  else items.push(item);
  writeCart(items, true);
}

export function readLook() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOOK_KEY));
    return saved ? { ...DEFAULT_LOOK, ...saved } : { ...DEFAULT_LOOK };
  } catch (e) {
    return { ...DEFAULT_LOOK };
  }
}

export function saveLook(look) {
  try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch (e) { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(LOOK_EVENT, { detail: look }));
}
