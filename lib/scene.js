import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import Lenis from 'lenis';
import { buildPitillera } from './pitillera.js';
import { LOOK_EVENT, readLook } from './cart.js';

// Attaches to the server-rendered page in #site: the canvas is created here, everything else already exists.
export function startExperience(root) {
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (x) => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const backOut = (x) => { x = clamp(x); return x + 2.2 * Math.pow(x, 4) * (1 - x); };
  const win = (s, a, b, f = .15) => clamp((s - a) / f) * clamp((b - s) / f);

  const STILL = window.location.search.includes('still');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const unlisten = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    unlisten.push(() => target.removeEventListener(type, fn, opts));
  };

  $$('.reveal').forEach((el) => {
    if (el.classList.contains('split')) return; // already split (dev remount)
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const i = document.createElement('span');
          i.textContent = t;
          w.append(i);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    el.classList.add('split');
    [...el.querySelectorAll('.w>span')].forEach((s, k) => { s.style.transitionDelay = (k * 0.055) + 's'; });
  });

  const sections = $$('main .ch');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.reveal,.fade').forEach((x) => x.classList.add('on'));
      e.target.classList.add('on');
    }
  }), { threshold: 0.2 });
  sections.forEach((s) => io.observe(s));
  requestAnimationFrame(() => $('#hero .reveal').classList.add('on'));

  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  root.prepend(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    $('#fallback').hidden = false;
    return () => {
      io.disconnect();
      unlisten.forEach((fn) => fn());
    };
  }
  // phones and tablets get a lighter setup; the pixel ratio also drops on its own if frames run slow
  const lite = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
  const maxDpr = STILL ? 1 : Math.min(lite ? 1.5 : 1.6, window.devicePixelRatio);
  let dpr = maxDpr;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.localClippingEnabled = true;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.38;
  const camera = new THREE.PerspectiveCamera(30, 1, 2, 200);

  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bgMat = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uC: { value: new THREE.Vector2(.68, .5) },
      uAspect: { value: 1 },
      uGlow: { value: new THREE.Color(0x6a1660) },
      uGlow2: { value: new THREE.Color(0x1aa6a8) },
      uBase: { value: new THREE.Color(0x0f070f) },
      uT: { value: 0 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `varying vec2 vUv; uniform vec2 uC; uniform float uAspect,uT; uniform vec3 uGlow,uGlow2,uBase;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec2 d=vUv-uC; d.x*=uAspect; float r=length(d);
        float g=exp(-r*r*5.5); float g2=exp(-pow(length(d-vec2(.18,-.22)),2.)*9.);
        vec3 c=uBase + uGlow*g*.75 + uGlow2*g2*.18;
        vec2 v=vUv-.5; c*=1.-dot(v,v)*.5;
        c+=(h(gl_FragCoord.xy+uT)-.5)*.012;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  const key = new THREE.DirectionalLight(0xfff4ec, 1.9);
  key.position.set(6, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(lite ? 1024 : 1536, lite ? 1024 : 1536);
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.05;
  scene.add(key);
  const rimT = new THREE.DirectionalLight(0x1aa6a8, 2.4);
  rimT.position.set(-10, 4, -8);
  scene.add(rimT);
  const rimL = new THREE.DirectionalLight(0xe3e88a, 0.8);
  rimL.position.set(10, 2, -6);
  scene.add(rimL);
  const hemi = new THREE.HemisphereLight(0xffe6fb, 0x1a061a, 0.22);
  scene.add(hemi);

  const P = buildPitillera(THREE, { look: readLook(), texSize: lite ? 1024 : 2048 });
  const stage = new THREE.Group();
  scene.add(stage);
  const pivot = new THREE.Group();
  stage.add(pivot);
  pivot.add(P.root);
  const glow = new THREE.PointLight(0xe3e88a, 0, 9, 1.6);
  glow.position.set(0, 1.4, -1.2);
  P.root.add(glow);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.45 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  stage.add(ground);

  const headGeo = new THREE.PlaneGeometry(10.4, 9);
  const head = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: 0x1aa6a8, transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false }));
  const headEdge = new THREE.LineSegments(new THREE.EdgesGeometry(headGeo), new THREE.LineBasicMaterial({ color: 0xe3e88a, transparent: true, opacity: .9 }));
  [head, headEdge].forEach((o) => { o.rotation.x = -Math.PI / 2; stage.add(o); });

  // the case follows every chapter: one pose per section (data-k). tx < 0 puts it on the right of wide screens, tx > 0 on the left.
  // narrow screens: ny moves the target, nd scales the distance, nvis dims the canvas behind long text.
  // idle adds float and sway, spin a slow turn (accumulated, so it never jumps).
  const POSE = { tz: 0, lid: 0, lift: 0, tray: 0, glow: 0, yaw: 0, ny: -2.6, nd: 2, nvis: 1, idle: 0, spin: 0 };
  const KF = {
    hero: { az: .62, el: .38, dist: 35, tx: -5.4, ty: 2.4, ny: -3.4, idle: 1 },
    problema: { az: .95, el: .58, dist: 37, tx: -7, ty: 2.8, lid: .55, tray: 1.8, glow: .6, ny: -1.8, nd: 2.2, nvis: 1, idle: 1, spin: .35 },
    anatomia: { az: .2, el: .74, dist: 36, tx: -6.2, ty: 3.2, tz: -.8, lid: 1, tray: 2.6, glow: 1, ny: -2.6, nd: 1.8 },
    especificaciones: { az: -.55, el: .66, dist: 36, tx: 8.6, ty: 2.2, ny: -1.8, nd: 2.2, nvis: 1, idle: 1, spin: .3 },
    personaliza: { az: .3, el: .82, dist: 29, tx: -5.6, ty: 1.4 },
    galeria: { az: .7, el: .3, dist: 72, tx: -2, ty: -10, ny: -9, nd: 1.6, nvis: 1, idle: 1, spin: .6 },
    opiniones: { az: .9, el: .5, dist: 36, tx: -7, ty: 2.4, lid: .4, ny: -1.8, nd: 2.2, nvis: 1, idle: 1, spin: .3 },
    tiendas: { az: .55, el: .5, dist: 37, tx: -7, ty: 2.4, tray: 2.6, glow: .3, ny: -1.8, nd: 2.2, nvis: 1, idle: 1, spin: .25 },
    faq: { az: -.45, el: .55, dist: 40, tx: 9, ty: 2.8, lid: .6, glow: .5, ny: -9, nd: 2.8, nvis: 1, idle: 1, spin: .3 },
    cta: { az: -.6, el: .36, dist: 54, tx: 0, ty: 6.2, ny: -4, nd: 1.3, idle: 1, spin: 1 },
  };
  let prevK = { ...POSE, ...KF.hero };
  const K = sections.map((sec) => {
    const kf = KF[sec.dataset.k];
    if (kf) prevK = { ...POSE, ...kf };
    return { ...prevK };
  });
  // fraction of each section where the move to the next pose starts: tall content sections hold their pose
  // and travel over the same ~1 screen of scroll as the sticky 3D chapters
  let startAt = sections.map(() => .36);
  const idx = (id) => sections.findIndex((sec) => sec.id === id);
  const S_ANAT = idx('anatomia');
  const S_CUSTOM = idx('personaliza');
  function stateAt(s) {
    const i = clamp(Math.floor(s), 0, K.length - 1);
    const j = Math.min(i + 1, K.length - 1);
    const a = startAt[i];
    const f = ease((s - i - a) / (1 - a));
    const o = {};
    for (const k in K[i]) o[k] = lerp(K[i][k], K[j][k], f);
    return o;
  }

  let W = 0;
  let H = 0;
  let narrow = false;
  const real = $('#real');
  const track = $('#track');
  const mqA = $('#mqA');
  const mqB = $('#mqB');
  const tagEls = {
    big: $('#t-big'),
    small: $('#t-small'),
    tray: $('#t-tray'),
    tab: $('#t-tab'),
    lid: $('#t-lid'),
  };
  // cached layout: section tops/heights, gallery travel, marquee span width, tag sizes
  const L = { tops: [], heights: [], realTop: 0, realH: 1, extra: 0, mw: 1, tags: {} };
  function sizeGallery() {
    L.extra = Math.max(0, track.scrollWidth - W + 48);
    real.style.height = (H + L.extra) + 'px';
  }
  function measure() {
    sizeGallery();
    sections.forEach((sec, i) => {
      L.tops[i] = sec.offsetTop;
      L.heights[i] = sec.offsetHeight;
      startAt[i] = Math.max(.36, 1 - 1.02 * H / L.heights[i]);
    });
    L.realTop = real.offsetTop;
    L.realH = real.offsetHeight;
    L.mw = mqA.firstChild.offsetWidth || 1;
    for (const id in tagEls) L.tags[id] = [tagEls[id].offsetWidth, tagEls[id].offsetHeight];
  }
  let measureQueued = false;
  const queueMeasure = () => { measureQueued = true; };
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    narrow = W < 760;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uAspect.value = W / H;
    measure();
  }
  on(window, 'resize', resize);
  // content can change height without a resize (fonts, images, FAQ answers, form errors, cart)
  const ro = new ResizeObserver(queueMeasure);
  ro.observe(root.querySelector('main'));
  document.fonts?.ready.then(queueMeasure);

  function scrollState() {
    const mid = window.scrollY + H * 0.5;
    let s = 0;
    for (let i = 0; i < sections.length; i++) {
      if (mid >= L.tops[i]) s = i + clamp((mid - L.tops[i]) / L.heights[i]);
    }
    return clamp(s, 0, K.length - 1);
  }

  const U = { yaw: 0, vyaw: 0, pitch: 0, open: 0, openT: 0, drawer: 0, drawerT: 0, top: 0, topT: 0, dragging: false };
  const zones = $$('.dragzone');
  let px0 = 0;
  let py0 = 0;
  let moved = 0;
  let lastX = 0;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function onDragMove(e) {
    if (!U.dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    U.vyaw = dx * 0.008;
    U.yaw += U.vyaw;
  }
  const bOpen = $('#bOpen');
  const bTray = $('#bTray');
  const bTop = $('#bTop');
  function setOpen(v) {
    U.openT = v ? 1 : 0;
    bOpen.setAttribute('aria-pressed', !!v);
    bOpen.textContent = v ? 'Cerrar' : 'Abrir';
  }
  function setDrawer(v) {
    U.drawerT = v ? 1 : 0;
    bTray.setAttribute('aria-pressed', !!v);
  }
  function onDragEnd(e) {
    U.dragging = false;
    if (moved < 6 && Math.abs(e.clientY - py0) < 6) {
      ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.intersectObject(P.tray, true).length) setDrawer(!U.drawerT);
      else if (ray.intersectObject(P.root, true).length) setOpen(!U.openT);
    }
  }
  zones.forEach((dz) => {
    on(dz, 'pointerdown', (e) => {
      U.dragging = true;
      px0 = lastX = e.clientX;
      py0 = e.clientY;
      moved = 0;
      dz.setPointerCapture(e.pointerId);
    });
    on(dz, 'pointermove', onDragMove);
    on(dz, 'pointerup', onDragEnd);
    // touch: a vertical swipe hands the gesture to the browser scroll and never fires pointerup
    on(dz, 'pointercancel', () => { U.dragging = false; });
  });
  on(bOpen, 'click', () => setOpen(!U.openT));
  on(bTray, 'click', () => setDrawer(!U.drawerT));
  on(bTop, 'click', () => {
    U.topT = U.topT ? 0 : 1;
    bTop.setAttribute('aria-pressed', !!U.topT);
  });
  on($('#bReset'), 'click', () => {
    U.yaw = 0;
    U.vyaw = 0;
    setOpen(false);
    setDrawer(false);
    U.topT = 0;
    bTop.setAttribute('aria-pressed', 'false');
  });

  const mouse = { x: 0, y: 0, sx: 0, sy: 0, cx: -100, cy: -100 };
  const cursor = $('#cursor');
  on(window, 'pointermove', (e) => {
    mouse.x = e.clientX / W - .5;
    mouse.y = e.clientY / H - .5;
    mouse.cx = e.clientX;
    mouse.cy = e.clientY;
  });
  zones.forEach((dz) => {
    on(dz, 'pointerenter', () => cursor.classList.add('big'));
    on(dz, 'pointerleave', () => cursor.classList.remove('big'));
  });

  // the configurator (components/Configurator.js) broadcasts the look
  on(window, LOOK_EVENT, (e) => P.setLook(e.detail));

  let lenis = null;
  if (!STILL && !reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, anchors: true });
    // keep the page still behind the age gate
    if (!document.documentElement.classList.contains('age-ok')) lenis.stop();
    on(window, 'estuche:age-ok', () => lenis.start());
  }

  const chNum = $('#chNum');
  const chBar = $('#chBar');
  const chLbl = $('#chLbl');
  const ghost = $('#ghost');
  const printPct = $('#printPct');
  const printBar = $('#printBar');
  const leaders = $('#leaders');
  const S_CTA = idx('cta');
  const S_REAL = idx('real');
  // writes only touch the DOM when the value changes: text changes would otherwise dirty layout every frame
  const last = new Map();
  const put = (el, key, v) => {
    const id = el.id + key;
    if (last.get(id) === v) return;
    last.set(id, v);
    if (key === 'text') el.textContent = v;
    else if (key === 'html') el.innerHTML = v;
    else el.style[key] = v;
  };
  // adaptive resolution: if frames stay slow, step the pixel ratio down
  let slowFrames = 0;
  let frameCount = 0;
  const v3 = new THREE.Vector3();
  const proj = (obj, x, y, z) => {
    obj.localToWorld(v3.set(x, y, z));
    v3.project(camera);
    return [(v3.x * .5 + .5) * W, (-v3.y * .5 + .5) * H, v3.z];
  };
  let sm = 0;
  let spinA = 0;
  let t0 = performance.now();
  // nothing is drawn behind the age gate; the print-in starts once it is accepted
  let gated = !STILL && !document.documentElement.classList.contains('age-ok');
  on(window, 'estuche:age-ok', () => { gated = false; });
  let lastT = t0;
  let mqx = 0;
  let alive = true;
  let raf = 0;

  function frame(now) {
    if (!alive) return;
    if (gated) { t0 = lastT = now; raf = requestAnimationFrame(frame); return; }
    const time = STILL ? 30 : (now - t0) / 1000;
    const rawDt = (now - lastT) / 1000 || .016;
    const dt = Math.min(.05, rawDt);
    lastT = now;
    if (measureQueued) { measureQueued = false; measure(); }
    if (!STILL && document.visibilityState === 'visible' && rawDt < .5) {
      frameCount++;
      if (rawDt > 1 / 50) slowFrames++;
      if (frameCount === 90) {
        if (slowFrames > 40 && dpr > 1) { dpr = Math.max(1, dpr - .25); resize(); }
        frameCount = 0;
        slowFrames = 0;
      }
    }
    if (lenis) lenis.raf(now);
    const target = scrollState();
    sm = STILL ? target : sm + (target - sm) * (reduce ? 1 : .14);
    const s = sm;
    const st = stateAt(s);

    const ix = win(s, S_CUSTOM - .3, S_CUSTOM + 1.05, .25);
    const k = 1 - Math.pow(.0015, dt);
    U.open += (U.openT - U.open) * k * .9;
    U.drawer += (U.drawerT - U.drawer) * k * .8;
    U.top += (U.topT - U.top) * k;
    if (!U.dragging) {
      U.yaw += U.vyaw;
      U.vyaw *= .94;
      if (ix > .5 && !reduce && Math.abs(U.vyaw) < .0005) U.yaw += dt * .12;
    }

    // hero: once printed, the lid opens a little so it is seen closed and open
    const heroLid = reduce ? 0 : ease((time - 3.8) / 1.4) * .55 * win(s, -1, .75, .35);
    const lid = lerp(Math.max(st.lid, heroLid), U.open, ix);
    const lift = lerp(st.lift, 0, ix);
    const tray = lerp(st.tray, U.drawer * 2.6, ix);
    P.lidPivot.rotation.x = -backOut(lid) * 1.92;
    P.lidPivot.position.y = P.dims.H + lift;
    P.tray.position.z = P.dims.trayZ + tray;
    glow.intensity = st.glow * 7 + ix * U.open * 5;

    const idle = reduce ? 0 : st.idle;
    spinA += reduce ? 0 : dt * .3 * st.spin;
    // without spin, ease back to the nearest whole turn so the pose's own angle is shown
    if (st.spin < .05) spinA += (Math.round(spinA / (Math.PI * 2)) * Math.PI * 2 - spinA) * (1 - Math.pow(.05, dt));
    mouse.sx += (mouse.x - mouse.sx) * .06;
    mouse.sy += (mouse.y - mouse.sy) * .06;
    stage.rotation.y = st.yaw + idle * Math.sin(time * .35) * .3 + ix * U.yaw + spinA;
    pivot.rotation.x = mouse.sy * .12 * (1 - ix);
    pivot.rotation.z = -mouse.sx * .08 * (1 - ix);
    P.root.position.y = idle * (.3 + Math.sin(time * 1.1) * .2);

    const heroBuild = ease((time - .4) / 2.8);
    const b = s < 1 ? heroBuild : 1;
    P.setBuild(b);
    head.visible = headEdge.visible = b > 0 && b < 1;
    if (head.visible) head.position.y = headEdge.position.y = P.getBuildY() + P.root.position.y;
    put(printPct, 'text', b < 1 ? 'Imprimiendo ' + String(Math.round(b * 100)).padStart(3, '0') + '%' : 'Impresa · 100%');
    put(printBar, 'transform', `scaleX(${b.toFixed(3)})`);

    let el = lerp(st.el, 1.32, ix * U.top);
    const dist = st.dist * (narrow ? st.nd : 1);
    const off = narrow ? 0 : st.tx;
    const tx = off * Math.cos(st.az);
    const tz = st.tz - off * Math.sin(st.az);
    const ty = narrow ? st.ty + st.ny : st.ty;
    camera.position.set(tx + dist * Math.cos(el) * Math.sin(st.az), ty + dist * Math.sin(el), tz + dist * Math.cos(el) * Math.cos(st.az));
    camera.lookAt(tx, ty, tz);
    camera.updateMatrixWorld();

    stage.updateMatrixWorld(true);
    const [gx, gy] = proj(P.root, 0, 1.2, 0);
    const u = bgMat.uniforms;
    u.uC.value.x = lerp(u.uC.value.x, gx / W, .1);
    u.uC.value.y = lerp(u.uC.value.y, 1 - gy / H, .1);
    u.uT.value = time % 10;

    put(canvas, 'opacity', String(narrow ? +st.nvis.toFixed(2) : 1));

    // horizontal gallery and marquee only move while they can be seen
    if (Math.abs(s - S_REAL - .5) < 1.5) {
      const gp = clamp((window.scrollY - L.realTop) / Math.max(1, L.realH - H));
      put(track, 'transform', `translate3d(${(-gp * L.extra).toFixed(1)}px,0,0)`);
    }

    const lastS = sections.length - 1;
    const ci = clamp(Math.round(s - .2), 0, lastS);
    put(chNum, 'text', String(ci).padStart(2, '0') + ' / ' + String(lastS).padStart(2, '0'));
    put(chLbl, 'text', sections[ci].dataset.label);
    put(chBar, 'transform', `scaleX(${(s / lastS).toFixed(3)})`);

    const gw = win(s, -1, .9, .5);
    put(ghost, 'opacity', gw.toFixed(3));
    if (gw > 0) put(ghost, 'transform', `translate3d(${(-window.scrollY * .35 - 40).toFixed(1)}px,-50%,0)`);

    const vel = lenis ? lenis.velocity : 0;
    if (s > S_CTA - 1) {
      mqx += dt * 60 + Math.abs(vel) * .6;
      const skew = clamp(-vel * .25, -12, 12).toFixed(2);
      mqA.style.transform = `translate3d(${(-(mqx % L.mw)).toFixed(1)}px,0,0) skewX(${skew}deg)`;
      mqB.style.transform = `translate3d(${((mqx % L.mw) - L.mw).toFixed(1)}px,0,0) skewX(${skew}deg)`;
    }

    let svg = '';
    const show = (el, visible) => { el.style.opacity = visible ? 1 : 0; };
    const place = (el, x, y) => { el.style.transform = `translate3d(${x}px,${y}px,0)`; };
    const wA = win(s, S_ANAT + .05, S_ANAT + .8, .1);
    const A = P.anchors;
    // numbered callouts, stacked in number order
    const items = [
      ['big', P.root, ...A.big.toArray(), wA],
      ['small', P.root, ...A.small.toArray(), wA],
      ['tray', P.tray, ...A.tray.toArray(), wA],
      ['tab', P.lid, ...A.tab.toArray(), wA],
      ['lid', P.lid, -2.2, .5, .6, wA],
    ];
    const colX = W * .76;
    let slot = 0;
    items.forEach((it) => {
      const [ax, ay, az] = proj(it[1], it[2], it[3], it[4]);
      it.p = [ax, ay, az];
    });
    items.forEach((it) => {
      const [id, , , , , w] = it;
      const el = tagEls[id];
      const [ax, ay, az] = it.p;
      if (w <= 0 || az > 1) { show(el, false); return; }
      show(el, true);
      const [tw, th] = L.tags[id];
      let lx;
      let ly;
      const n = slot++;
      if (narrow) {
        lx = 16;
        ly = 74 + n * (th + 8);
        svg += `<line x1="${ax}" y1="${ay}" x2="${lx + tw}" y2="${ly + th / 2}" style="opacity:${.75 * w}"/>`;
      } else {
        lx = Math.min(colX, W - tw - 90);
        ly = H * .22 + n * (th + 22);
        svg += `<line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly + th / 2}" style="opacity:${.75 * w}"/>`;
      }
      svg += `<circle cx="${ax}" cy="${ay}" r="4" style="opacity:${w}"/>`;
      place(el, lx, ly);
      el.style.opacity = w;
    });
    put(leaders, 'html', svg);

    cursor.style.transform = `translate3d(${mouse.cx}px,${mouse.cy}px,0)`;

    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.render(scene, camera);
    if (!STILL) raf = requestAnimationFrame(frame);
  }

  resize();
  if (STILL) window.__shot = () => { resize(); frame(performance.now()); };
  else raf = requestAnimationFrame(frame);
  on(window, 'load', queueMeasure);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    lenis?.destroy();
    unlisten.forEach((fn) => fn());
    ro.disconnect();
    pmrem.dispose();
    scene.environment?.dispose?.();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    if (STILL) delete window.__shot;
  };
}
