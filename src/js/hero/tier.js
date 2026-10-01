// Niveau d'appareil du hero, en fonction pure (testable sans navigateur).
// 'poster' : appareil modeste ou économie de données → pas d'animation continue (poster + même chorégraphie)
// 'live'   : scène animée dans le worker
// Note : navigator.connection.effectiveType n'est volontairement pas utilisé (il classe « 3g » beaucoup de 4G
// ouest-africaines, voir memory.md).
export function deviceTier({ forced = null, saveData = false, memory, cores } = {}) {
  if (forced === 'poster' || forced === 'live') return forced;   // tests : ?niveau=poster ou ?niveau=live
  if (saveData) return 'poster';
  if (memory && memory < 4) return 'poster';
  if (cores && cores < 4) return 'poster';
  return 'live';
}

// lecture des signaux du navigateur
export function readTierSignals(nav = navigator, search = location.search) {
  const c = nav.connection || {};
  return { forced: new URLSearchParams(search).get('niveau'), saveData: !!c.saveData, memory: nav.deviceMemory, cores: nav.hardwareConcurrency };
}
