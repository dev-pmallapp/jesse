import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Builds the India app as a single ES module entry that `scripts/patch_dashboard.py`'s
// generated wrapper (`jesse/static/_nuxt/india-page.js`) dynamically `import()`s at
// runtime, by filename, from `/ng/india.js` - so the entry's own filename (and its own
// module-level `export function mount(...)`) are a fixed contract with that wrapper,
// not just build output. `base: '/ng/'` matches the StaticFiles mount that already
// serves everything under `jesse/static/` (see jesse/__init__.py); no server change is
// needed to serve this directory.
export default defineConfig({
  base: '/ng/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: '../../jesse/static/ng',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        india: fileURLToPath(new URL('./src/entries/india.ts', import.meta.url)),
      },
      output: {
        // Fixed, non-hashed entry filename (see header comment) - the wrapper template
        // imports it by this exact name. Shared chunks/CSS may still be content-hashed
        // since nothing outside this bundle references those by name.
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Vite names the CSS asset after whichever entry pulled it in (e.g. `india.css`)
        // - there's only one CSS file for this whole build (a single Vue app), so force
        // it to the fixed name the entries' own `ensureNgCss()` <link> injection expects.
        assetFileNames: (assetInfo) => (assetInfo.name && assetInfo.name.endsWith('.css') ? 'ng.css' : 'assets/[name]-[hash][extname]'),
        // Keeps every export of the entry module reachable from the built file instead
        // of being tree-shaken as "unused" (this build has no other entry that imports
        // `mount` from `india.ts` - it's only ever consumed at runtime via a dynamic
        // `import()` from a hand-written, non-Vite-processed file).
        preserveModules: false,
      },
      preserveEntrySignatures: 'exports-only',
    },
  },
});
