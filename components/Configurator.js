'use client';

import { useEffect, useState } from 'react';
import { BODY_COLORS, LID_COLORS, ACCENT_COLORS, PATTERNS, FINISHES, DEFAULT_LOOK } from '@/lib/pitillera';
import { addToCart, itemFromLook, lookParts, priceFor, readLook, saveLook } from '@/lib/cart';
import { SITE, formatPrice } from '@/lib/site';

const STEPS = [
  { id: 'cuerpo', name: 'Cuerpo' },
  { id: 'tapa', name: 'Tapa' },
  { id: 'textura', name: 'Textura' },
  { id: 'acabado', name: 'Acabado' },
  { id: 'resumen', name: 'Resumen' },
];

const Todo = ({ children }) => <span className="todo">[{children}]</span>;

function Swatches({ label, list, value, onPick }) {
  const current = list.find((o) => o.hex === value);
  return (
    <div className="opt">
      <span className="small">{label} <b>{current?.name}</b></span>
      <div className="swatches" role="radiogroup" aria-label={label}>
        {list.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.hex === value} aria-label={o.name} title={o.name}
            className="swatch" style={{ '--c': o.hex }} onClick={() => onPick(o.hex)} />
        ))}
      </div>
    </div>
  );
}

function Pills({ label, list, value, onPick }) {
  return (
    <div className="opt">
      <span className="small">{label}</span>
      <div className="pills" role="radiogroup" aria-label={label}>
        {list.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className="pill" onClick={() => onPick(o.id)}>
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Configurator() {
  const [look, setLook] = useState(DEFAULT_LOOK);
  const [step, setStep] = useState(0);

  useEffect(() => { setLook(readLook()); }, []);

  const update = (patch) => {
    const next = { ...look, ...patch };
    setLook(next);
    saveLook(next);
  };

  const p = lookParts(look);
  const price = priceFor(look);
  const base = SITE.price.base;
  const extra = SITE.price.finish[look.finish];
  const id = STEPS[step].id;

  return (
    <div className="config">
      <div className="steps" role="tablist" aria-label="Pasos del personalizador">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" role="tab" id={`tab-${s.id}`} aria-selected={i === step} aria-controls="step-panel"
            className="step" onClick={() => setStep(i)}>
            <i>{i + 1}</i>{s.name}
          </button>
        ))}
      </div>

      <div className="steppanel" id="step-panel" role="tabpanel" aria-labelledby={`tab-${id}`}>
        {id === 'cuerpo' && <Swatches label="Color del cuerpo" list={BODY_COLORS} value={look.body} onPick={(body) => update({ body })} />}
        {id === 'tapa' && <Swatches label="Color de la tapa" list={LID_COLORS} value={look.lid} onPick={(lid) => update({ lid })} />}
        {id === 'textura' && (
          <>
            <Pills label="Patrón de la tapa" list={PATTERNS} value={look.pattern} onPick={(pattern) => update({ pattern })} />
            {look.pattern !== 'liso' && (
              <Swatches label="Color del relieve" list={ACCENT_COLORS} value={look.accent} onPick={(accent) => update({ accent })} />
            )}
          </>
        )}
        {id === 'acabado' && (
          <>
            <Pills label="Acabado" list={FINISHES} value={look.finish} onPick={(finish) => update({ finish })} />
            <p className="note">{p.finish.note}.</p>
          </>
        )}
        {id === 'resumen' && (
          <dl className="summary">
            <dt>Cuerpo</dt><dd>{p.body.name}</dd>
            <dt>Tapa</dt><dd>{p.lid.name}</dd>
            <dt>Textura</dt><dd>{p.pattern.name}{p.pattern.id !== 'liso' && ` · relieve ${p.accent.name.toLowerCase()}`}</dd>
            <dt>Acabado</dt><dd>{p.finish.name}</dd>
            <dt>Estuche</dt><dd>{base == null ? <Todo>PRECIO</Todo> : formatPrice(base)}</dd>
            <dt>Suplemento</dt><dd>{extra == null ? <Todo>SUPLEMENTO</Todo> : extra ? `+ ${formatPrice(extra)}` : 'Incluido'}</dd>
          </dl>
        )}
        <div className="stepnav">
          <button type="button" className="link" disabled={step === 0} onClick={() => setStep(step - 1)}>← Anterior</button>
          <button type="button" className="link" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Siguiente →</button>
        </div>
      </div>

      <div className="buy">
        <div className="price">
          <span className="small">Total</span>
          <b>{price == null ? <Todo>PRECIO</Todo> : formatPrice(price)}</b>
        </div>
        <button type="button" className="btn" onClick={() => addToCart(itemFromLook(look, true))}>Añadir al carrito</button>
      </div>
      <p className="legalnote">Los productos personalizados no admiten devolución por desistimiento.</p>
    </div>
  );
}
