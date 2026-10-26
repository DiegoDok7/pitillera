'use client';

import { useEffect, useRef, useState } from 'react';

export const AGE_COOKIE = 'mayor_edad';

// The gate is always in the server HTML; an inline script in <head> adds `age-ok` to <html>
// before paint when the cookie exists, so returning visitors never see it flash.
export default function AgeGate() {
  const [denied, setDenied] = useState(false);
  const yesRef = useRef(null);

  useEffect(() => {
    if (!document.documentElement.classList.contains('age-ok')) yesRef.current?.focus();
  }, []);

  function accept() {
    document.cookie = `${AGE_COOKIE}=1; max-age=31536000; path=/; SameSite=Lax`;
    document.documentElement.classList.add('age-ok');
    window.dispatchEvent(new Event('estuche:age-ok'));
  }

  return (
    <div className="agegate" role="dialog" aria-modal="true" aria-labelledby="ageTitle" aria-describedby="ageText">
      <div className="agebox">
        {denied ? (
          <>
            <h2 id="ageTitle">Vuelve cuando cumplas 18.</h2>
            <p id="ageText">Este sitio está dirigido solo a personas mayores de edad.</p>
            <button type="button" className="btn ghost" onClick={() => setDenied(false)}>Volver</button>
          </>
        ) : (
          <>
            <h2 id="ageTitle">¿Eres mayor de edad?</h2>
            <p id="ageText">Este sitio está dirigido a personas mayores de 18 años.</p>
            <div className="agebtns">
              <button type="button" className="btn" ref={yesRef} onClick={accept}>Soy mayor de 18 años</button>
              <button type="button" className="btn ghost" onClick={() => setDenied(true)}>Soy menor</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
