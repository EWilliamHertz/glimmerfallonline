import { defineConfig } from 'vite';
import net from 'node:net';
import { spawn } from 'node:child_process';

function autoStartMmoBackend() {
  let backendProc = null;
  let watchdog = null;
  let stopping = false;

  return {
    name: 'glimmerfall-mmo-backend',
    configureServer(server) {
      stopping = false;

      const ensureBackend = () => {
        if (stopping) return;
        const probe = net.createConnection({ host: '127.0.0.1', port: 3001 });
        probe.setTimeout(1200);
        probe.once('connect', () => probe.destroy());
        const onDown = () => {
          probe.destroy();
          if (stopping || (backendProc && backendProc.exitCode === null && !backendProc.killed)) return;
          console.log('[Vite] Starting GlimmerFall 20Hz Authoritative Server (:3001)...');
          backendProc = spawn(process.execPath, ['server/index.js'], {
            cwd: process.cwd(),
            stdio: 'inherit',
            env: process.env,
          });
          backendProc.on('exit', () => {
            backendProc = null;
          });
        };
        probe.once('error', onDown);
        probe.once('timeout', onDown);
      };

      ensureBackend();
      // Watchdog: if the MMO backend ever dies, bring it back automatically.
      watchdog = setInterval(ensureBackend, 4000);

      server.httpServer?.once('close', () => {
        stopping = true;
        clearInterval(watchdog);
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
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});
