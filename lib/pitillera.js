// ARIST3D · pitillera — procedural model (units: cm)
// buildPitillera(THREE) -> { root, body, lid, lidPivot, tray (cajón inferior), emblem, materials, dims, setBuild(h), anchors, setLook(look), getLook() }

// customisation catalogue: filament colours for body and lid, the raised print, lid patterns and surface finishes
export const BODY_COLORS = [
  { id: 'ciruela', name: 'Ciruela', hex: '#5a1052' },
  { id: 'negro', name: 'Negro', hex: '#1d1b20' },
  { id: 'blanco', name: 'Blanco', hex: '#e9e7e1' },
  { id: 'rojo', name: 'Rojo', hex: '#b01e2b' },
  { id: 'azul', name: 'Azul', hex: '#1f4c9e' },
  { id: 'verde', name: 'Verde', hex: '#2b7343' },
];
export const LID_COLORS = BODY_COLORS;
export const ACCENT_COLORS = [
  { id: 'lima', name: 'Lima', hex: '#e3e88a' },
  { id: 'blanco', name: 'Blanco', hex: '#f4f2ec' },
  { id: 'negro', name: 'Negro', hex: '#18161a' },
  { id: 'dorado', name: 'Dorado', hex: '#d4a63a' },
  { id: 'rosa', name: 'Rosa', hex: '#f08ac4' },
  { id: 'turquesa', name: 'Turquesa', hex: '#1aa6a8' },
];
export const PATTERNS = [
  { id: 'liso', name: 'Liso' },
  { id: 'leopardo', name: 'Leopardo' },
  { id: 'lunares', name: 'Lunares' },
  { id: 'rayas', name: 'Rayas' },
  { id: 'panal', name: 'Panal' },
];
export const FINISHES = [
  { id: 'mate', name: 'Mate', note: 'Sin brillo y suave al tacto' },
  { id: 'texturizado', name: 'Texturizado', note: 'Grano fino que disimula huellas y roces' },
];
export const DEFAULT_LOOK = { body: '#5a1052', lid: '#5a1052', accent: '#e3e88a', pattern: 'leopardo', finish: 'mate' };

export function buildPitillera(THREE, opts = {}) {
  const W = 8.6, L = 7.2, H = 2.7, LT = 0.42, R = 0.55;

  // ---------- helpers ----------
  const rr = (w, h, r, cx = 0, cy = 0) => {
    const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  };
  const rrPath = (w, h, r, cx, cy) => { const p = new THREE.Path(); p.setFromPoints(rr(w, h, r, cx, cy).getPoints(8).reverse()); return p; };
  const extrude = (shape, depth, bevel = 0.06) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
    g.rotateX(-Math.PI / 2); // shape XY -> XZ (shape +y -> -z), extrusion -> +y
    g.computeVertexNormals(); return g;
  };
  // ExtrudeGeometry puts both caps in group 0 (bottom cap first) -> bottom cap gets material 2
  const splitCaps = (g) => {
    const [caps, sides] = g.groups, half = caps.count / 2;
    g.clearGroups(); g.addGroup(0, half, 2); g.addGroup(half, half, 0); g.addGroup(sides.start, sides.count, 1); return g;
  };
  // ---------- textures ----------
  const TEX = 2048;
  const mkCanvas = () => { const c = document.createElement('canvas'); c.width = c.height = TEX; return c; };
  // layer-line bump (FDM look)
  const layerCanvas = (() => {
    const c = document.createElement('canvas'); c.width = 8; c.height = 512; const g = c.getContext('2d');
    for (let y = 0; y < 512; y++) { const v = 128 + 70 * Math.sin(y / 512 * Math.PI * 2 * 64); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 8, 1); }
    return c;
  })();
  const layerTex = new THREE.CanvasTexture(layerCanvas); layerTex.wrapS = layerTex.wrapT = THREE.RepeatWrapping;
  // fine grain bump for the textured finish
  const grainCanvas = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), id = g.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = 70 + Math.random() * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); g.filter = 'blur(1px)'; g.drawImage(c, 0, 0); return c;
  })();
  const grainTex = new THREE.CanvasTexture(grainCanvas); grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.repeat.set(0.6, 0.6);

  // lid print: colour map (base + accent) and bump map (accent raised) drawn from the same pattern
  const colorC = mkCanvas(), bumpC = mkCanvas();
  const cg = colorC.getContext('2d'), bg = bumpC.getContext('2d');
  const cx = TEX / 2, cy = TEX / 2, clear = TEX * 0.12; // keep the centre free for the hexagon emblem
  const blob = (ctx, rnd, x, y, r, kind) => {
    const n = 7 + Math.floor(rnd() * 4), pts = []; const rot = rnd() * Math.PI * 2, stretch = 0.45 + rnd() * 0.6;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, rr2 = r * (0.6 + rnd() * 0.7);
      let px = Math.cos(a) * rr2, py = Math.sin(a) * rr2 * stretch;
      pts.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my); }
    const p0 = pts[0], q0 = pts[1]; ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2);
    ctx.closePath(); ctx.fill();
    if (kind === 'ring') { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x + r * .1, y, r * .38, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  };
  // each pattern fills/strokes with the context's current style; `clearCentre` paints the emblem area back to the ground
  const DRAW = {
    liso() { return false; },
    leopardo(ctx, rnd) {
      const step = TEX / 9.5;
      for (let gy = -1; gy < 11; gy++) for (let gx = -1; gx < 11; gx++) {
        const x = gx * step + step * (gy % 2 ? .5 : 0) + (rnd() - .5) * step * .5;
        const y = gy * step + (rnd() - .5) * step * .5;
        const dc = Math.hypot(x - cx, y - cy); if (dc < clear) continue;
        const r = step * (0.3 + rnd() * 0.08);
        if (rnd() < .4) { // rosette: 2-4 fragments on a broken ring
          const n = 2 + Math.floor(rnd() * 2), R0 = r * 0.85, a0 = rnd() * Math.PI * 2, gap = .5 + rnd() * .8;
          for (let k = 0; k < n; k++) { const a = a0 + k * (Math.PI * 2 - gap) / n; blob(ctx, rnd, x + Math.cos(a) * R0, y + Math.sin(a) * R0, r * (.62 + rnd() * .18)); }
        } else blob(ctx, rnd, x, y, r * (0.75 + rnd() * .35));
      }
      return false;
    },
    lunares(ctx) {
      const step = TEX / 9;
      for (let gy = -1; gy < 11; gy++) for (let gx = -1; gx < 11; gx++) {
        ctx.beginPath(); ctx.arc(gx * step + (gy % 2 ? step / 2 : 0), gy * step * 0.87, step * 0.26, 0, Math.PI * 2); ctx.fill();
      }
      return true;
    },
    rayas(ctx) {
      const period = TEX / 11;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4);
      for (let x = -TEX; x < TEX; x += period) ctx.fillRect(x, -TEX, period * 0.42, TEX * 2);
      ctx.restore();
      return true;
    },
    panal(ctx) {
      const r = TEX / 14, w = Math.sqrt(3) * r; ctx.lineWidth = r * 0.22; ctx.lineJoin = 'round';
      for (let row = -1; row < TEX / (1.5 * r) + 1; row++) for (let col = -1; col < TEX / w + 1; col++) {
        const x = col * w + (row % 2 ? w / 2 : 0), y = row * 1.5 * r;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86); }
        ctx.closePath(); ctx.stroke();
      }
      return true;
    },
  };
  const drawPattern = (ctx, name, ink, ground) => {
    let s = opts.seed || 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = ctx.strokeStyle = ink;
    if (DRAW[name](ctx, rnd)) { ctx.fillStyle = ground; ctx.beginPath(); ctx.arc(cx, cy, clear, 0, Math.PI * 2); ctx.fill(); }
  };
  const lidColor = new THREE.CanvasTexture(colorC); lidColor.colorSpace = THREE.SRGBColorSpace; lidColor.anisotropy = 8;
  const lidBump = new THREE.CanvasTexture(bumpC);
  const paintColor = (pattern, base, accent) => {
    cg.fillStyle = base; cg.fillRect(0, 0, TEX, TEX);
    // subtle diagonal infill lines in the base colour
    cg.globalAlpha = .07; cg.strokeStyle = '#000'; cg.lineWidth = 3;
    for (let i = -TEX; i < TEX * 2; i += 14) { cg.beginPath(); cg.moveTo(i, 0); cg.lineTo(i + TEX, TEX); cg.stroke(); }
    cg.globalAlpha = 1;
    drawPattern(cg, pattern, accent, base);
    lidColor.needsUpdate = true;
  };
  const paintBump = (pattern) => {
    bg.filter = 'none'; bg.fillStyle = '#000'; bg.fillRect(0, 0, TEX, TEX);
    drawPattern(bg, pattern, '#fff', '#000');
    bg.filter = 'blur(3px)'; bg.drawImage(bumpC, 0, 0); bg.filter = 'none';
    lidBump.needsUpdate = true;
  };
  // ExtrudeGeometry cap UVs are in shape units -> map [-W/2,W/2] to [0,1]
  [lidColor, lidBump].forEach(t => { t.repeat.set(1 / W, 1 / W); t.offset.set(0.5, 0.5); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });

  // ---------- materials ----------
  const clip = [];
  const plastic = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: .5, metalness: 0, clearcoat: .25, clearcoatRoughness: .5, clippingPlanes: clip, ...extra });
  const mBody = plastic(0xffffff, { bumpMap: layerTex, bumpScale: 0.18 });
  const mInside = plastic(0xffffff, { roughness: .7 });
  const mLidTop = plastic(0xffffff, { map: lidColor, bumpMap: lidBump, bumpScale: 3.2, roughness: .48 });
  const mLidSide = plastic(0xffffff, { bumpMap: layerTex, bumpScale: .18 });
  const mLime = plastic(0xffffff, { roughness: .45, bumpMap: layerTex, bumpScale: .4 });
  layerTex.repeat.set(1, 18);

  // finishes: mate keeps the FDM layer lines, texturizado swaps them for a fine grain; both drop the clearcoat sheen
  const FINISH = {
    mate: { roughness: .78, bump: layerTex, bodyBump: .18, lidBump: 3.2 },
    texturizado: { roughness: .66, bump: grainTex, bodyBump: .9, lidBump: 2.4 },
  };
  const look = { ...DEFAULT_LOOK };
  const setLook = (next = {}) => {
    const prevPattern = look.pattern;
    Object.assign(look, next);
    if (!DRAW[look.pattern]) look.pattern = DEFAULT_LOOK.pattern;
    if (!FINISH[look.finish]) look.finish = DEFAULT_LOOK.finish;
    mBody.color.set(look.body); mLidSide.color.set(look.lid);
    mInside.color.set(look.body).multiplyScalar(0.45); // same filament seen in shadow
    mLime.color.set(look.accent);
    const fin = FINISH[look.finish];
    [mBody, mLidSide, mLidTop, mLime, mInside].forEach((m) => { m.roughness = m === mInside ? .85 : fin.roughness; m.clearcoat = 0; });
    [mBody, mLidSide].forEach((m) => { m.bumpMap = fin.bump; m.bumpScale = fin.bodyBump; });
    mLidTop.bumpScale = fin.lidBump;
    paintColor(look.pattern, look.lid, look.accent);
    if (look.pattern !== prevPattern) paintBump(look.pattern);
  };
  paintBump(look.pattern);
  setLook(opts.look);

  const root = new THREE.Group(); root.name = 'ARIST3D_pitillera';
  const body = new THREE.Group(); body.name = 'cuerpo'; root.add(body);

  // body = stacked slabs: base, U-shaped bay for the drawer, deck, upper walls with the two compartments
  const BV = 0.03, BASE = 0.25, BAY_TOP = 1.0, DECK = 1.18, SW = 0.65, BW = 0.45;
  const hw = W / 2, hl = L / 2, cw = W - 2 * SW;
  const slab = (shape, y0, y1, mat, name) => {
    const m = new THREE.Mesh(extrude(shape, y1 - y0 - 2 * BV, BV), mat);
    m.position.y = y0 + BV; m.name = name; body.add(m); return m;
  };
  slab(rr(W, L, R), 0, BASE, mBody, 'base');
  // outer outline with the drawer bay cut in from the front (shape -y)
  const us = new THREE.Shape();
  us.moveTo(cw / 2, -hl); us.lineTo(hw - R, -hl); us.quadraticCurveTo(hw, -hl, hw, -hl + R);
  us.lineTo(hw, hl - R); us.quadraticCurveTo(hw, hl, hw - R, hl);
  us.lineTo(-hw + R, hl); us.quadraticCurveTo(-hw, hl, -hw, hl - R);
  us.lineTo(-hw, -hl + R); us.quadraticCurveTo(-hw, -hl, -hw + R, -hl);
  us.lineTo(-cw / 2, -hl); us.lineTo(-cw / 2, hl - BW); us.lineTo(cw / 2, hl - BW); us.lineTo(cw / 2, -hl);
  slab(us, BASE, BAY_TOP, mBody, 'bahia_cajon');
  // deck caps are only seen from inside the compartments (top) and the bay (bottom)
  slab(rr(W, L, R), BAY_TOP, DECK, [mInside, mBody], 'suelo_compartimentos');
  const walls = rr(W, L, R);
  const compZ0 = -0.55, compZ1 = 3.25; // shape-y range (back half)
  walls.holes.push(rrPath(2.1, compZ1 - compZ0, .35, -W / 2 + 0.38 + 1.05, (compZ0 + compZ1) / 2));
  walls.holes.push(rrPath(5.25, compZ1 - compZ0, .35, W / 2 - 0.38 - 2.625, (compZ0 + compZ1) / 2));
  slab(walls, DECK, H, mBody, 'paredes');

  // drawer (cajón inferior) — slides out of the front bay; origin = front face, bottom centre
  const tray = new THREE.Group(); tray.name = 'cajon';
  const dw = cw - 2 * BV - 0.08, dh = BAY_TOP - BASE - 0.1, ft = 0.22, dd = L - BW - ft - 0.15, dt = 0.12, nr = 0.4;
  const fs = new THREE.Shape(); // front plate with a finger notch on the top edge
  fs.moveTo(-dw / 2, 0); fs.lineTo(dw / 2, 0); fs.lineTo(dw / 2, dh); fs.lineTo(nr, dh);
  fs.absarc(0, dh, nr, 0, Math.PI, true); fs.lineTo(-dw / 2, dh); fs.lineTo(-dw / 2, 0);
  const fg = new THREE.ExtrudeGeometry(fs, { depth: ft - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 16 });
  fg.translate(0, 0, -ft + 0.02); fg.computeVertexNormals();
  const plate = new THREE.Mesh(fg, mBody); plate.name = 'cajon_frente'; tray.add(plate);
  const box = (w, h, d, mat, x, y, z, name) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.name = name; tray.add(m); return m; };
  const dz = -ft - dd / 2;
  box(dw, dt, dd, [mBody, mBody, mInside, mBody, mBody, mBody], 0, dt / 2, dz, 'cajon_fondo');
  box(dt, dh, dd, mBody, -dw / 2 + dt / 2, dh / 2, dz, 'cajon_lateral_i');
  box(dt, dh, dd, mBody, dw / 2 - dt / 2, dh / 2, dz, 'cajon_lateral_d');
  box(dw, dh, dt, mBody, 0, dh / 2, -ft - dd + dt / 2, 'cajon_trasera');
  const trayZ = hl + BV - 0.02;
  tray.position.set(0, BASE + 0.03, trayZ); body.add(tray);

  // lid on a hinge at the back top edge
  const lidPivot = new THREE.Group(); lidPivot.name = 'bisagra'; lidPivot.position.set(0, H, -L / 2); root.add(lidPivot);
  const lid = new THREE.Group(); lid.name = 'tapa'; lid.position.set(0, 0.06, L / 2); lidPivot.add(lid);
  // lid outline with chamfered front tab (shape -y = front)
  const ls = new THREE.Shape(), r2 = R, tw = 1.25, th = 0.3, ch = 0.45;
  ls.moveTo(-hw + r2, -hl); ls.lineTo(-tw - ch, -hl); ls.lineTo(-tw, -hl - th); ls.lineTo(tw, -hl - th); ls.lineTo(tw + ch, -hl);
  ls.lineTo(hw - r2, -hl); ls.quadraticCurveTo(hw, -hl, hw, -hl + r2); ls.lineTo(hw, hl - r2); ls.quadraticCurveTo(hw, hl, hw - r2, hl);
  ls.lineTo(-hw + r2, hl); ls.quadraticCurveTo(-hw, hl, -hw, hl - r2); ls.lineTo(-hw, -hl + r2); ls.quadraticCurveTo(-hw, -hl, -hw + r2, -hl);
  // print on the top cap only; the underside gets the plain inside colour
  const lidMesh = new THREE.Mesh(splitCaps(extrude(ls, LT, 0.05)), [mLidTop, mLidSide, mInside]); lidMesh.name = 'tapa_relieve'; lid.add(lidMesh);
  // clasp tab folding down over the front face
  const tabZ = hl + BV + 0.12;
  const tab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 0.22), mLidSide); tab.name = 'cierre'; tab.position.set(0, -0.42, tabZ); lid.add(tab);
  const tabMark = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.03), mLime); tabMark.name = 'cierre_marca'; tabMark.position.set(0, -0.5, tabZ + 0.12); lid.add(tabMark);
  // hexagon emblem (raised ring with a gap, like the logo)
  const hexR = 0.78, hexIn = 0.5; const hs = new THREE.Shape(); const ho = new THREE.Path();
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const p = [Math.cos(a) * hexR, Math.sin(a) * hexR]; i ? hs.lineTo(...p) : hs.moveTo(...p); }
  for (let i = 6; i >= 0; i--) { const a = Math.PI / 6 + i * Math.PI / 3; const p = [Math.cos(a) * hexIn, Math.sin(a) * hexIn]; i === 6 ? ho.moveTo(...p) : ho.lineTo(...p); }
  hs.holes.push(ho);
  const emblem = new THREE.Mesh(extrude(hs, 0.16, 0.02), mLime); emblem.name = 'emblema'; emblem.position.y = LT + 0.05; lid.add(emblem);

  // shadow flags
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // centre the model on origin (x,z) and sit on y=0
  root.position.set(0, 0, 0);

  // build-up clipping (FDM print reveal). h in [0,1]
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 99), local = new THREE.Plane();
  let buildY = 99;
  const setBuild = (h) => {
    if (h >= 1) { clip.length = 0; buildY = 99; return; }
    if (!clip.length) clip.push(plane);
    buildY = -0.05 + h * (H + LT + 0.35);
    root.updateMatrixWorld(true);
    local.set(new THREE.Vector3(0, -1, 0), buildY); plane.copy(local).applyMatrix4(root.matrixWorld);
  };

  const anchors = {
    small: new THREE.Vector3(-W / 2 + 1.43, DECK + 0.1, -1.35),
    big: new THREE.Vector3(W / 2 - 3.0, DECK + 0.1, -1.35),
    tray: new THREE.Vector3(dw / 2 - 1.2, dt, -1.4), // drawer-local, on its floor
    tab: new THREE.Vector3(0, -0.4, tabZ + 0.12), // lid-local
    emblem: new THREE.Vector3(0, H + LT + .2, 0),
  };
  return { root, body, lid, lidPivot, tray, emblem, materials: { mBody, mLidTop, mLidSide, mLime, mInside }, dims: { W, L, H, LT, trayZ }, setBuild, getBuildY: () => buildY, anchors, buildHeight: H + LT + 0.3, setLook, getLook: () => ({ ...look }) };
}
