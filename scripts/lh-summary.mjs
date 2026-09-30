// Résume un rapport Lighthouse JSON : scores, métriques clés et audits en échec.
// Usage : node scripts/lh-summary.mjs rapport.json [--fails]
import { readFileSync } from 'node:fs';

const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const showFails = process.argv.includes('--fails');
const cat = k => Math.round((r.categories[k]?.score ?? 0) * 100);
const a = id => r.audits[id];
const ms = id => a(id)?.numericValue;
const out = {
  config: r.configSettings.formFactor + ' / ' + r.configSettings.throttlingMethod,
  perf: cat('performance'), a11y: cat('accessibility'), bp: cat('best-practices'), seo: cat('seo'),
  FCP: Math.round(ms('first-contentful-paint')), LCP: Math.round(ms('largest-contentful-paint')),
  TBT: Math.round(ms('total-blocking-time')), CLS: +ms('cumulative-layout-shift').toFixed(3),
  SI: Math.round(ms('speed-index')),
  lcpElement: a('largest-contentful-paint-element')?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 120),
  totalKB: Math.round(ms('total-byte-weight') / 1024),
  requests: a('network-requests')?.details?.items?.length,
};
const byType = {};
for (const it of a('network-requests')?.details?.items || []) {
  const t = it.resourceType || 'Other';
  byType[t] = (byType[t] || 0) + (it.transferSize || 0);
}
out.transferByTypeKB = Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)]));
console.log(JSON.stringify(out, null, 1));
if (showFails) {
  const fails = Object.values(r.audits)
    .filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'manual')
    .map(x => `- [${x.score}] ${x.id}: ${x.displayValue || ''}`);
  console.log('Audits en échec :\n' + fails.join('\n'));
}
