export const MARKUP = `
<canvas id="gl" aria-label="Pitillera ARIST3D en 3D"></canvas>
<img id="fallback" src="/assets/top.webp" alt="Pitillera ARIST3D" hidden>
<div class="ghost" id="ghost" aria-hidden="true">ARIST3D · ARIST3D · ARIST3D</div>
<div class="cursor" id="cursor"><span id="cursorLbl">Arrastra</span></div>
<svg class="leaders" id="leaders" aria-hidden="true"></svg>

<header>
  <a class="brand" href="#hero"><img src="/assets/logo.png" alt=""><span>ARIST<b>3</b>D</span></a>
  <div class="chapter" aria-live="polite"><span class="num" id="chNum">00</span><span class="bar"><i id="chBar"></i></span><span class="lbl" id="chLbl">Pitillera</span></div>
</header>

<main>
  <section class="ch" id="hero" data-label="Pitillera"><div class="in">
    <div class="copy hero-copy">
      <div class="eyebrow fade on">ARIST3D · Pitillera magenta / lima</div>
      <h1 class="reveal">La pitillera que <em>se imprime.</em></h1>
      <p class="lede fade on">Relieve bicolor, dos compartimentos y un cajón inferior escondido. Diseñada en digital y fabricada capa a capa.</p>
      <div class="printbar"><span id="printPct">Imprimiendo 000%</span><span class="track"><i id="printBar"></i></span></div>
    </div>
    <div class="cue"><i></i><span class="small">Desliza</span></div>
  </div></section>

  <section class="ch" id="capas" data-label="Capa a capa"><div class="in">
    <div class="copy">
      <div class="eyebrow">01 · Fabricación</div>
      <h2 class="reveal">Corte a corte, <em>de abajo arriba.</em></h2>
      <p class="lede fade">Así se construye: la impresora deposita filamento en láminas finísimas que se apilan hasta cerrar la forma. La separamos para que la veas por dentro.</p>
      <div class="ruler fade" id="ruler"></div>
    </div>
  </div></section>

  <section class="ch right" id="relieve" data-label="Relieve"><div class="in">
    <div class="copy">
      <div class="eyebrow">02 · Acabado</div>
      <h2 class="reveal">Relieve que <em>se toca.</em></h2>
      <p class="lede fade">Pasamos una luz rasante por la tapa: el estampado sobresale en lima sobre el magenta, y en el centro, el hexágono ARIST3D.</p>
    </div>
  </div></section>

  <section class="ch" id="abre" data-label="Interior"><div class="in">
    <div class="copy">
      <div class="eyebrow">03 · Interior</div>
      <h2 class="reveal">Ábrela. <em>Todo en su sitio.</em></h2>
      <p class="lede fade">La tapa gira sobre su bisagra y descubre dos compartimentos: uno amplio para lo principal y otro lateral para lo pequeño. Debajo, un cajón sale desde el frontal.</p>
    </div>
  </div></section>

  <section class="ch" id="despiece" data-label="Despiece"><div class="in">
    <div class="copy">
      <div class="eyebrow">04 · Despiece</div>
      <h2 class="reveal">Cuatro piezas. <em>Un solo gesto.</em></h2>
      <p class="lede fade">Cuerpo, tapa, cierre y cajón inferior. Encajan entre sí sin tornillos ni pegamento.</p>
    </div>
  </div></section>

  <section class="ch" id="real" data-label="La pieza real"><div class="pin">
    <div class="real-head">
      <div style="display:flex;flex-direction:column;gap:18px"><div class="eyebrow">05 · Sin render</div><h2 class="reveal">La pieza <em>real.</em></h2></div>
      <p>Fotos del producto impreso, tal y como sale del taller. Lo que ves en 3D es lo que llega a tu mano.</p>
    </div>
    <div class="track" id="track">
      <figure class="card c1"><img src="/assets/top.webp" alt="Pitillera vista cenital" loading="lazy"><figcaption><span>Vista cenital</span><span>01</span></figcaption></figure>
      <figure class="card c3"><img src="/assets/open.webp" alt="Pitillera abierta" loading="lazy"><figcaption><span>Abierta</span><span>02</span></figcaption></figure>
      <figure class="card c2"><img src="/assets/front.webp" alt="Pitillera frontal con cierre" loading="lazy"><figcaption><span>Frontal</span><span>03</span></figcaption></figure>
      <figure class="card c4"><img src="/assets/side.webp" alt="Pitillera de perfil" loading="lazy"><figcaption><span>Perfil</span><span>04</span></figcaption></figure>
      <div class="card end"><span class="small">Siguiente</span><h3>Ahora, gírala tú.</h3></div>
    </div>
  </div></section>

  <section class="ch" id="explora" data-label="Explora"><div class="dragzone" aria-hidden="true"></div><div class="in">
    <div class="bay">
      <div class="eyebrow">06 · Explora</div>
      <h2 class="reveal">Gírala <em>tú.</em></h2>
      <p class="small fade">Arrastra para girar · toca la tapa o el cajón para abrirlos</p>
      <div class="pills fade" role="group" aria-label="Controles del modelo">
        <button class="pill" id="bOpen" aria-pressed="false">Abrir</button>
        <button class="pill" id="bTray" aria-pressed="false">Cajón</button>
        <button class="pill" id="bExplode" aria-pressed="false">Despiece</button>
        <button class="pill" id="bTop" aria-pressed="false">Vista cenital</button>
        <button class="pill" id="bReset">Centrar</button>
      </div>
    </div>
  </div></section>

  <section class="ch" id="personaliza" data-label="Personaliza"><div class="dragzone" aria-hidden="true"></div><div class="in">
    <div class="copy custom">
      <div class="eyebrow">07 · Personaliza</div>
      <h2 class="reveal">Hazla <em>tuya.</em></h2>
      <div class="opts fade">
        <div class="opt"><span class="small">Color <b id="lblBody"></b></span><div class="swatches" id="swBody" role="radiogroup" aria-label="Color del cuerpo"></div></div>
        <div class="opt"><span class="small">Relieve <b id="lblAccent"></b></span><div class="swatches" id="swAccent" role="radiogroup" aria-label="Color del relieve"></div></div>
        <div class="opt"><span class="small">Patrón</span><div class="pills" id="swPattern" role="radiogroup" aria-label="Patrón de la tapa"></div></div>
      </div>
    </div>
  </div></section>

  <section class="ch" id="final" data-label="ARIST3D"><div class="in">
    <div class="eyebrow">ARIST3D · Diseñada e impresa en 3D</div>
    <h2 class="reveal" style="font-size:clamp(50px,8vw,136px)">Lleva lo tuyo con <em>estilo propio.</em></h2>
    <div class="marquee" aria-hidden="true">
      <div class="mq a" id="mqA"></div>
      <div class="mq b" id="mqB"></div>
    </div>
  </div></section>
</main>
<footer><span>© ARIST3D</span><span>Pitillera impresa en 3D</span></footer>

<div class="tag" id="t-lid"><span><b>Tapa</b>Relieve bicolor en una pieza</span></div>
<div class="tag" id="t-tab"><span><b>Cierre</b>Pestaña que encaja a presión</span></div>
<div class="tag" id="t-body"><span><b>Cuerpo</b>Dos compartimentos</span></div>
<div class="tag" id="t-tray"><span><b>Cajón inferior</b>Sale desde el frontal</span></div>
<div class="tag" id="t-big"><span><b>Compartimento principal</b>Espacio amplio</span></div>
<div class="tag" id="t-small"><span><b>Compartimento lateral</b>Para lo pequeño</span></div>
`;
