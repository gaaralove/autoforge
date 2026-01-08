
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: false
  },
  server: {
    port: 3000
  },
  define: {
    // Shimming process.env to allow the app to access API keys as instructed
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  }
});
