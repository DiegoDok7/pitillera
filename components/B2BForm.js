'use client';

import { useState } from 'react';
import { BUSINESS_TYPES, PROVINCES, VOLUMES, validateLead } from '@/lib/b2b';

function Field({ name, label, errors, children, optional }) {
  return (
    <label className={'field' + (errors[name] ? ' bad' : '')}>
      <span>{label}{optional ? <em> (opcional)</em> : null}</span>
      {children}
      {errors[name] && <small id={`${name}-err`} role="alert">{errors[name]}</small>}
    </label>
  );
}

function YesNo({ name, label, errors, required }) {
  return (
    <fieldset className={'field yesno' + (errors[name] ? ' bad' : '')} aria-describedby={errors[name] ? `${name}-err` : undefined}>
      <legend>{label}{required ? null : <em> (opcional)</em>}</legend>
      <label><input type="radio" name={name} value="si" required={required} /> Sí</label>
      <label><input type="radio" name={name} value="no" /> No</label>
      {errors[name] && <small id={`${name}-err`} role="alert">{errors[name]}</small>}
    </fieldset>
  );
}

export default function B2BForm() {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.privacy = form.privacy.checked;
    const { errors: errs } = validateLead(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      form.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/b2b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json();
      if (out.ok) { setStatus('sent'); form.reset(); return; }
      setErrors(out.errors || {});
      setStatus('error');
    } catch (err) {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="b2bdone" role="status">
        <h3>Solicitud recibida.</h3>
        <p>Gracias. Nuestro equipo comercial revisará tus datos y te escribirá con las tarifas para tiendas.</p>
      </div>
    );
  }

  const aria = (name) => ({ 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-err` : undefined });

  return (
    <form className="b2bform" onSubmit={onSubmit} noValidate>
      <Field name="business" label="Nombre del negocio" errors={errors}>
        <input name="business" autoComplete="organization" required {...aria('business')} />
      </Field>
      <Field name="taxId" label="NIF/CIF" errors={errors}>
        <input name="taxId" autoComplete="off" required placeholder="B12345678" {...aria('taxId')} />
      </Field>
      <Field name="type" label="Tipo de negocio" errors={errors}>
        <select name="type" required defaultValue="" {...aria('type')}>
          <option value="" disabled>Elige una opción</option>
          {BUSINESS_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field name="contact" label="Persona de contacto" errors={errors}>
        <input name="contact" autoComplete="name" required {...aria('contact')} />
      </Field>
      <Field name="email" label="Email" errors={errors}>
        <input name="email" type="email" autoComplete="email" required {...aria('email')} />
      </Field>
      <Field name="phone" label="Teléfono" errors={errors}>
        <input name="phone" type="tel" autoComplete="tel" required {...aria('phone')} />
      </Field>
      <Field name="province" label="Provincia" errors={errors}>
        <select name="province" required defaultValue="" {...aria('province')}>
          <option value="" disabled>Elige una provincia</option>
          {[...PROVINCES].sort((a, b) => a.localeCompare(b, 'es')).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>
      <Field name="volume" label="Volumen estimado al mes" errors={errors}>
        <select name="volume" required defaultValue="" {...aria('volume')}>
          <option value="" disabled>Unidades al mes</option>
          {VOLUMES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </Field>
      <YesNo name="branding" label="¿Personalización con tu marca?" errors={errors} />
      <YesNo name="surcharge" label="¿Recargo de equivalencia?" errors={errors} required />
      <Field name="message" label="Mensaje" errors={errors} optional>
        <textarea name="message" rows={3} maxLength={2000} />
      </Field>
      {/* honeypot: hidden from people, bots fill it in */}
      <input className="hp" name="web" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className={'check' + (errors.privacy ? ' bad' : '')}>
        <input type="checkbox" name="privacy" required {...aria('privacy')} />
        <span>He leído y acepto la <a href="/legal/privacidad" target="_blank" rel="noopener">política de privacidad</a>.</span>
        {errors.privacy && <small id="privacy-err" role="alert">{errors.privacy}</small>}
      </label>
      <div className="formfoot">
        <button type="submit" className="btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Enviando…' : 'Solicitar tarifas'}
        </button>
        {status === 'error' && <p className="formerr" role="alert">No hemos podido enviar la solicitud. Revisa los campos o inténtalo de nuevo.</p>}
      </div>
    </form>
  );
}
