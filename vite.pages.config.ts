import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
 root: root + 'pages',
 base: '/Diabetes_Rectanomy/',
 publicDir: root + 'public',
 define: { __PAGES_BASE__: JSON.stringify('/Diabetes_Rectanomy') },
 resolve: { alias: { '@': root } },
 plugins: [react()],
 css: { postcss: { plugins: [tailwindcss()] } },
 build: {
  outDir: root + 'dist-pages',
  emptyOutDir: true,
  rollupOptions: { input: { home: root + 'pages/index.html', dashboard: root + 'pages/dashboard/index.html' } },
 },
});
