// Outils partagés des tests navigateur
export const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

// collecte erreurs et avertissements de la console, exceptions et requêtes en échec
export function watchConsole(page) {
  const issues = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') issues.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => issues.push(`exception: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) issues.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => issues.push(`échec: ${r.url()} ${r.failure()?.errorText || ''}`));
  return issues;
}

// attend la fin de l'intro du hero (ou son absence)
export async function introDone(page) {
  await page.waitForFunction(() => window.__hero && window.__hero.introDoneAt, null, { timeout: 15000 });
}

// parcourt toute la page à la molette pour déclencher les apparitions, puis remonte
export async function scrollThrough(page, step = 500) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += step) { await page.mouse.wheel(0, step); await page.waitForTimeout(80); }
  await page.waitForTimeout(600);
}

// amène une section en haut de l'écran et attend que ses animations d'entrée soient finies
export async function settle(page, selector) {
  // Lenis peut encore finir un élan précédent : on attend un défilement stable, on se place, et on vérifie
  for (let i = 0; i < 10; i++) {
    await page.waitForFunction(() => new Promise(r => { const y = scrollY; setTimeout(() => r(Math.abs(scrollY - y) < 1), 250); }));
    const ok = await page.evaluate(sel => {
      const el = document.querySelector(sel), want = Math.max(0, el.getBoundingClientRect().top + scrollY - 80);
      if (Math.abs(scrollY - want) < 2) return true;
      window.scrollTo({ top: want, behavior: 'instant' });
      return false;
    }, selector);
    if (ok) break;
  }
  await page.waitForTimeout(400);
  await page.waitForFunction(sel => {
    const el = document.querySelector(sel);
    return document.getAnimations().filter(a => el.contains(a.effect?.target) && a.effect.getTiming().iterations !== Infinity).every(a => a.playState !== 'running');
  }, selector, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1600);   // les entrées GSAP n'apparaissent pas dans getAnimations()
}
