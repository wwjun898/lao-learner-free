import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: mode === 'android' ? undefined : {
    alias: {
      '@capacitor/core': './src/lib/capacitorWebShim.ts',
      '@capacitor-community/text-to-speech': './src/lib/capacitorWebShim.ts',
      '@capgo/capacitor-speech-recognition': './src/lib/capacitorWebShim.ts',
    },
  },
  base: mode === 'android' ? './' : '/lao-learner/',
}));
