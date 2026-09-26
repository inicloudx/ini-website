// iNiXR AR Wish — receiver experience (Birthday cake + Thank-you gift).
// Personal data (names, message) arrives only in the URL #fragment and never reaches the server.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const $ = (id) => document.getElementById(id);
const EVT_URL = document.body.dataset.evt;
const CREATE_URL = document.body.dataset.create;
const PAGE_KIND = document.body.dataset.kind === 'ty' ? 'ty' : 'bday';
const FONT = '"Baloo Thambi 2", system-ui, sans-serif';
const TEXT_FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/fonts/helvetiker_bold.typeface.json';

// ── Wish data ───────────────────────────────────────────────────
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, n);

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
}

function readWish() {
  try {
    const hp = new URLSearchParams(location.hash.slice(1));
    const d = hp.get('d');
    if (!d) return null;
    const o = JSON.parse(b64urlDecode(d));
    const w = {
      kind: o.k === 'ty' ? 'ty' : (o.k === 'bday' ? 'bday' : PAGE_KIND),
      to: clean(o.t, 24),
      from: clean(o.f, 24),
      msg: clean(o.m, 220),
      id: /^[a-z0-9]{1,12}$/.test(o.i || '') ? o.i : '',
      preview: hp.get('p') === '1',
    };
    return w.to ? w : null;
  } catch {
    return null;
  }
}

const W = readWish() || (PAGE_KIND === 'ty'
  ? { kind: 'ty', to: 'Friend', from: 'iNiXR', id: '', demo: true, msg: 'Thank you for being amazing! 💖' }
  : { kind: 'bday', to: 'Friend', from: 'iNiXR', id: '', demo: true, msg: 'Wishing you a year full of smiles, surprises and magic! 🎉' });
const IS_TY = W.kind === 'ty';

function track(e) {
  if (W.demo || W.preview || !EVT_URL) return;
  const body = JSON.stringify({ e, k: W.kind, i: W.id, r: '' });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(EVT_URL, new Blob([body], { type: 'text/plain' }));
    else fetch(EVT_URL, { method: 'POST', body, keepalive: true });
  } catch { /* analytics must never break the gift */ }
}

// ── Helpers ─────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutBack = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
const easeOutBounce = (k) => {
  const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k;
  if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
  if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
  return n * (k -= 2.625 / d) * k + 0.984375;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let toastTimer = 0;
function toast(text, ms = 2200) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx, text, weight, maxSize, maxWidth) {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 40) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function glowTexture() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

function plaqueTexture(line1, line2, colors) {
  const [c, ctx] = canvas(1024, 512);
  roundRectPath(ctx, 10, 10, 1004, 492, 70);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#fffaf2');
  g.addColorStop(1, colors.bg2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#e8b64c';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.line1;
  ctx.font = `700 100px ${FONT}`;
  ctx.fillText(line1, 512, 150);
  fitFont(ctx, line2, 800, 200, 900);
  ctx.fillStyle = colors.line2;
  ctx.fillText(line2, 512, 335);
  ctx.fillStyle = '#e8b64c';
  for (const [x, y, s] of [[90, 110, 26], [935, 110, 26], [110, 410, 18], [915, 410, 18]]) star(ctx, x, y, s);
  return toTexture(c);
}

function bandTexture(name) {
  const W_ = 4096, H_ = 178;
  const [c, ctx] = canvas(W_, H_);
  const unit = `  ★  HAPPY BIRTHDAY ${name.toUpperCase()}`;
  ctx.font = `800 104px ${FONT}`;
  const uw = ctx.measureText(unit).width;
  const reps = Math.max(1, Math.round(W_ / uw));
  ctx.setTransform(W_ / (reps * uw), 0, 0, 1, 0, 0);
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (let i = 0; i < reps; i++) {
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#c2185b';
    ctx.strokeText(unit, i * uw, H_ / 2 + 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(unit, i * uw, H_ / 2 + 6);
  }
  const t = toTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function stripeTexture() {
  const [c, ctx] = canvas(64, 256);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let y = -64; y < 256; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(64, y + 40); ctx.lineTo(64, y + 60); ctx.lineTo(0, y + 20);
    ctx.fill();
  }
  return toTexture(c);
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  return s;
}

// Heart geometry of a given width, centred, point facing down (depth 0 = flat).
function heartGeometry(width, depth) {
  const g = depth > 0
    ? new THREE.ExtrudeGeometry(heartShape(), { depth: 4, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.4, bevelSegments: 5, curveSegments: 18 })
    : new THREE.ShapeGeometry(heartShape(), 10);
  g.center();
  g.rotateZ(Math.PI);
  const s = width / 22;
  g.scale(s, s, depth > 0 ? (depth / 7.2) : 1);
  return g;
}

// ── Renderer / scene ────────────────────────────────────────────
const stage = $('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch {
  $('introTitle').textContent = 'Sorry, this phone’s browser can’t show 3D. Try opening the link in Chrome.';
  $('openBtn').hidden = true;
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const VIEW_FOV = 40, AR_FOV = 62;     // phone cameras see ~60° vertically in portrait
const camera = new THREE.PerspectiveCamera(VIEW_FOV, innerWidth / innerHeight, 0.05, 100);
const TARGET = new THREE.Vector3(0, 1.15, 0);
const ELEV = THREE.MathUtils.degToRad(17);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.52;

function framingDistance() {
  const aspect = innerWidth / innerHeight;
  return 5.6 * Math.max(1, 0.72 / aspect);
}

scene.add(new THREE.HemisphereLight(0xffe9f5, 0x3b1257, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(3, 7, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 });
sun.shadow.bias = -0.0005;
scene.add(sun);

const warmLight = new THREE.PointLight(IS_TY ? 0xff5c9d : 0xffa64d, 0, 5, 1.6);
warmLight.position.set(0, 2.05, 0.4);
scene.add(warmLight);

// Everything that is "the gift" lives in world (scaled down when shown through the camera).
const world = new THREE.Group();
scene.add(world);

const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.28 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.receiveShadow = true;
world.add(shadowCatcher);

const GLOW = glowTexture();
const hero = new THREE.Group();          // cake or gift box — drops in on reveal
hero.visible = false;
world.add(hero);

function std(color, rough = 0.55, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
}
function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Tweens ──────────────────────────────────────────────────────
const tweens = [];
function tween(dur, fn, delay = 0) {
  return new Promise((resolve) => tweens.push({ t: -delay, dur, fn, resolve }));
}

// ── Balloons (round for birthday, hearts for thank-you) ─────────
const balloons = [];
function buildBalloons() {
  const colors = IS_TY
    ? [0xff2d6f, 0xff8fc0, 0xc13cff, 0xff5c9d, 0xffb3d1, 0xe0115f, 0x9b5de5, 0xff7aa8]
    : [0xff4d6d, 0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00c49a, 0xf15bb5, 0xfb8500, 0x4d96ff];
  // [angle° (0 = toward viewer), radius, height] — sides and back only, never in front of the name.
  const spots = [[75, 2.2, 2.4], [105, 2.0, 3.0], [140, 2.3, 2.2], [165, 2.0, 3.4], [195, 2.2, 3.0], [220, 2.3, 2.3], [255, 2.0, 2.9], [285, 2.2, 2.5]];
  const geo = IS_TY ? heartGeometry(0.62, 0.22) : new THREE.SphereGeometry(0.3, 32, 24);
  spots.forEach(([deg, r, y], i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: colors[i], roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
    const body = new THREE.Mesh(geo, mat);
    if (!IS_TY) body.scale.set(1, 1.18, 1);
    body.userData.balloon = g;
    g.add(shadowed(body));
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 10), mat);
    knot.position.y = IS_TY ? -0.3 : -0.37;
    g.add(knot);
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      pts.push(new THREE.Vector3(Math.sin(t * 5 + i) * 0.05, knot.position.y - 0.03 - t * 1.5, Math.cos(t * 4 + i) * 0.03));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));
    const home = new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    g.position.set(home.x, -4, home.z);
    g.visible = false;
    g.userData = { home, seed: rand(0, 10), shown: 0, fly: 0, flyV: 0, flyX: rand(-0.3, 0.3), popped: false, body };
    world.add(g);
    balloons.push(g);
  });
}

function showBalloons() {
  balloons.forEach((b, i) => {
    Object.assign(b.userData, { shown: 0, fly: 0, flyV: 0, popped: false });
    b.visible = true;
    b.scale.setScalar(1);
    tween(2.2, (k) => { b.userData.shown = easeOutCubic(k); }, 0.3 + i * 0.12);
  });
}

function releaseBalloons() {
  balloons.forEach((b, i) => setTimeout(() => { if (!b.userData.popped) b.userData.flyV = rand(0.4, 0.8); }, i * 140));
}

function popBalloon(b) {
  if (b.userData.popped) return;
  b.userData.popped = true;
  const p = new THREE.Vector3();
  b.userData.body.getWorldPosition(p);
  world.worldToLocal(p);
  burstConfetti(40, p, 0.55);
  sfx.pop();
  tween(0.12, (k) => b.scale.setScalar(1 + k * 0.35)).then(() => { b.visible = false; });
}

// ── Sparkles, confetti, smoke ───────────────────────────────────
function buildSparkles() {
  const n = 90;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), r = rand(1.4, 2.6), y = rand(0.3, 3.2);
    pos.set([Math.sin(a) * r, y, Math.cos(a) * r], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, map: GLOW, color: IS_TY ? 0xffb3d1 : 0xffd98a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.visible = false;
  world.add(pts);
  return pts;
}
const sparkles = buildSparkles();

const CONF_N = 420;
const confetti = new THREE.InstancedMesh(
  IS_TY ? heartGeometry(0.1, 0) : new THREE.PlaneGeometry(0.055, 0.09),
  new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  CONF_N,
);
confetti.frustumCulled = false;
const conf = Array.from({ length: CONF_N }, () => ({ alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 }));
{
  const palette = IS_TY
    ? [0xff2d6f, 0xff8fc0, 0xffffff, 0xc13cff, 0xffd23f, 0xff5c9d]
    : [0xff4d6d, 0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00f5d4, 0xf15bb5, 0xffffff, 0xfb8500];
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < CONF_N; i++) {
    confetti.setMatrixAt(i, zero);
    confetti.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  world.add(confetti);
}
let confCursor = 0;
function burstConfetti(n, origin, power = 1) {
  for (let k = 0; k < n; k++) {
    const c = conf[confCursor];
    confCursor = (confCursor + 1) % CONF_N;
    const a = rand(0, Math.PI * 2);
    c.alive = true;
    c.life = 0;
    c.p.copy(origin).add(new THREE.Vector3(rand(-0.2, 0.2), 0, rand(-0.2, 0.2)));
    c.v.set(Math.cos(a) * rand(0.6, 2.2) * power, rand(3.2, 5.2) * power, Math.sin(a) * rand(0.6, 2.2) * power);
    c.r.set(rand(0, 6), rand(0, 6), rand(0, 6));
    c.w.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
  }
}

const smokeMats = [];
const smoke = Array.from({ length: 24 }, () => {
  const mat = new THREE.SpriteMaterial({ map: GLOW, color: 0xdad4e8, transparent: true, opacity: 0, depthWrite: false });
  smokeMats.push(mat);
  const s = new THREE.Sprite(mat);
  s.visible = false;
  hero.add(s);
  return { s, life: 0, alive: false, drift: 0 };
});
let smokeCursor = 0;
function puffSmoke(at) {
  for (let i = 0; i < 4; i++) {
    const sm = smoke[smokeCursor];
    smokeCursor = (smokeCursor + 1) % smoke.length;
    sm.alive = true;
    sm.life = -i * 0.12;
    sm.drift = rand(-0.15, 0.15);
    sm.s.position.copy(at);
    sm.s.visible = false;
  }
}

// ── Audio (all synthesized; the Happy Birthday tune is public domain) ─
let actx = null, master = null, songBus = null, noiseBuf = null, muted = false;

function initAudio() {
  if (actx) { actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
  master = actx.createGain();
  master.gain.value = 0.85;
  master.connect(actx.destination);
  noiseBuf = actx.createBuffer(1, actx.sampleRate * 1.2, actx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = (n) => 440 * Math.pow(2, (12 * (parseInt(n.slice(-1), 10) + 1) + NOTE[n[0]] - 69) / 12);

function tone(f, t, dur, vol, type = 'sine', out = master) {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function musicBox(f, t, dur, vol = 0.22, out = master) {
  tone(f, t, Math.max(0.6, dur * 1.5), vol, 'sine', out);
  tone(f * 2, t, 0.5, vol * 0.25, 'triangle', out);
  tone(f * 3, t, 0.18, vol * 0.08, 'sine', out);
}

function noise(t, dur, vol, filterType, f0, f1) {
  const src = actx.createBufferSource();
  src.buffer = noiseBuf;
  const flt = actx.createBiquadFilter();
  flt.type = filterType;
  flt.frequency.setValueAtTime(f0, t);
  flt.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const sfx = {
  sparkle() {
    if (!actx) return;
    const t = actx.currentTime;
    ['E6', 'G6', 'C7', 'E7'].forEach((n, i) => tone(freq(n), t + i * 0.07, 0.5, 0.06));
  },
  pop(delay = 0) {
    if (!actx) return;
    const t = actx.currentTime + delay;
    noise(t, 0.12, 0.5, 'bandpass', 1800, 600);
    tone(520, t, 0.12, 0.12, 'triangle');
  },
  whoosh() {
    if (!actx) return;
    noise(actx.currentTime, 0.7, 0.35, 'lowpass', 2400, 300);
  },
  light() {
    if (!actx) return;
    const t = actx.currentTime;
    noise(t, 0.35, 0.25, 'bandpass', 500, 2500);
    tone(freq('G6'), t + 0.05, 0.3, 0.04);
  },
  thud() {
    if (!actx) return;
    const t = actx.currentTime;
    tone(110, t, 0.25, 0.3, 'sine');
    noise(t, 0.15, 0.2, 'lowpass', 600, 120);
  },
  tada() {
    if (!actx) return;
    const t = actx.currentTime;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => musicBox(freq(n), t + i * 0.09, 0.4, 0.16));
    ['C5', 'E5', 'G5', 'C6'].forEach((n) => musicBox(freq(n), t + 0.42, 1.2, 0.1));
  },
  shutter() {
    if (!actx) return;
    const t = actx.currentTime;
    noise(t, 0.05, 0.4, 'highpass', 3000, 5000);
    noise(t + 0.07, 0.05, 0.3, 'highpass', 3000, 5000);
  },
};

// ── Songs ───────────────────────────────────────────────────────
// Happy Birthday (public domain). [note, beats, bass]
const BDAY_SONG = [
  [['G4', 0.75], ['G4', 0.25], ['A4', 1, 'C3'], ['G4', 1], ['C5', 1], ['B4', 2, 'G2']],
  [['G4', 0.75], ['G4', 0.25], ['A4', 1, 'G2'], ['G4', 1], ['D5', 1], ['C5', 2, 'C3']],
  [['G4', 0.75], ['G4', 0.25], ['G5', 1, 'C3'], ['E5', 1], ['C5', 1], ['B4', 1, 'F2'], ['A4', 2]],
  [['F5', 0.75], ['F5', 0.25], ['E5', 1, 'C3'], ['C5', 1], ['D5', 1, 'G2'], ['C5', 3, 'C3']],
];
const BDAY_LYRICS = [
  'Happy birthday to you 🎵',
  'Happy birthday to you 🎶',
  `Happy birthday dear ${W.to} 💖`,
  'Happy birthday to you! 🎉',
];
// Original gentle arpeggio for the thank-you gift.
const TY_SONG = [
  [['C5', 0.5, 'C3'], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5]],
  [['B4', 0.5, 'G2'], ['D5', 0.5], ['G5', 0.5], ['B5', 0.5]],
  [['A4', 0.5, 'A2'], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5]],
  [['F4', 0.5, 'F2'], ['A4', 0.5], ['C5', 0.5], ['F5', 0.5]],
  [['G4', 0.5, 'G2'], ['B4', 0.5], ['D5', 0.5], ['G5', 0.5]],
  [['E5', 0.5, 'C3'], ['G5', 0.5], ['C6', 2]],
];
const TY_LYRICS = ['', '', `Thank you, ${W.to} 💖`, '', '', ''];

let songTimers = [];

function stopSong() {
  songTimers.forEach(clearTimeout);
  songTimers = [];
  if (songBus && actx) {
    songBus.gain.setTargetAtTime(0, actx.currentTime, 0.08);
    const old = songBus;
    setTimeout(() => old.disconnect(), 800);
  }
  songBus = null;
  hideLyric();
}

function playSong(song, lyrics, beatSec) {
  stopSong();
  return new Promise((resolve) => {
    if (actx) {
      songBus = actx.createGain();
      songBus.connect(master);
    }
    const bus = songBus;
    const start = actx ? actx.currentTime + 0.15 : 0;
    let beat = 0;
    song.forEach((line, li) => {
      if (lyrics[li]) songTimers.push(setTimeout(() => showLyric(lyrics[li]), beat * beatSec * 1000 + 100));
      for (const [n, b, bass] of line) {
        if (bus) {
          const t = start + beat * beatSec;
          musicBox(freq(n), t, b * beatSec, 0.22, bus);
          if (bass) {
            tone(freq(bass), t, b * beatSec * 2.2, 0.1, 'triangle', bus);
            tone(freq(bass) * 1.5, t, b * beatSec * 2, 0.05, 'triangle', bus);
          }
        }
        beat += b;
      }
    });
    songTimers.push(setTimeout(() => { hideLyric(); resolve(); }, beat * beatSec * 1000 + 700));
  });
}

function showLyric(text) {
  const el = $('lyric');
  el.classList.remove('show');
  requestAnimationFrame(() => { el.textContent = text; el.classList.add('show'); });
}
function hideLyric() { $('lyric').classList.remove('show'); }

// ═══════════════════════════════════════════════════════════════
//  BIRTHDAY CAKE
// ═══════════════════════════════════════════════════════════════
const flames = [];

function dripRing(radius, topY, count, color, rMin, rMax) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 14, 10);
  const mat = std(color, 0.35);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = rand(rMin, rMax);
    const len = rand(1.1, 2.6);
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(r, r * len, r);
    m.position.set(Math.sin(a) * radius, topY - r * len * 0.45, Math.cos(a) * radius);
    g.add(shadowed(m));
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.01, rMax * 0.9, 12, 80), mat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = topY;
  g.add(shadowed(rim));
  return g;
}

function beadRing(radius, y, count, color, r) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(r, 12, 10);
  const mat = std(color, 0.4);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const m = new THREE.Mesh(geo, mat);
    m.position.set(Math.sin(a) * radius, y, Math.cos(a) * radius);
    g.add(shadowed(m));
  }
  return g;
}

function buildCake() {
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.38, 0.08, 64), std(0xf7f3ff, 0.25, { metalness: 0.15 }));
  plate.position.y = 0.04;
  hero.add(shadowed(plate));

  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 72), std(0xff8fb8, 0.6));
  t1.position.y = 0.48;
  hero.add(shadowed(t1));
  hero.add(dripRing(1.1, 0.88, 30, 0xfff4e6, 0.07, 0.1));
  hero.add(beadRing(1.1, 0.13, 40, 0xfff4e6, 0.07));

  const bandMat = new THREE.MeshStandardMaterial({ map: bandTexture(W.to), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.104, 1.104, 0.3, 96, 1, true), bandMat);
  band.position.y = 0.43;
  hero.add(band);

  const sprinkles = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.012, 0.045, 2, 6), std(0xffffff, 0.4), 90);
  const dummy = new THREE.Object3D();
  const sprColors = [0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00c49a, 0xff5d8f, 0xffffff];
  for (let i = 0; i < 90; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(0.8, 1.02);
    dummy.position.set(Math.sin(a) * r, 0.9, Math.cos(a) * r);
    dummy.rotation.set(Math.PI / 2, 0, rand(0, Math.PI));
    dummy.updateMatrix();
    sprinkles.setMatrixAt(i, dummy.matrix);
    sprinkles.setColorAt(i, new THREE.Color(sprColors[i % sprColors.length]));
  }
  hero.add(sprinkles);

  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 64), std(0xfff1dc, 0.6));
  t2.position.y = 1.18;
  hero.add(shadowed(t2));
  hero.add(dripRing(0.75, 1.48, 22, 0xff6fa3, 0.055, 0.08));
  hero.add(beadRing(0.75, 0.92, 30, 0xff8fb8, 0.05));

  const berryMat = std(0xd81b60, 0.25, { metalness: 0.05 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), berryMat);
    b.position.set(Math.sin(a) * 0.66, 1.52, Math.cos(a) * 0.66);
    hero.add(shadowed(b));
  }

  // Name topper on gold sticks
  const topper = new THREE.Group();
  topper.position.set(0, 2.24, -0.32);
  topper.scale.setScalar(1.2);
  const tex = plaqueTexture('Happy Birthday', W.to, { bg2: '#ffe1ee', line1: '#e64a8b', line2: '#5b1a8a' });
  const gold = std(0xe8b64c, 0.3, { metalness: 0.8 });
  topper.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.6, 0.02), gold)));
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.56), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    face.position.z = 0.011 * side;
    if (side < 0) face.rotation.y = Math.PI;
    topper.add(face);
  }
  for (const x of [-0.4, 0.4]) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), gold);
    stick.position.set(x, -0.52, 0);
    topper.add(stick);
  }
  hero.add(topper);

  // Candles (start unlit — the viewer lights them)
  const stripe = stripeTexture();
  const candleColors = [0x7ad0ff, 0xff7aa8, 0xffd23f, 0x9b5de5, 0x5fe0b0];
  const N = 5;
  for (let i = 0; i < N; i++) {
    const a = THREE.MathUtils.degToRad(-64 + (128 / (N - 1)) * i);
    const x = Math.sin(a) * 0.5, z = Math.cos(a) * 0.5 - 0.02;
    const h = 0.38;
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, h, 14),
      new THREE.MeshStandardMaterial({ color: candleColors[i], map: stripe, roughness: 0.45 }),
    );
    candle.position.set(x, 1.48 + h / 2, z);
    hero.add(shadowed(candle));

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), std(0x222222, 0.9));
    wick.position.set(x, 1.48 + h + 0.02, z);
    hero.add(wick);

    const flame = new THREE.Group();
    flame.position.set(x, 1.48 + h + 0.1, z);
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    outer.scale.set(0.05, 0.12, 0.05);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff4c2 }));
    inner.scale.set(0.028, 0.07, 0.028);
    inner.position.y = -0.02;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffb04d, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(0.5);
    flame.add(outer, inner, glow);
    flame.userData = { lit: false, k: 0, seed: rand(0, 100), base: flame.position.clone() };
    flame.visible = false;
    hero.add(flame);
    flames.push(flame);
  }
}

function lightFlame(f, delay) {
  return tween(0.35, (k) => { f.userData.k = easeOutBack(k); }, delay).then(() => { f.userData.lit = true; });
}

function extinguish(f) {
  if (!f.userData.lit) return;
  f.userData.lit = false;
  tween(0.25, (k) => { f.userData.k = 1 - k; });
  puffSmoke(f.userData.base.clone().add(new THREE.Vector3(0, 0.02, 0)));
}

// ═══════════════════════════════════════════════════════════════
//  THANK-YOU GIFT
// ═══════════════════════════════════════════════════════════════
const ty = { lid: null, heart: null, heartGlow: null, text: null, opened: false };

function tagTexture() {
  const [c, ctx] = canvas(1024, 512);
  roundRectPath(ctx, 40, 60, 944, 392, 60);
  ctx.fillStyle = '#fffaf5';
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#e8b64c';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e64a8b';
  ctx.font = `700 92px ${FONT}`;
  ctx.fillText('For', 512, 170);
  fitFont(ctx, W.to, 800, 170, 860);
  ctx.fillStyle = '#5b1a8a';
  ctx.fillText(W.to, 512, 330);
  return toTexture(c);
}

function buildGift() {
  const boxMat = new THREE.MeshPhysicalMaterial({ color: 0x8a5cff, roughness: 0.35, clearcoat: 0.6 });
  const ribbonMat = std(0xffc94a, 0.3, { metalness: 0.6 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), boxMat);
  box.position.y = 0.45;
  hero.add(shadowed(box));
  for (const rot of [0, Math.PI / 2]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.905, 1.21), ribbonMat);
    r.position.y = 0.45;
    r.rotation.y = rot;
    hero.add(r);
  }
  // Name tag on the front
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: tagTexture(), transparent: true, roughness: 0.6 }));
  tag.position.set(0, 0.42, 0.608);
  hero.add(tag);

  // Lid with bow
  const lid = new THREE.Group();
  lid.position.y = 0.99;
  lid.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.3), boxMat)));
  for (const rot of [0, Math.PI / 2]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.205, 1.31), ribbonMat);
    r.rotation.y = rot;
    lid.add(r);
  }
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 24), ribbonMat);
    loop.position.set(side * 0.17, 0.2, 0);
    loop.rotation.set(0, 0, side * 0.5);
    loop.scale.set(1, 0.75, 1);
    lid.add(shadowed(loop));
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), ribbonMat);
  knot.position.y = 0.14;
  lid.add(knot);
  hero.add(lid);
  ty.lid = lid;

  // Heart that rises out of the box
  const heart = new THREE.Mesh(
    heartGeometry(1.0, 0.36),
    new THREE.MeshPhysicalMaterial({ color: 0xff2d6f, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x5a0020, emissiveIntensity: 0.6 }),
  );
  heart.position.y = 0.5;
  heart.scale.setScalar(0.0001);
  hero.add(shadowed(heart));
  ty.heart = heart;
  const hg = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff5c9d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  hg.scale.setScalar(2.4);
  hero.add(hg);
  ty.heartGlow = hg;

  // "THANK YOU" in 3D (falls back to a flat sign if the font can't load)
  const textGroup = new THREE.Group();
  textGroup.position.set(0, 2.45, 0);
  textGroup.scale.setScalar(0.0001);
  hero.add(textGroup);
  ty.text = textGroup;
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffd36b, metalness: 0.85, roughness: 0.22, clearcoat: 0.6, emissive: 0x4a2a00, emissiveIntensity: 0.4 });
  new FontLoader().loadAsync(TEXT_FONT_URL).then((font) => {
    const g = new TextGeometry('THANK YOU', { font, size: 0.25, depth: 0.08, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.012, bevelSegments: 3 });
    g.center();
    textGroup.add(shadowed(new THREE.Mesh(g, goldMat)));
  }).catch(() => {
    const tex = plaqueTexture('💖', 'THANK YOU', { bg2: '#ffe1ee', line1: '#e64a8b', line2: '#c2185b' });
    textGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshStandardMaterial({ map: tex })));
  });
}

// Floating hearts rising gently around the gift (thank-you ambience)
const FLOAT_N = 28;
let floaters = null;
const floatData = [];
function buildFloaters() {
  floaters = new THREE.InstancedMesh(heartGeometry(0.14, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), FLOAT_N);
  const cols = [0xff2d6f, 0xff8fc0, 0xffb3d1, 0xc13cff];
  for (let i = 0; i < FLOAT_N; i++) {
    floaters.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    floatData.push({ a: rand(0, Math.PI * 2), r: rand(0.9, 2.2), y: rand(-1, 3.5), v: rand(0.12, 0.3), s: rand(0.6, 1.3), seed: rand(0, 10) });
  }
  floaters.visible = false;
  world.add(floaters);
}

async function openGift() {
  if (phase !== 'open' || ty.opened) return;
  ty.opened = true;
  phase = 'hearts';
  $('hint').hidden = true;
  track('gift_open');
  sfx.pop();
  sfx.sparkle();
  const lid = ty.lid;
  const from = lid.position.clone();
  tween(1.0, (k) => {
    const e = easeOutCubic(k);
    lid.position.set(from.x + e * 1.3, from.y + Math.sin(k * Math.PI) * 1.1 - k * 0.87, from.z - e * 0.2);
    lid.rotation.set(e * 0.4, e * 1.2, -e * 0.9);
  });
  burstConfetti(140, new THREE.Vector3(0, 1.0, 0), 1.05);
  await wait(250);
  sfx.tada();
  tween(1.4, (k) => {
    ty.heart.scale.setScalar(Math.max(0.0001, easeOutBack(k)));
    ty.heart.position.y = 0.5 + easeOutCubic(k) * 1.1;
    ty.heartGlow.material.opacity = 0.55 * k;
    ty.heartGlow.position.copy(ty.heart.position);
    warmLight.intensity = 4 * k;
  });
  await wait(700);
  tween(1.1, (k) => ty.text.scale.setScalar(Math.max(0.0001, easeOutBack(k))));
  floaters.visible = true;
  showBalloons();
  playSong(TY_SONG, TY_LYRICS, 0.32);
  await wait(2200);
  setHint({ text: 'Tap the heart balloons to pop them 💕' });
  await wait(4500);
  $('hint').hidden = true;
  showCard();
}

// ═══════════════════════════════════════════════════════════════
//  Camera modes: 3D · Room (back camera + gyro) · Selfie (front camera)
// ═══════════════════════════════════════════════════════════════
const AR_SCALE = 0.38;
const video = $('cam');
let mode = '3d';
let camStream = null;
let videoTex = null;
const arTarget = new THREE.Vector3();
const devQ = new THREE.Quaternion(), startQ = new THREE.Quaternion(), baseQ = new THREE.Quaternion();
let orientReady = false, orientStarted = false;

const _e = new THREE.Euler(), _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _z = new THREE.Vector3(0, 0, 1);
function onOrient(ev) {
  if (mode !== 'room' || ev.alpha == null || ev.beta == null) return;
  const d = THREE.MathUtils.degToRad;
  const orient = d((screen.orientation && screen.orientation.angle) || window.orientation || 0);
  _e.set(d(ev.beta), d(ev.alpha), -d(ev.gamma), 'YXZ');
  devQ.setFromEuler(_e).multiply(_q1).multiply(_q0.setFromAxisAngle(_z, -orient));
  if (!orientStarted) { startQ.copy(devQ); orientStarted = true; }
  if (!orientReady) {
    orientReady = true;
    controls.enabled = false;        // gyro takes over from finger-drag
    arTip('Move your phone slowly to look around 📱');
  }
}
window.addEventListener('deviceorientation', onOrient);

// iOS asks for motion permission; must be called synchronously inside a tap.
function askGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    return DeviceOrientationEvent.requestPermission().catch(() => 'denied');
  }
  return Promise.resolve('granted');
}

let tipTimer = 0;
function arTip(text, ms = 3500) {
  const el = $('arTip');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { el.hidden = true; }, ms);
}

function fitVideoBackground() {
  if (!videoTex || !video.videoWidth) return;
  const va = video.videoWidth / video.videoHeight;
  const sa = innerWidth / innerHeight;
  let rx = 1, ry = 1;
  if (sa < va) rx = sa / va; else ry = va / sa;
  const mirror = mode === 'selfie';
  videoTex.repeat.set(mirror ? -rx : rx, ry);
  videoTex.offset.set(mirror ? (1 + rx) / 2 : (1 - rx) / 2, (1 - ry) / 2);
}

function place3D() {
  camera.fov = VIEW_FOV;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  world.scale.setScalar(1);
  const d = framingDistance();
  camera.position.set(0, TARGET.y + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
  controls.target.copy(TARGET);
  controls.minDistance = 3;
  controls.maxDistance = 14;
  camera.lookAt(TARGET);
  controls.enabled = true;
  controls.update();
}

function placeAR() {
  camera.fov = AR_FOV;
  camera.clearViewOffset();
  world.scale.setScalar(AR_SCALE);
  const fovRatio = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV / 2)) / Math.tan(THREE.MathUtils.degToRad(AR_FOV / 2));
  const d = framingDistance() * AR_SCALE * fovRatio * 1.15;
  const elev = THREE.MathUtils.degToRad(mode === 'selfie' ? 12 : 24);
  arTarget.set(0, 1.0 * AR_SCALE, 0);
  camera.position.set(0, arTarget.y + Math.sin(elev) * d, Math.cos(elev) * d);
  camera.lookAt(arTarget);
  baseQ.copy(camera.quaternion);
  controls.target.copy(arTarget);
  controls.minDistance = d * 0.5;
  controls.maxDistance = d * 2.2;
  controls.enabled = true;
  controls.update();
  // Selfie: push the gift into the lower part of the frame so your face stays visible.
  if (mode === 'selfie') camera.setViewOffset(innerWidth, innerHeight, 0, -innerHeight * 0.24, innerWidth, innerHeight);
  camera.updateProjectionMatrix();
}

function stopCamera() {
  if (camStream) camStream.getTracks().forEach((t) => t.stop());
  camStream = null;
  video.srcObject = null;
}

function updateTools() {
  document.querySelectorAll('.tool[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('recenter').hidden = mode !== 'room';
  $('selfieBtn').textContent = mode === 'selfie' ? '📷 Back to room' : '🤳 Selfie with it';
}

let switching = false;
async function setMode(m, gyroAsk) {
  if (switching || m === mode) return m === mode;
  switching = true;
  try {
    if (m === '3d') {
      stopCamera();
      scene.background = null;
      document.body.classList.remove('ar');
      mode = '3d';
      place3D();
      updateTools();
      return true;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: m === 'room' ? 'environment' : 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch {
      toast('Camera not allowed — showing 3D view');
      return false;
    }
    if (gyroAsk) await gyroAsk;
    stopCamera();
    camStream = stream;
    video.srcObject = stream;
    try { await video.play(); } catch { /* muted inline video should play */ }
    if (!videoTex) {
      videoTex = new THREE.VideoTexture(video);
      videoTex.colorSpace = THREE.SRGBColorSpace;
      video.addEventListener('loadedmetadata', fitVideoBackground);
    }
    scene.background = videoTex;
    document.body.classList.add('ar');
    mode = m;
    orientReady = false;
    orientStarted = false;
    fitVideoBackground();
    placeAR();
    updateTools();
    track(m);
    arTip(m === 'room' ? 'Drag to look around 👆' : 'Smile! Tap 📸 to take a photo 😄');
    return true;
  } finally {
    switching = false;
  }
}

function recenter() {
  orientStarted = false;             // next gyro reading becomes "straight ahead"
  placeAR();
}

// ── Photo capture & share ───────────────────────────────────────
let shotBlob = null, shotUrl = '';

function capture() {
  track('photo');
  renderer.render(scene, camera);
  const src = renderer.domElement;
  const w = src.width, h = src.height;
  const [c, ctx] = canvas(w, h);
  if (mode === '3d') {
    const g = ctx.createRadialGradient(w / 2, h * 0.2, 0, w / 2, h * 0.2, h);
    g.addColorStop(0, '#7a1f5c');
    g.addColorStop(0.45, '#3b1257');
    g.addColorStop(1, '#1a0b2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(src, 0, 0);

  // Watermark pill — every shared photo points back to the creator.
  const s = w / 420;
  const label = `${IS_TY ? '💖' : '🎂'} Made with inixr.com/wish`;
  ctx.font = `800 ${Math.round(15 * s)}px ${FONT}`;
  const tw = ctx.measureText(label).width;
  const ph = 34 * s, pw = tw + 30 * s, px = (w - pw) / 2, py = h - ph - 22 * s;
  roundRectPath(ctx, px, py, pw, ph, ph / 2);
  ctx.fillStyle = 'rgba(20,8,32,0.62)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, py + ph / 2 + 1 * s);

  sfx.shutter();
  const fl = $('flash');
  fl.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => fl.classList.remove('on')));

  c.toBlob((blob) => {
    if (!blob) return;
    shotBlob = blob;
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = URL.createObjectURL(blob);
    $('shotImg').src = shotUrl;
    $('shotSave').href = shotUrl;
    $('shot').hidden = false;
  }, 'image/jpeg', 0.9);
}

async function sharePhoto() {
  if (!shotBlob) return;
  const file = new File([shotBlob], IS_TY ? 'thank-you.jpg' : 'birthday-surprise.jpg', { type: 'image/jpeg' });
  const text = IS_TY
    ? 'Look at this thank-you gift I got 💖 Make one: https://inixr.com/wish/create/'
    : 'Look at my birthday surprise 🎂 Make one: https://inixr.com/wish/create/';
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      track('photo_share');
    } catch { /* user cancelled */ }
  } else {
    $('shotSave').click();
    toast('Photo saved — share it from your gallery 📲');
  }
}

// ── Mic blow detection ──────────────────────────────────────────
let mic = null;
let micLevel = 0;

async function startMic() {
  $('hintMain').disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    track('mic_ok');
    initAudio();
    const src = actx.createMediaStreamSource(stream);
    const analyser = actx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    mic = { stream, analyser, buf: new Float32Array(analyser.fftSize), floor: 0, calib: 0, accum: 0 };
    setHint({ text: 'Now blow! 🌬️ (close to the mic)', meter: true, alt: 'or tap here to blow', onAlt: tapBlow });
  } catch {
    track('mic_denied');
    setHint({ text: 'No mic? No problem! 🌬️', main: '🌬️ Tap to blow', onMain: tapBlow });
  }
}

function stopMic() {
  if (mic) mic.stream.getTracks().forEach((t) => t.stop());
  mic = null;
  micLevel = 0;
  $('meter').classList.remove('on');
}

function updateMic(dt) {
  if (!mic || phase !== 'blow') return;
  mic.analyser.getFloatTimeDomainData(mic.buf);
  let sum = 0;
  for (const v of mic.buf) sum += v * v;
  const rms = Math.sqrt(sum / mic.buf.length);

  if (mic.calib < 0.5) {             // learn the room's noise floor first
    mic.calib += dt;
    mic.floor = Math.max(mic.floor, rms);
    return;
  }
  const thresh = Math.max(0.05, mic.floor * 3);
  micLevel += (clamp01((rms - mic.floor) / (thresh * 2)) - micLevel) * 0.3;
  $('meter').firstElementChild.style.width = `${Math.round(micLevel * 100)}%`;

  if (rms > thresh) {
    mic.accum += dt * (rms > thresh * 2 ? 2 : 1);
    if (mic.accum > 0.16) {
      mic.accum = 0;
      const lit = flames.filter((f) => f.userData.lit);
      if (lit.length) {
        extinguish(lit[Math.floor(Math.random() * lit.length)]);
        if (lit.length === flames.length) sfx.whoosh();
      }
      if (lit.length <= 1) celebrate();
    }
  }
}

function tapBlow() {
  if (phase !== 'blow') return;
  sfx.whoosh();
  flames.forEach((f, i) => setTimeout(() => extinguish(f), i * 110));
  setTimeout(celebrate, flames.length * 110 + 150);
}

// ── Hint panel ──────────────────────────────────────────────────
let hintMainHandler = null, hintAltHandler = null;
function setHint({ text, main = '', onMain = null, alt = '', onAlt = null, meter = false }) {
  $('hintText').textContent = text;
  const m = $('hintMain');
  m.hidden = !main;
  m.disabled = false;
  m.textContent = main;
  hintMainHandler = onMain;
  $('hintAlt').hidden = !alt;
  $('hintAlt').textContent = alt;
  hintAltHandler = onAlt;
  $('meter').classList.toggle('on', meter);
  $('hint').hidden = false;
}
$('hintMain').addEventListener('click', () => hintMainHandler && hintMainHandler());
$('hintAlt').addEventListener('click', () => hintAltHandler && hintAltHandler());

// ── Flow ────────────────────────────────────────────────────────
// bday: intro → reveal → light → blow (song plays, blow anytime) → done
// ty:   intro → reveal → open → hearts → done
let phase = 'intro';

async function reveal() {
  phase = 'reveal';
  hero.visible = true;
  sparkles.visible = true;
  sfx.sparkle();
  // Drop in from above with a bounce
  tween(1.1, (k) => {
    hero.position.y = (1 - easeOutBounce(k)) * 3.2;
    hero.scale.setScalar(Math.max(0.0001, Math.min(1, k * 3)));
  });
  setTimeout(() => { sfx.thud(); burstConfetti(60, new THREE.Vector3(0, 0.2, 0), 0.7); }, 420);
  await wait(1200);
  if (IS_TY) {
    phase = 'open';
    setHint({ text: 'Tap the gift to open it 🎁', main: '🎁 Open the gift', onMain: openGift });
  } else {
    showBalloons();
    phase = 'light';
    setHint({ text: 'Tap the cake to light the candles 🔥', main: '🔥 Light the candles', onMain: lightCandles });
  }
}

async function lightCandles() {
  if (phase !== 'light') return;
  phase = 'lighting';
  $('hint').hidden = true;
  track('lit');
  flames.forEach((f, i) => {
    setTimeout(() => { f.visible = true; sfx.light(); }, i * 170);
    lightFlame(f, i * 0.17);
  });
  await wait(flames.length * 170 + 400);
  phase = 'blow';
  setHint({ text: 'Make a wish… then blow! 🌬️', main: '🎤 Blow with mic', onMain: startMic, alt: 'or tap here to blow', onAlt: tapBlow });
  playSong(BDAY_SONG, BDAY_LYRICS, 0.52).then(() => { if (phase === 'blow') track('song_done'); });
}

async function celebrate() {
  if (phase !== 'blow') return;
  phase = 'done';
  stopMic();
  stopSong();
  flames.forEach(extinguish);
  $('hint').hidden = true;
  track('blown');

  await wait(350);
  sfx.tada();
  burstConfetti(160, new THREE.Vector3(0, 1.6, 0), 1.1);
  [0, 0.25, 0.5].forEach((d) => sfx.pop(d));
  setTimeout(() => { burstConfetti(110, new THREE.Vector3(-1.2, 0.2, 0.6), 1); sfx.pop(); }, 450);
  setTimeout(() => { burstConfetti(110, new THREE.Vector3(1.2, 0.2, 0.6), 1); sfx.pop(); }, 750);
  tween(0.6, (k) => hero.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.08));
  showLyric(`🎉 Happy Birthday, ${W.to}! 🎉`);
  setTimeout(releaseBalloons, 600);

  await wait(2600);
  hideLyric();
  showCard();
}

function showCard() {
  phase = 'done';
  $('cardTo').textContent = `Dear ${W.to},`;
  $('cardMsg').textContent = W.msg || (IS_TY ? 'Thank you so much! 💖' : 'Happy Birthday! 🎂');
  $('cardFrom').textContent = W.from ? `— with love, ${W.from}` : '';
  const btn = $('primaryBtn');
  btn.className = 'big-btn pink';
  if (IS_TY) {
    btn.textContent = '💌 Send a thank-you to someone';
    $('makeOwn').textContent = '🎂 Send someone a birthday wish';
  } else {
    btn.textContent = W.from ? `💌 Say thank you to ${W.from}` : '💌 Say thank you';
  }
  $('card').classList.remove('min');
  $('card').hidden = false;
}

async function replay() {
  track('replay');
  $('card').hidden = true;
  stopSong();
  if (IS_TY) {
    ty.opened = false;
    ty.heart.scale.setScalar(0.0001);
    ty.heart.position.y = 0.5;
    ty.heartGlow.material.opacity = 0;
    ty.text.scale.setScalar(0.0001);
    ty.lid.position.set(0, 0.99, 0);
    ty.lid.rotation.set(0, 0, 0);
    floaters.visible = false;
    warmLight.intensity = 0;
  } else {
    flames.forEach((f) => { f.userData.lit = false; f.userData.k = 0; f.visible = false; });
  }
  balloons.forEach((b) => { b.visible = false; });
  hero.visible = false;
  await wait(250);
  reveal();
}

// ── Taps on the 3D scene ────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  const quick = performance.now() - down.t < 450;
  down = null;
  if (moved > 12 || !quick) return;        // a drag, not a tap
  onTap(e.clientX, e.clientY);
});

function onTap(x, y) {
  if (phase === 'light') { lightCandles(); return; }
  if (phase === 'open') { openGift(); return; }
  pointer.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const bodies = balloons.filter((b) => b.visible && !b.userData.popped).map((b) => b.userData.body);
  const hit = raycaster.intersectObjects(bodies, false)[0];
  if (hit) {
    popBalloon(hit.object.userData.balloon);
    if (IS_TY) track('heart_pop');
  }
}

// ── Buttons ─────────────────────────────────────────────────────
$('openBtn').addEventListener('click', async () => {
  initAudio();
  track('start');
  const gyro = askGyro();
  $('openBtn').disabled = true;
  $('introSub').textContent = 'Opening your gift… 📷';
  const ok = await setMode('room', gyro);
  track(ok ? 'cam_ok' : 'cam_denied');
  if (!ok) place3D();
  updateTools();
  $('intro').classList.add('fade');
  setTimeout(() => { $('intro').hidden = true; }, 650);
  $('mute').hidden = false;
  $('tools').hidden = false;
  reveal();
});

$('mute').addEventListener('click', () => {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.85;
  $('mute').textContent = muted ? '🔇' : '🔊';
});

document.querySelectorAll('.tool[data-mode]').forEach((b) => {
  b.addEventListener('click', () => setMode(b.dataset.mode, b.dataset.mode === 'room' ? askGyro() : null));
});
$('recenter').addEventListener('click', recenter);
$('snapBtn').addEventListener('click', capture);
$('selfieBtn').addEventListener('click', () => {
  const next = mode === 'selfie' ? 'room' : 'selfie';
  setMode(next, next === 'room' ? askGyro() : null);
});
$('replayBtn').addEventListener('click', replay);
$('cardToggle').addEventListener('click', () => $('card').classList.toggle('min'));

$('primaryBtn').addEventListener('click', () => {
  const p = new URLSearchParams();
  p.set('k', 'ty');
  p.set('f', W.to);                            // the viewer becomes the sender
  if (!IS_TY) {
    track('send_back');
    if (W.from) p.set('t', W.from);            // birthday person thanks whoever wished them
    if (W.id) p.set('r', W.id);
  }
  location.href = `${CREATE_URL}#${p.toString()}`;
});
$('makeOwn').addEventListener('click', (e) => {
  if (!IS_TY) return;
  e.preventDefault();
  location.href = `${CREATE_URL}#k=bday`;
});

$('shotShare').addEventListener('click', sharePhoto);
$('shotClose').addEventListener('click', () => { $('shot').hidden = true; });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  renderer.setSize(innerWidth, innerHeight);
  if (mode === '3d') camera.updateProjectionMatrix();
  else placeAR();
  fitVideoBackground();
});

// ── Loop ────────────────────────────────────────────────────────
const clock = new THREE.Clock();
const dummy = new THREE.Object3D();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    if (tw.t < 0) continue;
    const k = clamp01(tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.resolve(); }
  }

  updateMic(dt);

  // Gently turns to show off, but keeps its front toward the viewer.
  hero.rotation.y = Math.sin(t * 0.35) * 0.3;

  if (!IS_TY) {
    let glow = 0;
    for (const f of flames) {
      const { k, seed, base } = f.userData;
      const flick = 1 + Math.sin(t * 19 + seed) * 0.08 + Math.sin(t * 31 + seed * 2) * 0.06;
      const lean = micLevel * 0.06 + Math.sin(t * 3 + seed) * 0.008;
      f.scale.set(Math.max(0.0001, k * (1 - micLevel * 0.3)), Math.max(0.0001, k * flick * (1 - micLevel * 0.35)), Math.max(0.0001, k));
      f.position.set(base.x - lean, base.y, base.z - lean * 0.5);
      if (k < 0.01 && !f.userData.lit) f.visible = false;
      glow += Math.max(0, k) * flick;
    }
    warmLight.intensity = glow * 0.9 * (1 - micLevel * 0.4);
  } else if (ty.opened) {
    ty.heart.rotation.y = Math.sin(t * 0.9) * 0.5;
    if (ty.heart.scale.x > 0.9) ty.heart.scale.setScalar(1 + Math.max(0, Math.sin(t * 5.2)) * 0.05);
    ty.heartGlow.position.copy(ty.heart.position);
    ty.text.position.y = 2.45 + Math.sin(t * 1.2) * 0.04;
  }

  for (const b of balloons) {
    if (!b.visible) continue;
    const u = b.userData;
    if (u.flyV > 0) {                       // released: drift up and away
      u.flyV = Math.min(u.flyV + dt * 0.6, 1.6);
      u.fly += u.flyV * dt;
      if (u.fly > 9) b.visible = false;
    }
    b.position.set(
      u.home.x + Math.sin(t * 0.6 + u.seed) * 0.08 + u.flyX * u.fly,
      THREE.MathUtils.lerp(-4, u.home.y + Math.sin(t * 0.9 + u.seed) * 0.12, u.shown) + u.fly,
      u.home.z + Math.cos(t * 0.5 + u.seed) * 0.08,
    );
    b.rotation.z = Math.sin(t * 0.7 + u.seed) * 0.12;
    if (IS_TY) b.rotation.y = Math.sin(t * 0.8 + u.seed) * 0.6;
  }

  if (floaters && floaters.visible) {
    floatData.forEach((f, i) => {
      f.y += f.v * dt;
      if (f.y > 3.8) { f.y = -0.2; f.a = rand(0, Math.PI * 2); }
      dummy.position.set(Math.sin(f.a + t * 0.1) * f.r, f.y, Math.cos(f.a + t * 0.1) * f.r);
      dummy.rotation.set(0, Math.sin(t + f.seed) * 0.8, Math.sin(t * 1.3 + f.seed) * 0.2);
      dummy.scale.setScalar(Math.max(0.0001, f.s * clamp01(f.y + 0.2) * clamp01((3.8 - f.y) * 1.5)));
      dummy.updateMatrix();
      floaters.setMatrixAt(i, dummy.matrix);
    });
    floaters.instanceMatrix.needsUpdate = true;
  }

  sparkles.rotation.y = t * 0.05;
  sparkles.material.opacity = 0.55 + Math.sin(t * 2.3) * 0.25;

  let anyConf = false;
  for (let i = 0; i < CONF_N; i++) {
    const c = conf[i];
    if (!c.alive) continue;
    anyConf = true;
    c.life += dt;
    c.v.y -= 3.4 * dt;
    c.v.multiplyScalar(1 - 1.6 * dt);
    c.p.addScaledVector(c.v, dt);
    c.p.x += Math.sin(c.life * 6 + i) * 0.004;
    c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; c.r.z += c.w.z * dt;
    const fade = c.p.y < 0 ? Math.max(0, 1 + c.p.y * 2) : 1;
    if (fade <= 0 || c.life > 7) {
      c.alive = false;
      dummy.scale.setScalar(0);
    } else {
      dummy.scale.setScalar(fade);
    }
    dummy.position.copy(c.p);
    dummy.rotation.copy(c.r);
    dummy.updateMatrix();
    confetti.setMatrixAt(i, dummy.matrix);
  }
  if (anyConf) confetti.instanceMatrix.needsUpdate = true;

  smoke.forEach((sm, i) => {
    if (!sm.alive) return;
    sm.life += dt;
    if (sm.life < 0) return;
    const k = sm.life / 1.8;
    if (k >= 1) { sm.alive = false; sm.s.visible = false; return; }
    sm.s.visible = true;
    sm.s.position.y += dt * 0.35;
    sm.s.position.x += dt * sm.drift;
    sm.s.scale.setScalar(0.08 + k * 0.35);
    smokeMats[i].opacity = 0.45 * (1 - k);
  });

  if (mode === 'room' && orientReady) {
    camera.quaternion.copy(baseQ).multiply(startQ.clone().invert().multiply(devQ));
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ── Boot ────────────────────────────────────────────────────────
(async function boot() {
  if (IS_TY) {
    $('introEmoji').textContent = '💌';
    $('introTitle').textContent = W.demo
      ? 'Preview: this is what they will see 💖'
      : `Hey ${W.to}! 💖 ${W.from || 'Someone'} sent you a thank-you gift!`;
  } else {
    $('introTitle').textContent = W.demo
      ? 'Preview: this is what your friend will see ✨'
      : `Hey ${W.to}! 🎉 You've got a birthday surprise!`;
  }
  track('open');
  place3D();
  try {
    await Promise.race([document.fonts.load(`800 100px ${FONT}`), wait(2500)]);
  } catch { /* fall back to system font */ }
  if (IS_TY) { buildGift(); buildFloaters(); } else { buildCake(); }
  buildBalloons();
  requestAnimationFrame(frame);
})();
