
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load all environment variables from the current directory, regardless of prefix
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Mapping environment variables to process.env so they are accessible in the browser
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve((process as any).cwd()),
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
