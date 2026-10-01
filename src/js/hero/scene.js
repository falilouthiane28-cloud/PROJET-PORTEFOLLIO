// Scène du hero : Saturne, son anneau de particules et les 4 mondes (les projets) qui s'alignent.
// Même code de dessin que le canvas d'origine (cosmos.js), sans aucun accès au DOM : il tourne
// dans un worker (OffscreenCanvas), sur le thread principal, et dans l'outil qui génère le poster.

export const TAU = Math.PI * 2;
export const E = 0.26;          // aplatissement du plan orbital
export const TILT = 0.16;       // inclinaison : l'alignement monte vers la gauche
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const smooth = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// Les 4 mondes : couleur claire, couleur de base, ombre
export const PLANETS = [
  { f: 2.05, size: 0.25, base: 0.6, hi: '#d9d2ff', mid: '#7c5cff', lo: '#1c1147' },  // DakarHouse
  { f: 2.85, size: 0.21, base: 3.4, hi: '#ffffff', mid: '#b9bbc6', lo: '#2a2b33' },  // iStore Tech
  { f: 3.75, size: 0.30, base: 5.1, hi: '#fbd5ff', mid: '#d946ef', lo: '#3b0a45', ring: true }, // Saturn Agents
  { f: 4.65, size: 0.24, base: 1.9, hi: '#ffc9c9', mid: '#dc2626', lo: '#2a0707' }   // Teranga
];

// Mise en page (identique à l'origine) : centre de Saturne et rayon de référence selon le cadre
export function layoutFor(W, H) {
  const wide = W / H > 1.05;
  return {
    cx: W * (wide ? 0.70 : 0.68),
    cy: H * (wide ? 0.40 : 0.50),
    R: Math.min(W * (wide ? 0.105 : 0.1), H * 0.15)
  };
}

// alignement du monde i selon la progression du scroll
export const align = (i, p) => { const s = 0.34 + i * 0.07; return smooth(p, s, s + 0.07); };
// grossissement léger de Saturne au fil du parcours
export const scaleAt = p => 1 + 0.06 * smooth(p, 0.3, 1);

// projection d'un point du plan orbital vers l'écran
export function project(cx, cy, rad, ang) {
  const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad * E;
  const c = Math.cos(TILT), s = Math.sin(TILT);
  return [cx + x * c - y * s, cy + x * s + y * c, Math.sin(ang)];
}

function buildParticles(n) {
  const r = rng(7);
  const cols = ['#c4b5fd', '#a78bfa', '#8b5cf6', '#ddd6fe', '#f0abfc', '#ffffff'];
  const out = [];
  while (out.length < n) {
    const rr = 1.32 + Math.pow(r(), 0.8) * 0.9;           // de 1.32R à 2.22R
    if (rr > 1.76 && rr < 1.83) continue;                  // division de Cassini
    const c = r();
    out.push({
      r: rr, a: r() * TAU, w: 0.09 * Math.pow(1.32 / rr, 1.5),
      s: 0.7 + r() * 1.5, o: 0.3 + r() * 0.7,
      c: c < 0.05 ? cols[5] : c < 0.12 ? cols[4] : cols[Math.floor(r() * 4)]
    });
  }
  return out;
}

/**
 * @param o { W, H, particles }
 * Le nombre de particules suit l'ordre fixe du générateur : en réduire le nombre garde les mêmes premières.
 */
export function createScene({ W, H, particles = 2800 }) {
  const all = buildParticles(2800);
  const r = rng(20240914);
  const stars = Array.from({ length: 260 }, () => ({
    x: r(), y: r(), s: 0.3 + r() * 1.1, a: 0.25 + r() * 0.6, tw: 0.4 + r() * 1.6, ph: r() * TAU, d: 0.3 + r() * 0.7
  }));

  const S = {
    W, H, cx: 0, cy: 0, R: 0,
    p: 0, time: 0, ringTime: 0, ox: 0, oy: 0, boost: 0, isStatic: false,
    phi: PLANETS.map(pl => pl.base), lock: PLANETS.map(() => null),
    count: particles,

    resize(w, h) {
      this.W = w; this.H = h;
      Object.assign(this, layoutFor(w, h));
    },
    setParticles(n) { this.count = Math.max(0, Math.min(all.length, n)); },
    // état aligné et figé (hero statique sur mobile, mouvement réduit)
    setStatic() { this.isStatic = true; this.p = 1; this.phi = PLANETS.map(() => Math.PI); },

    // dt en secondes ; input = { p, vel, ox, oy } déjà lissés par le thread principal (sauf vel)
    step(dt, input) {
      this.time += dt;
      this.p = input.p;
      this.ox = input.ox; this.oy = input.oy;
      // l'anneau tourne plus vite quand on scrolle vite, puis revient en douceur
      const target = Math.min(3, Math.abs(input.vel || 0) / 1200);
      this.boost += (target - this.boost) * (1 - Math.exp(-dt * 4));
      this.ringTime += dt * (1 + this.boost);
      // orbites : libres, puis verrouillées sur l'alignement (logique d'origine)
      PLANETS.forEach((pl, i) => {
        const a = align(i, this.p);
        const w = 0.16 * Math.pow(2.05 / pl.f, 1.5);
        if (a <= 0.0005) { this.lock[i] = null; this.phi[i] += w * dt; return; }
        if (this.lock[i] === null) this.lock[i] = Math.PI + TAU * Math.ceil((this.phi[i] - Math.PI) / TAU);
        this.phi[i] += w * dt * (1 - a);
        this.phi[i] += (this.lock[i] - this.phi[i]) * (1 - Math.exp(-dt * 7 * a));
      });
    },

    draw(ctx, { drawStars = true } = {}) {
      const { W, H, R } = this;
      const cx = this.cx + this.ox, cy = this.cy + this.oy;      // parallaxe du pointeur
      const p = this.p, t = this.time;
      ctx.clearRect(0, 0, W, H);

      // étoiles, légère parallaxe au scroll (et à l'opposé du pointeur : profondeur)
      if (drawStars) {
        ctx.fillStyle = '#e9e4ff';
        for (const s of stars) {
          const tw = this.isStatic ? 1 : 0.75 + 0.25 * Math.sin(t * s.tw + s.ph);
          ctx.globalAlpha = s.a * tw;
          const y = ((s.y * H - p * 60 * s.d - this.oy * 0.3 * s.d) % H + H) % H;
          ctx.fillRect(s.x * W - this.ox * 0.3 * s.d, y, s.s, s.s);
        }
        ctx.globalAlpha = 1;
      }

      // pulsation quand le dernier monde s'aligne
      const pulse = Math.exp(-Math.pow((p - 0.66) / 0.035, 2));
      const Rs = R * scaleAt(p);

      // halo
      const g = ctx.createRadialGradient(cx, cy, Rs * 0.6, cx, cy, Rs * (3.4 + pulse));
      g.addColorStop(0, `rgba(124,58,237,${0.30 + 0.25 * pulse})`);
      g.addColorStop(0.45, `rgba(91,33,182,${0.10 + 0.1 * pulse})`);
      g.addColorStop(1, 'rgba(11,10,18,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // orbites des mondes (traits fins)
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(TILT);
      ctx.lineWidth = 1;
      PLANETS.forEach((pl, i) => {
        ctx.strokeStyle = `rgba(200,190,255,${0.07 + 0.05 * align(i, p)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, pl.f * Rs, pl.f * Rs * E, 0, 0, TAU);
        ctx.stroke();
      });
      // l'axe d'alignement
      const all4 = Math.min(...PLANETS.map((_, i) => align(i, p)));
      if (all4 > 0.01) {
        const lg = ctx.createLinearGradient(-PLANETS[3].f * Rs * 1.12, 0, -Rs, 0);
        lg.addColorStop(0, 'rgba(167,139,250,0)');
        lg.addColorStop(1, `rgba(167,139,250,${0.45 * all4})`);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-PLANETS[3].f * Rs * 1.12, 0); ctx.lineTo(-Rs * 1.05, 0); ctx.stroke();
      }
      ctx.restore();

      // mondes derrière Saturne
      const worlds = PLANETS.map((pl, i) => {
        const [x, y, depth] = project(cx, cy, pl.f * Rs, this.phi[i]);
        return { pl, x, y, depth };
      });
      for (const w of worlds) if (w.depth < 0) planet(ctx, w, Rs, cx, cy);

      // anneau : moitié arrière
      ring(ctx, this, cx, cy, Rs, pulse, false);

      // corps de Saturne
      const body = ctx.createRadialGradient(cx - Rs * 0.38, cy - Rs * 0.42, Rs * 0.05, cx, cy, Rs);
      body.addColorStop(0, '#4a4658');
      body.addColorStop(0.35, '#1f1c2b');
      body.addColorStop(0.8, '#0a0910');
      body.addColorStop(1, '#050409');
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, Rs, 0, TAU); ctx.fill();
      // bandes nuageuses
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, Rs, 0, TAU); ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(TILT);
      for (let b = -3; b <= 3; b++) {
        ctx.fillStyle = `rgba(167,139,250,${0.018 + (b % 2 ? 0.012 : 0)})`;
        ctx.fillRect(-Rs, b * Rs * 0.24 - Rs * 0.05, Rs * 2, Rs * 0.1);
      }
      ctx.restore();
      // liseré de lumière violette
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, Rs - 0.5, 0, TAU);
      const rim = ctx.createLinearGradient(cx - Rs, cy - Rs, cx + Rs, cy + Rs);
      rim.addColorStop(0, 'rgba(167,139,250,0)');
      rim.addColorStop(0.7, `rgba(167,139,250,${0.35 + 0.3 * pulse})`);
      rim.addColorStop(1, `rgba(221,214,254,${0.6 + 0.3 * pulse})`);
      ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();

      // anneau : moitié avant
      ring(ctx, this, cx, cy, Rs, pulse, true);

      // mondes devant
      for (const w of worlds) if (w.depth >= 0) planet(ctx, w, Rs, cx, cy);
    }
  };

  function ring(ctx, sc, cx, cy, Rs, pulse, front) {
    const boost = 1 + 0.6 * pulse;
    const c = Math.cos(TILT), s = Math.sin(TILT);
    // voile continu de l'anneau, sous les particules
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(TILT);
    ctx.lineWidth = 0.04 * Rs;
    ctx.strokeStyle = `rgba(167,139,250,${(front ? 0.075 : 0.04) * boost})`;
    for (let rr = 1.34; rr < 2.22; rr += 0.04) {
      if (rr > 1.76 && rr < 1.83) continue;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr * Rs, rr * Rs * E, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
      ctx.stroke();
    }
    ctx.restore();
    const t = sc.ringTime, n = sc.count;
    for (let i = 0; i < n; i++) {
      const q = all[i];
      const ang = q.a + q.w * t;
      const sn = Math.sin(ang);
      if ((sn >= 0) !== front) continue;
      const x = Math.cos(ang) * q.r * Rs, y = sn * q.r * Rs * E;
      ctx.globalAlpha = Math.min(1, q.o * boost * (front ? 1 : 0.55));
      ctx.fillStyle = q.c;
      ctx.fillRect(cx + x * c - y * s, cy + x * s + y * c, q.s, q.s);
    }
    ctx.globalAlpha = 1;
  }

  function planet(ctx, w, Rs, cx, cy) {
    const { pl, x, y, depth } = w;
    const r = Rs * pl.size * (1 + 0.14 * depth);
    ctx.globalAlpha = 0.55 + 0.45 * (depth + 1) / 2;
    const glow = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 2.2);
    glow.addColorStop(0, pl.mid + '30');
    glow.addColorStop(1, pl.mid + '00');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
    if (pl.ring) miniRing(ctx, x, y, r, false);
    // sphère éclairée depuis Saturne
    const lx = cx - x, ly = cy - y, ll = Math.hypot(lx, ly) || 1;
    const gx = x + (lx / ll) * r * 0.45, gy = y + (ly / ll) * r * 0.45 - r * 0.2;
    const g = ctx.createRadialGradient(gx, gy, r * 0.05, x, y, r);
    g.addColorStop(0, pl.hi);
    g.addColorStop(0.45, pl.mid);
    g.addColorStop(1, pl.lo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (pl.ring) miniRing(ctx, x, y, r, true);
    ctx.globalAlpha = 1;
  }

  function miniRing(ctx, x, y, r, front) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(251,213,255,.75)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.9, r * 0.5, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
    ctx.stroke();
    ctx.restore();
  }

  S.resize(W, H);
  return S;
}
