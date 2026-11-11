import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

// The backend owns config.toml; the dev proxy reads the same port so the two never drift.
const BACKEND_PORT = (parse(readFileSync('config/config.toml', 'utf8')).server as { port: number }).port;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // NOTE: zod's source comments mention `@__PURE__` in prose; Rollup misreads them as annotations.
        if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('node_modules')) return;
        warn(warning);
      },
    },
  },
  server: {
    proxy: {
      '/api': `http://localhost:${BACKEND_PORT}`,
    },
  },
});
