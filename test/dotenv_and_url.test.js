import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseDotEnvContent, loadDotEnv } from '../server/db.js';
import { normalizeServerUrl, KNOWN_SERVER_FALLBACKS } from '../client/network.js';

test('parseDotEnvContent parses raw multiline PEM keys, escaped newlines, quotes, and comments', () => {
  const sample = [
    '# Top-level comment',
    'ADMIN_PASSWORD = secretPass! # inline comment',
    'VITE_GAME_SERVER_URL = http://79.76.40.148:8080',
    'BLOB_WEBHOOK_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----',
    'MCowBQYDK2VwAyEA/Z6Ly2gO4wljtNfjN3K48W1njB/+1JIoevGpC7SvOKo=',
    '-----END PUBLIC KEY-----"',
    'ESCAPED_PEM = "-----BEGIN PUBLIC KEY-----\\nABC123\\n-----END PUBLIC KEY-----"',
    "SINGLE_QUOTED_HASH = 'keep#hash'",
  ].join('\n');

  const parsed = parseDotEnvContent(sample);
  assert.equal(parsed.ADMIN_PASSWORD, 'secretPass!');
  assert.equal(parsed.VITE_GAME_SERVER_URL, 'http://79.76.40.148:8080');
  assert.equal(
    parsed.BLOB_WEBHOOK_PUBLIC_KEY,
    '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA/Z6Ly2gO4wljtNfjN3K48W1njB/+1JIoevGpC7SvOKo=\n-----END PUBLIC KEY-----'
  );
  assert.equal(
    parsed.ESCAPED_PEM,
    '-----BEGIN PUBLIC KEY-----\nABC123\n-----END PUBLIC KEY-----'
  );
  assert.equal(parsed.SINGLE_QUOTED_HASH, 'keep#hash');
});

test('loadDotEnv populates missing targetEnv keys without clobbering pre-existing env vars', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-env-'));
  const envFile = path.join(tmpDir, '.env');
  fs.writeFileSync(
    envFile,
    'FOO = from_file\nBAR = "line1\\nline2"\n',
    'utf8'
  );
  const envObj = { FOO: 'preexisting' };
  const loaded = loadDotEnv(envFile, envObj);
  assert.equal(loaded, true);
  assert.equal(envObj.FOO, 'preexisting');
  assert.equal(envObj.BAR, 'line1\nline2');
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('normalizeServerUrl routes Oracle IP and sslip.io to wss-ready ws.glimmerfall.online', () => {
  assert.equal(normalizeServerUrl('http://79.76.40.148:8080/'), 'https://ws.glimmerfall.online');
  assert.equal(normalizeServerUrl('http://79.76.40.148.sslip.io:8080'), 'https://ws.glimmerfall.online');
  assert.equal(normalizeServerUrl('http://localhost:8080'), 'http://localhost:8080');
  assert.equal(KNOWN_SERVER_FALLBACKS[0], 'https://ws.glimmerfall.online');
});
