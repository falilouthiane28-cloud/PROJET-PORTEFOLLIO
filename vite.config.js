import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// Met le CSS directement dans le HTML : zéro feuille bloquante sur le chemin critique.
// Le CSS du site est petit (quelques Ko compressés), l'insérer en entier coûte moins qu'un aller-retour réseau.
function cssEnLigne() {
  return {
    name: 'css-en-ligne',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
          if (chunk.type !== 'asset' || !fileName.endsWith('.css')) continue;
          const re = new RegExp(`<link[^>]+href="[^"]*${fileName.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}"[^>]*>`);
          if (!re.test(html)) continue;                      // CSS chargé à la demande : on le laisse en fichier
          html = html.replace(re, () => `<style>${chunk.source}</style>`);
          delete ctx.bundle[fileName];
        }
        return html;
      }
    }
  };
}

export default defineConfig(({ mode }) => ({
  base: '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 0,                // les images restent des fichiers (cache + srcset)
    modulePreload: { polyfill: false },
    reportCompressedSize: true
  },
  worker: { format: 'es' },
  plugins: [
    cssEnLigne(),
    mode === 'analyze' && visualizer({ filename: 'perf/bundle-analyse.html', gzipSize: true, brotliSize: true, template: 'treemap' })
  ].filter(Boolean)
}));
