// L'équipe : onglets accessibles (motif APG « tabs », activation automatique).
// Clic ou toucher sur un agent, flèches, Début et Fin au clavier. La couleur de l'agent choisi prend la section
// (fondu d'opacité entre cinq lueurs, en CSS). Sans JavaScript, les cinq fiches restent visibles.
export function initCrew() {
  const crew = document.querySelector('.crew');
  if (!crew) return;
  const tabs = [...crew.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const agentOf = t => t.id.replace('tab-', '');

  function select(tab, focus) {
    tabs.forEach((t, i) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    crew.dataset.agent = agentOf(tab);
    if (focus) tab.focus();
  }

  crew.classList.add('is-tabs');
  select(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0], false);

  tabs.forEach(t => t.addEventListener('click', () => select(t, false)));
  crew.querySelector('[role="tablist"]').addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });

  // les mascottes des fiches cachées se chargent dès qu'on s'intéresse à l'équipe : pas d'attente au changement
  const warm = () => panels.forEach(p => p.querySelectorAll('img[loading="lazy"]').forEach(img => (img.loading = 'eager')));
  crew.addEventListener('pointerenter', warm, { once: true });
  crew.addEventListener('focusin', warm, { once: true });
  crew.addEventListener('touchstart', warm, { once: true, passive: true });

  // les flux lumineux du schéma ne tournent qu'à l'écran
  new IntersectionObserver(([e]) => crew.classList.toggle('on', e.isIntersecting)).observe(crew);
}
