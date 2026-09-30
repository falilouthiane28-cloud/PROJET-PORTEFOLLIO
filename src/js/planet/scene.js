// Scène de la planète : sphère nacrée + anneau violet lumineux + poussière d'anneau.
// Entièrement procédurale : aucun modèle ni texture à télécharger.
// Partagée par le worker (OffscreenCanvas), le repli sur le thread principal et l'outil qui génère le poster.
import {
  Scene, PerspectiveCamera, Group, Mesh, Points, SphereGeometry, RingGeometry, BufferGeometry,
  Float32BufferAttribute, MeshPhysicalMaterial, ShaderMaterial, DataTexture, RGBAFormat,
  SRGBColorSpace, LinearFilter, ClampToEdgeWrapping, Color, DirectionalLight, HemisphereLight,
  PMREMGenerator, NormalBlending, DoubleSide, MathUtils
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Pose de repos : identique pour le poster et pour la première image 3D (fondu enchaîné sans saut).
export const POSE = { tiltX: 0.36, tiltZ: -0.24, spinY: 0.35 };
// Largeur « utile » de l'objet (anneau + poussière) en unités de scène, pour le cadrage.
const OBJECT_WIDTH = 5.2;

// Bandes de latitude très douces : blanc nacré, gris perle, lilas pâle. Aucune autre teinte.
function bandTexture() {
  const h = 256, data = new Uint8Array(4 * h);
  const pearl = [246, 243, 252], shade = [223, 216, 238], lilac = [226, 214, 255];
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const n = 0.5 + 0.5 * Math.sin(v * 38 + Math.sin(v * 9) * 2.2) * Math.sin(v * 17 + 1.3);
    const polar = Math.pow(Math.abs(v - 0.5) * 2, 3);
    const k = 0.42 * n + 0.45 * polar;
    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    const base = [0, 1, 2].map(i => mix(pearl[i], shade[i], k));
    const tint = 0.18 * (0.5 + 0.5 * Math.sin(v * 23 + 0.7));
    for (let i = 0; i < 3; i++) data[4 * y + i] = mix(base[i], lilac[i], tint);
    data[4 * y + 3] = 255;
  }
  const t = new DataTexture(data, 1, h, RGBAFormat);
  t.colorSpace = SRGBColorSpace;
  t.magFilter = t.minFilter = LinearFilter;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

const ringVertex = /* glsl */`
  varying vec2 vPos;
  void main(){
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const ringFragment = /* glsl */`
  uniform float uInner, uOuter, uPhase, uOpacity;
  uniform vec3 uDeep, uBright;
  varying vec2 vPos;
  void main(){
    float r = length(vPos);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
    float a = atan(vPos.y, vPos.x);
    // anneaux fins : plusieurs fréquences, légère irrégularité angulaire qui rend la rotation visible
    float bands = 0.55 + 0.25 * sin(t * 71.0 + sin(t * 11.0) * 2.4) + 0.2 * sin(t * 173.0 + 1.7);
    bands *= 0.9 + 0.1 * sin(a * 5.0 + uPhase * 1.3 + t * 9.0);
    float cassini = 1.0 - 0.88 * exp(-pow((t - 0.63) / 0.022, 2.0));
    float edge = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.86, t);
    float alpha = edge * cassini * clamp(bands, 0.0, 1.0) * uOpacity;
    // lumineux au bord intérieur, violet profond vers l'extérieur
    vec3 col = mix(uBright, uDeep, smoothstep(0.05, 0.75, t));
    col += 0.18 * (1.0 - t) * uBright;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

const dustVertex = /* glsl */`
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio, uScale;
  varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * uScale / -mv.z;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * mv;
  }`;
const dustFragment = /* glsl */`
  uniform vec3 uColor;
  varying float vAlpha;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float soft = smoothstep(0.5, 0.0, d);   // bords doux : les gros grains paraissent hors mise au point
    gl_FragColor = vec4(uColor, soft * vAlpha);
    #include <colorspace_fragment>
  }`;

function dustGeometry(count, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pos = [], size = [], alpha = [];
  for (let i = 0; i < count; i++) {
    const r = 1.4 + Math.pow(rnd(), 0.7) * 1.2;
    const a = rnd() * Math.PI * 2;
    pos.push(Math.cos(a) * r, Math.sin(a) * r, (rnd() - 0.5) * 0.08);
    const big = rnd() < 0.06;                // quelques grains proches, flous : profondeur de champ
    size.push(big ? 0.1 + rnd() * 0.12 : 0.012 + rnd() * 0.022);   // taille en unités de scène
    alpha.push(big ? 0.08 + rnd() * 0.1 : 0.25 + rnd() * 0.5);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aSize', new Float32BufferAttribute(size, 1));
  g.setAttribute('aAlpha', new Float32BufferAttribute(alpha, 1));
  return g;
}

/**
 * Construit la scène.
 * @param renderer WebGLRenderer déjà créé (sert à préparer l'environnement PMREM)
 * @param opts { segments, dust }
 */
export function createPlanet(renderer, { segments = 96, dust = 700 } = {}) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(26, 2, 0.1, 100);

  // éclairage studio : environnement généré (zéro téléchargement) + une lumière clé douce
  const pmrem = new PMREMGenerator(renderer);
  // environnement minuscule (64 px) : des reflets doux n'ont pas besoin de plus, et la génération est bien plus rapide
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 64 });
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.42;      // (envMapIntensity du matériau ne s'applique plus à scene.environment)
  pmrem.dispose();
  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(-7, 4.5, 0.5);        // lumière rasante : vrai dégradé jour / nuit
  const fill = new HemisphereLight(0xffffff, 0xb9a6e8, 0.3);
  // lumière de rebond lilas venant de l'anneau : la face à l'ombre reste nacrée, jamais grise
  const bounce = new DirectionalLight(0xc4b0ff, 1.1);
  bounce.position.set(4, -3, 2);
  scene.add(key, fill, bounce);

  const root = new Group();            // pointeur + scroll
  const tilt = new Group();            // inclinaison de l'axe
  tilt.rotation.set(POSE.tiltX, 0, POSE.tiltZ);
  root.add(tilt);
  scene.add(root);

  // la planète : céramique nacrée (vernis + reflet satiné), sans transmission (trop coûteuse)
  const bands = bandTexture();
  const sphereGeo = new SphereGeometry(1, segments, Math.round(segments * 0.66));
  const pearl = new MeshPhysicalMaterial({
    color: 0xffffff, map: bands, roughness: 0.38, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.14,
    sheen: 0.55, sheenColor: new Color(0xdccfff), sheenRoughness: 0.5
  });
  const planet = new Mesh(sphereGeo, pearl);
  planet.rotation.y = POSE.spinY;
  tilt.add(planet);

  // l'anneau : un seul maillage plan, motif calculé dans le shader
  const INNER = 1.38, OUTER = 2.3;
  const ringGeo = new RingGeometry(INNER, OUTER, 192, 1);
  const ringMat = new ShaderMaterial({
    uniforms: {
      uInner: { value: INNER }, uOuter: { value: OUTER }, uPhase: { value: 0 }, uOpacity: { value: 0.92 },
      uDeep: { value: new Color(0x5b21e6) }, uBright: { value: new Color(0xb9a2ff) }
    },
    vertexShader: ringVertex, fragmentShader: ringFragment,
    transparent: true, depthWrite: false, side: DoubleSide, blending: NormalBlending
  });
  const ring = new Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 1;
  tilt.add(ring);

  // poussière de l'anneau (nombre ajustable par la qualité adaptative)
  const dustGeo = dustGeometry(900);
  const dustMat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color(0x7a4dff) }, uPixelRatio: { value: 1 }, uScale: { value: 1 } },
    vertexShader: dustVertex, fragmentShader: dustFragment,
    transparent: true, depthWrite: false, blending: NormalBlending
  });
  const dustPts = new Points(dustGeo, dustMat);
  dustPts.rotation.x = -Math.PI / 2;
  dustPts.renderOrder = 2;
  tilt.add(dustPts);
  dustGeo.setDrawRange(0, dust);

  const state = { spin: 0, ringPhase: 0, px: 0, py: 0, scroll: 0, vel: 0, tpx: 0, tpy: 0, tscroll: 0, tvel: 0 };
  let baseDistance = 10;

  // cadrage : l'objet occupe une part fixe de la largeur, quel que soit le format du cadre
  function resize(width, height, pixelRatio, fill) {
    camera.aspect = width / height;
    const hfov = 2 * Math.atan(Math.tan(MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
    baseDistance = (OBJECT_WIDTH / 2) / Math.tan(hfov / 2) / fill;
    camera.position.set(0, baseDistance * 0.08, baseDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    dustMat.uniforms.uPixelRatio.value = pixelRatio;
    // pixels par unité de scène à distance 1 : la poussière garde sa taille réelle quel que soit l'écran
    dustMat.uniforms.uScale.value = height / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
  }

  // dt en secondes ; les cibles (pointeur, scroll, vitesse) sont lissées ici, à chaque image
  function update(dt) {
    const k = 1 - Math.exp(-dt * 4);           // lissage indépendant de la fréquence d'affichage
    state.px += (state.tpx - state.px) * k;
    state.py += (state.tpy - state.py) * k;
    state.scroll += (state.tscroll - state.scroll) * (1 - Math.exp(-dt * 6));
    state.vel += (state.tvel - state.vel) * (1 - Math.exp(-dt * 3));
    const boost = 1 + Math.min(4, Math.abs(state.vel) / 900);    // l'anneau accélère avec le scroll
    state.spin += dt * 0.12;
    state.ringPhase += dt * 0.35 * boost;
    planet.rotation.y = POSE.spinY + state.spin + state.scroll * 1.2;
    ringMat.uniforms.uPhase.value = state.ringPhase;
    dustPts.rotation.z = state.ringPhase * 0.08;
    root.rotation.y = state.px * 0.22;
    root.rotation.x = state.py * 0.12 + state.scroll * 0.35;
    const z = baseDistance * (1 - state.scroll * 0.14);          // léger zoom au scroll
    camera.position.set(0, baseDistance * 0.08 + state.scroll * 0.4, z);
    camera.lookAt(0, 0, 0);
  }

  function setDust(n) { dustGeo.setDrawRange(0, Math.max(0, Math.min(900, n))); }

  function dispose() {
    sphereGeo.dispose(); ringGeo.dispose(); dustGeo.dispose();
    pearl.dispose(); ringMat.dispose(); dustMat.dispose();
    bands.dispose(); envRT.dispose();
    scene.clear();
  }

  return { scene, camera, state, resize, update, setDust, dispose };
}
