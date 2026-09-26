// iNiXR AR Birthday Wish — receiver experience.
// Personal data (names, message) arrives only in the URL #fragment and never reaches the server.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (id) => document.getElementById(id);
const EVT_URL = document.body.dataset.evt;
const CREATE_URL = document.body.dataset.create;
const FONT = '"Baloo Thambi 2", system-ui, sans-serif';

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

const W = readWish() || {
  to: 'Friend', from: 'iNiXR', id: '', demo: true,
  msg: 'Wishing you a year full of smiles, surprises and magic! 🎉',
};

function track(e) {
  if (W.demo || W.preview || !EVT_URL) return;
  const body = JSON.stringify({ e, i: W.id, r: '' });
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

function topperTexture(name) {
  const [c, ctx] = canvas(1024, 512);
  roundRectPath(ctx, 10, 10, 1004, 492, 70);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#fffaf2');
  g.addColorStop(1, '#ffe1ee');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#e8b64c';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e64a8b';
  ctx.font = `700 100px ${FONT}`;
  ctx.fillText('Happy Birthday', 512, 150);

  fitFont(ctx, name, 800, 200, 900);
  ctx.fillStyle = '#5b1a8a';
  ctx.fillText(name, 512, 335);

  ctx.fillStyle = '#e8b64c';
  for (const [x, y, s] of [[90, 110, 26], [935, 110, 26], [110, 410, 18], [915, 410, 18]]) star(ctx, x, y, s);
  return toTexture(c);
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

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 100);
const TARGET = new THREE.Vector3(0, 1.15, 0);
const ELEV = THREE.MathUtils.degToRad(17);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 14;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.52;
controls.target.copy(TARGET);

function framingDistance() {
  const aspect = innerWidth / innerHeight;
  return 5.6 * Math.max(1, 0.72 / aspect);
}
function placeCamera() {
  const d = framingDistance();
  camera.position.set(0, TARGET.y + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
  camera.lookAt(TARGET);
  controls.update();
}
placeCamera();

scene.add(new THREE.HemisphereLight(0xffe9f5, 0x3b1257, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(3, 7, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 });
sun.shadow.bias = -0.0005;
scene.add(sun);

const candleLight = new THREE.PointLight(0xffa64d, 0, 5, 1.6);
candleLight.position.set(0, 2.05, 0.35);
scene.add(candleLight);

// Everything that is "the gift" lives in world (scaled down in room view).
const world = new THREE.Group();
scene.add(world);

const shadowCatcher = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.28 }),
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.receiveShadow = true;
world.add(shadowCatcher);

const GLOW = glowTexture();

// ── Cake ────────────────────────────────────────────────────────
const cake = new THREE.Group();
cake.scale.setScalar(0.0001);
world.add(cake);

const flames = [];

function std(color, rough = 0.55, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

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
  cake.add(shadowed(plate));

  // Tier 1 (pink)
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 72), std(0xff8fb8, 0.6));
  t1.position.y = 0.48;
  cake.add(shadowed(t1));
  cake.add(dripRing(1.1, 0.88, 30, 0xfff4e6, 0.07, 0.1));
  cake.add(beadRing(1.1, 0.13, 40, 0xfff4e6, 0.07));

  const bandMat = new THREE.MeshStandardMaterial({ map: bandTexture(W.to), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.104, 1.104, 0.3, 96, 1, true), bandMat);
  band.position.y = 0.43;
  cake.add(band);

  // Sprinkles on tier-1 ledge
  const sprGeo = new THREE.CapsuleGeometry(0.012, 0.045, 2, 6);
  const sprinkles = new THREE.InstancedMesh(sprGeo, std(0xffffff, 0.4), 90);
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
  cake.add(sprinkles);

  // Tier 2 (cream)
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 64), std(0xfff1dc, 0.6));
  t2.position.y = 1.18;
  cake.add(shadowed(t2));
  cake.add(dripRing(0.75, 1.48, 22, 0xff6fa3, 0.055, 0.08));
  cake.add(beadRing(0.75, 0.92, 30, 0xff8fb8, 0.05));

  // Berries on top
  const berryMat = std(0xd81b60, 0.25, { metalness: 0.05 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), berryMat);
    b.position.set(Math.sin(a) * 0.66, 1.52, Math.cos(a) * 0.66);
    cake.add(shadowed(b));
  }

  // Name topper on gold sticks
  const topper = new THREE.Group();
  topper.position.set(0, 2.24, -0.32);
  topper.scale.setScalar(1.2);
  const tex = topperTexture(W.to);
  const gold = std(0xe8b64c, 0.3, { metalness: 0.8 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.6, 0.02), gold);
  topper.add(shadowed(board));
  for (const side of [1, -1]) {
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.56), mat);
    face.position.z = 0.011 * side;
    if (side < 0) face.rotation.y = Math.PI;
    topper.add(face);
  }
  for (const x of [-0.4, 0.4]) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), gold);
    stick.position.set(x, -0.52, 0);
    topper.add(stick);
  }
  cake.add(topper);

  // Candles in a front arc
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
    cake.add(shadowed(candle));

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), std(0x222222, 0.9));
    wick.position.set(x, 1.48 + h + 0.02, z);
    cake.add(wick);

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
    flame.userData = { lit: true, k: 1, seed: rand(0, 100), base: flame.position.clone() };
    cake.add(flame);
    flames.push(flame);
  }
}

// ── Balloons ────────────────────────────────────────────────────
const balloons = [];
function buildBalloons() {
  const colors = [0xff4d6d, 0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00c49a, 0xf15bb5, 0xfb8500, 0x4d96ff];
  // [angle° (0 = toward viewer), radius, height] — sides and back only, never in front of the name.
  const spots = [[75, 2.2, 2.4], [105, 2.0, 3.0], [140, 2.3, 2.2], [165, 2.0, 3.4], [195, 2.2, 3.0], [220, 2.3, 2.3], [255, 2.0, 2.9], [285, 2.2, 2.5]];
  const geo = new THREE.SphereGeometry(0.3, 32, 24);
  spots.forEach(([deg, r, y], i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: colors[i], roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
    const body = new THREE.Mesh(geo, mat);
    body.scale.set(1, 1.18, 1);
    g.add(shadowed(body));
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 10), mat);
    knot.position.y = -0.37;
    g.add(knot);
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      pts.push(new THREE.Vector3(Math.sin(t * 5 + i) * 0.05, -0.4 - t * 1.5, Math.cos(t * 4 + i) * 0.03));
    }
    const string = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    g.add(string);
    const home = new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    g.position.set(home.x, -4, home.z);
    g.userData = { home, seed: rand(0, 10), shown: 0 };
    world.add(g);
    balloons.push(g);
  });
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
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, map: GLOW, color: 0xffd98a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  world.add(pts);
  return pts;
}

const CONF_N = 420;
const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.055, 0.09), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), CONF_N);
confetti.frustumCulled = false;
const conf = Array.from({ length: CONF_N }, () => ({ alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 }));
{
  const palette = [0xff4d6d, 0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00f5d4, 0xf15bb5, 0xffffff, 0xfb8500];
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
    const up = rand(3.2, 5.2) * power;
    const out = rand(0.6, 2.2) * power;
    c.alive = true;
    c.life = 0;
    c.p.copy(origin).add(new THREE.Vector3(rand(-0.2, 0.2), 0, rand(-0.2, 0.2)));
    c.v.set(Math.cos(a) * out, up, Math.sin(a) * out);
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
  cake.add(s);
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

// ── Audio (all synthesized; Happy Birthday tune is public domain) ─
let actx = null, master = null, noiseBuf = null, muted = false;

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

function tone(f, t, dur, vol, type = 'sine') {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function musicBox(f, t, dur, vol = 0.22) {
  tone(f, t, Math.max(0.6, dur * 1.5), vol, 'sine');
  tone(f * 2, t, 0.5, vol * 0.25, 'triangle');
  tone(f * 3, t, 0.18, vol * 0.08, 'sine');
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
    ['E6', 'G6', 'C7', 'E7'].forEach((n, i) => tone(freq(n), t + i * 0.07, 0.5, 0.06, 'sine'));
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
  tada() {
    if (!actx) return;
    const t = actx.currentTime;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => musicBox(freq(n), t + i * 0.09, 0.4, 0.16));
    ['C5', 'E5', 'G5', 'C6'].forEach((n) => musicBox(freq(n), t + 0.42, 1.2, 0.1));
  },
};

// Melody: [note, beats, bass]
const SONG = [
  [['G4', 0.75], ['G4', 0.25], ['A4', 1, 'C3'], ['G4', 1], ['C5', 1], ['B4', 2, 'G2']],
  [['G4', 0.75], ['G4', 0.25], ['A4', 1, 'G2'], ['G4', 1], ['D5', 1], ['C5', 2, 'C3']],
  [['G4', 0.75], ['G4', 0.25], ['G5', 1, 'C3'], ['E5', 1], ['C5', 1], ['B4', 1, 'F2'], ['A4', 2]],
  [['F5', 0.75], ['F5', 0.25], ['E5', 1, 'C3'], ['C5', 1], ['D5', 1, 'G2'], ['C5', 3, 'C3']],
];
const LYRICS = [
  'Happy birthday to you 🎵',
  'Happy birthday to you 🎶',
  `Happy birthday dear ${W.to} 💖`,
  'Happy birthday to you! 🎉',
];
const BEAT = 0.52;
let songTimers = [];

function playSong() {
  return new Promise((resolve) => {
    songTimers.forEach(clearTimeout);
    songTimers = [];
    const start = actx ? actx.currentTime + 0.15 : 0;
    let beat = 0;
    SONG.forEach((line, li) => {
      songTimers.push(setTimeout(() => showLyric(LYRICS[li]), beat * BEAT * 1000 + 100));
      for (const [n, b, bass] of line) {
        if (actx) {
          const t = start + beat * BEAT;
          musicBox(freq(n), t, b * BEAT);
          if (bass) {
            tone(freq(bass), t, b * BEAT * 2.2, 0.1, 'triangle');
            tone(freq(bass) * 1.5, t, b * BEAT * 2, 0.05, 'triangle');
          }
        }
        beat += b;
      }
    });
    songTimers.push(setTimeout(() => { hideLyric(); resolve(); }, beat * BEAT * 1000 + 700));
  });
}

function showLyric(text) {
  const el = $('lyric');
  el.classList.remove('show');
  requestAnimationFrame(() => { el.textContent = text; el.classList.add('show'); });
}
function hideLyric() { $('lyric').classList.remove('show'); }

// ── Tweens ──────────────────────────────────────────────────────
const tweens = [];
function tween(dur, fn, delay = 0) {
  return new Promise((resolve) => tweens.push({ t: -delay, dur, fn, resolve }));
}

// ── Candles ─────────────────────────────────────────────────────
let micLevel = 0;
const litCount = () => flames.filter((f) => f.userData.lit).length;

function extinguish(f) {
  if (!f.userData.lit) return;
  f.userData.lit = false;
  tween(0.25, (k) => { f.userData.k = 1 - k; });
  puffSmoke(f.userData.base.clone().add(new THREE.Vector3(0, 0.02, 0)));
}

function relightAll() {
  flames.forEach((f, i) => {
    f.userData.lit = true;
    tween(0.35, (k) => { f.userData.k = k; }, i * 0.12);
  });
}

// ── Mic blow detection ──────────────────────────────────────────
let mic = null;   // { stream, analyser, buf, floor, calib, accum }
let blowing = false;

async function startMic() {
  $('micBtn').disabled = true;
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
    $('hintText').textContent = 'Now blow! 🌬️ (close to the mic)';
    $('meter').classList.add('on');
    $('micBtn').hidden = true;
  } catch {
    track('mic_denied');
    $('hintText').textContent = 'No mic? No problem — tap to blow! 🌬️';
    $('micBtn').hidden = true;
    $('tapBtn').classList.replace('link-btn', 'big-btn');
  }
}

function stopMic() {
  if (mic) mic.stream.getTracks().forEach((t) => t.stop());
  mic = null;
  $('meter').classList.remove('on');
}

function updateMic(dt) {
  if (!mic || !blowing) return;
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

// ── Room view (camera + gyro "magic window") ────────────────────
// The camera feed is drawn as the 3D scene's background (not a <video> behind the canvas),
// so the cake is always composited on top — some Android phones put <video> above WebGL.
const ROOM_SCALE = 0.38;
const video = $('cam');
let camStream = null;
let videoTex = null;
let saved = null;
let inRoom = false;
const roomTarget = new THREE.Vector3();
const devQ = new THREE.Quaternion(), startQ = new THREE.Quaternion(), baseQ = new THREE.Quaternion();
let orientReady = false, orientStarted = false, gyroTimer = 0;

const _e = new THREE.Euler(), _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _z = new THREE.Vector3(0, 0, 1);
function onOrient(ev) {
  if (ev.alpha == null || ev.beta == null) return;
  const d = THREE.MathUtils.degToRad;
  const orient = d((screen.orientation && screen.orientation.angle) || window.orientation || 0);
  _e.set(d(ev.beta), d(ev.alpha), -d(ev.gamma), 'YXZ');
  devQ.setFromEuler(_e).multiply(_q1).multiply(_q0.setFromAxisAngle(_z, -orient));
  if (!orientStarted) { startQ.copy(devQ); orientStarted = true; }
  if (!orientReady) {
    orientReady = true;
    controls.enabled = false;        // gyro takes over from finger-drag
    $('roomTip').textContent = 'Move your phone slowly to look around 📱';
  }
}

function fitVideoBackground() {
  if (!videoTex || !video.videoWidth) return;
  const va = video.videoWidth / video.videoHeight;
  const sa = innerWidth / innerHeight;
  if (sa < va) {
    const r = sa / va;
    videoTex.repeat.set(r, 1);
    videoTex.offset.set((1 - r) / 2, 0);
  } else {
    const r = va / sa;
    videoTex.repeat.set(1, r);
    videoTex.offset.set(0, (1 - r) / 2);
  }
}

// Phone cameras see ~60° vertically in portrait; matching it keeps the cake "anchored" as you turn.
const ROOM_FOV = 62, VIEW_FOV = 40;
function placeRoomCamera() {
  camera.fov = ROOM_FOV;
  camera.updateProjectionMatrix();
  const fovRatio = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV / 2)) / Math.tan(THREE.MathUtils.degToRad(ROOM_FOV / 2));
  const d = framingDistance() * ROOM_SCALE * fovRatio * 1.15;
  const elev = THREE.MathUtils.degToRad(24);
  roomTarget.set(0, 1.0 * ROOM_SCALE, 0);
  camera.position.set(0, roomTarget.y + Math.sin(elev) * d, Math.cos(elev) * d);
  camera.lookAt(roomTarget);
  baseQ.copy(camera.quaternion);
  controls.target.copy(roomTarget);
  controls.minDistance = d * 0.5;
  controls.maxDistance = d * 2.2;
  controls.update();
}

function recenter() {
  orientStarted = false;             // next gyro reading becomes "straight ahead"
  placeRoomCamera();
}

async function enterRoom() {
  track('room');
  // iOS asks for motion permission; it must be requested inside the tap, before any await.
  const gyroAsk = (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')
    ? DeviceOrientationEvent.requestPermission().catch(() => 'denied')
    : Promise.resolve('granted');
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  } catch {
    $('roomBtn').textContent = '📷 Camera not allowed';
    return;
  }
  await gyroAsk;
  video.srcObject = camStream;
  try { await video.play(); } catch { /* muted inline video should play */ }

  videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = videoTex;
  video.onloadedmetadata = fitVideoBackground;
  fitVideoBackground();

  inRoom = true;
  document.body.classList.add('room');
  $('card').hidden = true;
  $('roomBar').hidden = false;
  $('roomTip').textContent = 'Drag to look around the cake 👆';

  saved = { pos: camera.position.clone(), q: camera.quaternion.clone() };
  world.scale.setScalar(ROOM_SCALE);
  placeRoomCamera();
  controls.enabled = true;           // finger-drag until the gyro reports in
  orientStarted = false;
  orientReady = false;
  window.addEventListener('deviceorientation', onOrient);
}

function exitRoom() {
  inRoom = false;
  window.removeEventListener('deviceorientation', onOrient);
  if (camStream) camStream.getTracks().forEach((t) => t.stop());
  camStream = null;
  video.srcObject = null;
  scene.background = null;
  if (videoTex) videoTex.dispose();
  videoTex = null;
  document.body.classList.remove('room');
  world.scale.setScalar(1);
  camera.fov = VIEW_FOV;
  camera.updateProjectionMatrix();
  controls.target.copy(TARGET);
  controls.minDistance = 3;
  controls.maxDistance = 14;
  if (saved) { camera.position.copy(saved.pos); camera.quaternion.copy(saved.q); }
  controls.enabled = true;
  controls.update();
  $('roomBar').hidden = true;
  $('card').hidden = false;
}

// ── Flow ────────────────────────────────────────────────────────
let celebrated = false;

async function reveal() {
  sfx.sparkle();
  burstConfetti(60, new THREE.Vector3(0, 0.3, 0), 0.8);
  sfx.pop(0.05);
  tween(1.4, (k) => cake.scale.setScalar(Math.max(0.0001, easeOutBack(k))));
  balloons.forEach((b, i) => tween(2.2, (k) => { b.userData.shown = easeOutCubic(k); }, 0.3 + i * 0.12));
  await wait(1700);
  await singAndPrompt();
}

async function singAndPrompt() {
  celebrated = false;
  await playSong();
  track('song_done');
  $('hintText').textContent = 'Make a wish… and blow out the candles! 🌬️';
  $('micBtn').hidden = false;
  $('micBtn').disabled = false;
  $('tapBtn').className = 'link-btn';
  $('hint').hidden = false;
  blowing = true;
}

async function celebrate() {
  if (celebrated) return;
  celebrated = true;
  blowing = false;
  stopMic();
  flames.forEach(extinguish);
  $('hint').hidden = true;
  track('blown');

  await wait(350);
  sfx.tada();
  const top = new THREE.Vector3(0, 1.6, 0);
  burstConfetti(160, top, 1.1);
  [0, 0.25, 0.5].forEach((d) => sfx.pop(d));
  setTimeout(() => { burstConfetti(110, new THREE.Vector3(-1.2, 0.2, 0.6), 1); sfx.pop(); }, 450);
  setTimeout(() => { burstConfetti(110, new THREE.Vector3(1.2, 0.2, 0.6), 1); sfx.pop(); }, 750);
  tween(0.6, (k) => cake.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.08));
  showLyric(`🎉 Happy Birthday, ${W.to}! 🎉`);

  await wait(2200);
  hideLyric();
  $('cardTo').textContent = `Dear ${W.to},`;
  $('cardMsg').textContent = W.msg || 'Happy Birthday! 🎂';
  $('cardFrom').textContent = W.from ? `— with love, ${W.from}` : '';
  $('card').hidden = false;
}

$('openBtn').addEventListener('click', () => {
  initAudio();
  track('start');
  $('intro').classList.add('fade');
  setTimeout(() => { $('intro').hidden = true; }, 650);
  $('mute').hidden = false;
  reveal();
});

$('mute').addEventListener('click', () => {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.85;
  $('mute').textContent = muted ? '🔇' : '🔊';
});

$('micBtn').addEventListener('click', startMic);
$('tapBtn').addEventListener('click', () => {
  if (!blowing) return;
  sfx.whoosh();
  flames.forEach((f, i) => setTimeout(() => extinguish(f), i * 110));
  setTimeout(celebrate, flames.length * 110 + 150);
});

$('sendBack').addEventListener('click', () => {
  track('send_back');
  const p = new URLSearchParams();
  p.set('f', W.to);
  if (W.from) p.set('t', W.from);
  if (W.id) p.set('r', W.id);
  location.href = `${CREATE_URL}#${p.toString()}`;
});

$('replayBtn').addEventListener('click', async () => {
  track('replay');
  $('card').hidden = true;
  relightAll();
  await wait(500);
  singAndPrompt();
});

$('roomBtn').addEventListener('click', enterRoom);
$('exitRoom').addEventListener('click', exitRoom);
$('recenter').addEventListener('click', recenter);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  fitVideoBackground();
});

// ── Loop ────────────────────────────────────────────────────────
const clock = new THREE.Clock();
const dummy = new THREE.Object3D();
let sparkles;

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

  // Cake gently turns to show off, but keeps its front toward the viewer.
  cake.rotation.y = Math.sin(t * 0.35) * 0.32;

  let glow = 0;
  for (const f of flames) {
    const { k, seed, base } = f.userData;
    const flick = 1 + Math.sin(t * 19 + seed) * 0.08 + Math.sin(t * 31 + seed * 2) * 0.06;
    const lean = micLevel * 0.06 + Math.sin(t * 3 + seed) * 0.008;
    f.scale.set(k * (1 - micLevel * 0.3), k * flick * (1 - micLevel * 0.35), k);
    f.position.set(base.x - lean, base.y, base.z - lean * 0.5);
    f.visible = k > 0.01;
    glow += k * flick;
  }
  candleLight.intensity = glow * 0.9 * (1 - micLevel * 0.4);

  for (const b of balloons) {
    const { home, seed, shown } = b.userData;
    b.position.set(
      home.x + Math.sin(t * 0.6 + seed) * 0.08,
      THREE.MathUtils.lerp(-4, home.y + Math.sin(t * 0.9 + seed) * 0.12, shown),
      home.z + Math.cos(t * 0.5 + seed) * 0.08,
    );
    b.rotation.z = Math.sin(t * 0.7 + seed) * 0.12;
  }

  if (sparkles) {
    sparkles.rotation.y = t * 0.05;
    sparkles.material.opacity = 0.55 + Math.sin(t * 2.3) * 0.25;
  }

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

  if (inRoom && orientReady) {
    camera.quaternion.copy(baseQ).multiply(startQ.clone().invert().multiply(devQ));
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ── Boot ────────────────────────────────────────────────────────
(async function boot() {
  $('introTitle').textContent = W.demo
    ? 'Preview: this is what your friend will see ✨'
    : `Hey ${W.to}! 🎉 You've got a birthday surprise!`;
  track('open');
  try {
    await Promise.race([document.fonts.load(`800 100px ${FONT}`), wait(2500)]);
  } catch { /* fall back to system font */ }
  buildCake();
  buildBalloons();
  sparkles = buildSparkles();
  requestAnimationFrame(frame);
})();
