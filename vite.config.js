import react from '@vitejs/plugin-react';
import { createLogger, defineConfig, loadEnv } from 'vite';

const customLogger = createLogger();
const originalLoggerError = customLogger.error;
customLogger.error = (msg, options) => {
  // Suppress harmless proxy socket disconnects (SSE stream aborts on tab reload/close) and temporary connection attempts
  if (
    typeof msg === 'string' &&
    msg.includes('http proxy error') &&
    (msg.includes('ECONNRESET') || msg.includes('ECONNREFUSED') || msg.includes('ECONNABORTED') || msg.includes('AggregateError'))
  ) {
    return;
  }
  originalLoggerError(msg, options);
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawTarget = env.VITE_BACKEND_URL || env.VITE_API_URL || env.VITE_API_BASE_URL || (mode === 'development' ? 'http://127.0.0.1:5000' : 'https://sehat-buddy-backend-j5cpgliowq-uc.a.run.app');
  // Strip trailing /api or slash to get the origin root for proxying
  const target = rawTarget.replace(/\/api\/?$/, '').replace(/\/+$/, '');

  return {
    customLogger,
    base: '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              // Suppress harmless socket resets from client tab reloads / aborted SSE streams
              if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Backend proxy error: server unreachable on port 5000' }));
              }
            });
          }
        },
        '/uploads': {
          target: target,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
