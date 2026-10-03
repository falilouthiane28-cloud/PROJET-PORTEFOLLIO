// Section Saturn Agents : vidéo différée, bouton pause, onglets de l'équipe, modale du film, mission
import { test, expect } from '@playwright/test';
import { watchConsole, introDone, settle } from '../helpers.mjs';

const mp4 = page => { const urls = []; page.on('request', r => { if (/\.mp4/.test(r.url())) urls.push(r.url()); }); return urls; };

test('aucun octet vidéo au chargement ; la boucle démarre près de l’écran, puis se met en pause au clic', async ({ page }) => {
  const issues = watchConsole(page), videos = mp4(page);
  await page.goto('/');
  await introDone(page);
  await page.waitForLoadState('load');
  expect(videos).toEqual([]);
  await settle(page, '#agents');
  await expect(page.locator('.agents__film')).toHaveClass(/is-playing/, { timeout: 8000 });
  expect(videos.some(u => /boucle-(av1|h264)/.test(u))).toBe(true);
  expect(videos.some(u => /film-/.test(u))).toBe(false);          // le film attend le clic

  const pause = page.locator('.agents__pause');
  await expect(pause).toBeVisible();
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.agents__video').evaluate(v => v.paused)).toBe(true);
  await pause.click();
  await expect.poll(() => page.locator('.agents__video').evaluate(v => v.paused)).toBe(false);
  expect(issues).toEqual([]);
});

test('équipe : clic, puis flèches, Début et Fin ; une seule fiche visible ; la couleur suit l’agent', async ({ page }) => {
  await page.goto('/');
  await settle(page, '.crew');
  await expect(page.locator('.crew__panel:visible')).toHaveCount(1);
  await page.locator('#tab-analyst').click();
  await expect(page.locator('#agent-analyst')).toBeVisible();
  await expect(page.locator('.crew')).toHaveAttribute('data-agent', 'analyst');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-marketing')).toBeFocused();
  await expect(page.locator('#tab-marketing')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#agent-prospect')).toBeVisible();
  await page.keyboard.press('ArrowRight');                         // boucle : retour au chef
  await expect(page.locator('#tab-lead')).toBeFocused();
  await page.keyboard.press('Tab');                                // un seul arrêt dans la liste, puis la fiche
  await expect(page.locator('#agent-lead')).toBeFocused();
  await expect(page.locator('.crew__panel:visible')).toHaveCount(1);
});

test('film : s’ouvre avec le son et les sous-titres, fige la page, se ferme avec Échap et rend le focus', async ({ page }) => {
  const issues = watchConsole(page);
  await page.goto('/');
  await settle(page, '#agents');
  const y = await page.evaluate(() => scrollY);
  await page.locator('#filmOpen').click();
  const dialog = page.locator('#film');
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.locator('.film__video').evaluate(v => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0.3);
  expect(await page.locator('.film__video').evaluate(v => ({ muted: v.muted, track: v.textTracks[0]?.mode, lang: v.textTracks[0]?.language })))
    .toEqual({ muted: false, track: 'showing', lang: 'fr' });
  expect(await page.locator('.agents__video').evaluate(v => v.paused)).toBe(true);   // un seul film à la fois
  await page.mouse.wheel(0, 800); await page.waitForTimeout(600);
  expect(Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThan(3);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#filmOpen')).toBeFocused();
  expect(await page.locator('.film__video').evaluate(v => v.paused)).toBe(true);
  // le bouton fermer et le clic sur le fond ferment aussi
  await page.locator('#filmOpen').click();
  await page.locator('#filmClose').click();
  await expect(dialog).toBeHidden();
  await page.locator('#filmOpen').click();
  await page.mouse.click(8, 8);
  await expect(dialog).toBeHidden();
  expect(issues).toEqual([]);
});

test('film : téléphone tenu droit, version 9:16', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#filmOpen').click();
  await expect.poll(() => page.locator('.film__video').evaluate(v => v.currentSrc)).toMatch(/film-9x16/);
  await expect(page.locator('#film')).toHaveClass(/film--haut/);
});

test('mission : tout est allumé une fois la traversée finie, sans style restant qui masque', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__motion?.effects?.includes('missionFlow'), null, { timeout: 15000 });
  await settle(page, '.mission');
  await page.waitForTimeout(4200);
  const ops = await page.locator('.mission__step').evaluateAll(ls => ls.map(l => +getComputedStyle(l).opacity));
  expect(Math.min(...ops)).toBeGreaterThan(0.99);
  expect(await page.locator('.mission__dot').evaluate(d => +getComputedStyle(d).opacity)).toBe(0);
});
