import { defineConfig } from 'vite';
import net from 'node:net';
import { spawn } from 'node:child_process';

function autoStartMmoBackend() {
  let backendProc = null;

  return {
    name: 'glimmerfall-mmo-backend',
    configureServer(server) {
      const checkAndEnsureBackend = () => {
        const probe = net.createConnection({ host: '127.0.0.1', port: 3001 });
        probe.once('connect', () => {
          probe.destroy();
        });
        probe.once('error', () => {
          probe.destroy();
          if (backendProc) return;
          console.log('[Vite] Starting GlimmerFall 20Hz Authoritative Server (:3001)...');
          backendProc = spawn(process.execPath, ['server/index.js'], {
            cwd: process.cwd(),
            stdio: 'inherit',
            env: process.env,
          });
          backendProc.on('exit', () => {
            backendProc = null;
          });
        });
      };

      checkAndEnsureBackend();

      server.httpServer?.once('close', () => {
        if (backendProc && !backendProc.killed) {
          backendProc.kill('SIGTERM');
          backendProc = null;
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [autoStartMmoBackend()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: false,
    allowedHosts: true,
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});
