import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    allowedHosts: ['tikmoney.duckdns.org'],
  },
  preview: {
    port: 4180,
    strictPort: true,
  },
});
