// ==========================================
// Vercel Serverless Function Entry Point for GlimmerFall Online API
// Handles /api/* (Auth, Register, Login, Characters, Profile, Status, SSO)
// Automatically connects to Neon PostgreSQL (DATABASE_URL)
// ==========================================

import { AccountsStore } from '../server/accountsStore.js';
import { handleApiRequest, sendJson } from '../server/index.js';

let accountsInstance = null;
let initPromise = null;

async function getAccounts() {
  if (accountsInstance && accountsInstance.dbConnected) {
    return accountsInstance;
  }
  if (!accountsInstance) {
    accountsInstance = new AccountsStore();
    initPromise = accountsInstance.init();
  }
  await initPromise;
  return accountsInstance;
}

export default async function handler(req, res) {
  // Normalize pathname across Vercel rewrites and catch-alls
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  let rawUrl = req.url || '/';

  // If Vercel passed path via query param
  if (req.query && req.query.path) {
    const subPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    rawUrl = `/api/${subPath}`;
  } else if (!rawUrl.startsWith('/api')) {
    rawUrl = `/api${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
  }

  req.url = rawUrl;

  try {
    const accounts = await getAccounts();
    const handled = await handleApiRequest(req, res, { accounts, rooms: null });
    if (!handled) {
      sendJson(res, 404, { ok: false, error: `API route not found: ${rawUrl}` });
    }
  } catch (err) {
    console.error('[Vite/Vercel Serverless Error]:', err);
    sendJson(res, 500, { ok: false, error: err.message || 'Internal serverless error' });
  }
}
