/* Saturn : l'alignement des mondes.
   Saturne + anneau de particules + 4 planètes (les projets) qui s'alignent au scroll. */
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  // Les 4 mondes : couleur claire, couleur de base, ombre
  const PLANETS = [
    { f: 2.05, size: 0.25, base: 0.6, hi: '#d9d2ff', mid: '#7c5cff', lo: '#1c1147' },  // DakarHouse
    { f: 2.85, size: 0.21, base: 3.4, hi: '#ffffff', mid: '#b9bbc6', lo: '#2a2b33' },  // iStore Tech
    { f: 3.75, size: 0.30, base: 5.1, hi: '#fbd5ff', mid: '#d946ef', lo: '#3b0a45', ring: true }, // Saturn Agents
    { f: 4.65, size: 0.24, base: 1.9, hi: '#ffc9c9', mid: '#dc2626', lo: '#2a0707' }   // Teranga
  ];
  const E = 0.26;          // aplatissement du plan orbital
  const TILT = 0.16;       // inclinaison : l'alignement monte vers la gauche

  const Cosmos = {
    canvas: null, ctx: null, chips: [], chipBox: null,
    W: 0, H: 0, dpr: 1, cx: 0, cy: 0, R: 0,
    target: 0, shown: 0, time: 0, last: 0,
    running: false, visible: true, paused: false, isStatic: false, rafId: null,
    onFrame: null, particles: [], stars: [], phi: [], lock: [],
    chipCache: [], chipSize: [],

    init(canvas, chipEls, chipBox) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.chips = chipEls;
      this.chipBox = chipBox;
      this.phi = PLANETS.map(p => p.base);
      this.lock = PLANETS.map(() => null);
      this.chipCache = PLANETS.map(() => ({ x: -1, y: -1, o: -1 }));
      const r = rng(20240914);
      this.stars = Array.from({ length: 260 }, () => ({
        x: r(), y: r(), s: 0.3 + r() * 1.1, a: 0.25 + r() * 0.6, tw: 0.4 + r() * 1.6, ph: r() * TAU, d: 0.3 + r() * 0.7
      }));
      this.resize();
      addEventListener('resize', () => { this.resize(); if (!this.running) this.draw(); });
    },

    buildParticles(n) {
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
      this.particles = out;
    },

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.W = Math.max(1, rect.width); this.H = Math.max(1, rect.height);
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const wide = this.W / this.H > 1.05;
      this.cx = this.W * (wide ? 0.70 : 0.68);
      this.cy = this.H * (wide ? 0.40 : 0.50);
      this.R = Math.min(this.W * (wide ? 0.105 : 0.1), this.H * 0.15);
      this.buildParticles(this.W < 720 ? 1300 : 2800);
      // les étiquettes : version courte quand les planètes sont serrées
      const tight = this.R * 1.7 < 165;   // étiquettes alternées dessus / dessous
      this.chipBox.classList.toggle('is-tight', tight);
      this.chipSize = this.chips.map(c => [c.offsetWidth, c.offsetHeight]);
      this.chipCache.forEach(c => { c.x = -1; c.o = -1; });
    },

    // projection d'un point du plan orbital vers l'écran
    project(rad, ang, scale) {
      const x = Math.cos(ang) * rad * scale;
      const y = Math.sin(ang) * rad * scale * E;
      const c = Math.cos(TILT), s = Math.sin(TILT);
      return [this.cx + x * c - y * s, this.cy + x * s + y * c, Math.sin(ang)];
    },

    align(i, p) { const s = 0.34 + i * 0.07; return smooth(p, s, s + 0.07); },

    setProgress(p) { this.target = p; this.wake(); },
    setVisible(v) { this.visible = v; v ? this.wake() : this.stop(); },
    setPaused(v) { this.paused = v; v ? this.stop() : this.wake(); },
    setStatic(v) {
      this.isStatic = v;
      if (v) {
        this.stop();
        this.shown = this.target = 1;
        this.phi = PLANETS.map(() => Math.PI);
        requestAnimationFrame(() => { this.resize(); this.draw(); });
      } else { this.wake(); }
    },
    wake() {
      if (this.running || this.isStatic || !this.visible || this.paused) return;
      this.running = true; this.last = 0;
      this.rafId = requestAnimationFrame(t => this.tick(t));
    },
    stop() { if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; this.running = false; },

    tick(now) {
      if (!this.running) return;
      const dtMs = Math.min(100, now - (this.last || now));
      this.last = now;
      const dt = dtMs / 1000;
      this.time += dt;
      // lissage indépendant de la fréquence d'affichage
      const k = 0.12;
      this.shown += (this.target - this.shown) * (1 - Math.pow(1 - k, dtMs / 16.667));
      if (Math.abs(this.target - this.shown) < 0.0004) this.shown = this.target;

      // orbites : libres, puis verrouillées sur l'alignement
      PLANETS.forEach((pl, i) => {
        const a = this.align(i, this.shown);
        const w = 0.16 * Math.pow(2.05 / pl.f, 1.5);
        if (a <= 0.0005) { this.lock[i] = null; this.phi[i] += w * dt; return; }
        if (this.lock[i] === null) this.lock[i] = Math.PI + TAU * Math.ceil((this.phi[i] - Math.PI) / TAU);
        this.phi[i] += w * dt * (1 - a);
        this.phi[i] += (this.lock[i] - this.phi[i]) * (1 - Math.exp(-dt * 7 * a));
      });

      this.draw();
      if (this.onFrame) this.onFrame(this.shown, now);
      this.rafId = requestAnimationFrame(t => this.tick(t));
    },

    draw() {
      const { ctx, W, H, R, cx, cy } = this;
      const p = this.shown, t = this.time;
      ctx.clearRect(0, 0, W, H);

      // étoiles, légère parallaxe au scroll
      for (const s of this.stars) {
        const tw = this.isStatic ? 1 : 0.75 + 0.25 * Math.sin(t * s.tw + s.ph);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = '#e9e4ff';
        const y = ((s.y * H - p * 60 * s.d) % H + H) % H;
        ctx.fillRect(s.x * W, y, s.s, s.s);
      }
      ctx.globalAlpha = 1;

      // pulsation quand le dernier monde s'aligne
      const pulse = Math.exp(-Math.pow((p - 0.66) / 0.035, 2));
      const scale = 1 + 0.06 * smooth(p, 0.3, 1);
      const Rs = R * scale;

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
        const a = this.align(i, p);
        ctx.strokeStyle = `rgba(200,190,255,${0.07 + 0.05 * a})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, pl.f * Rs, pl.f * Rs * E, 0, 0, TAU);
        ctx.stroke();
      });
      // l'axe d'alignement
      const all = Math.min(...PLANETS.map((_, i) => this.align(i, p)));
      if (all > 0.01) {
        const lg = ctx.createLinearGradient(-PLANETS[3].f * Rs * 1.12, 0, -Rs, 0);
        lg.addColorStop(0, 'rgba(167,139,250,0)');
        lg.addColorStop(1, `rgba(167,139,250,${0.45 * all})`);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-PLANETS[3].f * Rs * 1.12, 0); ctx.lineTo(-Rs * 1.05, 0); ctx.stroke();
      }
      ctx.restore();

      // mondes derrière Saturne
      const worlds = PLANETS.map((pl, i) => {
        const [x, y, depth] = this.project(pl.f * Rs, this.phi[i], 1);
        return { pl, i, x, y, depth };
      });
      worlds.filter(w => w.depth < 0).forEach(w => this.planet(w, Rs));

      // anneau : moitié arrière
      this.ring(Rs, pulse, false);

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
      this.ring(Rs, pulse, true);

      // mondes devant
      worlds.filter(w => w.depth >= 0).forEach(w => this.planet(w, Rs));

      this.placeChips(worlds, Rs, p);
    },

    ring(Rs, pulse, front) {
      const { ctx } = this;
      const t = this.time, boost = 1 + 0.6 * pulse;
      const c = Math.cos(TILT), s = Math.sin(TILT);
      // voile continu de l'anneau, sous les particules
      ctx.save();
      ctx.translate(this.cx, this.cy); ctx.rotate(TILT);
      for (let rr = 1.34; rr < 2.22; rr += 0.04) {
        if (rr > 1.76 && rr < 1.83) continue;
        ctx.strokeStyle = `rgba(167,139,250,${(front ? 0.075 : 0.04) * boost})`;
        ctx.lineWidth = 0.04 * Rs;
        ctx.beginPath();
        ctx.ellipse(0, 0, rr * Rs, rr * Rs * E, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
        ctx.stroke();
      }
      ctx.restore();
      for (const q of this.particles) {
        const ang = q.a + q.w * t;
        const sn = Math.sin(ang);
        if ((sn >= 0) !== front) continue;
        const x = Math.cos(ang) * q.r * Rs, y = sn * q.r * Rs * E;
        ctx.globalAlpha = Math.min(1, q.o * boost * (front ? 1 : 0.55));
        ctx.fillStyle = q.c;
        ctx.fillRect(this.cx + x * c - y * s, this.cy + x * s + y * c, q.s, q.s);
      }
      ctx.globalAlpha = 1;
    },

    planet(w, Rs) {
      const { ctx } = this;
      const { pl, x, y, depth } = w;
      const r = Rs * pl.size * (1 + 0.14 * depth);
      ctx.globalAlpha = 0.55 + 0.45 * (depth + 1) / 2;
      // lueur
      const glow = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 2.2);
      glow.addColorStop(0, pl.mid + '30');
      glow.addColorStop(1, pl.mid + '00');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
      if (pl.ring) this.miniRing(x, y, r, false);
      // sphère éclairée depuis Saturne
      const lx = this.cx - x, ly = this.cy - y, ll = Math.hypot(lx, ly) || 1;
      const gx = x + (lx / ll) * r * 0.45, gy = y + (ly / ll) * r * 0.45 - r * 0.2;
      const g = ctx.createRadialGradient(gx, gy, r * 0.05, x, y, r);
      g.addColorStop(0, pl.hi);
      g.addColorStop(0.45, pl.mid);
      g.addColorStop(1, pl.lo);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      if (pl.ring) this.miniRing(x, y, r, true);
      ctx.globalAlpha = 1;
    },

    miniRing(x, y, r, front) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(-0.35);
      ctx.strokeStyle = 'rgba(251,213,255,.75)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.9, r * 0.5, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
      ctx.stroke();
      ctx.restore();
    },

    // étiquettes DOM sous les mondes, écrites seulement si elles changent
    placeChips(worlds, Rs, p) {
      worlds.forEach(w => {
        const el = this.chips[w.i];
        if (!el) return;
        const [cw, ch] = this.chipSize[w.i] || [0, 0];
        const r = Rs * w.pl.size;
        const below = w.i % 2 === 0;
        const x = Math.round(w.x - cw / 2);
        const y = Math.round(below ? w.y + r + 12 : w.y - r - 12 - ch);
        const o = this.isStatic ? 1 : Math.round(this.align(w.i, p) * 100) / 100;
        const c = this.chipCache[w.i];
        if (c.x !== x || c.y !== y) { el.style.transform = `translate(${x}px,${y}px)`; c.x = x; c.y = y; }
        if (c.o !== o) { el.style.opacity = o; c.o = o; }
      });
    }
  };

  window.Cosmos = Cosmos;
})();
