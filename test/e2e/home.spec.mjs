// Page d'accueil : chargement propre, mise en page, hero, navigation, contact, régression visuelle
import { test, expect } from '@playwright/test';
import { WIDTHS, watchConsole, introDone, scrollThrough, settle } from '../helpers.mjs';

test('charge sans erreur ni avertissement console, ni requête en échec', async ({ page }) => {
  const issues = watchConsole(page);
  await page.goto('/');
  await introDone(page);
  await scrollThrough(page);
  expect(issues).toEqual([]);
});

for (const w of WIDTHS) {
  test(`aucun débordement horizontal à ${w} px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
    await page.goto('/');
    await introDone(page);
    await scrollThrough(page, 700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}

test('hero : le poster s’affiche d’abord, puis la scène animée prend le relais', async ({ page }) => {
  await page.goto('/?niveau=live');
  const poster = page.locator('.hero__poster img');
  await expect(poster).toBeVisible();
  expect(await poster.evaluate(img => img.complete && img.naturalWidth > 1)).toBe(true);
  await introDone(page);
  await page.mouse.wheel(0, 200);
  await page.waitForFunction(() => window.__hero.mode === 'worker' || window.__hero.mode === 'main', null, { timeout: 15000 });
  await expect.poll(() => page.locator('#cosmos').evaluate(c => +getComputedStyle(c).opacity), { timeout: 5000 }).toBeGreaterThan(0.95);
});

test('hero : appareil modeste, le poster reste et rien ne tourne en continu', async ({ page }) => {
  await page.goto('/?niveau=poster');
  await introDone(page);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__hero.tier)).toBe('poster');
  expect(await page.evaluate(() => window.__hero.mode)).toBe('poster');
});

test('hero : passage du mode statique au mode animé sans erreur (rotation, redimensionnement)', async ({ page }) => {
  const issues = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?niveau=live');
  await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(() => window.__hero.mode === 'worker', null, { timeout: 15000 });
  expect(issues).toEqual([]);
});

test('hero du téléphone : la scène s’anime (worker, 30 i/s), sans erreur, et s’arrête en mouvement réduit', async ({ page }) => {
  const issues = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?niveau=live');
  await introDone(page);
  await page.waitForFunction(() => window.__hero.mode === 'ambient' && window.__hero.stats?.frames > 20, null, { timeout: 15000 });
  const s = await page.evaluate(() => window.__hero.stats);
  expect(s.fps).toBeGreaterThanOrEqual(24);
  expect(s.fps).toBeLessThanOrEqual(32);
  expect(s.particles).toBeLessThanOrEqual(900);
  await expect.poll(() => page.locator('.hero__canvas').count()).toBe(1);   // le dessin statique est retiré après le fondu
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => window.__hero.mode)).toBe('statique');
  expect(issues).toEqual([]);
});

test('projets : liens vers les sites en ligne, nouvel onglet annoncé', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('.link--site');
  await expect(links).toHaveCount(4);
  for (const a of await links.all()) {
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', 'noopener');
    expect(await a.evaluate(e => e.textContent.replace(/\s+/g, ' '))).toMatch(/Voir le site .* de .+ \(nouvel onglet\)/);
  }
});

test('chaque lien de navigation mène à sa section', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  for (const id of ['agents', 'projets', 'services', 'methode', 'studio']) {
    const link = page.locator(`.nav a[href="#${id}"]`).first();
    await link.focus();                       // la nav, masquée après le défilement, réapparaît au focus
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(i => Math.round(document.getElementById(i).getBoundingClientRect().top), id), { timeout: 5000 })
      .toBeLessThan(200);
    await expect.poll(() => page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id), { timeout: 5000 }).toBeGreaterThan(-200);
  }
});

test('menu mobile : s’ouvre, mène à la section, se ferme avec Échap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const btn = page.locator('#navMenu, .nav__menu').first();
  await btn.click();
  await expect(page.locator('#navSheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#navSheet')).toBeHidden();
  await btn.click();
  await page.locator('#navSheet a[href="#services"]').click();
  await expect(page.locator('#navSheet')).toBeHidden();
  await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('services').getBoundingClientRect().top)), { timeout: 5000 }).toBeLessThan(200);
});

test('contact : WhatsApp et e-mail (pas de formulaire sur ce site)', async ({ page }) => {
  await page.goto('/');
  const wa = page.locator('a[href^="https://wa.me/221763312469"]');
  expect(await wa.count()).toBeGreaterThanOrEqual(10);
  // chaque lien pointe vers le même numéro, avec un texte personnalisé (?text=…)
  const hrefs = await wa.evaluateAll(as => as.map(a => a.href));
  for (const h of hrefs) {
    expect(h).toMatch(/^https:\/\/wa\.me\/221763312469\?text=.+/);
    expect(decodeURIComponent(h)).toMatch(/Bonjour Saturn/);
  }
  for (const a of await wa.all()) {
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', /noopener/);
  }
  await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute('href', 'mailto:saturndesingstudio@gmail.com');
  await expect(page.locator('#finalCta')).toBeVisible();
});

test('moment « mettre en orbite » : maintenir le bouton termine le lancement', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  await page.locator('#launchBtn').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.locator('#launchBtn').focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(2200);
  await page.keyboard.up('Space');
  await expect(page.locator('#launch')).toHaveClass(/is-done/);
  await expect(page.locator('.launch__done')).toContainText('en orbite');
});

// ---------- régression visuelle : le design au repos ne doit pas changer ----------
const SECTIONS = ['#top', '#agents', '.crew', '.mission', '#projets', '#services', '#methode', '#studio', '#faq', '#contact', '.footer'];
// la scène est déterministe (graine fixe) et ?niveau=poster fige le hero ; restent l'heure et l'extrait vidéo en boucle
const MASK = ['.clock', '.agents__screen'];
for (const w of [390, 768, 1440]) {
  test(`régression visuelle à ${w} px`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
    await page.goto('/?niveau=poster');
    await introDone(page);
    await page.waitForTimeout(1500);
    await scrollThrough(page, 800);
    for (const sel of SECTIONS) {
      await settle(page, sel);
      const name = sel.replace(/[#.]/g, '');
      await expect(page).toHaveScreenshot(`${name}-${w}.png`, { mask: MASK.map(m => page.locator(m)), fullPage: false });
    }
  });
}
