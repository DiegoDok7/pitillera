'use client';

import { useEffect, useState } from 'react';
import { CART_EVENT, describeLook, readCart, writeCart } from '@/lib/cart';
import { formatPrice } from '@/lib/site';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(readCart());
    const onCart = (e) => {
      setItems(e.detail.items);
      if (e.detail.open) setOpen(true);
    };
    window.addEventListener(CART_EVENT, onCart);
    return () => window.removeEventListener(CART_EVENT, onCart);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const priced = items.every((i) => i.unitPrice != null);
  const total = items.reduce((n, i) => n + (i.unitPrice || 0) * i.qty, 0);
  const hasCustom = items.some((i) => i.custom);

  const setQty = (sku, qty) => writeCart(qty > 0
    ? items.map((i) => (i.sku === sku ? { ...i, qty } : i))
    : items.filter((i) => i.sku !== sku));

  return (
    <>
      <button type="button" className="cartbtn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Carrito <span className="count">{count}</span>
      </button>
      <div className={'cartlayer' + (open ? ' open' : '')} hidden={!open}>
        <div className="cartscrim" onClick={() => setOpen(false)} />
        <aside className="cart" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
          <div className="carthead">
            <h2 id="cartTitle">Tu carrito</h2>
            <button type="button" className="close" onClick={() => setOpen(false)} aria-label="Cerrar carrito">×</button>
          </div>
          {items.length === 0 ? (
            <p className="empty">Todavía no has añadido nada.</p>
          ) : (
            <ul className="cartitems">
              {items.map((i) => (
                <li key={i.sku}>
                  <span className="dots" aria-hidden="true">
                    <i style={{ background: i.attrs.body.hex }} />
                    <i style={{ background: i.attrs.lid.hex }} />
                    {i.attrs.accent && <i style={{ background: i.attrs.accent.hex }} />}
                  </span>
                  <div className="info">
                    <b>{i.name}</b>
                    <span>{describeLook(i.look)}</span>
                    <code>{i.sku}</code>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(i.sku, i.qty - 1)} aria-label="Quitar uno">−</button>
                    <span>{i.qty}</span>
                    <button type="button" onClick={() => setQty(i.sku, i.qty + 1)} aria-label="Añadir uno">+</button>
                  </div>
                  <span className="price">{i.unitPrice == null ? <span className="todo">[PRECIO]</span> : formatPrice(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="cartfoot">
            <div className="total"><span>Total</span><b>{items.length && !priced ? <span className="todo">[PRECIO]</span> : formatPrice(total)}</b></div>
            <button type="button" className="btn" disabled>Pago disponible próximamente</button>
            {hasCustom && (
              <p className="legalnote">Los productos personalizados no admiten devolución por desistimiento.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
