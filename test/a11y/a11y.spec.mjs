// Accessibilité : axe (WCAG 2.2 A/AA) à plusieurs largeurs et parcours au clavier
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { introDone, scrollThrough } from '../helpers.mjs';

for (const w of [390, 1440]) {
  test(`axe : aucune violation à ${w} px (page entière, après les apparitions)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
    await page.goto('/');
    await introDone(page);
    await scrollThrough(page);
    await page.waitForTimeout(1500);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('clavier : lien d’évitement puis tous les éléments interactifs, focus toujours visible', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement.className);
  expect(first).toContain('skip');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('main');

  const total = await page.evaluate(() => [...document.querySelectorAll('a[href], button, summary, [tabindex="0"]')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').length);
  const seen = new Set();
  const state = () => page.evaluate(() => {
    const el = document.activeElement; if (!el || el === document.body) return null;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none';
    let o = 1; for (let n = el; n; n = n.parentElement) o *= +getComputedStyle(n).opacity;
    return { key: el.className + " « " + el.textContent.trim().slice(0, 30) + " » y=" + Math.round(r.top) + " scrollY=" + Math.round(scrollY), ring, onScreen: r.bottom > 0 && r.top < innerHeight && r.width > 0, opacity: o };
  });
  for (let i = 0; i < total + 5; i++) {
    await page.keyboard.press('Tab');
    // le défilement vers l'élément est doux (scroll-behavior: smooth) : on laisse 2,5 s au plus pour arriver
    let info = await state();
    for (let t = 0; t < 25 && info && !(info.onScreen && info.opacity > 0.9); t++) { await page.waitForTimeout(100); info = await state(); }
    if (!info) continue;
    expect(info.onScreen && info.opacity > 0.9, `élément focalisé invisible : ${JSON.stringify(info)}`).toBe(true);
    expect(info.ring, `focus invisible : ${info.key}`).toBe(true);
    seen.add(info.key + i);
  }
  expect(seen.size).toBeGreaterThan(20);
});

test('clavier : la nav masquée au scroll réapparaît quand elle reçoit le focus', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  await page.mouse.wheel(0, 2500); await page.waitForTimeout(800);
  await page.mouse.wheel(0, 600); await page.waitForTimeout(800);
  await page.locator('.nav__home').focus();
  await expect(page.locator('#nav')).not.toHaveClass(/is-hidden/);
});

test('FAQ : s’ouvre et se ferme au clavier', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.faq summary').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq details').first()).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.locator('.faq details').first().evaluate(d => d.open), { timeout: 3000 }).toBe(false);
});

test('souris : cliquer sur du texte ne fait pas défiler la page (focus sur <main>)', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(50); }
  await page.waitForTimeout(1500);
  const p = page.locator('.project__info p').nth(1);
  await p.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
  const before = await page.evaluate(() => Math.round(scrollY));
  await p.click();
  await page.waitForTimeout(1200);
  expect(Math.abs(await page.evaluate(() => Math.round(scrollY)) - before)).toBeLessThan(3);
});
