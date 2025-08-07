import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', 'framer-motion', '@mui/material', '@mui/icons-material', 'recharts', '@fullcalendar/core']
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
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          calendar: ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
          recharts: ['recharts'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          datefns: ['date-fns'],
          motion: ['framer-motion']
        }
      }
    }
  },
  // This is important for client-side routing
  preview: {
    port: 5173,
    strictPort: false,
    host: true,
  },
});
