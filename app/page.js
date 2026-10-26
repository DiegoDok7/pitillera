import AgeGate from '@/components/AgeGate';
import B2BForm from '@/components/B2BForm';
import BuyButtons from '@/components/BuyButtons';
import Cart from '@/components/Cart';
import Configurator from '@/components/Configurator';
import Experience from '@/components/Experience';
import { BODY_COLORS, ACCENT_COLORS, PATTERNS, FINISHES } from '@/lib/pitillera';
import { FAQ, SITE, formatPrice } from '@/lib/site';

// Every section names its pose of the 3D case in `data-k` (keyframes in lib/scene.js); content sections leave the other half of the screen to it.

const NAME = SITE.brand ?? SITE.product;

const Todo = ({ children }) => <span className="todo">[{children}]</span>;
const val = (v, label) => (v == null ? <Todo>{label}</Todo> : v);

const LEGAL_LINKS = [
  ['aviso-legal', 'Aviso legal'],
  ['privacidad', 'Privacidad'],
  ['cookies', 'Cookies'],
  ['condiciones-de-venta', 'Condiciones de venta'],
  ['envios-y-devoluciones', 'Envíos y devoluciones'],
];

const Icon = {
  paper: (
    <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8l9 4 7-3 6 5 6-2-2 11 3 8-5 9-9-2-6 4-8-4-3-9 3-8z" /><path d="M19 12l-2 10 8 5 5-8M17 22l-6 6M25 27l2 11" /></svg>
  ),
  drop: (
    <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6c6 9 13 16 13 24a13 13 0 0 1-26 0c0-8 7-15 13-24z" /><path d="M18 31a6 6 0 0 0 6 6" /></svg>
  ),
  loose: (
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="12" width="7" height="16" rx="3.5" transform="rotate(-20 10 20)" /><rect x="22" y="8" width="7" height="16" rx="3.5" transform="rotate(25 25 16)" /><rect x="30" y="24" width="7" height="16" rx="3.5" transform="rotate(-50 33 32)" /><rect x="12" y="30" width="7" height="16" rx="3.5" transform="rotate(70 15 38)" /></svg>
  ),
};

const PROBLEMS = [
  { icon: Icon.paper, bad: 'Papel arrugado', good: 'Un compartimento para cada cosa', text: 'Cada cosa va en su hueco y llega como la guardaste.' },
  { icon: Icon.drop, bad: 'Tabaco que se seca', good: 'Cierre que conserva la humedad', text: 'La tapa cierra a presión sobre una junta de TPU.' },
  { icon: Icon.loose, bad: 'Filtros sueltos', good: 'Formato de bolsillo', text: 'Todo junto en un estuche que cabe en el bolsillo.' },
];

const TAGS = [
  ['t-big', 1, 'Compartimento principal', 'Espacio amplio'],
  ['t-small', 2, 'Compartimento lateral', 'Para lo pequeño'],
  ['t-tray', 3, 'Cajón inferior', 'Sale desde el frontal'],
  ['t-tab', 4, 'Cierre', 'Pestaña que encaja a presión'],
  ['t-lid', 5, 'Tapa', 'Relieve bicolor en una pieza'],
];

function jsonLd() {
  const abs = (p) => (SITE.siteUrl ? new URL(p, SITE.siteUrl).href : p);
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: SITE.product,
    description: 'Estuche impreso en 3D con un compartimento para cada cosa, cierre con junta que conserva la humedad y formato de bolsillo. Personalizable en color y textura.',
    image: ['/assets/top.webp', '/assets/open.webp', '/assets/front.webp'].map(abs),
    ...(SITE.brand ? { brand: { '@type': 'Brand', name: SITE.brand } } : {}),
    material: SITE.specs.material,
    color: BODY_COLORS.map((c) => c.name).join(', '),
  };
  if (SITE.price.base != null) {
    product.offers = {
      '@type': 'Offer',
      price: SITE.price.base.toFixed(2),
      priceCurrency: SITE.price.currency,
      availability: 'https://schema.org/InStock',
      ...(SITE.siteUrl ? { url: SITE.siteUrl } : {}),
    };
  }
  if (SITE.reviews.length) {
    product.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (SITE.reviews.reduce((n, r) => n + r.rating, 0) / SITE.reviews.length).toFixed(1),
      reviewCount: SITE.reviews.length,
    };
  }
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return JSON.stringify([product, faq]).replace(/</g, '\\u003c');
}

export default function Page() {
  const s = SITE.specs;
  const m = SITE.manufacturer;
  return (
    <div id="site">
      <AgeGate />
      <Experience />
      <img id="fallback" src="/assets/top.webp" alt="Estuche impreso en 3D" hidden />
      <div className="ghost" id="ghost" aria-hidden="true">Impreso en 3D · Impreso en 3D</div>
      <div className="cursor" id="cursor" aria-hidden="true"><span>Arrastra</span></div>
      <svg className="leaders" id="leaders" aria-hidden="true" />

      <header>
        <a className="brand" href="#hero">{NAME}</a>
        <div className="chapter" aria-hidden="true"><span className="num" id="chNum">00</span><span className="bar"><i id="chBar" /></span><span className="lbl" id="chLbl">Inicio</span></div>
        <nav className="nav" aria-label="Principal">
          <a href="#personaliza">Personalizar</a>
          <a href="#tiendas">Tiendas</a>
          <a href="#faq">FAQ</a>
          <Cart />
        </nav>
      </header>

      <main>
        <section className="ch" id="hero" data-label="Inicio" data-k="hero"><div className="in">
          <div className="copy hero-copy">
            <div className="eyebrow fade on">Diseñado e impreso a medida</div>
            <h1 className="reveal">Todo lo que llevas, <em>en un solo estuche.</em></h1>
            <p className="lede fade on">Un compartimento para cada cosa, un cierre que conserva la humedad y formato de bolsillo. Impreso en 3D bajo pedido.</p>
            <div className="fade on"><BuyButtons /></div>
            <ul className="trust fade on">
              <li>Envío en {val(SITE.shippingDays, 'X')} días</li>
              <li>Fabricado en {SITE.madeIn}</li>
              <li>Garantía de {SITE.warrantyYears} años</li>
            </ul>
            <div className="printbar" aria-hidden="true"><span id="printPct">Imprimiendo 000%</span><span className="track"><i id="printBar" /></span></div>
          </div>
        </div></section>

        <section className="ch flow" id="problema" data-label="Para qué" data-k="problema"><div className="in">
          <div className="eyebrow fade">02 · Por qué un estuche</div>
          <h2 className="reveal">Se acabó llevarlo <em>todo suelto.</em></h2>
          <div className="problems">
            {PROBLEMS.map((p) => (
              <article className="problem fade" key={p.bad}>
                <div className="ico">{p.icon}</div>
                <p className="bad">{p.bad}</p>
                <h3>{p.good}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div></section>

        <section className="ch" id="anatomia" data-label="Anatomía" data-k="anatomia"><div className="in">
          <div className="copy">
            <div className="eyebrow">03 · Anatomía</div>
            <h2 className="reveal">Un sitio <em>para cada cosa.</em></h2>
            <p className="lede fade">Abre la tapa y saca el cajón: dos compartimentos arriba y un cajón inferior que sale desde el frontal.</p>
          </div>
        </div></section>

        <section className="ch" id="fabricacion" data-label="Fabricación" data-k="fabricacion"><div className="in">
          <div className="copy">
            <div className="eyebrow">04 · Materiales y fabricación</div>
            <h2 className="reveal">Hecho capa a capa, <em>bajo pedido.</em></h2>
            <ul className="facts fade">
              <li><b>{s.material}</b>Resistente al calor: no se deforma en el coche.</li>
              <li><b>{s.gasket}</b>Sella la tapa para mantener la humedad.</li>
              <li><b>Impreso bajo pedido</b>Revisado a mano y sin stock sobrante.</li>
            </ul>
            {SITE.printerVideo ? (
              <video className="printvid fade" src={SITE.printerVideo} autoPlay muted loop playsInline aria-label="La impresora fabricando un estuche" />
            ) : (
              <div className="printvid ph fade"><Todo>Vídeo de la impresora trabajando</Todo></div>
            )}
          </div>
        </div></section>

        <section className="ch flow right" id="especificaciones" data-label="Medidas" data-k="especificaciones"><div className="in">
          <div className="eyebrow fade">05 · Especificaciones</div>
          <h2 className="reveal">Medidas <em>y capacidad.</em></h2>
          <div className="tablewrap fade">
            <table className="specs">
              <tbody>
                <tr><th scope="row">Dimensiones</th><td>{val(s.dimensions, 'L × A × H mm')}</td></tr>
                <tr><th scope="row">Peso</th><td>{val(s.weight, 'GRAMOS')}</td></tr>
                <tr><th scope="row">Capacidad</th><td>{val(s.capacityGrams, 'X')} g de tabaco · {val(s.papers, 'X')} papeles · {val(s.filters, 'X')} filtros</td></tr>
                <tr><th scope="row">Material</th><td>{s.material} · {s.gasket} en el cierre</td></tr>
                <tr><th scope="row">Colores</th><td>{BODY_COLORS.map((c) => c.name).join(', ')} · relieve en {ACCENT_COLORS.map((c) => c.name.toLowerCase()).join(', ')}</td></tr>
                <tr><th scope="row">Texturas</th><td>{PATTERNS.map((p) => p.name).join(', ')}</td></tr>
                <tr><th scope="row">Acabados</th><td>{FINISHES.map((f) => f.name).join(', ')}</td></tr>
                <tr><th scope="row">Precio</th><td>{SITE.price.base == null ? <Todo>PRECIO</Todo> : `Desde ${formatPrice(SITE.price.base)}`}</td></tr>
              </tbody>
            </table>
          </div>
        </div></section>

        <section className="ch" id="personaliza" data-label="Personaliza" data-k="personaliza"><div className="dragzone" aria-hidden="true" /><div className="in">
          <div className="copy custom">
            <div className="eyebrow">06 · Personalizador</div>
            <h2 className="reveal">Hazla <em>tuya.</em></h2>
            <Configurator />
          </div>
          <div className="viewbar" role="group" aria-label="Vista del modelo">
            <button type="button" className="pill" id="bOpen" aria-pressed="false">Abrir</button>
            <button type="button" className="pill" id="bTray" aria-pressed="false">Cajón</button>
            <button type="button" className="pill" id="bTop" aria-pressed="false">Vista cenital</button>
            <button type="button" className="pill" id="bReset">Centrar</button>
          </div>
        </div></section>

        <section className="ch" id="real" data-label="Galería" data-k="galeria"><div className="pin">
          <div className="real-head">
            <div className="real-title"><div className="eyebrow">07 · Galería</div><h2 className="reveal">La pieza <em>real.</em></h2></div>
            <p>Fotos del producto impreso, tal y como sale del taller.</p>
          </div>
          <div className="track" id="track">
            <figure className="card c1"><img src="/assets/top.webp" alt="Estuche visto desde arriba" loading="lazy" /><figcaption><span>Vista cenital</span><span>01</span></figcaption></figure>
            <figure className="card c3"><img src="/assets/open.webp" alt="Estuche abierto con sus compartimentos" loading="lazy" /><figcaption><span>Abierto</span><span>02</span></figcaption></figure>
            <figure className="card c2"><img src="/assets/front.webp" alt="Frontal del estuche con el cierre" loading="lazy" /><figcaption><span>Frontal</span><span>03</span></figcaption></figure>
            <figure className="card c4"><img src="/assets/side.webp" alt="Estuche de perfil" loading="lazy" /><figcaption><span>Perfil</span><span>04</span></figcaption></figure>
            <a className="card end" href="#personaliza"><span className="small">Siguiente</span><h3>¿En otro color? Personaliza la tuya.</h3></a>
          </div>
        </div></section>

        {SITE.reviews.length > 0 && (
          <section className="ch flow" id="opiniones" data-label="Opiniones" data-k="opiniones"><div className="in">
            <div className="eyebrow fade">08 · Opiniones</div>
            <h2 className="reveal">Lo que dicen <em>quienes lo usan.</em></h2>
            <div className="reviews">
              {SITE.reviews.map((r) => (
                <blockquote className="review fade" key={r.name + r.date}>
                  <span className="stars" aria-label={`${r.rating} de 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <p>{r.text}</p>
                  <footer>{r.name} · {r.date}</footer>
                </blockquote>
              ))}
            </div>
            {SITE.retailers.length > 0 && (
              <ul className="retailers">
                {SITE.retailers.map((t) => <li key={t.name}><a href={t.url}><img src={t.logo} alt={t.name} /></a></li>)}
              </ul>
            )}
          </div></section>
        )}

        <section className="ch flow" id="tiendas" data-label="Tiendas" data-k="tiendas"><div className="in b2b">
          <div className="b2bcopy">
            <div className="eyebrow fade">09 · Para tiendas</div>
            <h2 className="reveal">¿Tienes una tienda <em>o estanco?</em></h2>
            <ul className="facts fade">
              <li><b>Tarifas por volumen</b>Precios escalonados según tu pedido mensual.</li>
              <li><b>Expositor de mostrador</b>Para tener los estuches a la vista en caja.</li>
              <li><b>Con la marca de tu tienda</b>Personalizamos los estuches con tu logo.</li>
            </ul>
            {SITE.catalogPdf ? (
              <a className="btn ghost fade" href={SITE.catalogPdf} download>Descargar catálogo (PDF)</a>
            ) : (
              <span className="btn ghost fade" aria-disabled="true">Catálogo PDF <Todo>pendiente</Todo></span>
            )}
          </div>
          <B2BForm />
        </div></section>

        <section className="ch flow right" id="faq" data-label="Preguntas" data-k="faq"><div className="in">
          <div className="eyebrow fade">10 · Preguntas frecuentes</div>
          <h2 className="reveal">Lo que <em>nos preguntáis.</em></h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q} className="fade">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div></section>

        <section className="ch" id="cta" data-label="Tu estuche" data-k="cta"><div className="in">
          <div className="eyebrow">Diseñado e impreso a medida</div>
          <h2 className="reveal">Todo lo que llevas, <em>en un solo estuche.</em></h2>
          <BuyButtons />
          <div className="marquee" aria-hidden="true">
            {['a', 'b'].map((k) => (
              <div key={k} className={'mq ' + k} id={k === 'a' ? 'mqA' : 'mqB'}>
                {Array.from({ length: 6 }, (_, i) => <span key={i}>Impreso a medida — Hecho en {SITE.madeIn} — </span>)}
              </div>
            ))}
          </div>
        </div></section>
      </main>

      <footer className="sitefoot">
        <div className="fcol">
          <a className="brand" href="#hero">{NAME}</a>
          <p>Estuches diseñados e impresos en 3D bajo pedido en {SITE.madeIn}.</p>
        </div>
        <nav className="fcol" aria-label="Legal">
          <h3>Legal</h3>
          {LEGAL_LINKS.map(([slug, name]) => <a key={slug} href={`/legal/${slug}`}>{name}</a>)}
        </nav>
        <div className="fcol">
          <h3>Fabricante</h3>
          <p>{val(m.name, 'NOMBRE O RAZÓN SOCIAL')}<br />{val(m.address, 'DIRECCIÓN POSTAL')}</p>
        </div>
        <div className="fcol">
          <h3>Contacto</h3>
          <p>{val(m.email, 'EMAIL')}<br />{val(m.phone, 'TELÉFONO')}</p>
        </div>
        <p className="copyright">© {new Date().getFullYear()} {NAME}</p>
      </footer>

      {TAGS.map(([id, n, title, text]) => (
        <div className="tag" id={id} key={id} aria-hidden="true"><span><b><i>{n}</i>{title}</b>{text}</span></div>
      ))}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
    </div>
  );
}
