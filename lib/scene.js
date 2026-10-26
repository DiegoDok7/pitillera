import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import Lenis from 'lenis';
import { buildPitillera, BODY_COLORS, ACCENT_COLORS, PATTERNS } from './pitillera.js';
import { MARKUP } from './markup.js';

export function startExperience(root) {
  root.innerHTML = MARKUP;

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

  const N = 14;
  const ruler = $('#ruler');
  for (let i = 0; i < N; i++) {
    const d = document.createElement('div');
    d.style.setProperty('--w', (24 + (i % 3) * 14) + 'px');
    d.innerHTML = '<i></i>Corte ' + String(i + 1).padStart(2, '0');
    ruler.append(d);
  }
  const rulerRows = [...ruler.children];

  const mqText = 'ARIST3D — Pitillera — Impresa en 3D — ';
  ['#mqA', '#mqB'].forEach((id) => {
    const el = $(id);
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span');
      s.textContent = mqText;
      el.append(s);
    }
  });

  const canvas = $('#gl');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.hidden = true;
    $('#fallback').hidden = false;
    return () => {
      io.disconnect();
      unlisten.forEach((fn) => fn());
      root.innerHTML = '';
    };
  }
  renderer.setPixelRatio(Math.min(STILL ? 1 : 1.75, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

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
      uMix2: { value: 0 },
      uT: { value: 0 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `varying vec2 vUv; uniform vec2 uC; uniform float uAspect,uMix2,uT; uniform vec3 uGlow,uGlow2,uBase;
      void main(){ vec2 d=vUv-uC; d.x*=uAspect; float r=length(d);
        float g=exp(-r*r*5.5); float g2=exp(-pow(length(d-vec2(.18,-.22)),2.)*9.);
        vec3 c=uBase + uGlow*g*.75 + uGlow2*g2*(.18+.35*uMix2);
        gl_FragColor=vec4(c,1.); }`,
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  const key = new THREE.DirectionalLight(0xfff4ec, 1.9);
  key.position.set(6, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
  key.shadow.radius = 6;
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
  const rake = new THREE.DirectionalLight(0xfff1d6, 0);
  scene.add(rake);
  scene.add(rake.target);

  const LOOK_KEY = 'arist3d-look';
  let savedLook;
  try { savedLook = JSON.parse(localStorage.getItem(LOOK_KEY)) || undefined; } catch (e) { savedLook = undefined; }
  const P = buildPitillera(THREE, { look: savedLook });
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

  const HT = P.buildHeight;
  const slices = [];
  const sliceGroup = new THREE.Group();
  pivot.add(sliceGroup);
  sliceGroup.visible = false;
  const outlinePts = (() => {
    const s = new THREE.Shape();
    const w = 8.7;
    const l = 7.3;
    const r = .6;
    const x = -w / 2;
    const y = -l / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + l - r);
    s.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
    s.lineTo(x + r, y + l);
    s.quadraticCurveTo(x, y + l, x, y + l - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s.getPoints(10).map((p) => new THREE.Vector3(p.x, 0, p.y));
  })();
  for (let i = 0; i < N; i++) {
    const c = P.root.clone(true);
    const lo = new THREE.Plane();
    const hi = new THREE.Plane();
    const planes = [lo, hi];
    const cl = (m) => {
      const n = m.clone();
      n.userData.src = m;
      n.clippingPlanes = planes;
      n.side = THREE.DoubleSide;
      n.clipShadows = true;
      return n;
    };
    c.traverse((o) => {
      if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(cl) : cl(o.material);
      if (o.isLight) o.intensity = 0;
    });
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outlinePts), new THREE.LineBasicMaterial({ color: 0xe3e88a, transparent: true, opacity: 0 }));
    ring.position.y = i * HT / N;
    c.add(ring);
    sliceGroup.add(c);
    slices.push({ c, lo, hi, ring, a: i * HT / N, b: (i + 1) * HT / N });
  }
  const tmpPlane = new THREE.Plane();

  const composer = new EffectComposer(renderer);
  const bgPass = new RenderPass(bgScene, bgCam);
  composer.addPass(bgPass);
  const mainPass = new RenderPass(scene, camera);
  mainPass.clear = false;
  composer.addPass(mainPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.16, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grain = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uV: { value: .32 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uV; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec4 c=texture2D(tDiffuse,vUv); float n=h(vUv*vec2(1920.,1080.)+uT)-.5; c.rgb+=n*.035;
        vec2 d=vUv-.5; c.rgb*=1.-dot(d,d)*uV*1.6; gl_FragColor=c; }`,
  });
  composer.addPass(grain);

  const K = [
    { az: .62, el: .34, dist: 30, tx: -5.4, ty: 1.3, tz: 0, lid: 0, lift: 0, tray: 0, spread: 0, rake: 0, glow: 0, yaw: 0, ny: -2.6 },
    { az: .42, el: .26, dist: 38, tx: -6.4, ty: 5.0, tz: 0, lid: 0, lift: 0, tray: 0, spread: 1, rake: 0, glow: 0, yaw: .3, ny: -2.6 },
    { az: -.08, el: 1.05, dist: 31, tx: 6.8, ty: 2.2, tz: .4, lid: 0, lift: 0, tray: 0, spread: 0, rake: 1, glow: 0, yaw: 0, ny: -2.6 },
    { az: .2, el: .74, dist: 36, tx: -6.2, ty: 3.2, tz: -.8, lid: 1, lift: 0, tray: 2.6, spread: 0, rake: 0, glow: 1, yaw: 0, ny: -2.6 },
    { az: .95, el: .42, dist: 43, tx: -7.2, ty: 3.8, tz: .6, lid: .62, lift: 2.6, tray: 3.6, spread: 0, rake: 0, glow: .4, yaw: 0, ny: -2.6 },
    { az: 1.4, el: .42, dist: 43, tx: -7.2, ty: 3.8, tz: .6, lid: .62, lift: 2.6, tray: 3.6, spread: 0, rake: 0, glow: 0, yaw: 0, ny: -2.6 },
    { az: .55, el: .40, dist: 31, tx: 0, ty: 0.2, tz: 0, lid: 0, lift: 0, tray: 0, spread: 0, rake: 0, glow: 0, yaw: 0, ny: 1.2 },
    { az: .3, el: .82, dist: 29, tx: -5.6, ty: 1.4, tz: 0, lid: 0, lift: 0, tray: 0, spread: 0, rake: 0, glow: 0, yaw: 0, ny: -2.2 },
    { az: -.6, el: .36, dist: 50, tx: 0, ty: 1.6, tz: 0, lid: 0, lift: 0, tray: 0, spread: 0, rake: 0, glow: 0, yaw: 0, ny: 1.2 },
  ];
  function stateAt(s) {
    const i = clamp(Math.floor(s), 0, K.length - 1);
    const j = Math.min(i + 1, K.length - 1);
    const f = ease((s - i - 0.36) / 0.64);
    const o = {};
    for (const k in K[i]) o[k] = lerp(K[i][k], K[j][k], f);
    return o;
  }

  let W = 0;
  let H = 0;
  let narrow = false;
  const real = $('#real');
  const track = $('#track');
  function sizeGallery() {
    const extra = Math.max(0, track.scrollWidth - W + 48);
    real.style.height = (H + extra) + 'px';
    real.dataset.extra = extra;
  }
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    narrow = W < 760;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    bloom.setSize(W / 2, H / 2);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uAspect.value = W / H;
    sizeGallery();
  }
  on(window, 'resize', resize);

  function scrollState() {
    const y = window.scrollY;
    const mid = y + H * 0.5;
    let s = 0;
    for (let i = 0; i < sections.length; i++) {
      const top = sections[i].offsetTop;
      const h = sections[i].offsetHeight;
      if (mid >= top) s = i + clamp((mid - top) / h);
    }
    return clamp(s, 0, K.length - 1);
  }

  const U = { yaw: 0, vyaw: 0, pitch: 0, open: 0, openT: 0, drawer: 0, drawerT: 0, exp: 0, expT: 0, top: 0, topT: 0, dragging: false };
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
  const bExp = $('#bExplode');
  const bTop = $('#bTop');
  function setOpen(v) {
    U.openT = v ? 1 : 0;
    bOpen.setAttribute('aria-pressed', !!v);
    bOpen.textContent = v ? 'Cerrar' : 'Abrir';
    if (v && U.expT) setExp(false);
  }
  function setDrawer(v) {
    U.drawerT = v ? 1 : 0;
    bTray.setAttribute('aria-pressed', !!v);
    if (v && U.expT) setExp(false);
  }
  function setExp(v) {
    U.expT = v ? 1 : 0;
    bExp.setAttribute('aria-pressed', !!v);
    if (v && U.openT) setOpen(false);
    if (v && U.drawerT) setDrawer(false);
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
  on(bExp, 'click', () => setExp(!U.expT));
  on(bTop, 'click', () => {
    U.topT = U.topT ? 0 : 1;
    bTop.setAttribute('aria-pressed', !!U.topT);
  });
  on($('#bReset'), 'click', () => {
    U.yaw = 0;
    U.vyaw = 0;
    setOpen(false);
    setDrawer(false);
    setExp(false);
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

  // customiser: swatches/pills write the look into the model, mirror it on the slice clones and remember it
  const syncSlices = () => sliceGroup.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.userData.src) m.color.copy(m.userData.src.color); });
  });
  syncSlices();
  const lblBody = $('#lblBody');
  const lblAccent = $('#lblAccent');
  const groups = [
    { key: 'body', el: $('#swBody'), list: BODY_COLORS, label: lblBody },
    { key: 'accent', el: $('#swAccent'), list: ACCENT_COLORS, label: lblAccent },
    { key: 'pattern', el: $('#swPattern'), list: PATTERNS },
  ];
  function renderLook() {
    const look = P.getLook();
    groups.forEach((g) => {
      const value = (o) => (g.key === 'pattern' ? o.id : o.hex);
      [...g.el.children].forEach((b, i) => b.setAttribute('aria-checked', value(g.list[i]) === look[g.key]));
      if (g.label) g.label.textContent = g.list.find((o) => o.hex === look[g.key])?.name || '';
    });
  }
  groups.forEach((g) => {
    g.list.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      if (g.key === 'pattern') {
        b.className = 'pill';
        b.textContent = o.name;
      } else {
        b.className = 'swatch';
        b.style.setProperty('--c', o.hex);
        b.setAttribute('aria-label', o.name);
        b.title = o.name;
      }
      on(b, 'click', () => {
        P.setLook({ [g.key]: g.key === 'pattern' ? o.id : o.hex });
        syncSlices();
        renderLook();
        try { localStorage.setItem(LOOK_KEY, JSON.stringify(P.getLook())); } catch (e) { /* storage unavailable */ }
      });
      g.el.append(b);
    });
  });
  renderLook();

  let lenis = null;
  if (!STILL && !reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, anchors: true });
  }

  const chNum = $('#chNum');
  const chBar = $('#chBar');
  const chLbl = $('#chLbl');
  const ghost = $('#ghost');
  const printPct = $('#printPct');
  const printBar = $('#printBar');
  const mqA = $('#mqA');
  const mqB = $('#mqB');
  const leaders = $('#leaders');
  const tagEls = {
    lid: $('#t-lid'),
    tab: $('#t-tab'),
    body: $('#t-body'),
    tray: $('#t-tray'),
    big: $('#t-big'),
    small: $('#t-small'),
  };
  const v3 = new THREE.Vector3();
  const proj = (obj, x, y, z) => {
    obj.localToWorld(v3.set(x, y, z));
    v3.project(camera);
    return [(v3.x * .5 + .5) * W, (-v3.y * .5 + .5) * H, v3.z];
  };
  let sm = 0;
  const t0 = performance.now();
  let lastT = t0;
  let mqx = 0;
  let alive = true;
  let raf = 0;

  function frame(now) {
    if (!alive) return;
    const time = STILL ? 30 : (now - t0) / 1000;
    const dt = Math.min(.05, (now - lastT) / 1000 || .016);
    lastT = now;
    if (lenis) lenis.raf(now);
    const target = scrollState();
    sm = STILL ? target : sm + (target - sm) * (reduce ? 1 : .14);
    const s = sm;
    const st = stateAt(s);

    const ix = win(s, 5.75, 7.75, .25);
    const k = 1 - Math.pow(.0015, dt);
    U.open += (U.openT - U.open) * k * .9;
    U.drawer += (U.drawerT - U.drawer) * k * .8;
    U.exp += (U.expT - U.exp) * k * .8;
    U.top += (U.topT - U.top) * k;
    if (!U.dragging) {
      U.yaw += U.vyaw;
      U.vyaw *= .94;
      if (ix > .5 && !reduce && Math.abs(U.vyaw) < .0005) U.yaw += dt * .12;
    }

    const lid = lerp(st.lid, Math.max(U.open, U.exp * .62), ix);
    const lift = lerp(st.lift, U.exp * 2.6, ix);
    const tray = lerp(st.tray, Math.max(U.drawer * 2.6, U.exp * 3.6), ix);
    P.lidPivot.rotation.x = -backOut(lid) * 1.92;
    P.lidPivot.position.y = P.dims.H + lift;
    P.tray.position.z = P.dims.trayZ + tray;
    glow.intensity = st.glow * 7 + ix * U.open * 5;

    const idle = reduce ? 0 : Math.max(win(s, -1, .7, .4), win(s, 7.6, 9, .3));
    mouse.sx += (mouse.x - mouse.sx) * .06;
    mouse.sy += (mouse.y - mouse.sy) * .06;
    stage.rotation.y = st.yaw + idle * Math.sin(time * .35) * .3 + ix * U.yaw + (s > 7.6 && !reduce ? time * .25 * win(s, 7.8, 9, .3) : 0);
    pivot.rotation.x = mouse.sy * .12 * (1 - ix);
    pivot.rotation.z = -mouse.sx * .08 * (1 - ix);
    P.root.position.y = idle * (.3 + Math.sin(time * 1.1) * .2);

    const heroBuild = ease((time - .4) / 2.8);
    const b = s < 1 ? heroBuild : 1;
    P.setBuild(b);
    head.visible = headEdge.visible = b > 0 && b < 1;
    if (head.visible) head.position.y = headEdge.position.y = P.getBuildY() + P.root.position.y;
    printPct.textContent = b < 1 ? 'Imprimiendo ' + String(Math.round(b * 100)).padStart(3, '0') + '%' : 'Impresa · 100%';
    printBar.style.transform = `scaleX(${b})`;

    const spread = st.spread;
    const sliced = spread > .003;
    sliceGroup.visible = sliced;
    P.root.visible = !sliced;
    if (sliced) {
      sliceGroup.position.y = P.root.position.y;
      sliceGroup.updateMatrixWorld(true);
      slices.forEach((o, i) => {
        o.c.position.y = i * .62 * spread;
        o.c.updateMatrixWorld(true);
        o.lo.copy(tmpPlane.set(v3.set(0, 1, 0), -o.a)).applyMatrix4(o.c.matrixWorld);
        o.hi.copy(tmpPlane.set(v3.set(0, -1, 0), o.b)).applyMatrix4(o.c.matrixWorld);
        o.ring.material.opacity = .55 * spread;
      });
      const hot = Math.floor(clamp((s - 1) / .7) * N);
      rulerRows.forEach((r, i) => r.classList.toggle('hot', i < hot));
    }

    const rk = st.rake;
    const ra = lerp(-1.25, 1.25, clamp((s - 1.7) / 1.1));
    rake.intensity = rk * 4.2;
    rake.position.set(Math.sin(ra) * 14, 2.2, Math.cos(ra) * 14);
    rake.target.position.set(0, 2.5, 0);
    key.intensity = 1.9 * (1 - .55 * rk);
    hemi.intensity = .22 * (1 - .6 * rk);

    let el = lerp(st.el, 1.32, ix * U.top);
    const dist = st.dist * (narrow ? 2.0 : 1);
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
    u.uMix2.value = rk;
    u.uT.value = time;
    grain.uniforms.uT.value = time % 10;

    canvas.style.opacity = 1 - win(s, 5.05, 5.8, .15);

    const rTop = real.offsetTop;
    const extra = +real.dataset.extra || 0;
    const gp = clamp((window.scrollY - rTop) / Math.max(1, real.offsetHeight - H));
    track.style.transform = `translate3d(${-gp * extra}px,0,0)`;

    const last = sections.length - 1;
    const ci = clamp(Math.round(s - .2), 0, last);
    chNum.textContent = String(ci).padStart(2, '0') + ' / ' + String(last).padStart(2, '0');
    chLbl.textContent = sections[ci].dataset.label;
    chBar.style.transform = `scaleX(${s / last})`;

    ghost.style.opacity = Math.max(win(s, -1, .9, .5), 0) * 1;
    ghost.style.transform = `translate3d(${-window.scrollY * .35 - 40}px,-50%,0)`;

    const vel = lenis ? lenis.velocity : 0;
    mqx += dt * 60 + Math.abs(vel) * .6;
    const mw = mqA.firstChild.offsetWidth || 1;
    mqA.style.transform = `translate3d(${-(mqx % mw)}px,0,0) skewX(${clamp(-vel * .25, -12, 12)}deg)`;
    mqB.style.transform = `translate3d(${(mqx % mw) - mw}px,0,0) skewX(${clamp(-vel * .25, -12, 12)}deg)`;

    let svg = '';
    const show = (el, visible) => { el.style.opacity = visible ? 1 : 0; };
    const place = (el, x, y) => { el.style.transform = `translate3d(${x}px,${y}px,0)`; };
    const wOpen = win(s, 3.0, 3.75, .1);
    const wExp = win(s, 4.05, 4.8, .1);
    const A = P.anchors;
    const items = [
      ['big', P.root, ...A.big.toArray(), wOpen],
      ['small', P.root, ...A.small.toArray(), wOpen],
      ['tray', P.tray, ...A.tray.toArray(), Math.max(wOpen, wExp)],
      ['lid', P.lid, -2.2, .5, .6, wExp],
      ['tab', P.lid, ...A.tab.toArray(), wExp],
      ['body', P.root, 2.6, 2.2, -1.2, wExp],
    ];
    const colX = W * .76;
    const slot = { open: 0, exp: 0 };
    items.forEach((it) => {
      const [ax, ay, az] = proj(it[1], it[2], it[3], it[4]);
      it.p = [ax, ay, az];
    });
    items.sort((p, q) => p.p[0] - q.p[0]);
    items.forEach((it) => {
      const [id, , , , , w] = it;
      const el = tagEls[id];
      const [ax, ay, az] = it.p;
      if (w <= 0 || az > 1) { show(el, false); return; }
      show(el, true);
      const tw = el.offsetWidth;
      const th = el.offsetHeight;
      let lx;
      let ly;
      if (narrow) {
        const g = w === wOpen ? 'open' : 'exp';
        const n = slot[g]++;
        lx = 16;
        ly = 74 + n * (th + 8);
        svg += `<line x1="${ax}" y1="${ay}" x2="${lx + tw}" y2="${ly + th / 2}" style="opacity:${.75 * w}"/>`;
      } else {
        const group = w === wOpen ? 'open' : 'exp';
        const n = slot[group]++;
        lx = Math.min(colX, W - tw - 90);
        ly = H * (group === 'open' ? .36 : .2) + n * (th + 26);
        svg += `<line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly + th / 2}" style="opacity:${.75 * w}"/>`;
      }
      svg += `<circle cx="${ax}" cy="${ay}" r="4" style="opacity:${w}"/>`;
      place(el, lx, ly);
      el.style.opacity = w;
    });
    leaders.innerHTML = svg;

    cursor.style.transform = `translate3d(${mouse.cx}px,${mouse.cy}px,0)`;

    composer.render(dt);
    if (!STILL) raf = requestAnimationFrame(frame);
  }

  resize();
  if (STILL) window.__shot = () => { resize(); frame(performance.now()); };
  else raf = requestAnimationFrame(frame);
  on(window, 'load', sizeGallery);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    lenis?.destroy();
    unlisten.forEach((fn) => fn());
    composer.dispose();
    pmrem.dispose();
    scene.environment?.dispose?.();
    renderer.dispose();
    renderer.forceContextLoss();
    if (STILL) delete window.__shot;
    root.innerHTML = '';
  };
}
