import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';               // ← built-in node module, no install needed

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // You can add more if needed, e.g.
      // '@components': path.resolve(__dirname, './src/components'),
    },
  },
});
