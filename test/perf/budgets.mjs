// Budgets de performance (source unique pour test/perf/*). Voir docs/PERFORMANCE.md.
export const budgets = {
  lighthouse: {
    perf: { min: 90, label: 'Performance' },
    a11y: { min: 100, label: 'Accessib.' },
    bp: { min: 95, label: 'Bonnes prat.' },
    seo: { min: 95, label: 'SEO' },
    lcp: { max: 2000, label: 'LCP (ms)' },
    cls: { max: 0.05, label: 'CLS' },
    tbt: { max: 200, label: 'TBT (ms)' },
    kb: { max: 300, label: 'Poids (Ko)' }
  },
  fps: {
    desktop: { min: 58, label: 'ordinateur' },          // 60 i/s visés, 2 i/s de tolérance de mesure
    mobile: { min: 50, label: 'mobile bridé (CPU ×4)' }
  }
};
