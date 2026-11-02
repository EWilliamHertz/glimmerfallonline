// ==========================================
// GlimmerFall Online 2D — WebSocket & Unified GlimmerFall ID Client
// Connects to /ws (20Hz Authoritative Server) and /api/* (Neon PostgreSQL Roster & SSO)
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
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.token = this.loadStoredToken();
    this.manualReconnect = false;
    this.preferredRoom = null;
  }

  loadStoredToken() {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch (_) {
      return '';
    }
  }

  saveStoredToken(tok) {
    this.token = tok || '';
    try {
      if (tok) localStorage.setItem(TOKEN_STORAGE_KEY, tok);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (_) {}
  }

  async bootstrapAndConnect(clientProgression = null) {
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
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({
          token: this.token || undefined,
          clientProgression,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) this.saveStoredToken(data.token);
        if (data.profile) this.profile = data.profile;
      }
    } catch (_) {}

    this.connectWebSocket();
    return this.profile;
  }

  connectWebSocket() {
    if (typeof window === 'undefined' || !window.WebSocket) return;
    if (window.location.protocol === 'file:') return;

    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.manualReconnect = true;
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }

    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const qs = new URLSearchParams();
    if (this.token) qs.set('token', this.token);
    if (this.preferredRoom) qs.set('room', this.preferredRoom);
    const qStr = qs.toString() ? `?${qs.toString()}` : '';
    const url = `${wsProto}//${window.location.host}/ws${qStr}`;

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
        this.send({ type: 'ping', ts: performance.now() });
      }, 3000);
    };

    sock.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'session_token' && msg.token) {
          this.saveStoredToken(msg.token);
          return;
        }
        if (msg.type === 'pong' && msg.ts) {
          this.pingMs = Math.max(1, Math.round(performance.now() - msg.ts));
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

    sock.onclose = () => {
      const wasConnected = this.connected;
      this.connected = false;
      clearInterval(this.pingInterval);
      if (wasConnected && this.onStatusChange) this.onStatusChange(false);
      if (!this.manualReconnect) {
        this.scheduleReconnect();
      }
    };

    sock.onerror = () => {};
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 2500);
  }

  send(packet) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(packet));
      return true;
    }
    return false;
  }

  async apiCall(path, method = 'POST', body = null) {
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
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
}
