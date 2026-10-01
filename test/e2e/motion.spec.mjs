// Système de mouvement : chaque effet se déclenche, se termine proprement et ne laisse aucune trace au repos
import { test, expect } from '@playwright/test';
import { watchConsole, introDone, settle } from '../helpers.mjs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__splits = new Set();
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.classList?.contains('mv-line')) window.__splits.add(n.closest('h2')?.id);
    }))).observe(document, { childList: true, subtree: true });
  });
});

async function wheelDown(page, times, step = 300) { for (let i = 0; i < times; i++) { await page.mouse.wheel(0, step); await page.waitForTimeout(60); } }

test('ordinateur : les 8 effets démarrent, sans erreur', async ({ page }) => {
  const issues = watchConsole(page);
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length, null, { timeout: 15000 });
  expect((await page.evaluate(() => window.__motion.effects)).sort()).toEqual(
    ['faqSmooth', 'imageReveal', 'lineReveal', 'magnetic', 'marqueeVelocity', 'spotlight', 'staggerTags', 'wordHighlight']);
  expect(issues).toEqual([]);
});

test('titres : chaque h2 est découpé à l’arrivée puis rendu intact', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  await page.waitForFunction(() => window.__motion?.effects?.length);
  await wheelDown(page, 45);
  await page.waitForTimeout(2500);
  expect([...await page.evaluate(() => [...window.__splits])].sort()).toEqual(['t-cta', 't-faq', 't-methode', 't-projets', 't-services']);
  expect(await page.locator('.mv-line').count()).toBe(0);
  await expect(page.locator('#t-projets')).toHaveJSProperty('innerHTML', 'Nos <em>réalisations</em>');
});

test('studio : tous les mots allumés une fois la phrase lue ; lecteurs d’écran : phrase entière', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length);
  await settle(page, '#studio');
  const min = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.mv-word')].map(w => +getComputedStyle(w).opacity)));
  expect(min).toBeGreaterThan(0.99);
  await expect(page.locator('.studio__statement .sr')).toContainText('chaque pixel doit porter son propre poids');
});

test('étiquettes : aucun style inline restant après l’arrivée', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length);
  await wheelDown(page, 60, 250);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => [...document.querySelectorAll('.tags li')].filter(l => l.getAttribute('style')).length)).toBe(0);
});

test('bandeau : accélère avec le scroll puis revient à son allure', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length);
  const rate = () => page.evaluate(() => document.querySelector('.marquee__track').getAnimations()[0].playbackRate);
  await settle(page, '.marquee');
  await page.mouse.wheel(0, -700); await page.waitForTimeout(800);   // bandeau vers le bas de l'écran
  await wheelDown(page, 3, 120);
  expect(Math.abs(await rate())).toBeGreaterThan(1.3);
  await page.waitForTimeout(4000);                                    // toujours à l'écran : retour à l'allure
  expect(Math.abs(await rate())).toBeLessThan(1.15);
  await page.mouse.wheel(0, 2500); await page.waitForTimeout(800);    // sortie de l'écran : allure normale
  expect(Math.abs(await rate())).toBe(1);
});

test('FAQ : la fermeture est animée puis la question se ferme', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length);
  await settle(page, '#faq');
  const s = page.locator('.faq summary').first(), d = page.locator('.faq details').first();
  await s.click(); await page.waitForTimeout(700);
  await expect(d).toHaveJSProperty('open', true);
  await s.click(); await page.waitForTimeout(90);
  await expect(d).toHaveJSProperty('open', true);                // encore ouverte : le repli est en cours
  await page.waitForTimeout(400);
  await expect(d).toHaveJSProperty('open', false);
  expect(await page.evaluate(() => document.querySelector('.faq details > div').getAttribute('style') || '')).toBe('');
  await s.click(); await page.waitForTimeout(800);                // la réouverture montre bien la réponse
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.faq details > div')).opacity)).toBe('1');
});

test('services : la lueur suit la souris puis s’éteint', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length);
  await settle(page, '#services');
  const row = page.locator('.service').first();
  await row.hover({ position: { x: 300, y: 50 } });
  await expect(row).toHaveClass(/is-lit/);
  await page.mouse.move(5, 5);
  await expect(row).not.toHaveClass(/is-lit/);
});

test('appel final : le bouton magnétique suit la souris puis revient', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length);
  await settle(page, '#contact');
  const btn = page.locator('#finalCta');
  const b = await btn.boundingBox();
  await page.mouse.move(b.x + 8, b.y + 6, { steps: 5 });
  await page.waitForTimeout(500);
  expect(await btn.evaluate(e => getComputedStyle(e).translate)).not.toBe('none');
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1200);
  expect(await btn.evaluate(e => getComputedStyle(e).translate)).toMatch(/^(none|0px( 0px)?)$/);
});

test('mobile : effets sans souris et sans clip-path coûteux', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.length, null, { timeout: 15000 });
  const fx = await page.evaluate(() => window.__motion.effects);
  expect(fx).not.toContain('imageReveal');
});
