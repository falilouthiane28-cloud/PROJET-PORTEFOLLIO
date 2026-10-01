// Tests navigateur : Edge installé (channel msedge), aucun navigateur téléchargé.
// Le site testé est le build de production servi comme un CDN (scripts/serve.mjs, port 4181).
import { defineConfig, devices } from '@playwright/test';

const desktop = { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: 'test',
  testMatch: /.*\.spec\.mjs$/,
  timeout: 60000,
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' } },
  snapshotPathTemplate: '{testDir}/{testFileDir}/__snapshots__/{arg}-{projectName}{ext}',
  use: { baseURL: 'http://localhost:4181', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && node scripts/serve.mjs dist 4181',
    url: 'http://localhost:4181',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: 'e2e', testDir: 'test/e2e', use: desktop },
    { name: 'a11y', testDir: 'test/a11y', use: desktop },
    { name: 'reduced-motion', testDir: 'test/reduced-motion', use: { ...desktop, reducedMotion: 'reduce' } }
  ]
});
