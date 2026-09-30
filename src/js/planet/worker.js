// Worker de rendu : three.js est chargé, compilé et exécuté ici, hors du thread principal.
// Le thread principal reste libre pour le scroll, les interactions et les métriques (TBT, INP).
import { createEngine } from './engine.js';

let engine = null;
const queue = [];

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      engine = await createEngine(data.canvas, data.options, msg => self.postMessage(msg));
      queue.splice(0).forEach(m => engine.handle(m));
    } catch (err) {
      self.postMessage({ type: 'fail', reason: String(err && err.message || err) });
    }
    return;
  }
  if (!engine) { queue.push(data); return; }
  engine.handle(data);
  if (data.type === 'dispose') self.close();
};
