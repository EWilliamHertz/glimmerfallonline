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

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  });
  res.end(payload);
}

function readJsonBody(req) {
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
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      });
      res.end();
      return;
    }

    await ready;
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const authHeader = req.headers.authorization || '';

    try {
      if (pathname === '/api/status' && req.method === 'GET') {
        sendJson(res, 200, {
          ok: true,
          service: 'glimmerfall-online-2d-mmo',
          tickRate: TICK_RATE,
          dbConnected: accounts.dbConnected,
          totalAccounts: accounts.accountsById.size,
          onlinePlayers: rooms.clients.size,
          rooms: rooms.listPublicRooms(),
          ssoBridge: 'glimmerfalltcg.com',
        });
        return;
      }

      if (pathname === '/api/rooms' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, rooms: rooms.listPublicRooms() });
        return;
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        const acc = accounts.verifyToken(authHeader);
        if (!acc) {
          sendJson(res, 401, { ok: false, error: 'Invalid or expired GlimmerFall ID session.' });
          return;
        }
        sendJson(res, 200, { ok: true, profile: accounts.toPublicProfile(acc) });
        return;
      }

      if (pathname === '/api/auth/guest' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const existing = accounts.verifyToken(body.token || authHeader);
        if (existing) {
          sendJson(res, 200, {
            ok: true,
            token: accounts.signToken(existing.id),
            profile: accounts.toPublicProfile(existing),
          });
          return;
        }
        const { account, token } = accounts.createGuestAccount({
          preferredName: body.preferredName,
          faction: body.faction,
          classId: body.classId,
          clientProgression: body.clientProgression,
        });
        sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(account) });
        return;
      }

      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const currentAcc = accounts.verifyToken(authHeader || body.currentToken);
        const { account, token } = accounts.registerAccount({
          username: body.username,
          password: body.password,
          displayName: body.displayName,
          faction: body.faction,
          classId: body.classId,
          orderTag: body.orderTag,
          orderName: body.orderName,
          tcgHandle: body.tcgHandle,
          upgradeAccountId: currentAcc ? currentAcc.id : null,
          clientProgression: body.clientProgression,
        });
        rooms.refreshClientFromAccount(account.id);
        sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(account) });
        return;
      }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const { account, token } = accounts.loginAccount({
          username: body.username,
          password: body.password,
        });
        sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(account) });
        return;
      }

      if (pathname === '/api/auth/sso/glimmerfall' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const currentAcc = accounts.verifyToken(authHeader || body.currentToken);

        if (body.ssoToken) {
          const verifiedSsoAcc = accounts.verifyToken(body.ssoToken);
          if (verifiedSsoAcc) {
            const token = accounts.signToken(verifiedSsoAcc.id);
            rooms.refreshClientFromAccount(verifiedSsoAcc.id);
            sendJson(res, 200, { ok: true, token, profile: accounts.toPublicProfile(verifiedSsoAcc) });
            return;
          }
        }

        if (!currentAcc) {
          const created = accounts.createGuestAccount({
            preferredName: body.tcgHandle || 'Summoner',
            faction: body.faction || 'Solari',
            classId: body.classId || 'solari_vanguard',
          });
          const linked = accounts.linkGlimmerFallTcgAccount(created.account.id, body);
          sendJson(res, 200, {
            ok: true,
            token: created.token,
            profile: accounts.toPublicProfile(linked),
          });
          return;
        }

        const updated = accounts.linkGlimmerFallTcgAccount(currentAcc.id, body);
        rooms.refreshClientFromAccount(updated.id);
        sendJson(res, 200, {
          ok: true,
          token: accounts.signToken(updated.id),
          profile: accounts.toPublicProfile(updated),
        });
        return;
      }

      if (pathname === '/api/account/profile' && req.method === 'PATCH') {
        const currentAcc = accounts.verifyToken(authHeader);
        if (!currentAcc) {
          sendJson(res, 401, { ok: false, error: 'Unauthorized' });
          return;
        }
        const body = await readJsonBody(req);
        const updated = accounts.updateProfile(currentAcc.id, body);
        rooms.refreshClientFromAccount(updated.id);
        sendJson(res, 200, { ok: true, profile: accounts.toPublicProfile(updated) });
        return;
      }

      // Character Roster & Loadout Endpoints (Persisted to Neon PostgreSQL!)
      if (pathname === '/api/characters' && req.method === 'GET') {
        const currentAcc = accounts.verifyToken(authHeader);
        if (!currentAcc) {
          sendJson(res, 401, { ok: false, error: 'Unauthorized' });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          characters: accounts.listCharacters(currentAcc.id),
          activeCharacterId: currentAcc.activeCharacterId,
        });
        return;
      }

      if (pathname === '/api/characters' && req.method === 'POST') {
        const currentAcc = accounts.verifyToken(authHeader);
        if (!currentAcc) {
          sendJson(res, 401, { ok: false, error: 'Unauthorized' });
          return;
        }
        const body = await readJsonBody(req);
        const charObj = accounts.createOrSelectCharacter(currentAcc.id, body);
        await accounts.flushToPostgres();
        rooms.refreshClientFromAccount(currentAcc.id);
        if (body.enterRealm && rooms.getClientById(currentAcc.id)) {
          rooms.joinRoom(rooms.getClientById(currentAcc.id), body.enterRealm);
        }
        sendJson(res, 200, {
          ok: true,
          character: charObj,
          profile: accounts.toPublicProfile(currentAcc),
        });
        return;
      }

      if (pathname === '/api/characters' && req.method === 'DELETE') {
        const currentAcc = accounts.verifyToken(authHeader);
        if (!currentAcc) {
          sendJson(res, 401, { ok: false, error: 'Unauthorized' });
          return;
        }
        const body = await readJsonBody(req);
        accounts.deleteCharacter(currentAcc.id, body.characterId || url.searchParams.get('id'));
        rooms.refreshClientFromAccount(currentAcc.id);
        sendJson(res, 200, { ok: true, profile: accounts.toPublicProfile(currentAcc) });
        return;
      }
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message || 'Request failed' });
      return;
    }

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

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (req, socket, head) => {
    await ready;
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, url);
    });
  });

  wss.on('connection', (ws, _req, url) => {
    const token = url.searchParams.get('token');
    const preferredRoom = url.searchParams.get('room') || null;
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

    const session = rooms.attachConnection(ws, account, preferredRoom);
    if (issuedToken) {
      session.send({ type: 'session_token', token: issuedToken });
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        rooms.handlePacket(session, msg);
      } catch (_) {}
    });

    ws.on('close', () => {
      rooms.removeClient(session);
    });

    ws.on('error', () => {
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
