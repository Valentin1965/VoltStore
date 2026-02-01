import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Завантажуємо змінні. Третій параметр '' дозволяє завантажувати змінні без префікса VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Замість передачі всього 'process.env': env, 
      // ми передаємо лише те, що реально потрібно фронтенду.
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
      // Додаємо порожній об'єкт process.env, щоб бібліотеки не видавали помилку "process is not defined"
      'process.env': {} 
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd()),
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    server: {
      port: 5173,
      open: true,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});