import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', 'framer-motion']
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: true,
    // Commenting out proxy since we're using Cloud Functions instead of onRequest functions
    // proxy: {
    //   '/api': {
    //     target: 'http://127.0.0.1:5003',
    //     changeOrigin: true,
    //     secure: false,
    //   }
    // },
  },
  build: {
    outDir: 'dist',
  },
  // This is important for client-side routing
  preview: {
    port: 5173,
    strictPort: false,
    host: true,
  },
});
