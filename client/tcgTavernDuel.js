// ==========================================
// GlimmerFall Online 2D — Interactive 1v1 GlimmerFallTCG.com Tavern Card Game UI
// Full 1v1 Arena Battlefield, Live Neon PostgreSQL Deck Lists, 322-Card Catalog,
// AI (GlimmerBot) + Live PvP Matchmaking + Room Codes + Spectating
// ==========================================

import {
  TCG_FALLBACK_CARDS,
  TCG_FALLBACK_DECKS,
  TCG_FALLBACK_STARTER_DECKS,
} from '../shared/tcgCatalogFallback.js';
import {
  AI_NAME,
  CARDBACK_URL,
  FALLBACK_CARDBACK_URL,
  TCG_RARITY_ICONS,
  applyAction,
  buildDeck,
  getDesignerCardUrl,
  getTcgFactionConfig,
  hasGuard,
  newMatchState,
  redactState,
} from '../shared/tcgGameEngine.js';

const TCG_AUDIO_FILES = {
  draw: '/audio/draw.mp3',
  play: '/audio/play.mp3',
  attack: '/audio/attack.mp3',
  nexus_hit: '/audio/nexus_hit.mp3',
  spell: '/audio/spell.mp3',
  pass: '/audio/pass.mp3',
  victory: '/audio/victory.mp3',
  defeat: '/audio/defeat.mp3',
};

function playTcgSfx(kind, muted = false) {
  if (muted || typeof Audio === 'undefined') return;
  const src = TCG_AUDIO_FILES[kind];
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = 0.28;
    a.play().catch(() => {});
  } catch (_) {}
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCardHtml(card, opts = {}) {
  const {
    size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
    hidden = false,
    selected = false,
    exhausted = false,
    isTarget = false,
    dimmed = false,
    actionAttr = '',
    inspectAttr = '',
    draggable = false,
    testId = '',
  } = opts;

  if (hidden || card?.hidden) {
    return `
      <div class="gf-tcg-card gf-tcg-card-${size} gf-tcg-card-hidden" ${testId ? `data-testid="${escapeHtml(testId)}"` : ''}>
        <img src="${CARDBACK_URL}" onerror="this.onerror=null;this.src='${FALLBACK_CARDBACK_URL}'" alt="GlimmerFall Card Back" draggable="false" />
      </div>
    `;
  }

  const f = getTcgFactionConfig(card?.faction);
  const designerUrl = getDesignerCardUrl(card?.name);
  const isDesigner = Boolean(designerUrl);
  const imgUrl =
    card?.image_url && card.image_url !== 'None'
      ? card.image_url
      : isDesigner
      ? designerUrl
      : CARDBACK_URL;

  const type = card?.cardType || card?.card_type || 'Entity';
  const isEntity = type === 'Entity';
  const power = card?.power;
  const health = card?.curHealth !== null && card?.curHealth !== undefined ? card.curHealth : card?.health;
  const damaged =
    card?.curHealth !== null &&
    card?.curHealth !== undefined &&
    card?.health !== null &&
    card?.health !== undefined &&
    card.curHealth < card.health;
  const kws = Array.isArray(card?.keywords)
    ? card.keywords
    : card?.keywords && card.keywords !== 'None'
    ? String(card.keywords).split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const isGuard = kws.includes('Guard') && !kws.includes('Stealth');
  const isStealth = kws.includes('Stealth');
  const rarityIcon = TCG_RARITY_ICONS[card?.rarity] || TCG_RARITY_ICONS.Common;

  const classes = [
    'gf-tcg-card',
    `gf-tcg-card-${size}`,
    selected ? 'gf-tcg-card-selected' : '',
    isTarget ? 'gf-tcg-card-target' : '',
    dimmed ? 'gf-tcg-card-dimmed' : '',
    isGuard ? 'gf-tcg-card-guard' : '',
    isStealth ? 'gf-tcg-card-stealth' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div
      class="${classes}"
      style="--tcg-faction-color:${f.color}; --tcg-faction-soft:${f.soft}; --tcg-faction-glow:${f.glow};"
      ${actionAttr}
      ${draggable ? `draggable="true" data-drag-instance="${escapeHtml(card.instanceId)}"` : ''}
      ${testId ? `data-testid="${escapeHtml(testId)}"` : ''}
    >
      <div class="gf-tcg-card-inner">
        <img
          src="${escapeHtml(imgUrl)}"
          onerror="this.onerror=null;this.src='${FALLBACK_CARDBACK_URL}'"
          alt="${escapeHtml(card?.name || 'Card')}"
          class="gf-tcg-card-art ${isDesigner ? 'gf-tcg-art-fill' : 'gf-tcg-art-cover'}"
          draggable="false"
        />
        <div class="gf-tcg-card-tint"></div>

        <!-- Energy Cost Badge -->
        <div class="gf-tcg-cost-orb" title="Energy Cost: ${escapeHtml(card?.cost ?? 0)}">
          ${escapeHtml(card?.cost ?? 0)}
        </div>

        <!-- Rarity Icon -->
        <img src="${escapeHtml(rarityIcon)}" alt="${escapeHtml(card?.rarity || 'Common')}" class="gf-tcg-rarity-icon" draggable="false" />

        ${
          inspectAttr
            ? `<button type="button" class="gf-tcg-inspect-btn" ${inspectAttr} title="Inspect Card">🔍</button>`
            : ''
        }

        <!-- Bottom Card Frame Info -->
        <div class="gf-tcg-card-footer ${isEntity ? 'has-stats' : ''}">
          <div class="gf-tcg-card-name">${escapeHtml(card?.name || 'Card')}</div>
          <div class="gf-tcg-card-tags">
            <span class="gf-tcg-type-pill">${escapeHtml(card?.faction || 'Aether')} · ${escapeHtml(type)}</span>
            ${kws
              .slice(0, 3)
              .map((k) => `<span class="gf-tcg-kw-pill">${escapeHtml(k)}</span>`)
              .join('')}
          </div>
          ${
            size !== 'xs' && size !== 'sm' && card?.description
              ? `<div class="gf-tcg-card-desc">${escapeHtml(card.description)}</div>`
              : ''
          }
        </div>

        <!-- Entity Power / Health Pill -->
        ${
          isEntity && power !== null && power !== undefined
            ? `<div class="gf-tcg-stat-pill ${damaged ? 'is-damaged' : ''}">
                <span>⚔️${escapeHtml(power)}</span>
                <span class="sep">/</span>
                <span class="${damaged ? 'hp-damaged' : ''}">❤️${escapeHtml(health)}</span>
              </div>`
            : ''
        }

        ${
          exhausted
            ? `<div class="gf-tcg-exhausted-overlay"><span>EXHAUSTED</span></div>`
            : ''
        }
      </div>
    </div>
  `;
}

export class TcgTavernDuelController {
  constructor({
    getPlayerName = () => 'Summoner',
    getPlayerFaction = () => 'Solari',
    getOnlinePlayers = () => [],
    sendWs = () => false,
    apiBase = '',
    onMatchVictory = () => {},
    onLogChat = () => {},
  } = {}) {
    this.getPlayerName = getPlayerName;
    this.getPlayerFaction = getPlayerFaction;
    this.getOnlinePlayers = getOnlinePlayers;
    this.sendWs = sendWs;
    this.apiBase = apiBase;
    this.onMatchVictory = onMatchVictory;
    this.onLogChat = onLogChat;

    this.cards = TCG_FALLBACK_CARDS;
    this.decks = TCG_FALLBACK_DECKS;
    this.starterDecks = TCG_FALLBACK_STARTER_DECKS;
    this.deckSource = 'neon_postgres';

    this.selectedDeckId = TCG_FALLBACK_DECKS[2]?.id || TCG_FALLBACK_DECKS[0]?.id || 3; // Default Solar Singularity
    this.selectedDeckName = TCG_FALLBACK_DECKS[2]?.deck_name || 'Solar Singularity';
    this.aiDeckName = ''; // '' = Random Official Precon
    this.roomCodeInput = '';
    this.challengeTargetInput = '';

    // Views: 'lobby' | 'deck_inspector' | 'deck_builder' | 'waiting' | 'match'
    this.view = 'lobby';
    this.activeMatch = null; // { matchId, slot, roomCode, status, vsAI, state, isLocalEngine, rawLocalState }
    this.selectedHandInstanceId = null;
    this.selectedAttackerId = null;
    this.pendingSpellCard = null;
    this.inspectCard = null;
    this.viewingVoidSlot = null; // 'me' | 'opp' | null
    this.featuredMatches = [];
    this.muted = localStorage.getItem('gf_tcg_muted') === 'true';
    this.busy = false;
    this.pollTimer = null;

    // Custom Deck Builder state
    this.builderName = 'My Tavern Deck';
    this.builderFactionFilter = 'ALL';
    this.builderSearch = '';
    this.builderCounts = new Map(); // cardName -> count

    this._injectStyles();
    this._ensureModalDom();
  }

  _apiUrl(path) {
    return `${this.apiBase || ''}${path}`;
  }

  async syncCatalogAndDecks() {
    try {
      const [cardsRes, decksRes, featRes] = await Promise.all([
        fetch(this._apiUrl('/api/tcg/cards')).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(this._apiUrl('/api/tcg/decks')).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(this._apiUrl('/api/tcg/featured')).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (cardsRes?.ok && Array.isArray(cardsRes.cards) && cardsRes.cards.length > 0) {
        this.cards = cardsRes.cards;
      }
      if (decksRes?.ok && Array.isArray(decksRes.decks) && decksRes.decks.length > 0) {
        this.decks = decksRes.decks;
        if (Array.isArray(decksRes.starterDecks)) this.starterDecks = decksRes.starterDecks;
        this.deckSource = decksRes.source || 'neon_postgres';
        const hasSel = this.decks.some((d) => String(d.id) === String(this.selectedDeckId));
        if (!hasSel) {
          this.selectedDeckId = this.decks[0].id;
          this.selectedDeckName = this.decks[0].deck_name;
        }
      }
      if (featRes?.ok && Array.isArray(featRes.matches)) {
        this.featuredMatches = featRes.matches;
      }
    } catch (_) {}
    if (this.isOpen()) this.render();
  }

  isOpen() {
    const el = document.getElementById('tcg-tavern-modal');
    return Boolean(el && !el.classList.contains('hidden'));
  }

  open(initialTargetPlayer = '') {
    const el = document.getElementById('tcg-tavern-modal');
    if (!el) return;
    if (initialTargetPlayer) {
      this.challengeTargetInput = initialTargetPlayer;
    }
    el.classList.remove('hidden');
    this.syncCatalogAndDecks();
    this.render();
  }

  close() {
    const el = document.getElementById('tcg-tavern-modal');
    if (el) el.classList.add('hidden');
    this._stopPolling();
  }

  getSelectedDeck() {
    return (
      this.decks.find((d) => String(d.id) === String(this.selectedDeckId)) ||
      this.decks.find((d) => d.deck_name === this.selectedDeckName) ||
      this.decks[0] ||
      TCG_FALLBACK_DECKS[0]
    );
  }

  // ---- Real-time WebSocket Event Hooks from MMO Server ----
  onServerMatchJoined(pkt) {
    this.activeMatch = {
      matchId: pkt.matchId,
      slot: Number(pkt.slot || 1),
      roomCode: pkt.roomCode,
      status: pkt.status || pkt.state?.phase || 'PLAYING',
      vsAI: Boolean(pkt.vsAI),
      deckName: pkt.deckName || this.selectedDeckName,
      opponentDeckName: pkt.opponentDeckName || '',
      state: pkt.state,
      isLocalEngine: false,
    };
    this.selectedHandInstanceId = null;
    this.selectedAttackerId = null;
    this.pendingSpellCard = null;
    this.view = this.activeMatch.status === 'WAITING' ? 'waiting' : 'match';
    const el = document.getElementById('tcg-tavern-modal');
    if (el) el.classList.remove('hidden');
    if (!this.activeMatch.vsAI) {
      this._startPolling();
    }
    this.render();
  }

  onServerStateUpdate(pkt) {
    if (!this.activeMatch || String(this.activeMatch.matchId) !== String(pkt.matchId)) {
      return;
    }
    const prevPhase = this.activeMatch.state?.phase;
    this.activeMatch.state = pkt.state;
    this.activeMatch.status = pkt.status || pkt.state?.phase || 'PLAYING';
    if (this.view === 'waiting' && this.activeMatch.status !== 'WAITING') {
      this.view = 'match';
    }
    if (prevPhase !== 'ENDED' && this.activeMatch.state?.phase === 'ENDED') {
      const won = String(this.activeMatch.state.winner) === String(this.activeMatch.slot);
      playTcgSfx(won ? 'victory' : 'defeat', this.muted);
    }
    this.render();
  }

  onIncomingInvite(pkt) {
    // Show an interactive invite banner in the corner of the screen
    let banner = document.getElementById('tcg-invite-toast');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'tcg-invite-toast';
      document.body.appendChild(banner);
    }
    banner.innerHTML = `
      <div class="gf-tcg-invite-card">
        <div class="gf-tcg-invite-title">🃏 1v1 GLIMMERFALL TCG CHALLENGE</div>
        <div class="gf-tcg-invite-sub">
          <strong>${escapeHtml(pkt.senderName)}</strong> challenges you from the Tavern Table!
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Challenger Deck: ${escapeHtml(pkt.senderDeckName || 'Custom')} · Room ${escapeHtml(pkt.roomCode)}</div>
        </div>
        <div class="gf-tcg-invite-actions">
          <button type="button" id="tcg-inv-accept-btn" class="gf-tcg-btn gf-tcg-btn-gold">⚔️ ACCEPT DUEL</button>
          <button type="button" id="tcg-inv-decline-btn" class="gf-tcg-btn gf-tcg-btn-ghost">DECLINE</button>
        </div>
      </div>
    `;
    banner.classList.remove('hidden');

    document.getElementById('tcg-inv-accept-btn')?.addEventListener('click', () => {
      banner.classList.add('hidden');
      const deck = this.getSelectedDeck();
      const sent = this.sendWs({
        type: 'tcg_challenge_respond',
        inviteId: pkt.inviteId,
        accept: true,
        deckId: deck?.id,
        deckName: deck?.deck_name,
      });
      if (!sent) {
        this.startMatch({ vsAI: false, roomCode: pkt.roomCode });
      }
      this.open();
    });

    document.getElementById('tcg-inv-decline-btn')?.addEventListener('click', () => {
      banner.classList.add('hidden');
      this.sendWs({
        type: 'tcg_challenge_respond',
        inviteId: pkt.inviteId,
        accept: false,
      });
    });
  }

  // ---- Starting a Match (vs AI, Room Code, Quick Queue, or Player Challenge) ----
  async startMatch({ vsAI = true, roomCode = '', spectateId = null } = {}) {
    if (this.busy) return;
    this.busy = true;
    const deck = this.getSelectedDeck();
    const username = this.getPlayerName() || 'Summoner';

    try {
      if (spectateId) {
        const res = await fetch(this._apiUrl(`/api/tcg/match?id=${encodeURIComponent(spectateId)}&slot=1&isSpectator=true`));
        if (res.ok) {
          const data = await res.json();
          this.activeMatch = {
            matchId: data.matchId,
            slot: 1,
            roomCode: data.roomCode,
            status: data.status,
            vsAI: false,
            isSpectator: true,
            state: data.state,
            isLocalEngine: false,
          };
          this.view = 'match';
          this._startPolling();
          this.render();
          return;
        }
      }

      // Try REST endpoint first so match is persisted to Neon PostgreSQL
      const resp = await fetch(this._apiUrl('/api/tcg/matchmaking'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          deckId: deck?.id,
          deckName: deck?.deck_name,
          vsAI,
          aiDeckName: this.aiDeckName || null,
          roomCode: roomCode || null,
        }),
      }).catch(() => null);

      if (resp && resp.ok) {
        const data = await resp.json();
        this.activeMatch = {
          matchId: data.matchId,
          slot: Number(data.slot || 1),
          roomCode: data.roomCode,
          status: data.status,
          vsAI: Boolean(data.vsAI),
          deckName: data.deckName || deck?.deck_name,
          opponentDeckName: data.opponentDeckName || '',
          state: data.state,
          isLocalEngine: false,
        };
        this.selectedHandInstanceId = null;
        this.selectedAttackerId = null;
        this.pendingSpellCard = null;
        this.view = data.status === 'WAITING' ? 'waiting' : 'match';
        if (!this.activeMatch.vsAI) {
          this._startPolling();
        }
        this.render();
        return;
      }

      // Offline / Instant Local Engine Fallback (works 100% offline with all 322 cards & 6 decks!)
      const deck1 = buildDeck(this.cards, {
        deck,
        deckName: deck?.deck_name,
        decksPool: this.decks,
      });
      const precons = this.decks.filter((d) => d.is_preconstructed);
      const poolDecks = precons.length > 0 ? precons : this.decks;
      const aiDeckObj =
        (this.aiDeckName && poolDecks.find((d) => d.deck_name === this.aiDeckName)) ||
        poolDecks[Math.floor(Math.random() * poolDecks.length)] ||
        this.decks[0];
      const deck2 = buildDeck(this.cards, {
        deck: aiDeckObj,
        deckName: aiDeckObj?.deck_name,
        decksPool: this.decks,
      });
      const rawState = newMatchState(username, deck1, AI_NAME, deck2, true, {
        p1DeckName: deck?.deck_name || 'Custom',
        p2DeckName: aiDeckObj?.deck_name || 'Solar Singularity',
      });

      this.activeMatch = {
        matchId: Date.now(),
        slot: 1,
        roomCode: 'LOCAL',
        status: rawState.phase,
        vsAI: true,
        deckName: deck?.deck_name || 'Custom',
        opponentDeckName: aiDeckObj?.deck_name || 'Solar Singularity',
        rawLocalState: rawState,
        state: redactState(rawState, 1),
        isLocalEngine: true,
      };
      this.selectedHandInstanceId = null;
      this.selectedAttackerId = null;
      this.pendingSpellCard = null;
      this.view = 'match';
      this.render();
    } finally {
      this.busy = false;
    }
  }

  async performMatchAction(action, payload = {}) {
    if (!this.activeMatch || this.busy || this.activeMatch.isSpectator) return;
    this.busy = true;

    try {
      const slot = this.activeMatch.slot || 1;
      const prevPhase = this.activeMatch.state?.phase;

      // Play SFX
      if (action === 'DRAW_CARD') playTcgSfx('draw', this.muted);
      else if (action === 'PLAY_CARD') playTcgSfx('play', this.muted);
      else if (action === 'ATTACK_ENTITY') playTcgSfx('attack', this.muted);
      else if (action === 'ATTACK_NEXUS') playTcgSfx('nexus_hit', this.muted);
      else if (action === 'CAST_SPELL') playTcgSfx('spell', this.muted);
      else if (action === 'END_TURN') playTcgSfx('pass', this.muted);

      if (this.activeMatch.isLocalEngine && this.activeMatch.rawLocalState) {
        try {
          applyAction(this.activeMatch.rawLocalState, slot, action, payload);
          this.activeMatch.state = redactState(
            this.activeMatch.rawLocalState,
            this.activeMatch.rawLocalState.phase === 'ENDED' ? 0 : slot
          );
          this.activeMatch.status = this.activeMatch.rawLocalState.phase;
        } catch (err) {
          this._showBannerToast(err.message || 'Illegal move.', 'error');
        }
      } else {
        const resp = await fetch(this._apiUrl('/api/tcg/action'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: this.activeMatch.matchId,
            slot,
            action,
            payload,
          }),
        }).catch(() => null);

        if (resp && resp.ok) {
          const data = await resp.json();
          this.activeMatch.state = data.state;
          this.activeMatch.status = data.status || data.state?.phase;
        } else if (resp) {
          const errData = await resp.json().catch(() => ({}));
          this._showBannerToast(errData.error || 'Illegal move.', 'error');
        }
      }

      if (prevPhase !== 'ENDED' && this.activeMatch.state?.phase === 'ENDED') {
        const won = String(this.activeMatch.state.winner) === String(slot);
        playTcgSfx(won ? 'victory' : 'defeat', this.muted);
        if (won) {
          this.onMatchVictory({
            vsAI: this.activeMatch.vsAI,
            deckName: this.activeMatch.deckName,
            turn: this.activeMatch.state.turn,
          });
        }
      }

      this.selectedHandInstanceId = null;
      this.selectedAttackerId = null;
      this.pendingSpellCard = null;
      this.render();
    } finally {
      this.busy = false;
    }
  }

  _startPolling() {
    this._stopPolling();
    this.pollTimer = setInterval(async () => {
      if (!this.activeMatch || this.activeMatch.isLocalEngine) return;
      try {
        const res = await fetch(
          this._apiUrl(
            `/api/tcg/match?id=${encodeURIComponent(this.activeMatch.matchId)}&slot=${encodeURIComponent(
              this.activeMatch.slot || 1
            )}&isSpectator=${this.activeMatch.isSpectator ? 'true' : 'false'}`
          )
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.state) {
          const changed =
            data.status !== this.activeMatch.status ||
            data.state.turn !== this.activeMatch.state?.turn ||
            data.state.activePlayer !== this.activeMatch.state?.activePlayer ||
            (data.state.log?.length || 0) !== (this.activeMatch.state?.log?.length || 0);
          this.activeMatch.state = data.state;
          this.activeMatch.status = data.status;
          if (this.view === 'waiting' && data.status !== 'WAITING') {
            this.view = 'match';
          }
          if (changed) this.render();
        }
      } catch (_) {}
    }, 1600);
  }

  _stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  _showBannerToast(msg, kind = 'info') {
    const el = document.getElementById('tcg-inline-toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `gf-tcg-inline-toast is-${kind}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      if (el) el.className = 'gf-tcg-inline-toast hidden';
    }, 3200);
  }

  // ---- DOM Construction & Event Delegation ----
  _ensureModalDom() {
    if (document.getElementById('tcg-tavern-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'tcg-tavern-modal';
    modal.className = 'gf-tcg-modal-overlay hidden';
    modal.innerHTML = `<div id="tcg-tavern-root" class="gf-tcg-modal-shell"></div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });
  }

  render() {
    const root = document.getElementById('tcg-tavern-root');
    if (!root) return;

    if (this.view === 'waiting' && this.activeMatch) {
      root.innerHTML = this._renderWaitingView();
    } else if (this.view === 'match' && this.activeMatch?.state) {
      root.innerHTML = this._renderMatchView();
    } else if (this.view === 'deck_inspector') {
      root.innerHTML = this._renderDeckInspectorView();
    } else if (this.view === 'deck_builder') {
      root.innerHTML = this._renderDeckBuilderView();
    } else {
      root.innerHTML = this._renderLobbyView();
    }

    this._bindEvents(root);
  }

  _renderLobbyView() {
    const selectedDeck = this.getSelectedDeck();
    const precons = this.decks.filter((d) => d.is_preconstructed);
    const communityDecks = this.decks.filter((d) => !d.is_preconstructed);
    const onlinePlayers = (this.getOnlinePlayers() || []).filter(
      (p) => p && p.name && p.name !== this.getPlayerName()
    );

    return `
      <div class="gf-tcg-header">
        <div class="gf-tcg-brand">
          <span class="gf-tcg-logo-badge">🃏 GLIMMERFALL TCG</span>
          <div>
            <h2 class="gf-tcg-title">TAVERN 1V1 CARD DUEL ARENA</h2>
            <p class="gf-tcg-subtitle">Connected to GlimmerFallTCG.com Oracle Catalog (${this.cards.length} Cards · ${this.decks.length} Decks)</p>
          </div>
        </div>
        <div class="gf-tcg-header-actions">
          <button type="button" data-tcg-cmd="open-deck-inspector" class="gf-tcg-btn gf-tcg-btn-outline">
            🔍 Inspect Deck (${selectedDeck?.total_cards || 40} Cards)
          </button>
          <button type="button" data-tcg-cmd="open-deck-builder" class="gf-tcg-btn gf-tcg-btn-cyan">
            🛠️ Build Custom Deck
          </button>
          <button type="button" data-tcg-cmd="close-modal" class="gf-tcg-btn gf-tcg-btn-ghost">✖ Close</button>
        </div>
      </div>

      <div id="tcg-inline-toast" class="gf-tcg-inline-toast hidden"></div>

      <div class="gf-tcg-lobby-grid">
        <!-- Left Column: Deck Selection from Database -->
        <div class="gf-tcg-lobby-panel">
          <div class="gf-tcg-section-head">
            <span>1. CHOOSE YOUR 40-CARD DECK</span>
            <span class="gf-tcg-db-pill">⚡ Live Deck Lists</span>
          </div>

          <div class="gf-tcg-sublabel">Official Pre-Constructed Theme Decks</div>
          <div class="gf-tcg-deck-grid">
            ${precons
              .map((d) => {
                const isSel = String(d.id) === String(selectedDeck?.id);
                const primaryFac = String(d.factions || 'Solari').split(',')[0] || 'Solari';
                const fCfg = getTcgFactionConfig(primaryFac);
                const coverImg = d.cards?.[0]?.image_url || CARDBACK_URL;
                return `
                  <button
                    type="button"
                    data-tcg-select-deck="${escapeHtml(d.id)}"
                    class="gf-tcg-deck-card ${isSel ? 'is-selected' : ''}"
                    style="--deck-color:${fCfg.color};"
                  >
                    <img src="${escapeHtml(coverImg)}" onerror="this.onerror=null;this.src='${FALLBACK_CARDBACK_URL}'" alt="${escapeHtml(d.deck_name)}" class="gf-tcg-deck-thumb" />
                    <div class="gf-tcg-deck-meta">
                      <div class="gf-tcg-deck-name" style="color:${fCfg.soft};">${escapeHtml(d.deck_name)}</div>
                      <div class="gf-tcg-deck-factions">${escapeHtml(d.factions || 'All Factions')} · ${escapeHtml(d.total_cards || 40)} Cards</div>
                      <div class="gf-tcg-deck-author">By ${escapeHtml(d.username || 'GlimmerFall Official')}</div>
                    </div>
                    ${isSel ? `<span class="gf-tcg-deck-check">✓ ACTIVE</span>` : ''}
                  </button>
                `;
              })
              .join('')}
          </div>

          <div class="gf-tcg-sublabel" style="margin-top:12px;">Community & Saved Database Decks</div>
          <div class="gf-tcg-deck-grid">
            ${communityDecks
              .map((d) => {
                const isSel = String(d.id) === String(selectedDeck?.id);
                const primaryFac = String(d.factions || 'Aether').split(',')[0] || 'Aether';
                const fCfg = getTcgFactionConfig(primaryFac);
                const coverImg = d.cards?.[0]?.image_url || CARDBACK_URL;
                return `
                  <button
                    type="button"
                    data-tcg-select-deck="${escapeHtml(d.id)}"
                    class="gf-tcg-deck-card ${isSel ? 'is-selected' : ''}"
                    style="--deck-color:${fCfg.color};"
                  >
                    <img src="${escapeHtml(coverImg)}" onerror="this.onerror=null;this.src='${FALLBACK_CARDBACK_URL}'" alt="${escapeHtml(d.deck_name)}" class="gf-tcg-deck-thumb" />
                    <div class="gf-tcg-deck-meta">
                      <div class="gf-tcg-deck-name" style="color:${fCfg.soft};">${escapeHtml(d.deck_name)}</div>
                      <div class="gf-tcg-deck-factions">${escapeHtml(d.factions || 'Mixed')} · ${escapeHtml(d.total_cards || 40)} Cards</div>
                      <div class="gf-tcg-deck-author">Crafted by ${escapeHtml(d.username || 'Summoner')}</div>
                    </div>
                    ${isSel ? `<span class="gf-tcg-deck-check">✓ ACTIVE</span>` : ''}
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Right Column: 1v1 Match Modes -->
        <div class="gf-tcg-lobby-panel">
          <div class="gf-tcg-section-head">
            <span>2. SELECT 1V1 DUEL OPPONENT</span>
            <span style="color:#fde047; font-size:11px;">🏆 Win: +85–150 ✨ Glimmer</span>
          </div>

          <!-- Play vs GlimmerBot AI -->
          <div class="gf-tcg-mode-box">
            <div class="gf-tcg-mode-title">🤖 1v1 vs GlimmerBot (Tavern Master AI)</div>
            <p class="gf-tcg-mode-desc">Instant 1v1 match against GlimmerBot piloting an official 40-card deck. Perfect for learning combos or testing deck lists!</p>
            <div class="gf-tcg-ai-row">
              <select id="tcg-ai-deck-select" class="gf-tcg-input">
                <option value="" ${this.aiDeckName === '' ? 'selected' : ''}>🎲 Random Official Deck</option>
                ${precons
                  .map(
                    (d) =>
                      `<option value="${escapeHtml(d.deck_name)}" ${
                        this.aiDeckName === d.deck_name ? 'selected' : ''
                      }>AI Plays: ${escapeHtml(d.deck_name)}</option>`
                  )
                  .join('')}
              </select>
              <button type="button" data-tcg-cmd="play-ai" class="gf-tcg-btn gf-tcg-btn-gold">
                ⚔️ PLAY VS GLIMMERBOT
              </button>
            </div>
          </div>

          <!-- Challenge Online Tavern Player -->
          <div class="gf-tcg-mode-box">
            <div class="gf-tcg-mode-title">🍺 Challenge a Player in the Tavern</div>
            <p class="gf-tcg-mode-desc">Send a live 1v1 card duel invitation to another adventurer in the realm:</p>
            <div class="gf-tcg-ai-row">
              <input
                type="text"
                id="tcg-challenge-input"
                value="${escapeHtml(this.challengeTargetInput)}"
                placeholder="Player name..."
                class="gf-tcg-input"
              />
              <button type="button" data-tcg-cmd="challenge-player" class="gf-tcg-btn gf-tcg-btn-cyan">
                🃏 SEND CHALLENGE
              </button>
            </div>
            ${
              onlinePlayers.length > 0
                ? `<div class="gf-tcg-nearby-chips">
                    <span class="chip-label">Nearby:</span>
                    ${onlinePlayers
                      .slice(0, 6)
                      .map(
                        (p) =>
                          `<button type="button" data-tcg-quick-challenge="${escapeHtml(p.name)}" class="gf-tcg-player-chip">⚔️ ${escapeHtml(p.name)}</button>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>

          <!-- Room Code & Quick Queue -->
          <div class="gf-tcg-mode-box">
            <div class="gf-tcg-mode-title">🔑 Cross-Table Room Code / Matchmaking Queue</div>
            <div class="gf-tcg-ai-row" style="margin-bottom:8px;">
              <input
                type="text"
                id="tcg-room-code-input"
                value="${escapeHtml(this.roomCodeInput)}"
                placeholder="5-Letter Room Code (optional)"
                maxlength="8"
                class="gf-tcg-input"
                style="text-transform:uppercase; letter-spacing:2px;"
              />
              <button type="button" data-tcg-cmd="join-room-code" class="gf-tcg-btn gf-tcg-btn-outline">
                🚪 HOST / JOIN CODE
              </button>
            </div>
            <button type="button" data-tcg-cmd="quick-queue" class="gf-tcg-btn gf-tcg-btn-purple" style="width:100%;">
              🌐 SOLO QUEUE 1V1 MATCHMAKING
            </button>
          </div>

          <!-- Rules Quick Reference -->
          <div class="gf-tcg-rules-mini">
            <div><strong>⚡ Resonance Row:</strong> Drag or tap 1 card per turn to charge a Resonance Node (+1 Max Energy).</div>
            <div><strong>⚔️ Entities & Relics:</strong> Deploy to the Battlefield (no summoning sickness!). Attach Relics to buff Entities.</div>
            <div><strong>✨ Rites & Flashes:</strong> Rites cast on your turn; Flashes cast anytime. Reduce Enemy Nexus from <strong>30 HP → 0</strong>!</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderDeckInspectorView() {
    const deck = this.getSelectedDeck();
    const cardMap = new Map();
    for (const c of this.cards) {
      cardMap.set(c.name.toLowerCase(), c);
    }
    const fullEntries = (deck?.cards || []).map((entry) => {
      const oracle = cardMap.get(String(entry.card_name || '').toLowerCase()) || entry;
      return {
        ...oracle,
        count: entry.count || 1,
      };
    });

    return `
      <div class="gf-tcg-header">
        <div>
          <h2 class="gf-tcg-title">📜 DECK LIST: ${escapeHtml(deck?.deck_name || 'Deck')}</h2>
          <p class="gf-tcg-subtitle">Author: ${escapeHtml(deck?.username || 'GlimmerFall Official')} · ${escapeHtml(deck?.total_cards || 40)} Cards (${escapeHtml(deck?.factions || 'Mixed')})</p>
        </div>
        <div class="gf-tcg-header-actions">
          <button type="button" data-tcg-cmd="back-to-lobby" class="gf-tcg-btn gf-tcg-btn-gold">← Back to Duel Lobby</button>
        </div>
      </div>

      <div class="gf-tcg-inspector-grid">
        ${fullEntries
          .map(
            (c) => `
              <div class="gf-tcg-inspector-item">
                ${renderCardHtml(c, {
                  size: 'md',
                  actionAttr: `data-tcg-inspect-name="${escapeHtml(c.name)}"`,
                })}
                <div class="gf-tcg-copy-badge">${escapeHtml(c.count)}x Copies</div>
              </div>
            `
          )
          .join('')}
      </div>
      ${this._renderInspectModalHtml()}
    `;
  }

  _renderDeckBuilderView() {
    let totalCount = 0;
    for (const ct of this.builderCounts.values()) totalCount += ct;

    const filteredCards = this.cards.filter((c) => {
      if (this.builderFactionFilter !== 'ALL' && c.faction !== this.builderFactionFilter) return false;
      if (this.builderSearch) {
        const q = this.builderSearch.toLowerCase();
        const hay = `${c.name} ${c.card_type} ${c.keywords || ''} ${c.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return `
      <div class="gf-tcg-header">
        <div>
          <h2 class="gf-tcg-title">🛠️ GLIMMERFALL TCG DECK BUILDER (${totalCount} / 40 Cards)</h2>
          <p class="gf-tcg-subtitle">Tap cards to add up to 3 copies. Saved decks persist to the GlimmerFallTCG PostgreSQL database!</p>
        </div>
        <div class="gf-tcg-header-actions">
          <input
            type="text"
            id="tcg-builder-deck-name"
            value="${escapeHtml(this.builderName)}"
            placeholder="Deck Name..."
            class="gf-tcg-input"
            style="width:190px;"
          />
          <button type="button" data-tcg-cmd="save-custom-deck" class="gf-tcg-btn gf-tcg-btn-gold">
            💾 Save Deck (${totalCount}/40)
          </button>
          <button type="button" data-tcg-cmd="back-to-lobby" class="gf-tcg-btn gf-tcg-btn-ghost">← Lobby</button>
        </div>
      </div>

      <div id="tcg-inline-toast" class="gf-tcg-inline-toast hidden"></div>

      <div class="gf-tcg-builder-toolbar">
        ${['ALL', 'Solari', 'Umbri', 'Terra', 'Aether']
          .map(
            (fac) => `
              <button
                type="button"
                data-tcg-builder-fac="${fac}"
                class="gf-tcg-btn ${this.builderFactionFilter === fac ? 'gf-tcg-btn-gold' : 'gf-tcg-btn-outline'}"
              >
                ${fac}
              </button>
            `
          )
          .join('')}
        <input
          type="text"
          id="tcg-builder-search"
          value="${escapeHtml(this.builderSearch)}"
          placeholder="Search 322 cards by name, keyword, or effect..."
          class="gf-tcg-input"
          style="flex:1; min-width:180px;"
        />
        <button type="button" data-tcg-cmd="clear-builder" class="gf-tcg-btn gf-tcg-btn-ghost">Clear</button>
      </div>

      <div class="gf-tcg-inspector-grid">
        ${filteredCards
          .slice(0, 80)
          .map((c) => {
            const count = this.builderCounts.get(c.name) || 0;
            return `
              <div class="gf-tcg-inspector-item">
                ${renderCardHtml(c, {
                  size: 'sm',
                  selected: count > 0,
                  actionAttr: `data-tcg-builder-add="${escapeHtml(c.name)}"`,
                  inspectAttr: `data-tcg-inspect-name="${escapeHtml(c.name)}"`,
                })}
                <div class="gf-tcg-builder-counter">
                  <button type="button" data-tcg-builder-rem="${escapeHtml(c.name)}" class="gf-tcg-cnt-btn">−</button>
                  <span>${count} / 3</span>
                  <button type="button" data-tcg-builder-add="${escapeHtml(c.name)}" class="gf-tcg-cnt-btn">+</button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
      ${this._renderInspectModalHtml()}
    `;
  }

  _renderWaitingView() {
    return `
      <div class="gf-tcg-waiting-wrap">
        <div class="gf-tcg-spinner">✨</div>
        <h2 class="gf-tcg-title">AWAITING CHALLENGER AT THE TAVERN TABLE</h2>
        <p class="gf-tcg-subtitle">Share this 5-letter Room Code with any player in the Tavern or on GlimmerFallTCG.com:</p>
        <div class="gf-tcg-room-code-box">${escapeHtml(this.activeMatch?.roomCode || 'TABLE')}</div>
        <p style="color:#94a3b8; font-size:13px; margin-bottom:18px;">Your Deck: <strong style="color:#fde047;">${escapeHtml(this.activeMatch?.deckName || this.selectedDeckName)}</strong></p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button type="button" data-tcg-cmd="switch-to-ai" class="gf-tcg-btn gf-tcg-btn-gold">🤖 Play vs GlimmerBot Instead</button>
          <button type="button" data-tcg-cmd="leave-match" class="gf-tcg-btn gf-tcg-btn-ghost">Cancel Table</button>
        </div>
      </div>
    `;
  }

  _renderMatchView() {
    const m = this.activeMatch;
    const state = m.state;
    const slot = String(m.slot || 1);
    const oppSlot = slot === '1' ? '2' : '1';
    const me = state.players?.[slot] || { username: 'You', hp: 30, energy: 0, maxEnergy: 0, hand: [], battlefield: [], resonanceRow: [], relics: [], void: [] };
    const opp = state.players?.[oppSlot] || { username: AI_NAME, hp: 30, energy: 0, maxEnergy: 0, hand: [], battlefield: [], resonanceRow: [], relics: [], void: [] };

    const isMyTurn = String(state.activePlayer) === slot && state.phase === 'PLAYING' && !m.isSpectator;
    const ended = state.phase === 'ENDED';
    const enemyHasGuard = hasGuard(opp);

    const selectedHandCard = (me.hand || []).find((c) => c.instanceId === this.selectedHandInstanceId) || null;
    const attackerEntity = (me.battlefield || []).find((e) => e.instanceId === this.selectedAttackerId) || null;
    const attackerIsEvasive = Boolean(attackerEntity?.keywords?.includes('Evasive'));

    const canAttackEnemyNexus = Boolean(attackerEntity && (!enemyHasGuard || attackerIsEvasive));
    const enemyNexusIsTarget = canAttackEnemyNexus || Boolean(this.pendingSpellCard);
    const myNexusIsTarget = Boolean(this.pendingSpellCard);

    const renderEnergyDots = (energy = 0, max = 0) => {
      const dots = [];
      for (let i = 0; i < Math.max(0, max); i++) {
        dots.push(`<span class="gf-tcg-energy-dot ${i < energy ? 'is-charged' : ''}"></span>`);
      }
      return `<div class="gf-tcg-energy-wrap">${dots.join('')}<span class="gf-tcg-energy-num">⚡ ${energy}/${max}</span></div>`;
    };

    return `
      <div class="gf-tcg-board-container">
        <!-- Top Opponent Bar -->
        <div class="gf-tcg-top-bar">
          <button
            type="button"
            data-tcg-nexus="${oppSlot}"
            data-testid="enemy-nexus"
            class="gf-tcg-nexus is-enemy ${enemyNexusIsTarget ? 'is-target' : ''}"
          >
            <div class="gf-tcg-nexus-shield">🛡️</div>
            <div class="gf-tcg-nexus-info">
              <div class="gf-tcg-nexus-name">${escapeHtml(opp.username || AI_NAME)} ${opp.deckName ? `<span class="deck-tag">(${escapeHtml(opp.deckName)})</span>` : ''}</div>
              <div class="gf-tcg-nexus-hp"><span class="${opp.hp <= 8 ? 'low-hp' : ''}">${escapeHtml(opp.hp)}</span> <small>/ 30 HP</small></div>
            </div>
            ${enemyNexusIsTarget ? `<span class="gf-tcg-target-badge">🎯 TAP TO TARGET</span>` : ''}
          </button>

          <!-- Opponent Hand Fan -->
          <div class="gf-tcg-opp-hand">
            ${Array.from({ length: Math.min(8, opp.handCount ?? opp.hand?.length ?? 0) })
              .map((_, i) => {
                const c = opp.hand?.[i];
                const revealed = c && !c.hidden;
                return revealed
                  ? renderCardHtml(c, {
                      size: 'xs',
                      inspectAttr: `data-tcg-inspect-instance="${escapeHtml(c.instanceId)}" data-tcg-inspect-owner="${oppSlot}"`,
                    })
                  : `<div class="gf-tcg-opp-cardback" style="transform:rotate(${(i - 3) * 3}deg);"></div>`;
              })
              .join('')}
          </div>

          <div class="gf-tcg-top-stats">
            <div class="gf-tcg-stat-chip" title="Opponent Hand">✋ ${escapeHtml(opp.handCount ?? opp.hand?.length ?? 0)}</div>
            <div class="gf-tcg-stat-chip" title="Opponent Deck">📚 ${escapeHtml(opp.libraryCount ?? 0)}</div>
            <button type="button" data-tcg-view-void="opp" class="gf-tcg-stat-chip is-btn" title="Inspect Enemy Void">
              💀 Void (${escapeHtml(opp.void?.length ?? 0)})
            </button>
            ${renderEnergyDots(opp.energy || 0, opp.maxEnergy || 0)}
            <button type="button" data-tcg-cmd="toggle-mute" class="gf-tcg-btn gf-tcg-btn-ghost" title="Toggle Sound">
              ${this.muted ? '🔇' : '🔊'}
            </button>
            <button type="button" data-tcg-cmd="leave-match" class="gf-tcg-btn gf-tcg-btn-ghost" title="Return to Tavern">
              🚪 Exit
            </button>
          </div>
        </div>

        <div id="tcg-inline-toast" class="gf-tcg-inline-toast hidden"></div>

        <!-- Opponent Battlefield -->
        <div class="gf-tcg-battlefield is-enemy">
          ${
            (opp.battlefield?.length || 0) + (opp.relics?.filter((r) => !r.attachedTo).length || 0) > 0
              ? [
                  ...(opp.battlefield || []).map((e) => {
                    const isStealth = e.keywords?.includes('Stealth');
                    const isGuard = e.keywords?.includes('Guard') && !isStealth;
                    const isValidAttack =
                      Boolean(attackerEntity) && !isStealth && (!enemyHasGuard || attackerIsEvasive || isGuard);
                    const isTarget = isValidAttack || (Boolean(this.pendingSpellCard) && !isStealth);
                    const attached = (opp.relics || []).filter((r) => r.attachedTo === e.instanceId);
                    return `
                      <div class="gf-tcg-bf-slot">
                        ${attached
                          .map((r) => `<div class="gf-tcg-attached-relic">⚙️ ${escapeHtml(r.name)}</div>`)
                          .join('')}
                        ${renderCardHtml(e, {
                          size: 'sm',
                          exhausted: e.exhausted,
                          isTarget,
                          actionAttr: `data-tcg-entity="${escapeHtml(e.instanceId)}" data-tcg-owner="${oppSlot}"`,
                          inspectAttr: `data-tcg-inspect-instance="${escapeHtml(e.instanceId)}" data-tcg-inspect-owner="${oppSlot}"`,
                          testId: `enemy-entity-${e.instanceId}`,
                        })}
                      </div>
                    `;
                  }),
                  ...(opp.relics || [])
                    .filter((r) => !r.attachedTo)
                    .map((r) =>
                      renderCardHtml(r, {
                        size: 'sm',
                        isTarget: Boolean(this.pendingSpellCard),
                        actionAttr: `data-tcg-entity="${escapeHtml(r.instanceId)}" data-tcg-owner="${oppSlot}"`,
                        inspectAttr: `data-tcg-inspect-instance="${escapeHtml(r.instanceId)}" data-tcg-inspect-owner="${oppSlot}"`,
                      })
                    ),
                ].join('')
              : `<div class="gf-tcg-empty-zone">Enemy Battlefield</div>`
          }
        </div>

        <!-- Center Turn Indicator & Contextual Action Bar -->
        <div class="gf-tcg-center-bar">
          <div class="gf-tcg-turn-pill ${isMyTurn ? 'is-my-turn' : ''}" data-testid="turn-indicator">
            ${ended ? '🏁 MATCH ENDED' : isMyTurn ? '⚔️ YOUR TURN' : `⏳ ${escapeHtml(opp.username)}'S TURN`} · Turn ${escapeHtml(state.turn)}
          </div>

          ${
            this.pendingSpellCard
              ? `<div class="gf-tcg-context-bar is-spell">
                  <span>✨ Casting <strong>${escapeHtml(this.pendingSpellCard.name)}</strong> — tap any target, or:</span>
                  <button type="button" data-tcg-cast-nexus="${oppSlot}" class="gf-tcg-btn gf-tcg-btn-red">🎯 Enemy Nexus</button>
                  <button type="button" data-tcg-cast-nexus="${slot}" class="gf-tcg-btn gf-tcg-btn-outline">🛡️ My Nexus</button>
                  <button type="button" data-tcg-cast-notarget="1" class="gf-tcg-btn gf-tcg-btn-gold">✨ Cast (No Target)</button>
                  <button type="button" data-tcg-cmd="cancel-selection" class="gf-tcg-btn gf-tcg-btn-ghost">✖ Cancel</button>
                </div>`
              : attackerEntity
              ? `<div class="gf-tcg-context-bar is-attack">
                  <span>⚔️ Attacking with <strong>${escapeHtml(attackerEntity.name)} (${escapeHtml(attackerEntity.power)} PWR)</strong> — tap an ${
                  enemyHasGuard && !attackerIsEvasive ? 'Enemy GUARD Entity' : 'Enemy Entity or Enemy Nexus'
                }!</span>
                  <button type="button" data-tcg-cmd="cancel-selection" class="gf-tcg-btn gf-tcg-btn-ghost">✖ Cancel</button>
                </div>`
              : selectedHandCard
              ? `<div class="gf-tcg-context-bar is-hand-action">
                  <span>🃏 Selected <strong>${escapeHtml(selectedHandCard.name)}</strong> (Cost ${escapeHtml(selectedHandCard.cost)}):</span>
                  ${
                    isMyTurn && !me.hasResonatedThisTurn && (me.maxEnergy || 0) < 12
                      ? `<button type="button" data-tcg-play-resonance="${escapeHtml(selectedHandCard.instanceId)}" class="gf-tcg-btn gf-tcg-btn-cyan">
                          ⚡ Charge as Resonance Node (+1 Energy)
                        </button>`
                      : ''
                  }
                  ${
                    isMyTurn && (selectedHandCard.cardType === 'Entity' || selectedHandCard.cardType === 'Relic')
                      ? `<button type="button" data-tcg-play-bf="${escapeHtml(selectedHandCard.instanceId)}" class="gf-tcg-btn gf-tcg-btn-gold">
                          ⚔️ Deploy to Battlefield (${escapeHtml(selectedHandCard.cost)} ⚡)
                        </button>`
                      : ''
                  }
                  ${
                    selectedHandCard.cardType === 'Rite' || selectedHandCard.cardType === 'Flash'
                      ? `<button type="button" data-tcg-begin-spell="${escapeHtml(selectedHandCard.instanceId)}" class="gf-tcg-btn gf-tcg-btn-purple">
                          ✨ Cast ${escapeHtml(selectedHandCard.cardType)} (${escapeHtml(selectedHandCard.cost)} ⚡)
                        </button>`
                      : ''
                  }
                  <button type="button" data-tcg-inspect-instance="${escapeHtml(selectedHandCard.instanceId)}" data-tcg-inspect-owner="${slot}" class="gf-tcg-btn gf-tcg-btn-outline">🔍 Inspect</button>
                  <button type="button" data-tcg-cmd="cancel-selection" class="gf-tcg-btn gf-tcg-btn-ghost">✖</button>
                </div>`
              : ''
          }
        </div>

        <!-- Player Battlefield -->
        <div
          class="gf-tcg-battlefield is-mine ${selectedHandCard && (selectedHandCard.cardType === 'Entity' || selectedHandCard.cardType === 'Relic') ? 'is-drop-ready' : ''}"
          data-tcg-dropzone="battlefield"
          data-testid="dropzone-battlefield"
        >
          ${
            (me.battlefield?.length || 0) + (me.relics?.filter((r) => !r.attachedTo).length || 0) > 0
              ? [
                  ...(me.battlefield || []).map((e) => {
                    const isSelectedAtk = this.selectedAttackerId === e.instanceId;
                    const attached = (me.relics || []).filter((r) => r.attachedTo === e.instanceId);
                    return `
                      <div class="gf-tcg-bf-slot">
                        ${attached
                          .map((r) => `<div class="gf-tcg-attached-relic">⚙️ ${escapeHtml(r.name)}</div>`)
                          .join('')}
                        ${renderCardHtml(e, {
                          size: 'sm',
                          selected: isSelectedAtk,
                          exhausted: e.exhausted,
                          isTarget: Boolean(this.pendingSpellCard),
                          actionAttr: `data-tcg-entity="${escapeHtml(e.instanceId)}" data-tcg-owner="${slot}"`,
                          inspectAttr: `data-tcg-inspect-instance="${escapeHtml(e.instanceId)}" data-tcg-inspect-owner="${slot}"`,
                          testId: `my-entity-${e.instanceId}`,
                        })}
                      </div>
                    `;
                  }),
                  ...(me.relics || [])
                    .filter((r) => !r.attachedTo)
                    .map((r) =>
                      renderCardHtml(r, {
                        size: 'sm',
                        actionAttr: `data-tcg-inspect-instance="${escapeHtml(r.instanceId)}" data-tcg-inspect-owner="${slot}"`,
                        inspectAttr: `data-tcg-inspect-instance="${escapeHtml(r.instanceId)}" data-tcg-inspect-owner="${slot}"`,
                      })
                    ),
                ].join('')
              : `<div class="gf-tcg-empty-zone">Your Battlefield — Tap a card in hand or drag Entities & Relics here</div>`
          }
        </div>

        <!-- Player Nexus + Resonance Row + Action Controls -->
        <div class="gf-tcg-mid-controls">
          <button
            type="button"
            data-tcg-nexus="${slot}"
            data-testid="my-nexus"
            class="gf-tcg-nexus is-mine ${myNexusIsTarget ? 'is-target' : ''}"
          >
            <div class="gf-tcg-nexus-shield">🛡️</div>
            <div class="gf-tcg-nexus-info">
              <div class="gf-tcg-nexus-name">${escapeHtml(me.username)}</div>
              <div class="gf-tcg-nexus-hp"><span class="${me.hp <= 8 ? 'low-hp' : ''}">${escapeHtml(me.hp)}</span> <small>/ 30 HP</small></div>
            </div>
          </button>

          <div
            class="gf-tcg-resonance-row ${selectedHandCard && isMyTurn && !me.hasResonatedThisTurn ? 'is-drop-ready' : ''}"
            data-tcg-dropzone="resonance"
            data-testid="dropzone-resonance"
            title="Tap or drag a hand card here once per turn to charge +1 Max Energy"
          >
            <span class="res-label">⚡ Resonance Nodes (${escapeHtml(me.resonanceRow?.length || 0)}/12):</span>
            <div class="res-nodes">
              ${(me.resonanceRow || [])
                .map((c) => {
                  const f = getTcgFactionConfig(c.faction);
                  return `<span class="gf-tcg-res-node" style="border-color:${f.color}; background:${f.color}33; color:${f.soft};" title="Resonated: ${escapeHtml(c.name)}">⚡</span>`;
                })
                .join('')}
            </div>
            <div style="margin-left:auto;">
              ${renderEnergyDots(me.energy || 0, me.maxEnergy || 0)}
            </div>
          </div>

          <div class="gf-tcg-turn-buttons">
            <button
              type="button"
              data-tcg-cmd="draw-card"
              data-testid="btn-draw"
              ${!isMyTurn || this.busy || me.hasDrawnThisTurn ? 'disabled' : ''}
              class="gf-tcg-btn ${isMyTurn && !me.hasDrawnThisTurn ? 'gf-tcg-btn-cyan pulse-glow' : 'gf-tcg-btn-outline'}"
              title="Draw 1 Card this turn (Hotkey: D)"
            >
              🃏 Draw (${escapeHtml(me.libraryCount ?? me.library?.length ?? 0)}) ${me.hasDrawnThisTurn ? '✓' : ''}
            </button>
            <button
              type="button"
              data-tcg-view-void="me"
              class="gf-tcg-btn gf-tcg-btn-outline"
              title="Inspect Your Void"
            >
              💀 Void (${escapeHtml(me.void?.length ?? 0)})
            </button>
            <button
              type="button"
              data-tcg-cmd="end-turn"
              data-testid="btn-end-turn"
              ${!isMyTurn || this.busy ? 'disabled' : ''}
              class="gf-tcg-btn gf-tcg-btn-gold"
              title="End Turn (Hotkey: Space)"
            >
              ▶️ End Turn
            </button>
          </div>
        </div>

        <!-- Bottom: Player Hand + Battle Log -->
        <div class="gf-tcg-bottom-row">
          <div class="gf-tcg-hand-tray">
            ${(me.hand || [])
              .map((c) =>
                renderCardHtml(c, {
                  size: 'md',
                  selected: this.selectedHandInstanceId === c.instanceId || this.pendingSpellCard?.instanceId === c.instanceId,
                  draggable: !ended,
                  actionAttr: `data-tcg-hand-card="${escapeHtml(c.instanceId)}"`,
                  inspectAttr: `data-tcg-inspect-instance="${escapeHtml(c.instanceId)}" data-tcg-inspect-owner="${slot}"`,
                  testId: `hand-card-${c.instanceId}`,
                })
              )
              .join('')}
          </div>

          <div class="gf-tcg-log-box" data-testid="game-log">
            <div class="gf-tcg-log-head">📜 Battle Log</div>
            <div class="gf-tcg-log-list">
              ${[...(state.log || [])]
                .reverse()
                .map((line) => {
                  let cls = 'log-neutral';
                  let txt = String(line);
                  if (txt.startsWith('[P1] ')) {
                    cls = slot === '1' ? 'log-mine' : 'log-opp';
                    txt = txt.slice(5);
                  } else if (txt.startsWith('[P2] ')) {
                    cls = slot === '2' ? 'log-mine' : 'log-opp';
                    txt = txt.slice(5);
                  }
                  return `<div class="gf-tcg-log-item ${cls}">${escapeHtml(txt)}</div>`;
                })
                .join('')}
            </div>
          </div>
        </div>

        ${state.phase === 'DICE_ROLL' ? this._renderDiceRollModalHtml(state, slot, oppSlot) : ''}
        ${state.pendingChoice && String(state.pendingChoice.player) === slot ? this._renderPendingChoiceModalHtml(state.pendingChoice) : ''}
        ${ended ? this._renderVictoryModalHtml(state, slot) : ''}
        ${this._renderVoidModalHtml(me, opp)}
        ${this._renderInspectModalHtml()}
      </div>
    `;
  }

  _renderDiceRollModalHtml(state, slot, oppSlot) {
    const me = state.players?.[slot];
    const opp = state.players?.[oppSlot];
    const myRoll = state.diceRolls?.[slot];
    const oppRoll = state.diceRolls?.[oppSlot];

    return `
      <div class="gf-tcg-submodal-backdrop">
        <div class="gf-tcg-submodal">
          <h3 class="gf-tcg-title" style="color:#38bdf8;">🎲 WHO GOES FIRST?</h3>
          <div class="gf-tcg-dice-row">
            <div class="gf-tcg-dice-box">
              <span>${escapeHtml(me?.username || 'You')}</span>
              <div class="dice-num">${escapeHtml(myRoll ?? '?')}</div>
            </div>
            <span class="dice-vs">VS</span>
            <div class="gf-tcg-dice-box">
              <span>${escapeHtml(opp?.username || 'Opponent')}</span>
              <div class="dice-num">${escapeHtml(oppRoll ?? '?')}</div>
            </div>
          </div>
          ${
            myRoll
              ? `<p style="color:#94a3b8;">Waiting for ${escapeHtml(opp?.username || 'opponent')} to roll...</p>`
              : `<button type="button" data-tcg-cmd="roll-dice" class="gf-tcg-btn gf-tcg-btn-cyan" style="padding:10px 28px; font-size:15px;">🎲 Roll 1d6</button>`
          }
        </div>
      </div>
    `;
  }

  _renderPendingChoiceModalHtml(choice) {
    return `
      <div class="gf-tcg-submodal-backdrop">
        <div class="gf-tcg-submodal" style="max-width:680px;">
          <h3 class="gf-tcg-title" style="color:#38bdf8; margin-bottom:14px;">🔮 ${escapeHtml(choice.prompt || 'Make a Choice')}</h3>
          <div class="gf-tcg-choice-options">
            ${(choice.options || [])
              .map((opt, idx) => {
                const previewCard = opt.payload?.card || opt.payload?.keep || opt.payload?.dump || null;
                return `
                  <div class="gf-tcg-choice-card">
                    ${previewCard ? renderCardHtml(previewCard, { size: 'sm' }) : ''}
                    <button type="button" data-tcg-choice-idx="${idx}" class="gf-tcg-btn gf-tcg-btn-gold">
                      ${escapeHtml(opt.text)}
                    </button>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderVictoryModalHtml(state, slot) {
    const won = String(state.winner) === String(slot);
    return `
      <div class="gf-tcg-submodal-backdrop" data-testid="match-over">
        <div class="gf-tcg-submodal">
          <div style="font-size:46px; margin-bottom:8px;">${won ? '👑' : '💀'}</div>
          <h2 class="gf-tcg-title" style="font-size:28px; color:${won ? '#facc15' : '#f87171'};">
            ${won ? 'VICTORY AT THE TAVERN TABLE!' : 'DEFEAT'}
          </h2>
          <p style="color:#cbd5e1; margin:8px 0 16px;">
            Match concluded on Turn ${escapeHtml(state.turn)}.
            ${won ? `<br/><strong style="color:#4ade80;">+${this.activeMatch?.vsAI ? 85 : 150} ✨ Glimmer Awarded!</strong>` : ''}
          </p>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button type="button" data-tcg-cmd="rematch-ai" class="gf-tcg-btn gf-tcg-btn-gold">⚔️ Play Again</button>
            <button type="button" data-tcg-cmd="leave-match" data-testid="return-lobby" class="gf-tcg-btn gf-tcg-btn-outline">Return to Deck Lobby</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderVoidModalHtml(me, opp) {
    if (!this.viewingVoidSlot) return '';
    const list = this.viewingVoidSlot === 'me' ? me?.void || [] : opp?.void || [];
    const title = this.viewingVoidSlot === 'me' ? '💀 Your Void (Graveyard)' : '💀 Opponent Void (Graveyard)';
    return `
      <div class="gf-tcg-submodal-backdrop">
        <div class="gf-tcg-submodal" style="max-width:780px; width:92%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 class="gf-tcg-title">${escapeHtml(title)} (${list.length} Cards)</h3>
            <button type="button" data-tcg-cmd="close-void" class="gf-tcg-btn gf-tcg-btn-ghost">✖ Close</button>
          </div>
          ${
            list.length > 0
              ? `<div class="gf-tcg-void-grid">
                  ${list.map((c) => renderCardHtml(c, { size: 'sm' })).join('')}
                </div>`
              : `<p style="color:#94a3b8; padding:24px;">The Void is currently empty.</p>`
          }
        </div>
      </div>
    `;
  }

  _renderInspectModalHtml() {
    if (!this.inspectCard) return '';
    const c = this.inspectCard;
    const f = getTcgFactionConfig(c.faction);
    return `
      <div class="gf-tcg-submodal-backdrop">
        <div class="gf-tcg-submodal" style="max-width:540px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h3 class="gf-tcg-title" style="color:${f.soft};">${escapeHtml(c.name)}</h3>
            <button type="button" data-tcg-cmd="close-inspect" class="gf-tcg-btn gf-tcg-btn-ghost">✖ Close</button>
          </div>
          <div style="display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap; justify-content:center;">
            ${renderCardHtml(c, { size: 'lg' })}
            <div style="flex:1; min-width:210px; text-align:left; font-size:13px; color:#e2e8f0;">
              <div style="margin-bottom:6px;"><strong>Faction:</strong> <span style="color:${f.soft};">${escapeHtml(c.faction)}</span></div>
              <div style="margin-bottom:6px;"><strong>Type:</strong> ${escapeHtml(c.cardType || c.card_type)} · <strong>Rarity:</strong> ${escapeHtml(c.rarity || 'Common')}</div>
              <div style="margin-bottom:6px;"><strong>Energy Cost:</strong> ⚡ ${escapeHtml(c.cost ?? 0)}</div>
              ${
                c.power !== null && c.power !== undefined && c.power !== 'None'
                  ? `<div style="margin-bottom:6px;"><strong>Stats:</strong> ⚔️ ${escapeHtml(c.power)} Power / ❤️ ${escapeHtml(c.curHealth ?? c.health)} Health</div>`
                  : ''
              }
              ${
                c.keywords && c.keywords !== 'None' && (!Array.isArray(c.keywords) || c.keywords.length > 0)
                  ? `<div style="margin-bottom:8px; color:#38bdf8; font-weight:bold;">Keywords: ${escapeHtml(
                      Array.isArray(c.keywords) ? c.keywords.join(', ') : c.keywords
                    )}</div>`
                  : ''
              }
              <div style="padding:10px; background:rgba(15,23,42,0.85); border:1px solid rgba(148,163,184,0.25); border-radius:8px; margin-bottom:8px; line-height:1.45;">
                ${escapeHtml(c.description || 'No rules text.')}
              </div>
              ${
                c.lore
                  ? `<div style="font-style:italic; color:#94a3b8; font-size:12px; line-height:1.4;">"${escapeHtml(c.lore)}"</div>`
                  : ''
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _bindEvents(root) {
    // Select Deck in Lobby
    root.querySelectorAll('[data-tcg-select-deck]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tcg-select-deck');
        const found = this.decks.find((d) => String(d.id) === String(id));
        if (found) {
          this.selectedDeckId = found.id;
          this.selectedDeckName = found.deck_name;
          this.render();
        }
      });
    });

    // AI Deck selector
    const aiSel = root.querySelector('#tcg-ai-deck-select');
    if (aiSel) {
      aiSel.addEventListener('change', (e) => {
        this.aiDeckName = e.target.value;
      });
    }

    // Inputs in Lobby
    const chalInput = root.querySelector('#tcg-challenge-input');
    if (chalInput) {
      chalInput.addEventListener('input', (e) => {
        this.challengeTargetInput = e.target.value;
      });
    }
    const roomInput = root.querySelector('#tcg-room-code-input');
    if (roomInput) {
      roomInput.addEventListener('input', (e) => {
        this.roomCodeInput = e.target.value.toUpperCase();
      });
    }

    // Quick challenge nearby player chips
    root.querySelectorAll('[data-tcg-quick-challenge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetName = btn.getAttribute('data-tcg-quick-challenge');
        this.challengeTargetInput = targetName;
        this._sendPlayerChallenge(targetName);
      });
    });

    // Commands
    root.querySelectorAll('[data-tcg-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-tcg-cmd');
        if (cmd === 'close-modal') this.close();
        else if (cmd === 'open-deck-inspector') {
          this.view = 'deck_inspector';
          this.render();
        } else if (cmd === 'open-deck-builder') {
          this._initBuilderFromCurrentDeck();
          this.view = 'deck_builder';
          this.render();
        } else if (cmd === 'back-to-lobby') {
          this.view = 'lobby';
          this.inspectCard = null;
          this.render();
        } else if (cmd === 'play-ai' || cmd === 'rematch-ai' || cmd === 'switch-to-ai') {
          this._stopPolling();
          this.startMatch({ vsAI: true });
        } else if (cmd === 'challenge-player') {
          this._sendPlayerChallenge(this.challengeTargetInput);
        } else if (cmd === 'join-room-code') {
          this.startMatch({ vsAI: false, roomCode: this.roomCodeInput || 'TAVRN' });
        } else if (cmd === 'quick-queue') {
          this.startMatch({ vsAI: false, roomCode: '' });
        } else if (cmd === 'leave-match') {
          this._stopPolling();
          this.activeMatch = null;
          this.view = 'lobby';
          this.render();
        } else if (cmd === 'toggle-mute') {
          this.muted = !this.muted;
          localStorage.setItem('gf_tcg_muted', String(this.muted));
          this.render();
        } else if (cmd === 'draw-card') {
          this.performMatchAction('DRAW_CARD', {});
        } else if (cmd === 'end-turn') {
          this.performMatchAction('END_TURN', {});
        } else if (cmd === 'roll-dice') {
          this.performMatchAction('ROLL_DICE', {});
        } else if (cmd === 'cancel-selection') {
          this.selectedHandInstanceId = null;
          this.selectedAttackerId = null;
          this.pendingSpellCard = null;
          this.render();
        } else if (cmd === 'close-void') {
          this.viewingVoidSlot = null;
          this.render();
        } else if (cmd === 'close-inspect') {
          this.inspectCard = null;
          this.render();
        } else if (cmd === 'clear-builder') {
          this.builderCounts.clear();
          this.render();
        } else if (cmd === 'save-custom-deck') {
          this._saveCustomDeckFromBuilder();
        }
      });
    });

    // Deck Builder events
    const builderNameInput = root.querySelector('#tcg-builder-deck-name');
    if (builderNameInput) {
      builderNameInput.addEventListener('input', (e) => {
        this.builderName = e.target.value;
      });
    }
    const builderSearchInput = root.querySelector('#tcg-builder-search');
    if (builderSearchInput) {
      builderSearchInput.addEventListener('input', (e) => {
        this.builderSearch = e.target.value;
        this.render();
        const el = document.getElementById('tcg-builder-search');
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      });
    }
    root.querySelectorAll('[data-tcg-builder-fac]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.builderFactionFilter = btn.getAttribute('data-tcg-builder-fac');
        this.render();
      });
    });
    root.querySelectorAll('[data-tcg-builder-add]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = el.getAttribute('data-tcg-builder-add');
        let total = 0;
        for (const v of this.builderCounts.values()) total += v;
        if (total >= 40) {
          this._showBannerToast('Deck already has 40 cards!', 'error');
          return;
        }
        const cur = this.builderCounts.get(name) || 0;
        if (cur >= 3) {
          this._showBannerToast('Maximum 3 copies of a card per deck.', 'error');
          return;
        }
        this.builderCounts.set(name, cur + 1);
        this.render();
      });
    });
    root.querySelectorAll('[data-tcg-builder-rem]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = el.getAttribute('data-tcg-builder-rem');
        const cur = this.builderCounts.get(name) || 0;
        if (cur <= 1) this.builderCounts.delete(name);
        else this.builderCounts.set(name, cur - 1);
        this.render();
      });
    });

    // Inspect Card buttons
    root.querySelectorAll('[data-tcg-inspect-name]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = el.getAttribute('data-tcg-inspect-name');
        const found = this.cards.find((c) => c.name === name);
        if (found) {
          this.inspectCard = found;
          this.render();
        }
      });
    });

    root.querySelectorAll('[data-tcg-inspect-instance]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const iid = el.getAttribute('data-tcg-inspect-instance');
        const owner = el.getAttribute('data-tcg-inspect-owner') || String(this.activeMatch?.slot || 1);
        const pl = this.activeMatch?.state?.players?.[owner];
        if (!pl) return;
        const all = [...(pl.hand || []), ...(pl.battlefield || []), ...(pl.relics || []), ...(pl.void || [])];
        const found = all.find((c) => c && c.instanceId === iid);
        if (found && !found.hidden) {
          this.inspectCard = found;
          this.render();
        }
      });
    });

    // Void Viewer
    root.querySelectorAll('[data-tcg-view-void]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.viewingVoidSlot = btn.getAttribute('data-tcg-view-void');
        this.render();
      });
    });

    // Hand Card selection
    root.querySelectorAll('[data-tcg-hand-card]').forEach((cardEl) => {
      cardEl.addEventListener('click', () => {
        const iid = cardEl.getAttribute('data-tcg-hand-card');
        const slot = String(this.activeMatch?.slot || 1);
        const me = this.activeMatch?.state?.players?.[slot];
        const card = (me?.hand || []).find((c) => c.instanceId === iid);
        if (!card) return;
        this.selectedAttackerId = null;
        if (this.selectedHandInstanceId === iid) {
          this.selectedHandInstanceId = null;
          this.pendingSpellCard = null;
        } else {
          this.selectedHandInstanceId = iid;
          this.pendingSpellCard = null;
        }
        this.render();
      });
    });

    // Contextual Hand Action Buttons
    root.querySelectorAll('[data-tcg-play-resonance]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const iid = btn.getAttribute('data-tcg-play-resonance');
        this.performMatchAction('PLAY_CARD', { instanceId: iid, destination: 'resonance' });
      });
    });
    root.querySelectorAll('[data-tcg-play-bf]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const iid = btn.getAttribute('data-tcg-play-bf');
        this.performMatchAction('PLAY_CARD', { instanceId: iid, destination: 'battlefield' });
      });
    });
    root.querySelectorAll('[data-tcg-begin-spell]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const iid = btn.getAttribute('data-tcg-begin-spell');
        const slot = String(this.activeMatch?.slot || 1);
        const me = this.activeMatch?.state?.players?.[slot];
        const card = (me?.hand || []).find((c) => c.instanceId === iid);
        if (!card) return;
        const low = String(card.description || '').toLowerCase();
        // If spell does not require a target ("draw", "damage to all", "put the top card", "look at"), cast immediately!
        if (!low.includes('target') && !low.includes('nexus')) {
          this.performMatchAction('CAST_SPELL', { instanceId: card.instanceId });
        } else {
          this.pendingSpellCard = card;
          this.render();
        }
      });
    });

    // Spell Target Buttons
    root.querySelectorAll('[data-tcg-cast-nexus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.pendingSpellCard) return;
        const targetSlot = btn.getAttribute('data-tcg-cast-nexus');
        this.performMatchAction('CAST_SPELL', {
          instanceId: this.pendingSpellCard.instanceId,
          targetType: 'nexus',
          targetSlot,
        });
      });
    });
    root.querySelectorAll('[data-tcg-cast-notarget]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.pendingSpellCard) return;
        this.performMatchAction('CAST_SPELL', {
          instanceId: this.pendingSpellCard.instanceId,
        });
      });
    });

    // Battlefield Entity clicks (select attacker, attack enemy entity, or cast spell at entity)
    root.querySelectorAll('[data-tcg-entity]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const entityId = el.getAttribute('data-tcg-entity');
        const ownerSlot = el.getAttribute('data-tcg-owner');
        const mySlot = String(this.activeMatch?.slot || 1);

        if (this.pendingSpellCard) {
          this.performMatchAction('CAST_SPELL', {
            instanceId: this.pendingSpellCard.instanceId,
            targetType: 'entity',
            targetId: entityId,
            targetSlot: ownerSlot,
          });
          return;
        }

        if (ownerSlot === mySlot) {
          const me = this.activeMatch?.state?.players?.[mySlot];
          const ent = (me?.battlefield || []).find((x) => x.instanceId === entityId);
          if (!ent) return;
          if (ent.exhausted) {
            this._showBannerToast('That entity is exhausted this turn.', 'error');
            return;
          }
          this.selectedHandInstanceId = null;
          this.selectedAttackerId = this.selectedAttackerId === entityId ? null : entityId;
          this.render();
        } else if (this.selectedAttackerId) {
          this.performMatchAction('ATTACK_ENTITY', {
            attackerId: this.selectedAttackerId,
            targetId: entityId,
          });
        }
      });
    });

    // Nexus clicks (attack enemy nexus or cast spell on nexus)
    root.querySelectorAll('[data-tcg-nexus]').forEach((el) => {
      el.addEventListener('click', () => {
        const targetSlot = el.getAttribute('data-tcg-nexus');
        const mySlot = String(this.activeMatch?.slot || 1);
        if (this.pendingSpellCard) {
          this.performMatchAction('CAST_SPELL', {
            instanceId: this.pendingSpellCard.instanceId,
            targetType: 'nexus',
            targetSlot,
          });
          return;
        }
        if (targetSlot !== mySlot && this.selectedAttackerId) {
          this.performMatchAction('ATTACK_NEXUS', {
            attackerId: this.selectedAttackerId,
          });
        }
      });
    });

    // Tap / Drop onto Battlefield or Resonance Row when a hand card is selected
    root.querySelectorAll('[data-tcg-dropzone]').forEach((zoneEl) => {
      const zoneId = zoneEl.getAttribute('data-tcg-dropzone');
      zoneEl.addEventListener('click', (e) => {
        if (e.target.closest('[data-tcg-entity]') || e.target.closest('button')) return;
        if (!this.selectedHandInstanceId) return;
        const slot = String(this.activeMatch?.slot || 1);
        const me = this.activeMatch?.state?.players?.[slot];
        const card = (me?.hand || []).find((c) => c.instanceId === this.selectedHandInstanceId);
        if (!card) return;
        if (zoneId === 'resonance') {
          this.performMatchAction('PLAY_CARD', { instanceId: card.instanceId, destination: 'resonance' });
        } else if (zoneId === 'battlefield') {
          if (card.cardType === 'Entity' || card.cardType === 'Relic') {
            this.performMatchAction('PLAY_CARD', { instanceId: card.instanceId, destination: 'battlefield' });
          } else {
            this.pendingSpellCard = card;
            this.render();
          }
        }
      });

      zoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      zoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const iid = e.dataTransfer?.getData('text/plain');
        if (!iid) return;
        if (zoneId === 'resonance') {
          this.performMatchAction('PLAY_CARD', { instanceId: iid, destination: 'resonance' });
        } else if (zoneId === 'battlefield') {
          this.performMatchAction('PLAY_CARD', { instanceId: iid, destination: 'battlefield' });
        }
      });
    });

    root.querySelectorAll('[data-drag-instance]').forEach((dragEl) => {
      dragEl.addEventListener('dragstart', (e) => {
        const iid = dragEl.getAttribute('data-drag-instance');
        e.dataTransfer?.setData('text/plain', iid);
      });
    });

    // Pending Choice Option Buttons
    root.querySelectorAll('[data-tcg-choice-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-tcg-choice-idx'));
        const opt = this.activeMatch?.state?.pendingChoice?.options?.[idx];
        if (opt) {
          this.performMatchAction('MAKE_CHOICE', opt.payload);
        }
      });
    });
  }

  _sendPlayerChallenge(targetName) {
    const clean = String(targetName || '').trim();
    if (!clean) {
      this._showBannerToast('Enter a player name to challenge.', 'error');
      return;
    }
    const deck = this.getSelectedDeck();
    const sent = this.sendWs({
      type: 'tcg_challenge_invite',
      targetName: clean,
      deckId: deck?.id,
      deckName: deck?.deck_name,
    });
    if (sent) {
      this._showBannerToast(`Sent 1v1 GlimmerFall TCG challenge to ${clean}!`, 'info');
    } else {
      this._showBannerToast('Not connected to multiplayer realm — starting vs GlimmerBot AI!', 'info');
      this.startMatch({ vsAI: true });
    }
  }

  _initBuilderFromCurrentDeck() {
    this.builderCounts.clear();
    const deck = this.getSelectedDeck();
    if (deck && Array.isArray(deck.cards)) {
      this.builderName = `${deck.deck_name} Remix`;
      for (const c of deck.cards) {
        this.builderCounts.set(c.card_name, Number(c.count) || 1);
      }
    }
  }

  async _saveCustomDeckFromBuilder() {
    let total = 0;
    const deckCards = [];
    for (const [card_name, count] of this.builderCounts.entries()) {
      if (count > 0) {
        deckCards.push({ card_name, count });
        total += count;
      }
    }
    if (total < 10) {
      this._showBannerToast('Please add at least 10 cards (40 recommended) before saving.', 'error');
      return;
    }
    try {
      const resp = await fetch(this._apiUrl('/api/tcg/decks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.getPlayerName() || 'Summoner',
          deck_name: this.builderName || 'Custom Tavern Deck',
          deck_cards: deckCards,
        }),
      }).catch(() => null);

      if (resp && resp.ok) {
        const data = await resp.json();
        if (data?.deck) {
          this.decks.unshift(data.deck);
          this.selectedDeckId = data.deck.id;
          this.selectedDeckName = data.deck.deck_name;
        }
      } else {
        const localDeck = {
          id: Date.now(),
          username: this.getPlayerName() || 'Summoner',
          deck_name: this.builderName || 'Custom Tavern Deck',
          is_preconstructed: false,
          factions: 'Custom',
          total_cards: total,
          cards: deckCards,
        };
        this.decks.unshift(localDeck);
        this.selectedDeckId = localDeck.id;
        this.selectedDeckName = localDeck.deck_name;
      }
      this.view = 'lobby';
      this.render();
    } catch (err) {
      this._showBannerToast(err.message || 'Failed to save deck.', 'error');
    }
  }

  _injectStyles() {
    if (document.getElementById('gf-tcg-tavern-styles')) return;
    const style = document.createElement('style');
    style.id = 'gf-tcg-tavern-styles';
    style.textContent = `
      .gf-tcg-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 9500;
        background: rgba(4, 7, 15, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        touch-action: manipulation;
      }
      .gf-tcg-modal-overlay.hidden { display: none !important; }
      .gf-tcg-modal-shell {
        width: min(1240px, 98vw);
        max-height: 95vh;
        overflow-y: auto;
        background: radial-gradient(circle at 50% 0%, #172038 0%, #090d18 75%);
        border: 2px solid rgba(250, 204, 21, 0.45);
        border-radius: 18px;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(242, 169, 0, 0.18);
        padding: 14px 16px;
        color: #f8fafc;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
      }
      .gf-tcg-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        margin-bottom: 12px;
      }
      .gf-tcg-brand { display: flex; align-items: center; gap: 12px; }
      .gf-tcg-logo-badge {
        background: linear-gradient(135deg, #f59e0b, #eab308);
        color: #000;
        font-weight: 900;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 8px;
        letter-spacing: 1px;
      }
      .gf-tcg-title {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #fef08a;
      }
      .gf-tcg-subtitle {
        margin: 2px 0 0;
        font-size: 12px;
        color: #94a3b8;
      }
      .gf-tcg-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .gf-tcg-btn {
        cursor: pointer;
        border-radius: 10px;
        padding: 8px 13px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid rgba(255,255,255,0.16);
        transition: all 0.15s ease;
        touch-action: manipulation;
      }
      .gf-tcg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .gf-tcg-btn-gold {
        background: linear-gradient(135deg, #f59e0b, #facc15);
        color: #090d16;
        border-color: #fde047;
        box-shadow: 0 0 16px rgba(242, 169, 0, 0.35);
      }
      .gf-tcg-btn-gold:hover:not(:disabled) { filter: brightness(1.1); }
      .gf-tcg-btn-cyan {
        background: rgba(0, 191, 255, 0.2);
        color: #7fdbff;
        border-color: rgba(0, 191, 255, 0.55);
      }
      .gf-tcg-btn-purple {
        background: rgba(155, 48, 255, 0.25);
        color: #e9d5ff;
        border-color: rgba(155, 48, 255, 0.6);
      }
      .gf-tcg-btn-red {
        background: rgba(239, 68, 68, 0.25);
        color: #fecaca;
        border-color: rgba(239, 68, 68, 0.6);
      }
      .gf-tcg-btn-outline {
        background: rgba(15, 23, 42, 0.75);
        color: #e2e8f0;
        border-color: rgba(148, 163, 184, 0.35);
      }
      .gf-tcg-btn-ghost {
        background: transparent;
        color: #94a3b8;
        border-color: rgba(148, 163, 184, 0.2);
      }
      .gf-tcg-lobby-grid {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 14px;
      }
      @media (max-width: 860px) {
        .gf-tcg-lobby-grid { grid-template-columns: 1fr; }
      }
      .gf-tcg-lobby-panel {
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 14px;
        padding: 12px;
      }
      .gf-tcg-section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        font-weight: 800;
        color: #fde047;
        letter-spacing: 0.8px;
        margin-bottom: 10px;
      }
      .gf-tcg-db-pill {
        background: rgba(34, 224, 123, 0.15);
        color: #4ade80;
        border: 1px solid rgba(34, 224, 123, 0.4);
        padding: 2px 8px;
        border-radius: 99px;
        font-size: 10px;
      }
      .gf-tcg-sublabel {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        color: #94a3b8;
        margin-bottom: 6px;
        font-weight: 700;
      }
      .gf-tcg-deck-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 8px;
      }
      .gf-tcg-deck-card {
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
        padding: 8px 10px;
        border-radius: 11px;
        background: rgba(9, 13, 24, 0.8);
        border: 1px solid rgba(148, 163, 184, 0.22);
        cursor: pointer;
        position: relative;
        transition: all 0.15s ease;
      }
      .gf-tcg-deck-card.is-selected {
        border: 2px solid var(--deck-color, #facc15);
        background: rgba(30, 41, 59, 0.9);
        box-shadow: 0 0 16px rgba(250, 204, 21, 0.22);
      }
      .gf-tcg-deck-thumb {
        width: 42px;
        height: 58px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
      }
      .gf-tcg-deck-name { font-size: 13px; font-weight: 800; }
      .gf-tcg-deck-factions { font-size: 11px; color: #cbd5e1; margin-top: 2px; }
      .gf-tcg-deck-author { font-size: 10px; color: #64748b; margin-top: 2px; }
      .gf-tcg-deck-check {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 9px;
        font-weight: 900;
        color: #4ade80;
      }
      .gf-tcg-mode-box {
        background: rgba(9, 13, 24, 0.75);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 12px;
        padding: 10px 12px;
        margin-bottom: 10px;
      }
      .gf-tcg-mode-title { font-size: 13px; font-weight: 800; color: #f8fafc; margin-bottom: 4px; }
      .gf-tcg-mode-desc { font-size: 11px; color: #94a3b8; margin: 0 0 8px; line-height: 1.4; }
      .gf-tcg-ai-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .gf-tcg-input {
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(148, 163, 184, 0.35);
        color: #f8fafc;
        border-radius: 9px;
        padding: 8px 10px;
        font-size: 12px;
        flex: 1;
        min-width: 140px;
      }
      .gf-tcg-nearby-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
      .gf-tcg-nearby-chips .chip-label { font-size: 11px; color: #94a3b8; }
      .gf-tcg-player-chip {
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #bae6fd;
        border-radius: 99px;
        padding: 3px 9px;
        font-size: 11px;
        cursor: pointer;
      }
      .gf-tcg-rules-mini {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.5;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 10px;
        padding: 8px 10px;
      }

      /* Card Template Styles */
      .gf-tcg-card {
        position: relative;
        aspect-ratio: 5 / 7;
        border-radius: 11px;
        cursor: pointer;
        user-select: none;
        flex-shrink: 0;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .gf-tcg-card:hover { transform: translateY(-4px); }
      .gf-tcg-card-xs { width: 64px; }
      .gf-tcg-card-sm { width: 108px; }
      .gf-tcg-card-md { width: 136px; }
      .gf-tcg-card-lg { width: 210px; }
      .gf-tcg-card-inner {
        position: absolute;
        inset: 0;
        border-radius: 11px;
        overflow: hidden;
        border: 2px solid var(--tcg-faction-color, #38bdf8);
        background: #0f172a;
      }
      .gf-tcg-card-selected .gf-tcg-card-inner {
        border-color: #ffffff;
        box-shadow: 0 0 0 2px #facc15, 0 0 22px var(--tcg-faction-glow, rgba(250,204,21,0.7));
      }
      .gf-tcg-card-target .gf-tcg-card-inner {
        border-color: #ef4444;
        box-shadow: 0 0 0 2px #ef4444, 0 0 20px rgba(239, 68, 68, 0.85);
      }
      .gf-tcg-card-guard {
        outline: 3px solid rgba(226, 232, 240, 0.85);
        outline-offset: 2px;
      }
      .gf-tcg-card-stealth { opacity: 0.68; }
      .gf-tcg-card-art { width: 100%; height: 100%; display: block; }
      .gf-tcg-art-cover { object-fit: cover; }
      .gf-tcg-art-fill { object-fit: fill; }
      .gf-tcg-card-tint {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(4, 7, 15, 0.94) 0%, rgba(4, 7, 15, 0.45) 44%, transparent 68%);
        pointer-events: none;
      }
      .gf-tcg-cost-orb {
        position: absolute;
        top: 5px;
        left: 5px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--tcg-faction-color, #facc15);
        color: #000;
        font-weight: 900;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(0,0,0,0.65);
        box-shadow: 0 0 8px var(--tcg-faction-glow);
      }
      .gf-tcg-rarity-icon {
        position: absolute;
        top: 5px;
        right: 5px;
        height: 16px;
        width: auto;
        pointer-events: none;
      }
      .gf-tcg-inspect-btn {
        position: absolute;
        top: 26px;
        right: 4px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(9, 13, 24, 0.85);
        border: 1px solid rgba(255,255,255,0.25);
        color: #38bdf8;
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4;
      }
      .gf-tcg-card-footer {
        position: absolute;
        inset-inline: 0;
        bottom: 0;
        padding: 4px 6px 5px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.95);
      }
      .gf-tcg-card-footer.has-stats { padding-bottom: 22px; }
      .gf-tcg-card-name {
        font-size: 11px;
        font-weight: 800;
        color: var(--tcg-faction-soft, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .gf-tcg-card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-top: 2px;
      }
      .gf-tcg-type-pill {
        background: var(--tcg-faction-color, #38bdf8);
        color: #000;
        font-size: 8px;
        font-weight: 800;
        padding: 1px 4px;
        border-radius: 3px;
        text-transform: uppercase;
      }
      .gf-tcg-kw-pill {
        background: rgba(15, 23, 42, 0.9);
        color: #7fdbff;
        border: 1px solid var(--tcg-faction-color);
        font-size: 8px;
        font-weight: 800;
        padding: 0 4px;
        border-radius: 3px;
      }
      .gf-tcg-card-desc {
        font-size: 9px;
        color: rgba(255,255,255,0.92);
        margin-top: 3px;
        line-height: 1.25;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .gf-tcg-stat-pill {
        position: absolute;
        right: 5px;
        bottom: 4px;
        background: rgba(9, 13, 24, 0.92);
        border: 1.5px solid var(--tcg-faction-color, #facc15);
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .gf-tcg-stat-pill.is-damaged { border-color: #ef4444; background: rgba(69, 10, 10, 0.92); }
      .gf-tcg-stat-pill .hp-damaged { color: #fca5a5; }
      .gf-tcg-exhausted-overlay {
        position: absolute;
        inset: 0;
        background: rgba(4, 7, 15, 0.58);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .gf-tcg-exhausted-overlay span {
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #e2e8f0;
        border: 1px solid rgba(255,255,255,0.35);
        padding: 2px 6px;
        border-radius: 4px;
        transform: rotate(-8deg);
      }

      /* Game Board Layout */
      .gf-tcg-board-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .gf-tcg-top-bar, .gf-tcg-mid-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .gf-tcg-nexus {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(15, 23, 42, 0.85);
        border: 1.5px solid rgba(148, 163, 184, 0.3);
        border-radius: 14px;
        padding: 6px 14px;
        min-width: 195px;
        cursor: pointer;
        position: relative;
        color: #fff;
      }
      .gf-tcg-nexus.is-mine { border-color: rgba(34, 224, 123, 0.5); }
      .gf-tcg-nexus.is-enemy { border-color: rgba(248, 113, 113, 0.45); }
      .gf-tcg-nexus.is-target {
        border-color: #ef4444;
        box-shadow: 0 0 18px rgba(239, 68, 68, 0.75);
      }
      .gf-tcg-nexus-shield { font-size: 22px; }
      .gf-tcg-nexus-name { font-size: 12px; font-weight: 700; color: #cbd5e1; }
      .gf-tcg-nexus-name .deck-tag { font-size: 10px; color: #94a3b8; font-weight: 400; }
      .gf-tcg-nexus-hp { font-size: 20px; font-weight: 900; }
      .gf-tcg-nexus-hp .low-hp { color: #f87171; }
      .gf-tcg-nexus-hp small { font-size: 11px; color: #64748b; }
      .gf-tcg-target-badge {
        position: absolute;
        top: -8px;
        right: 8px;
        background: #ef4444;
        color: #fff;
        font-size: 9px;
        font-weight: 900;
        padding: 2px 6px;
        border-radius: 99px;
      }
      .gf-tcg-opp-hand { display: flex; align-items: center; justify-content: center; gap: 2px; }
      .gf-tcg-opp-cardback {
        width: 26px;
        height: 36px;
        border-radius: 4px;
        background: url('${CARDBACK_URL}') center/cover no-repeat, #1e293b;
        border: 1px solid rgba(255,255,255,0.25);
        margin-left: -6px;
      }
      .gf-tcg-top-stats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .gf-tcg-stat-chip {
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 8px;
        padding: 4px 9px;
        font-size: 12px;
        color: #cbd5e1;
      }
      .gf-tcg-stat-chip.is-btn { cursor: pointer; }
      .gf-tcg-energy-wrap { display: flex; align-items: center; gap: 4px; }
      .gf-tcg-energy-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255,255,255,0.16);
      }
      .gf-tcg-energy-dot.is-charged {
        background: #00bfff;
        box-shadow: 0 0 8px rgba(0, 191, 255, 0.9);
      }
      .gf-tcg-energy-num { font-size: 12px; font-weight: 800; color: #7fdbff; margin-left: 4px; }
      .gf-tcg-battlefield {
        min-height: 146px;
        background: rgba(15, 23, 42, 0.55);
        border: 1.5px solid rgba(148, 163, 184, 0.2);
        border-radius: 14px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .gf-tcg-battlefield.is-drop-ready, .gf-tcg-resonance-row.is-drop-ready {
        border-color: #facc15;
        background: rgba(250, 204, 21, 0.07);
      }
      .gf-tcg-bf-slot { display: flex; flex-direction: column; align-items: center; }
      .gf-tcg-attached-relic {
        background: rgba(242, 169, 0, 0.2);
        border: 1px solid rgba(242, 169, 0, 0.6);
        color: #fde047;
        font-size: 9px;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 5px 5px 0 0;
        margin-bottom: -2px;
        z-index: 2;
      }
      .gf-tcg-empty-zone { font-size: 12px; color: rgba(148, 163, 184, 0.45); font-weight: 600; }
      .gf-tcg-center-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .gf-tcg-turn-pill {
        padding: 4px 16px;
        border-radius: 99px;
        font-size: 12px;
        font-weight: 800;
        background: rgba(15, 23, 42, 0.85);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }
      .gf-tcg-turn-pill.is-my-turn {
        background: linear-gradient(135deg, #f59e0b, #facc15);
        color: #090d16;
        border-color: #fde047;
      }
      .gf-tcg-context-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        background: rgba(15, 23, 42, 0.95);
        border: 1.5px solid #38bdf8;
        border-radius: 12px;
        padding: 6px 12px;
        font-size: 12px;
      }
      .gf-tcg-resonance-row {
        flex: 1;
        min-height: 48px;
        background: rgba(15, 23, 42, 0.65);
        border: 1.5px solid rgba(148, 163, 184, 0.22);
        border-radius: 12px;
        padding: 6px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        cursor: pointer;
      }
      .gf-tcg-resonance-row .res-label { font-size: 11px; color: #94a3b8; font-weight: 700; }
      .gf-tcg-resonance-row .res-nodes { display: flex; gap: 4px; flex-wrap: wrap; }
      .gf-tcg-res-node {
        width: 24px;
        height: 30px;
        border-radius: 5px;
        border: 1px solid #38bdf8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
      .gf-tcg-turn-buttons { display: flex; align-items: center; gap: 8px; }
      .gf-tcg-bottom-row {
        display: grid;
        grid-template-columns: 1fr 270px;
        gap: 10px;
        align-items: stretch;
      }
      @media (max-width: 900px) {
        .gf-tcg-bottom-row { grid-template-columns: 1fr; }
      }
      .gf-tcg-hand-tray {
        background: rgba(9, 13, 24, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 14px;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
        min-height: 196px;
      }
      .gf-tcg-log-box {
        background: rgba(9, 13, 24, 0.82);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 14px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        max-height: 205px;
      }
      .gf-tcg-log-head {
        font-size: 11px;
        font-weight: 800;
        color: #94a3b8;
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        padding-bottom: 4px;
        margin-bottom: 6px;
      }
      .gf-tcg-log-list {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
      }
      .gf-tcg-log-item.log-mine { color: #4ade80; }
      .gf-tcg-log-item.log-opp { color: #f87171; }
      .gf-tcg-log-item.log-neutral { color: #fde047; }

      /* Submodals & Inspector */
      .gf-tcg-submodal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9600;
        background: rgba(4, 7, 15, 0.82);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
      }
      .gf-tcg-submodal {
        background: #0f172a;
        border: 2px solid rgba(250, 204, 21, 0.5);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        max-width: 440px;
        width: 100%;
        max-height: 88vh;
        overflow-y: auto;
      }
      .gf-tcg-dice-row {
        display: flex;
        align-items: center;
        justify-content: space-around;
        margin: 18px 0;
      }
      .gf-tcg-dice-box .dice-num {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        font-weight: 900;
        margin-top: 6px;
      }
      .gf-tcg-choice-options, .gf-tcg-void-grid, .gf-tcg-inspector-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
      }
      .gf-tcg-inspector-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }
      .gf-tcg-copy-badge {
        font-size: 11px;
        font-weight: 800;
        color: #fde047;
        background: rgba(250, 204, 21, 0.14);
        border: 1px solid rgba(250, 204, 21, 0.35);
        padding: 2px 8px;
        border-radius: 99px;
      }
      .gf-tcg-builder-toolbar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .gf-tcg-builder-counter {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 800;
      }
      .gf-tcg-cnt-btn {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(15, 23, 42, 0.9);
        color: #fff;
        cursor: pointer;
      }
      .gf-tcg-waiting-wrap {
        text-align: center;
        padding: 40px 16px;
      }
      .gf-tcg-room-code-box {
        display: inline-block;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: 6px;
        color: #facc15;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid rgba(250, 204, 21, 0.5);
        border-radius: 14px;
        padding: 12px 26px;
        margin: 14px 0;
      }
      .gf-tcg-inline-toast {
        margin: 6px 0;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        text-align: center;
      }
      .gf-tcg-inline-toast.hidden { display: none; }
      .gf-tcg-inline-toast.is-error {
        background: rgba(239, 68, 68, 0.22);
        border: 1px solid rgba(239, 68, 68, 0.55);
        color: #fecaca;
      }
      .gf-tcg-inline-toast.is-info {
        background: rgba(56, 189, 248, 0.2);
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: #bae6fd;
      }
      #tcg-invite-toast {
        position: fixed;
        top: 76px;
        right: 16px;
        z-index: 9700;
      }
      #tcg-invite-toast.hidden { display: none; }
      .gf-tcg-invite-card {
        background: rgba(9, 13, 24, 0.96);
        border: 2px solid #facc15;
        border-radius: 14px;
        padding: 12px 14px;
        width: 310px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.85);
        color: #f8fafc;
      }
      .gf-tcg-invite-title { font-size: 12px; font-weight: 900; color: #facc15; margin-bottom: 4px; }
      .gf-tcg-invite-sub { font-size: 12px; color: #e2e8f0; margin-bottom: 10px; }
      .gf-tcg-invite-actions { display: flex; gap: 8px; }
    `;
    document.head.appendChild(style);
  }
}
