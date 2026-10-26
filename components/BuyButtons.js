'use client';

import { addToCart, standardItem } from '@/lib/cart';

// "Comprar" adds the standard case; "Personalizar" jumps to the configurator.
export default function BuyButtons() {
  return (
    <div className="ctas">
      <button type="button" className="btn" onClick={() => addToCart(standardItem())}>Comprar</button>
      <a className="btn ghost" href="#personaliza">Personalizar la tuya</a>
    </div>
  );
}
