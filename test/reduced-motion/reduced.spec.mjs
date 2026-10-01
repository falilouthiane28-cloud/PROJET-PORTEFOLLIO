// Mouvement réduit : rien de lourd ne bouge, tout le contenu est visible tout de suite
import { test, expect } from '@playwright/test';
import { watchConsole, scrollThrough } from '../helpers.mjs';

test('hero statique, pas de scène animée, pas de Lenis', async ({ page }) => {
  const issues = watchConsole(page);
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 400); await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.__hero.mode)).toBe('statique');
  await expect(page.locator('.hero__static .hero__title')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false);
  expect(issues).toEqual([]);
});

test('tout le contenu est visible sans attendre d’animation', async ({ page }) => {
  await page.goto('/');
  await scrollThrough(page, 900);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('main *, footer *')]
    .filter(e => e.getClientRects().length && !e.closest('[aria-hidden="true"], .band, .sr, .launch__done') && getComputedStyle(e).visibility !== 'hidden')
    .filter(e => { let o = 1; for (let n = e; n && n !== document.body; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o < 0.99; })
    .map(e => e.tagName + '.' + e.className).slice(0, 10));
  expect(hidden).toEqual([]);
});

test('aucune animation lourde : pas de déplacement en cours, pas de boucle infinie', async ({ page }) => {
  await page.goto('/');
  await scrollThrough(page, 900);
  await page.waitForTimeout(500);
  const running = await page.evaluate(() => document.getAnimations()
    .filter(a => a.playState === 'running')
    .map(a => ({ name: a.animationName || a.transitionProperty || a.id || 'anim', infinite: a.effect.getTiming().iterations === Infinity, dur: a.effect.getTiming().duration })));
  expect(running.filter(a => a.infinite)).toEqual([]);
  expect(running.filter(a => +a.dur > 300)).toEqual([]);
});

test('le moment « orbite » s’achève sans animation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#launchBtn').scrollIntoViewIfNeeded();
  await page.locator('#launchBtn').click();
  await expect(page.locator('#launch')).toHaveClass(/is-done/);
});
