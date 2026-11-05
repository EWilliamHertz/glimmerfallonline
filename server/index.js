// ==========================================
// GlimmerFall Online 2D — Authoritative Multiplayer HTTP + WebSocket Server
// Tick Rate: 20 Hz (50ms) | Protocol: ws (/ws) + REST (/api/*) + Neon PostgreSQL
// ==========================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { AccountsStore } from './accountsStore.js';
import { PartyManager } from './partyManager.js';
import { RoomManager } from './roomManager.js';
import { TICK_RATE } from '../shared/protocol.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GlimmerFall-Token, ngrok-skip-browser-warning',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
  });
  res.end(payload);
}

export function readJsonBody(req) {
  // Support pre-parsed req.body in serverless runtimes (e.g. Vercel)
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (_) {
      return Promise.reject(new Error('Invalid JSON payload'));
    }
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function extractRequestToken(req, body = null) {
  const gfHdr = req.headers['x-glimmerfall-token'];
  if (gfHdr && typeof gfHdr === 'string') return gfHdr.trim();
  const authHdr = req.headers.authorization;
  if (authHdr && typeof authHdr === 'string') return authHdr.trim();
  if (body && typeof body === 'object') {
    return String(body.currentToken || body.token || '').trim();
  }
  return '';
}

export async function handleApiRequest(req, res, { accounts, rooms = null }) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return true;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  if (!pathname.startsWith('/api/')) return false;

  const verifyWithRefresh = async (rawTok) => {
    if (!rawTok) return null;
    const sub = accounts.decodeTokenSubject(rawTok);
    if (sub) await accounts.ensureFreshFromPostgres({ id: sub });
    return accounts.verifyToken(rawTok);
  };

  try {
    if (pathname === '/api/ping') {
      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': '0',
          ...CORS_HEADERS,
        });
        res.end();
        return true;
      }
      const body = 'pong';
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        ...CORS_HEADERS,
      });
      res.end(body);
      return true;
    }

    if (pathname === '/api/status' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        service: 'glimmerfall-online-2d-mmo',
        tickRate: TICK_RATE,
        dbConnected: accounts.dbConnected,
        totalAccounts: accounts.accountsById.size,
        onlinePlayers: rooms ? rooms.clients.size : 0,
        rooms: rooms ? rooms.listPublicRooms() : [],
        ssoBridge: 'glimmerfalltcg.com',
      });
      return true;
    }

    if (pathname === '/api/rooms' && req.method === 'GET') {
      sendJson(res, 200, { ok: true, rooms: rooms ? rooms.listPublicRooms() : [] });
      return true;
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const acc = await verifyWithRefresh(extractRequestToken(req) || url.searchParams.get('token'));
      if (!acc) {
        sendJson(res, 401, { ok: false, error: 'Invalid or expired GlimmerFall ID session.' });
        return true;
      }
      sendJson(res, 200, { ok: true, profile: accounts.toPublicProfile(acc) });
      return true;
    }

    if (pathname === '/api/auth/guest' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const existing = await verifyWithRefresh(extractRequestToken(req, body));
      if (existing) {
        sendJson(res, 200, {
          ok: true,
          token: accounts.signToken(existing.id),
          profile: accounts.toPublicProfile(existing),
        });
        return true;
      }
      const { account, token } = accounts.createGuestAccount({
        preferredName: body.preferredName,
        faction: body.faction,
        classId: body.classId,
        clientProgression: body.clientProgression,
      });
      await accounts.flushToPostgres();
      sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(account) });
      return true;
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await readJsonBody(req);
      await accounts.ensureFreshFromPostgres({ username: body.username });
      const currentAcc = await verifyWithRefresh(extractRequestToken(req, body));
      const { account, token } = accounts.registerAccount({
        username: body.username,
        password: body.password,
        displayName: body.displayName,
        faction: body.faction,
        classId: body.classId,
        orderTag: body.orderTag,
        orderName: body.orderName,
        loadout: body.loadout,
        equipment: body.equipment,
        tcgHandle: body.tcgHandle,
        upgradeAccountId: currentAcc ? currentAcc.id : null,
        clientProgression: body.clientProgression,
      });
      await accounts.flushToPostgres();
      if (rooms) rooms.refreshClientFromAccount(account.id);
      sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(account) });
      return true;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      await accounts.ensureFreshFromPostgres({ username: body.username });
      const { account, token } = accounts.loginAccount({
        username: body.username,
        password: body.password,
      });
      await accounts.flushToPostgres();
      sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(account) });
      return true;
    }

    if (pathname === '/api/auth/sso/glimmerfall' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const currentAcc = await verifyWithRefresh(extractRequestToken(req, body));

      if (body.ssoToken) {
        const verifiedSsoAcc = await verifyWithRefresh(body.ssoToken);
        if (verifiedSsoAcc) {
          const token = accounts.signToken(verifiedSsoAcc.id);
          if (rooms) rooms.refreshClientFromAccount(verifiedSsoAcc.id);
          sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(verifiedSsoAcc) });
          return true;
        }
      }

      if (!currentAcc) {
        const created = accounts.createGuestAccount({
          preferredName: body.tcgHandle || 'Summoner',
          faction: body.faction || 'Solari',
          classId: body.classId || 'solari_vanguard',
        });
        const linked = accounts.linkGlimmerFallTcgAccount(created.account.id, body);
        await accounts.flushToPostgres();
        sendJson(res, 200, {
          ok: true,
          token: created.token,
          profile: accounts.toPublicProfile(linked),
        });
        return true;
      }

      const updated = accounts.linkGlimmerFallTcgAccount(currentAcc.id, body);
      await accounts.flushToPostgres();
      if (rooms) rooms.refreshClientFromAccount(updated.id);
      sendJson(res, 200, {
        ok: true,
        token: accounts.signToken(updated.id),
        profile: accounts.toPublicProfile(updated),
      });
      return true;
    }

    if (pathname === '/api/account/profile' && (req.method === 'PATCH' || req.method === 'POST')) {
      const body = await readJsonBody(req);
      const currentAcc = await verifyWithRefresh(extractRequestToken(req, body));
      if (!currentAcc) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized' });
        return true;
      }
      const updated = accounts.updateProfile(currentAcc.id, body);
      await accounts.flushToPostgres();
      if (rooms) rooms.refreshClientFromAccount(updated.id);
      sendJson(res, 200, { ok: true, profile: accounts.toPublicProfile(updated) });
      return true;
    }

    if (pathname === '/api/characters' && req.method === 'GET') {
      const currentAcc = await verifyWithRefresh(extractRequestToken(req) || url.searchParams.get('token'));
      if (!currentAcc) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized' });
        return true;
      }
      sendJson(res, 200, {
        ok: true,
        characters: accounts.listCharacters(currentAcc.id),
        activeCharacterId: currentAcc.activeCharacterId,
      });
      return true;
    }

    if (pathname === '/api/characters' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const currentAcc = await verifyWithRefresh(extractRequestToken(req, body));
      if (!currentAcc) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized' });
        return true;
      }
      const charObj = accounts.createOrSelectCharacter(currentAcc.id, body);
      await accounts.flushToPostgres();
      if (rooms) {
        rooms.refreshClientFromAccount(currentAcc.id);
        if (body.enterRealm && rooms.getClientById(currentAcc.id)) {
          rooms.joinRoom(rooms.getClientById(currentAcc.id), body.enterRealm);
        }
      }
      sendJson(res, 200, {
        ok: true,
        character: charObj,
        profile: accounts.toPublicProfile(currentAcc),
      });
      return true;
    }

    if (pathname === '/api/characters' && req.method === 'DELETE') {
      const body = await readJsonBody(req);
      const currentAcc = await verifyWithRefresh(extractRequestToken(req, body));
      if (!currentAcc) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized' });
        return true;
      }
      accounts.deleteCharacter(currentAcc.id, body.characterId || url.searchParams.get('id'));
      await accounts.flushToPostgres();
      if (rooms) rooms.refreshClientFromAccount(currentAcc.id);
      sendJson(res, 200, { ok: true, profile: accounts.toPublicProfile(currentAcc) });
      return true;
    }

    sendJson(res, 404, { ok: false, error: `Unknown API endpoint: ${pathname}` });
    return true;
  } catch (err) {
    sendJson(res, 400, { ok: false, error: err.message || 'Request failed' });
    return true;
  }
}

export function createGlimmerFallServer() {
  const accounts = new AccountsStore();
  const ready = accounts.init();

  let rooms = null;
  const parties = new PartyManager(
    (id) => rooms?.getClientById(id),
    (name) => rooms?.findClientByName(name)
  );
  rooms = new RoomManager({ accountsStore: accounts, partyManager: parties });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Lightweight keep-alive endpoint for cron-job.org / monitoring
    if (pathname === '/ping') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
      }
      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': '0',
          ...CORS_HEADERS,
        });
        res.end();
        return;
      }
      const body = 'pong';
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        ...CORS_HEADERS,
      });
      res.end(body);
      return;
    }

    await ready;
    const handledApi = await handleApiRequest(req, res, { accounts, rooms });
    if (handledApi) return;

    // Production static file serving from dist/
    if (fs.existsSync(DIST_DIR)) {
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const fullPath = path.resolve(DIST_DIR, rel);
      if (fullPath.startsWith(DIST_DIR) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(fullPath).pipe(res);
        return;
      }
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  });

  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false, // Disables compression overhead and buffer queues for low latency
  });

  server.on('upgrade', async (req, socket, head) => {
    socket.setNoDelay(true); // Disable Nagle's algorithm on TCP socket to prevent 200ms packet bunching
    socket.setKeepAlive(true, 15000);
    await ready;
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    // Accounts/characters created or edited through the Vercel serverless /api live only in Neon;
    // pull the latest copy before authenticating so the WS session sees them.
    // (Skip the forced reload if that account is already online here, to protect unsaved progress.)
    try {
      const sub = accounts.decodeTokenSubject(url.searchParams.get('token'));
      if (sub) {
        await accounts.ensureFreshFromPostgres({ id: sub, force: !rooms.clients.has(sub) });
      }
    } catch (_) {}

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, url);
    });
  });

  wss.on('connection', (ws, _req, url) => {
    if (ws._socket) {
      ws._socket.setNoDelay(true);
      ws._socket.setKeepAlive(true, 15000);
    }

    // RFC 6455 Ping/Pong Heartbeat to keep ngrok & intermediate reverse proxies alive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    const heartbeatTimer = setInterval(() => {
      if (ws.readyState !== 1) {
        clearInterval(heartbeatTimer);
        return;
      }
      if (ws.isAlive === false) {
        clearInterval(heartbeatTimer);
        try { ws.terminate(); } catch (_) {}
        return;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch (_) {}
    }, 12000);

    const token = url.searchParams.get('token');
    const preferredRoom = url.searchParams.get('room') || null;
    const reqX = url.searchParams.get('x');
    const reqY = url.searchParams.get('y');
    let account = token ? accounts.verifyToken(token) : null;
    let issuedToken = null;

    if (!account) {
      const created = accounts.createGuestAccount({
        preferredName: url.searchParams.get('name') || undefined,
        faction: url.searchParams.get('faction') || 'Solari',
        classId: url.searchParams.get('classId') || 'solari_vanguard',
      });
      account = created.account;
      issuedToken = created.token;
    }

    const session = rooms.attachConnection(ws, account, preferredRoom, reqX, reqY);
    if (issuedToken) {
      session.send({ type: 'session_token', token: issuedToken });
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        // Immediate low-latency ping response
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: msg.ts, serverTs: Date.now() }));
          return;
        }
        rooms.handlePacket(session, msg);
      } catch (_) {}
    });

    ws.on('close', () => {
      clearInterval(heartbeatTimer);
      rooms.removeClient(session);
    });

    ws.on('error', () => {
      clearInterval(heartbeatTimer);
      rooms.removeClient(session);
    });
  });

  const shutdown = async () => {
    rooms.stop();
    await accounts.flushToPostgres().catch(() => {});
  };

  return { server, wss, accounts, parties, rooms, ready, shutdown };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const app = createGlimmerFallServer();
  app.ready.then(() => {
    app.server.listen(PORT, HOST, () => {
      console.log(
        `[GlimmerFall 2D MMO Server] Authoritative ${TICK_RATE}Hz server listening on http://${HOST}:${PORT} (Neon DB: ${app.accounts.dbConnected ? 'CONNECTED' : 'LOCAL'})`
      );
    });
  });

  process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
  });
}
