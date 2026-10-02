// Bande-son synthétisée : ré majeur, 100 BPM, mesures calées sur les coupes de la vidéo.
import { writeFileSync } from 'node:fs';
const SR = 48000, DUR = 23.0, N = Math.round(SR * DUR);
const dry = [new Float32Array(N), new Float32Array(N)], wet = [new Float32Array(N), new Float32Array(N)];
const BEAT = 0.6, BAR = 2.4, T0 = 4.6;
const mtof = m => 440 * 2 ** ((m - 69) / 12);
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const add = (buf, i, l, r) => { if (i >= 0 && i < N) { buf[0][i] += l; buf[1][i] += r; } };

// ---------- nappe ----------
const chords = [[50, 57, 61, 64, 66, 69], [47, 54, 57, 61, 62, 66], [43, 50, 54, 57, 62, 66], [45, 52, 54, 57, 59, 64]]; // Dmaj9 Bm9 Gmaj9 A6sus
const duck = new Float32Array(N).fill(1);
function pad() {
  const lp = [0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const bar = t < T0 ? 0 : Math.floor((t - T0) / BAR) % 4;
    const ch = t >= 19.0 ? chords[0] : chords[bar];
    // enveloppe globale : montée de l'intro, plongée, plateau, impact, fin
    let g = Math.min(1, t / 2.5) * 0.9;
    if (t > 3.6 && t < 4.6) g *= 1 - 0.55 * Math.sin(Math.PI * (t - 3.6));
    if (t > 21.0) g *= Math.max(0, 1 - (t - 21.0) / 2.0) ** 1.3;
    // crossfade doux entre accords (évite les clics)
    const tb = t < T0 ? 99 : (t - T0) % BAR, xf = Math.min(1, tb / 0.12);
    const prev = t >= 19.0 && t < 19.12 ? chords[3] : chords[(bar + 3) % 4];
    let sL = 0, sR = 0;
    for (const [set, w] of [[ch, xf], [prev, 1 - xf]]) {
      if (w <= 0 || t < T0 + 0.01 && set === prev) continue;
      set.forEach((m, k) => {
        const f = mtof(m);
        for (const [dt, pan] of [[-0.11, 0.8], [0.11, 0.2]]) {
          const ph = 2 * Math.PI * f * (1 + dt / 100) * t + k;
          const v = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) * w / set.length;
          sL += v * pan; sR += v * (1 - pan);
        }
      });
    }
    // filtre passe-bas qui s'ouvre au fil du film
    const cut = 900 + 2600 * Math.min(1, t / 19) + (t > 19 ? 1500 : 0);
    const a = 1 - Math.exp(-2 * Math.PI * cut / SR);
    lp[0] += a * (sL - lp[0]); lp[1] += a * (sR - lp[1]);
    const v = 0.55 * g * (t < T0 ? 1.5 : 1);
    dry[0][i] += lp[0] * v * 0.7; dry[1][i] += lp[1] * v * 0.7;
    wet[0][i] += lp[0] * v * 0.5; wet[1][i] += lp[1] * v * 0.5;
  }
}

// ---------- percussions ----------
function kick(t0, amp = 1) {
  let ph = 0;
  for (let j = 0; j < SR * 0.5; j++) {
    const t = j / SR, f = 45 + 95 * Math.exp(-t * 28);
    ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.exp(-t * 7) * 0.55 * amp * Math.min(1, t * 400);
    add(dry, Math.round((t0 + t) * SR), v, v);
  }
  for (let j = 0; j < SR * 0.45; j++) { // ducking de la nappe
    const i = Math.round((t0 + j / SR) * SR); if (i < N) duck[i] = Math.min(duck[i], 1 - 0.45 * amp * Math.exp(-j / SR * 9));
  }
}
function hat(t0, amp = 1) {
  let hp = 0, prev = 0;
  for (let j = 0; j < SR * 0.08; j++) {
    const n = rnd(); hp = 0.85 * (hp + n - prev); prev = n;
    const v = hp * Math.exp(-j / SR * 60) * 0.035 * amp;
    add(dry, Math.round((t0 + j / SR) * SR), v * 0.7, v);
    add(wet, Math.round((t0 + j / SR) * SR), v * 0.2, v * 0.2);
  }
}
function bass(t0, m, len) {
  const f = mtof(m - 12);
  for (let j = 0; j < SR * len; j++) {
    const t = j / SR, env = Math.min(1, t * 60) * Math.min(1, (len - t) * 20) * (0.75 + 0.25 * Math.exp(-t * 4));
    const v = (Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(4 * Math.PI * f * t)) * 0.2 * env;
    add(dry, Math.round((t0 + t) * SR), v, v);
  }
}

// ---------- notes, souffles, impacts ----------
function pluck(t0, m, amp = 1, pan = 0.5) {
  const f = mtof(m);
  for (let j = 0; j < SR * 1.6; j++) {
    const t = j / SR, env = Math.exp(-t * 3.2) * Math.min(1, t * 900);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 8) + 0.12 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 14)) * env * 0.09 * amp;
    const i = Math.round((t0 + t) * SR);
    add(dry, i, v * (1 - pan) * 1.2, v * pan * 1.2);
    add(wet, i, v * 0.9, v * 0.9);
  }
}
function whoosh(t0, len, amp = 1, rise = false) {
  let b0 = 0, b1 = 0;
  for (let j = 0; j < SR * len; j++) {
    const p = j / (SR * len), env = rise ? p ** 2.2 * Math.min(1, (1 - p) * 40) : Math.sin(Math.PI * p) ** 2;
    const cut = rise ? 300 + 5000 * p ** 2 : 400 + 2600 * Math.sin(Math.PI * p);
    const a = 1 - Math.exp(-2 * Math.PI * cut / SR);
    b0 += a * (rnd() - b0); b1 += a * (b0 - b1);
    const v = b1 * env * 0.32 * amp, i = Math.round((t0 + j / SR) * SR);
    const pan = 0.5 + 0.35 * Math.sin(Math.PI * 2 * p);
    add(dry, i, v * (1 - pan), v * pan); add(wet, i, v * 0.4, v * 0.4);
  }
}
function boom(t0) {
  bass(t0, 38, 2.8); kick(t0, 1.3);
  let b = 0;
  for (let j = 0; j < SR * 2.5; j++) {
    const t = j / SR, a = 1 - Math.exp(-2 * Math.PI * (2500 * Math.exp(-t * 2) + 300) / SR);
    b += a * (rnd() - b);
    const v = b * Math.exp(-t * 2.2) * 0.12 * Math.min(1, t * 200), i = Math.round((t0 + t) * SR);
    add(dry, i, v * 0.6, v * 0.6); add(wet, i, v, v);
  }
}

pad();
whoosh(2.9, 1.7, 1.1, true);          // montée vers la plongée
kick(T0, 1.1); bass(T0, 50, BAR);       // atterrissage dans le studio
kick(T0 + 1.2, 0.6);
for (let b = 0; b < 5; b++) {           // 7.0 → 19.0 : battement
  const t = 7.0 + b * BAR, root = [47, 43, 45, 50, 47][b];
  bass(t, root, BAR - 0.02);
  for (let q = 0; q < 4; q++) { kick(t + q * BEAT, q === 0 ? 1 : 0.7); hat(t + q * BEAT + BEAT / 2, q % 2 ? 1 : 0.7); }
}
// entrées des projets : arpège dans l'accord
const arps = [[74, 78, 81], [71, 74, 78], [74, 78, 79], [76, 81, 83]];
arps.forEach((a, k) => a.forEach((m, n) => pluck(7.0 + k * BAR + n * 0.15, m, 1 - n * 0.2, 0.3 + n * 0.2)));
// coupes
[[6.45, 0.6], [9.05, 0.5], [11.45, 0.5], [13.85, 0.5], [16.1, 0.6], [18.55, 0.55]].forEach(([t, l]) => whoosh(t, l, 0.7));
// étapes de la méthode, une par temps
[74, 76, 78, 81].forEach((m, k) => pluck(16.6 + k * BEAT, m, 0.85, 0.35 + k * 0.1));
// retour en orbite
boom(19.0);
// clic sur le bouton + toast
pluck(21.4, 93, 0.5, 0.6); pluck(21.62, 86, 0.6, 0.55); pluck(21.78, 90, 0.6, 0.45);

// ---------- réverbération (Schroeder) ----------
function reverb(x, combs, decay) {
  const y = new Float32Array(N);
  for (const d of combs) {
    const L = Math.round(d * SR), buf = new Float32Array(L); let k = 0, lp = 0;
    for (let i = 0; i < N; i++) { const o = buf[k]; lp = 0.7 * o + 0.3 * lp; buf[k] = x[i] + lp * decay; y[i] += o / combs.length; k = (k + 1) % L; }
  }
  for (const d of [0.0051, 0.0017]) {
    const L = Math.round(d * SR), buf = new Float32Array(L); let k = 0;
    for (let i = 0; i < N; i++) { const o = buf[k], v = y[i] + o * 0.5; buf[k] = v; y[i] = o - 0.5 * v; k = (k + 1) % L; }
  }
  return y;
}
const rL = reverb(wet[0], [0.0297, 0.0371, 0.0411, 0.0437, 0.0533], 0.86);
const rR = reverb(wet[1], [0.0311, 0.0359, 0.0423, 0.0451, 0.0547], 0.86);

// ---------- mix ----------
const out = new Int16Array(N * 2); let peak = 0;
const mix = [new Float32Array(N), new Float32Array(N)];
for (let i = 0; i < N; i++) {
  // la nappe vit dans dry : on applique le ducking à tout le bus, sauf le kick (déjà dedans) – effet de pompe léger
  const d = 0.75 + 0.25 * duck[i];
  for (const c of [0, 1]) mix[c][i] = (c ? dry[1][i] : dry[0][i]) * d + (c ? rR[i] : rL[i]) * 0.9;
  peak = Math.max(peak, Math.abs(mix[0][i]), Math.abs(mix[1][i]));
}
const gain = 0.95 / Math.tanh(peak * 1.4) ;
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = Math.min(1, t / 0.02) * Math.min(1, (DUR - t) / 0.6);
  for (const c of [0, 1]) out[i * 2 + c] = Math.round(Math.tanh(mix[c][i] * 1.4) * gain * 0.89 * fade * 32767);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + out.byteLength, 4); hdr.write('WAVEfmt ', 8);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(out.byteLength, 40);
writeFileSync('music.wav', Buffer.concat([hdr, Buffer.from(out.buffer)]));
console.log('ok peak', peak.toFixed(3));
