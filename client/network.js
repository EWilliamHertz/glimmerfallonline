// ==========================================
// GlimmerFall Online 2D — Real-Time & Unified GlimmerFall ID Client
// Connects to /ws (Authoritative Real-Time Server) and /api/* (Cloud Realm Roster & SSO)
// ==========================================

const TOKEN_STORAGE_KEY = 'glimmerfall_auth_token';

export class MultiplayerClient {
  constructor({ onPacket, onStatusChange }) {
    this.onPacket = onPacket;
    this.onStatusChange = onStatusChange;
    this.ws = null;
    this.connected = false;
    this.playerId = null;
    this.profile = null;
    this.pingMs = 0;
    this.onPing = null;
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.token = this.loadStoredToken();
    this.manualReconnect = false;
    this.preferredRoom = null;
    this.pendingRpc = new Map();
    this.isBootstrapping = false;
  }

  loadStoredToken() {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch (_) {
      return '';
    }
  }

  getDefaultServerBase() {
    try {
      const env = import.meta.env?.VITE_GAME_SERVER_URL;
      if (env) return String(env).trim().replace(/\/+$/, '');
    } catch (_) {}
    return '';
  }

  getServerBase() {
    try {
      const params = new URLSearchParams(window.location.search);
      const qServer = params.get('server');
      if (qServer) {
        const clean = qServer.trim().replace(/\/+$/, '');
        localStorage.setItem('glimmerfall_server_url', clean);
        return clean;
      }
      const stored = localStorage.getItem('glimmerfall_server_url');
      if (stored) return stored.trim().replace(/\/+$/, '');
    } catch (_) {}
    return this.getDefaultServerBase();
  }

  // Free hosts (Render etc.) sleep when idle — poke the game server as early as possible
  // so it is awake by the time the player finishes the character screen.
  wakeServer() {
    const base = this.getServerBase();
    if (!base || typeof fetch === 'undefined') return;
    fetch(`${base}/api/status`, { mode: 'cors', headers: { 'ngrok-skip-browser-warning': '1' } }).catch(() => {});
  }

  setServerBase(url) {
    try {
      if (url) localStorage.setItem('glimmerfall_server_url', String(url).trim().replace(/\/+$/, ''));
      else localStorage.removeItem('glimmerfall_server_url');
    } catch (_) {}
    this.connectWebSocket();
  }

  saveStoredToken(tok) {
    this.token = tok || '';
    try {
      if (tok) localStorage.setItem(TOKEN_STORAGE_KEY, tok);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (_) {}
  }

  async bootstrapAndConnect(clientProgression = null) {
    if (this.isBootstrapping) return this.profile;
    this.isBootstrapping = true;
    try {
      // 1. Check URL query string for OAuth / glimmerfalltcg.com SSO handoff token!
      try {
        const params = new URLSearchParams(window.location.search);
        const ssoTok = params.get('sso_token') || params.get('glimmerfall_token');
        const tcgHandle = params.get('tcg_handle');
        if (ssoTok || tcgHandle) {
          await this.linkTcgSso({ ssoToken: ssoTok, tcgHandle });
          params.delete('sso_token');
          params.delete('glimmerfall_token');
          params.delete('tcg_handle');
          const cleanQuery = params.toString();
          window.history.replaceState({}, '', window.location.pathname + (cleanQuery ? `?${cleanQuery}` : ''));
        }
      } catch (_) {}

      // 2. Ensure valid guest or persistent GlimmerFall ID token via /api/auth/guest
      this.wakeServer();
      try {
        const gBase = this.getServerBase();
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const abortTimer = ctrl ? setTimeout(() => ctrl.abort(), 7000) : null;
        const res = await fetch(`${gBase}/api/auth/guest`, {
          signal: ctrl ? ctrl.signal : undefined,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '1',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          body: JSON.stringify({
            token: this.token || undefined,
            clientProgression,
          }),
        });
        if (abortTimer) clearTimeout(abortTimer);
        if (res.ok) {
          const data = await res.json();
          if (data.token) this.saveStoredToken(data.token);
          if (data.profile) this.profile = data.profile;
        }
      } catch (_) {}

      this.connectWebSocket();
      return this.profile;
    } finally {
      this.isBootstrapping = false;
    }
  }

  connectWebSocket() {
    if (typeof window === 'undefined' || !window.WebSocket) return;
    if (window.location.protocol === 'file:') return;

    // Prevent thrashing if connection is already healthy and active
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.manualReconnect = true;
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }

    const qs = new URLSearchParams();
    if (this.token) qs.set('token', this.token);
    if (this.preferredRoom) qs.set('room', this.preferredRoom);
    qs.set('ngrok-skip-browser-warning', '1');
    if (this.currentCoords && Number.isFinite(this.currentCoords.x) && Number.isFinite(this.currentCoords.y)) {
      qs.set('x', String(Math.round(this.currentCoords.x)));
      qs.set('y', String(Math.round(this.currentCoords.y)));
    }
    const qStr = qs.toString() ? `?${qs.toString()}` : '';

    const serverBase = this.getServerBase();
    let url;
    if (serverBase) {
      const isHttps = serverBase.startsWith('https:');
      const wsProto = isHttps ? 'wss:' : 'ws:';
      const cleanHost = serverBase.replace(/^https?:\/\//i, '');
      url = `${wsProto}//${cleanHost}/ws${qStr}`;
    } else {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${wsProto}//${window.location.host}/ws${qStr}`;
    }

    let sock;
    try {
      sock = new WebSocket(url);
    } catch (_) {
      this.scheduleReconnect();
      return;
    }

    this.ws = sock;
    this.manualReconnect = false;

    sock.onopen = () => {
      this.connected = true;
      if (this.onStatusChange) this.onStatusChange(true);
      clearInterval(this.pingInterval);
      this.send({ type: 'ping', ts: performance.now() });
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === 1) {
          this.send({ type: 'ping', ts: performance.now() });
        }
      }, 1000);
    };

    sock.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'session_token' && msg.token) {
          this.saveStoredToken(msg.token);
          return;
        }
        if (msg.type === 'auth_rpc_res') {
          const pending = this.pendingRpc.get(msg.reqId);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingRpc.delete(msg.reqId);
            pending.resolve(msg);
          }
          return;
        }
        if (msg.type === 'pong' && typeof msg.ts === 'number') {
          const sample = Math.max(1, Math.round(performance.now() - msg.ts));
          // Moving average filter to prevent transient timer outliers from latching
          if (!this.pingMs || this.pingMs <= 0) {
            this.pingMs = sample;
          } else {
            this.pingMs = Math.round(this.pingMs * 0.65 + sample * 0.35);
          }
          if (this.onPing) this.onPing(this.pingMs);
          return;
        }
        if (msg.type === 'welcome') {
          this.playerId = msg.playerId;
          this.profile = msg.profile;
        } else if (msg.type === 'profile_updated') {
          this.profile = msg.profile;
        }
        if (this.onPacket) this.onPacket(msg);
      } catch (_) {}
    };

    sock.onclose = (ev) => {
      const wasConnected = this.connected;
      this.connected = false;
      clearInterval(this.pingInterval);
      const isSuperseded = ev?.code === 4001;
      if (wasConnected && this.onStatusChange) {
        this.onStatusChange(false, isSuperseded ? 'superseded' : 'disconnected');
      }
      if (isSuperseded) {
        console.warn('[Network] Disconnected: Session opened from another window or tab.');
        return; // Halt reconnect duel: do not schedule reconnect!
      }
      if (!this.manualReconnect) {
        this.scheduleReconnect();
      }
    };

    sock.onerror = (err) => {
      console.warn('[Network] WebSocket error occurred:', err?.message || err);
    };
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 2500);
  }

  disconnect() {
    this.manualReconnect = true;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingInterval);
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.connected = false;
    if (this.onStatusChange) this.onStatusChange(false);
  }

  send(packet) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(packet));
      return true;
    }
    return false;
  }

  // Map REST endpoints to authenticated WebSocket RPC actions (used if HTTP fetch fails,
  // e.g. Safari "Load failed" over tunnels / proxies).
  static WS_RPC_MAP = {
    'POST /api/auth/register': 'register',
    'POST /api/auth/login': 'login',
    'POST /api/characters': 'save_character',
    'DELETE /api/characters': 'delete_character',
    'PATCH /api/account/profile': 'update_profile',
    'POST /api/auth/sso/glimmerfall': 'link_tcg',
  };

  wsRpc(action, payload, timeoutMs = 9000) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== 1) {
        reject(new Error('Cannot reach the GlimmerFall server. Check your connection and try again.'));
        return;
      }
      const reqId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timer = setTimeout(() => {
        this.pendingRpc.delete(reqId);
        reject(new Error('Server timed out. Please try again.'));
      }, timeoutMs);
      this.pendingRpc.set(reqId, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ type: 'auth_rpc', reqId, action, payload }));
    });
  }

  async apiCall(path, method = 'POST', body = null) {
    const action = MultiplayerClient.WS_RPC_MAP[`${method} ${path}`];
    // If WebSocket is already connected, try WS RPC first for supported actions (zero CORS overhead!)
    if (action && this.ws && this.ws.readyState === 1) {
      try {
        const wsRes = await this.wsRpc(action, body || {}, 3500);
        if (wsRes && wsRes.ok) return wsRes;
      } catch (wsErr) {
        console.warn('[Network] wsRpc failed, attempting HTTP fallback:', wsErr?.message || wsErr);
      }
    }

    const base = this.getServerBase();
    const doFetch = (url, timeoutMs = 3500) => {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
      return fetch(url, {
        signal: ctrl ? ctrl.signal : undefined,
        method,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }).finally(() => {
        if (timer) clearTimeout(timer);
      });
    };

    let res;
    try {
      res = await doFetch(base ? `${base}${path}` : path);
    } catch (_networkErr) {
      // Game server asleep/unreachable: same-origin cloud /api fallback shares the persistent realm
      if (base) {
        try {
          res = await doFetch(path);
        } catch (_) {
          res = null;
        }
      }
      if (!res) {
        if (action && this.ws && this.ws.readyState === 1) {
          const data = await this.wsRpc(action, body || {}, 4000);
          if (!data.ok) throw new Error(data.error || 'Server request failed');
          return data;
        }
        throw new Error('Cannot reach the GlimmerFall realm. If the realm was idle it may be waking up — wait ~30s and try again.');
      }
    }

    if (res.status === 404 && this.ws && this.ws.readyState === 1) {
      if (action) {
        const data = await this.wsRpc(action, body || {}, 4000);
        if (!data.ok) throw new Error(data.error || 'Server request failed');
        return data;
      }
    }

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      if (res.status === 404) {
        throw new Error('Realm API service unreachable. Please ensure the server realm is active.');
      }
      throw new Error(`Server returned an unexpected response (HTTP ${res.status}). Please try again.`);
    }
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  }

  async register(payload) {
    const data = await this.apiCall('/api/auth/register', 'POST', {
      ...payload,
      currentToken: this.token,
    });
    const idChanged = !this.profile || this.profile.id !== data.profile.id;
    this.saveStoredToken(data.token);
    this.profile = data.profile;
    if (idChanged) this.connectWebSocket();
    return data.profile;
  }

  async login({ username, password }) {
    const data = await this.apiCall('/api/auth/login', 'POST', { username, password });
    this.saveStoredToken(data.token);
    this.profile = data.profile;
    this.connectWebSocket();
    return data.profile;
  }

  async linkTcgSso({ tcgHandle, tcgEmail, ssoToken }) {
    const data = await this.apiCall('/api/auth/sso/glimmerfall', 'POST', {
      tcgHandle,
      tcgEmail,
      ssoToken,
      currentToken: this.token,
    });
    if (data.token) this.saveStoredToken(data.token);
    if (data.profile) this.profile = data.profile;
    return data.profile;
  }

  async updateProfile(patch) {
    const data = await this.apiCall('/api/account/profile', 'PATCH', patch);
    this.profile = data.profile;
    return data.profile;
  }

  async saveOrSelectCharacter(payload) {
    const data = await this.apiCall('/api/characters', 'POST', payload);
    if (data.profile) this.profile = data.profile;
    return data;
  }

  async deleteCharacter(characterId) {
    const data = await this.apiCall('/api/characters', 'DELETE', { characterId });
    if (data.profile) this.profile = data.profile;
    return data.profile;
  }

  logout() {
    this.saveStoredToken(null);
    this.profile = null;
    this.disconnect();
  }
}
