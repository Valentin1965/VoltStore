import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Завантажуємо всі .env файли (Vercel автоматично додає свої змінні)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Визначаємо змінні для клієнтського коду (Vite експортує тільки з define або VITE_)
    define: {
      // Якщо потрібно використовувати на клієнті — можна додати, але краще не передавати ключі
      // 'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      // 'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      // 'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'), // тепер без (process as any)
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },

    server: {
      port: 5173,
      open: true,
      strictPort: true,
    },

    build: {
      outDir: 'dist',
      sourcemap: true,

      // Оптимізація чанків — зменшує розмір великих бандлів
      rollupOptions: {
        output: {
          manualChunks: {
            // Розділяємо великі залежності
            vendor: ['react', 'react-dom', '@google/generative-ai'],
            ui: ['./src/components'], // якщо багато компонентів
          },
          // Зменшуємо попередження про розмір чанків
          chunkFileNames: 'assets/[name]-[hash].js',
        },
      },

      // Збільшуємо ліміт попередження про розмір чанку (якщо не хочеш бачити попередження)
      chunkSizeWarningLimit: 1000,
    },

    // Додаємо підтримку Vercel Serverless Functions (для /api/*)
    // Vercel автоматично підхоплює, але для впевненості
    esbuild: {
      // Опціонально: якщо потрібно
    },

    // Дозволяємо Vercel правильно обробляти API-роути
    // (не обов'язково, але корисно)
    preview: {
      port: 4173,
    },
  };
});