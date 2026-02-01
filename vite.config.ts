
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Prioritize actual process.env then .env files. Trim and remove potential quotes.
  const rawKey = process.env.API_KEY || env.VITE_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["'](.+)["']$/, '$1');

  const supabaseUrl = (process.env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "").trim();

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
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
