import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawTarget = env.VITE_BACKEND_URL || env.VITE_API_URL || env.VITE_API_BASE_URL || (mode === 'development' ? 'http://localhost:5000' : 'https://sehat-buddy-backend-j5cpgliowq-uc.a.run.app');
  // Strip trailing /api or slash to get the origin root for proxying
  const target = rawTarget.replace(/\/api\/?$/, '').replace(/\/+$/, '');

  return {
    base: '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
