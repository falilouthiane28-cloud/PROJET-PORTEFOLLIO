// Heure de Dakar (UTC+0 toute l'année), écrite seulement quand la minute change.
export function initClock() {
  const clocks = document.querySelectorAll('.clock');
  let last = '';
  const tick = () => {
    const d = new Date();
    const s = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
    if (s !== last) { last = s; clocks.forEach(c => (c.textContent = s)); }
  };
  tick();
  setInterval(tick, 10000);
}
