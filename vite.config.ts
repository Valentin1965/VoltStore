
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Vercel build environment check
  const apiKey = (env.VITE_API_KEY || env.API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || "").trim().replace(/['"]/g, '');
  const supabaseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

  return {
    plugins: [react()],
    define: {
      // Define process.env for compatibility with some libraries
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
      sourcemap: true,
      minify: 'esbuild'
    }
  };
});
