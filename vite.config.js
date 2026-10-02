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

// Mode « file » (npm run build:file) : version qui s'ouvre en double-cliquant dist-local/index.html.
// En file://, les scripts module externes et les import() sont bloqués : chemins relatifs, un seul bundle,
// inséré dans la page.
// (avant la construction) : sans préchargement, les polices ne sont plus émises en fichiers et s'intègrent au CSS
function sansPrechargementPolices() {
  return { name: 'sans-prechargement-polices', transformIndexHtml: { order: 'pre', handler: html => html.replace(/<link rel="preload"[^>]*as="font"[^>]*>\s*/g, '') } };
}

function jsEnLigne() {
  return {
    name: 'js-en-ligne',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
        html = html.replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, '');
        for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
          if (chunk.type !== 'chunk' || !chunk.isEntry) continue;
          const re = new RegExp(`<script type="module"[^>]*src="[^"]*${fileName.replace(/[.*+?^${}()|[\]/]/g, '\\$&')}"[^>]*></script>`);
          html = html.replace(re, () => `<script type="module">${chunk.code.replace(/__VITE_PRELOAD__/g, 'void 0').replace(/<\/script/gi, '<\\/script')}</script>`);
          delete ctx.bundle[fileName];
        }
        return html;
      }
    }
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === 'file' ? './' : '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // les images restent des fichiers (cache + srcset) ; en mode « file », les polices sont intégrées
    // (en file://, une police externe est refusée par CORS)
    assetsInlineLimit: mode === 'file' ? (f => f.endsWith('.woff2')) : 0,
    modulePreload: mode === 'file' ? false : { polyfill: false },
    reportCompressedSize: true,
    ...(mode === 'file' ? { outDir: 'dist-local', rollupOptions: { output: { inlineDynamicImports: true } } } : {}),
    chunkSizeWarningLimit: 600      // seul three.js (chargé à la demande, dans le worker) dépasse 500 Ko
  },
  worker: { format: 'es' },
  plugins: [
    cssEnLigne(),
    mode === 'file' && sansPrechargementPolices(),
    mode === 'file' && jsEnLigne(),
    mode === 'analyze' && visualizer({ filename: 'perf/bundle-analyse.html', gzipSize: true, brotliSize: true, template: 'treemap' })
  ].filter(Boolean)
}));
