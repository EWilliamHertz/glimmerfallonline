// ==========================================
// GlimmerFall Online — World Atlas, Quest Log & Lore Modal UI
// ==========================================

import { WORLD_ATLAS_REGIONS } from "./worldAtlasData.js";
import { QUEST_CATALOG } from "./questCatalogData.js";
import { ROOM_TYPES, EQUIPMENT_CATALOG, CHAMPION_TITLES, ACHIEVEMENTS_CATALOG } from "../../shared/protocol.js";

export function setupWorldAtlasAndLoreUi({
  getQuestState,
  getPlayer,
  getCurrentRoomType,
  audio,
  toggleModal,
  saveQuestState,
  updateQuestTrackerHUD,
  isSinglePlayer,
  net,
}) {
  let currentLoreTab = "quests";
  let currentAtlasView = "square"; // "square" | "grid"
  let selectedMapRegionId = "SANCTUARY_HUB";
  let edgeScrollTimer = null;

  let currentLoreTab = 'quests';
  let currentAtlasView = 'square'; // 'square' | 'grid'
  let selectedMapRegionId = 'SANCTUARY_HUB';
  let edgeScrollTimer = null;

  window.switchLoreTab = function (tab) {
    currentLoreTab = tab;
    renderLoreModal();
  };

  window.openQuestLog = function () {
    currentLoreTab = 'quests';
    if (document.getElementById('lore-modal')?.style.display !== 'block') {
      window.toggleModal('lore-modal');
    }
    renderLoreModal();
  };

  window.openWorldMap = function () {
    currentLoreTab = 'map';
    const curKey = String(currentRoomType || '').toUpperCase();
    if (WORLD_ATLAS_REGIONS[curKey]) {
      selectedMapRegionId = curKey;
    }
    if (document.getElementById('lore-modal')?.style.display !== 'block') {
      window.toggleModal('lore-modal');
    }
    renderLoreModal();
  };

  window.toggleWorldAtlas = function () {
    if (typeof window !== 'undefined' && typeof window._isDeadScreenVisible === 'function' && window._isDeadScreenVisible()) return;
    const modal = document.getElementById('lore-modal');
    if (modal && modal.style.display === 'block' && currentLoreTab === 'map') {
      window.toggleModal('lore-modal');
    } else {
      window.openWorldMap();
    }
  };

  window.setAtlasViewMode = function (mode) {
    currentAtlasView = mode;
    const body = document.getElementById('lore-modal-body');
    if (body && currentLoreTab === 'map') {
      renderWorldAtlasView(body);
    }
  };

  window.centerMapOnPlayer = function () {
    const curKey = String(currentRoomType || '').toUpperCase();
    if (WORLD_ATLAS_REGIONS[curKey]) {
      window.selectMapRegion(curKey, true);
    }
  };

  window.edgeHoverScroll = function (direction) {
    if (edgeScrollTimer) clearTimeout(edgeScrollTimer);
    const reg = WORLD_ATLAS_REGIONS[selectedMapRegionId];
    if (!reg || !reg.neighbors || !reg.neighbors[direction]) return;
    const targetId = reg.neighbors[direction];
    edgeScrollTimer = setTimeout(() => {
      window.selectMapRegion(targetId, true);
    }, 200);
  };

  window.cancelEdgeHoverScroll = function () {
    if (edgeScrollTimer) {
      clearTimeout(edgeScrollTimer);
      edgeScrollTimer = null;
    }
  };

  window.selectMapRegion = function (regId, playSound = false) {
    if (!WORLD_ATLAS_REGIONS[regId]) return;
    selectedMapRegionId = regId;
    if (playSound && audio && audio.playChime) {
      audio.playChime();
    }
    const body = document.getElementById('lore-modal-body');
    if (body && currentLoreTab === 'map') {
      renderWorldAtlasView(body);
    }
  };

  window.inspectMapRegion = function (regId) {
    window.selectMapRegion(regId, false);
  };

  window.toggleQuestTracking = function (qId) {
    if (!questState.trackedQuests) questState.trackedQuests = {};
    const currentlyTracked = questState.trackedQuests[qId] !== false;
    questState.trackedQuests[qId] = !currentlyTracked;
    saveQuestState();
    updateQuestTrackerHUD();
    renderLoreModal();
  };

  window.setAllQuestTracking = function (track) {
    if (!questState.trackedQuests) questState.trackedQuests = {};
    for (const qId of Object.keys(questState.activeQuests || {})) {
      questState.trackedQuests[qId] = Boolean(track);
    }
    saveQuestState();
    updateQuestTrackerHUD();
    renderLoreModal();
  };

  function getRegionInspectorHtml(regId) {
    const reg = WORLD_ATLAS_REGIONS[regId] || WORLD_ATLAS_REGIONS.SANCTUARY_HUB;
    const isPlayerHere = String(currentRoomType || '').toUpperCase() === reg.id;
    const n = reg.neighbors || {};

    return `
      <div style="background:#070b18; border:2px solid ${reg.borderColor}; border-radius:6px; padding:12px; height:100%; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid #1e293b; padding-bottom:6px;">
          <div>
            <div style="font-family:var(--font-header); font-size:14px; font-weight:800; color:${reg.color}; letter-spacing:0.5px;">
              ${reg.name.toUpperCase()}
            </div>
            <div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">${reg.sub}</div>
          </div>
          <div style="text-align:right;">
            <span style="display:inline-block; font-size:9.5px; font-weight:bold; background:#0f172a; border:1px solid ${reg.color}; color:${reg.color}; padding:2px 7px; border-radius:3px;">
              ${reg.dangerTag}
            </span>
            <div style="font-size:10px; color:#facc15; font-weight:bold; margin-top:3px;">${reg.level}</div>
          </div>
        </div>

        ${isPlayerHere ? `
          <div style="background:rgba(34, 197, 94, 0.15); border:1px solid #22c55e; color:#86efac; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>📍</span><span>YOU ARE CURRENTLY IN THIS REALM (${Math.round(player.x)}, ${Math.round(player.y)})</span>
          </div>
        ` : ''}

        <!-- Connected Edge Boundaries (Click to Navigate) -->
        <div style="margin-bottom:8px; background:#0b1120; border:1px solid #1e293b; border-radius:4px; padding:6px 8px;">
          <div style="font-size:9px; color:#64748b; font-weight:bold; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">
            🧭 Connected Territory Boundaries
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-size:9.5px;">
            ${n.north ? `
              <button type="button" onclick="selectMapRegion('${n.north}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ▲ North: ${WORLD_ATLAS_REGIONS[n.north]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">▲ North: None (Edge)</div>'}
            ${n.south ? `
              <button type="button" onclick="selectMapRegion('${n.south}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ▼ South: ${WORLD_ATLAS_REGIONS[n.south]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">▼ South: None (Edge)</div>'}
            ${n.west ? `
              <button type="button" onclick="selectMapRegion('${n.west}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ◀ West: ${WORLD_ATLAS_REGIONS[n.west]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">◀ West: None (Edge)</div>'}
            ${n.east ? `
              <button type="button" onclick="selectMapRegion('${n.east}', true)" style="background:#0f172a; border:1px solid #38bdf8; color:#7dd3fc; padding:3px 6px; border-radius:3px; cursor:pointer; text-align:left; font-size:9px;">
                ▶ East: ${WORLD_ATLAS_REGIONS[n.east]?.name.split(' ')[0]}
              </button>
            ` : '<div style="color:#475569; font-size:9px; padding:3px 6px;">▶ East: None (Edge)</div>'}
          </div>
        </div>

        <div style="margin-bottom:8px;">
          <div style="font-size:10px; font-weight:bold; text-transform:uppercase; margin-bottom:2px; color:#38bdf8;">
            🏛️ Faction &amp; Affiliation
          </div>
          <div style="font-size:10.5px; color:#f8fafc; font-weight:600;">${reg.faction}</div>
          <div style="font-size:9.5px; color:#94a3b8; margin-top:2px; line-height:1.4;">${reg.desc}</div>
        </div>

        <div style="margin-bottom:8px;">
          <div style="font-size:10px; font-weight:bold; text-transform:uppercase; margin-bottom:3px; color:#fde047;">
            👾 Entities &amp; Inhabitants
          </div>
          <div style="display:flex; flex-direction:column; gap:3px; max-height:120px; overflow-y:auto; padding-right:2px;">
            ${reg.entities.map((e) => `
              <div style="background:#0c1222; border-left:2px solid ${reg.color}; padding:3px 6px; font-size:9.5px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <b style="color:#f1f5f9;">${e.name}</b>
                  <span style="color:#facc15; font-size:9px; font-weight:bold;">${e.hp}</span>
                </div>
                <div style="color:#94a3b8; font-size:8.5px; margin-top:1px;">${e.type} • ${e.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="background:#090d1c; border:1px solid #1e293b; border-radius:4px; padding:5px 8px;">
          <div style="font-size:9.5px; color:#facc15; font-weight:bold; text-transform:uppercase; margin-bottom:2px;">
            🧭 Pathfinding Route (From Sanctuary)
          </div>
          <div style="font-size:9.5px; color:#cbd5e1; line-height:1.4;">${reg.travel}</div>
        </div>
      </div>
    `;
  }

  function renderSquareZoneView(reg) {
    const isPlayerHere = String(currentRoomType || '').toUpperCase() === reg.id;
    const n = reg.neighbors || {};
    const northReg = n.north ? WORLD_ATLAS_REGIONS[n.north] : null;
    const southReg = n.south ? WORLD_ATLAS_REGIONS[n.south] : null;
    const westReg = n.west ? WORLD_ATLAS_REGIONS[n.west] : null;
    const eastReg = n.east ? WORLD_ATLAS_REGIONS[n.east] : null;

    // Player position percentage on current map
    let playerMarkerX = 50;
    let playerMarkerY = 50;
    if (isPlayerHere && mapBounds.halfW && mapBounds.halfH) {
      playerMarkerX = Math.max(10, Math.min(90, 50 + (player.x / mapBounds.halfW) * 40));
      playerMarkerY = Math.max(10, Math.min(90, 50 + (player.y / mapBounds.halfH) * 40));
    }

    return `
      <div style="display:flex; flex-direction:column; gap:0; background:#060a14; border:2px solid ${reg.borderColor}; border-radius:6px; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.8);">
        <!-- TOP EDGE SCROLL BAR (NORTH) -->
        <div class="map-edge-scroll north"
          onmouseenter="edgeHoverScroll('north')"
          onmouseleave="cancelEdgeHoverScroll()"
          onclick="if ('${n.north || ''}') selectMapRegion('${n.north}', true)"
          style="
            height: 26px;
            background: ${northReg ? '#0b162c' : '#05070f'};
            border-bottom: 1px solid ${northReg ? '#38bdf8' : '#1e293b'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${northReg ? 'pointer' : 'default'};
            font-size: 10px;
            font-weight: bold;
            color: ${northReg ? '#38bdf8' : '#475569'};
            transition: all 0.15s ease;
            user-select: none;
            letter-spacing: 0.5px;
          "
          title="${northReg ? 'Hover or click to scroll North into ' + northReg.name : 'Northern Boundary'}">
          ${northReg ? `▲ HOVER EDGE TO SCROLL NORTH: ${northReg.name.toUpperCase()} [${northReg.level}] ▲` : '— NORTHERN SEA BOUNDARY (THE FALL) —'}
        </div>

        <!-- MIDDLE ROW: WEST BAR + SQUARE MAP CANVAS + EAST BAR -->
        <div style="display:flex; height: 340px; position:relative;">
          <!-- LEFT EDGE SCROLL BAR (WEST) -->
          <div class="map-edge-scroll west"
            onmouseenter="edgeHoverScroll('west')"
            onmouseleave="cancelEdgeHoverScroll()"
            onclick="if ('${n.west || ''}') selectMapRegion('${n.west}', true)"
            style="
              width: 26px;
              background: ${westReg ? '#0b162c' : '#05070f'};
              border-right: 1px solid ${westReg ? '#38bdf8' : '#1e293b'};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: ${westReg ? 'pointer' : 'default'};
              font-size: 10px;
              font-weight: bold;
              color: ${westReg ? '#38bdf8' : '#475569'};
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              transition: all 0.15s ease;
              user-select: none;
              letter-spacing: 0.5px;
            "
            title="${westReg ? 'Hover or click to scroll West into ' + westReg.name : 'Western Boundary'}">
            ${westReg ? `◀ WEST: ${westReg.name.toUpperCase()}` : '— WEST BOUNDARY —'}
          </div>

          <!-- THE SQUARE MAP INTERIOR CANVAS -->
          <div style="
            flex: 1;
            position: relative;
            background:
              radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(5, 8, 16, 0.95) 75%),
              repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,0.03) 31px, rgba(255,255,255,0.03) 32px),
              repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,0.03) 31px, rgba(255,255,255,0.03) 32px),
              #080d1a;
            border-radius: 0;
            overflow: hidden;
          ">
            <!-- Compass Rose in Top-Right Corner -->
            <div style="position:absolute; top:8px; right:8px; background:rgba(6,10,20,0.85); border:1px solid #334155; border-radius:50%; width:34px; height:34px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:8px; font-weight:800; color:#cbd5e1; user-select:none; z-index:10; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
              <span style="color:#facc15; font-size:9px; margin-top:-2px;">N</span>
              <span style="font-size:7px; color:#64748b; margin-top:-1px;">W • E</span>
              <span style="font-size:7px; color:#64748b; margin-top:-1px;">S</span>
            </div>

            <!-- Regional Banner in Top-Left -->
            <div style="position:absolute; top:8px; left:8px; background:rgba(7,11,22,0.9); border:1px solid ${reg.color}; border-radius:4px; padding:3px 8px; z-index:10; box-shadow:0 2px 8px rgba(0,0,0,0.6);">
              <div style="font-family:var(--font-header); font-size:11px; font-weight:800; color:${reg.color};">
                ${reg.name}
              </div>
              <div style="font-size:8.5px; color:#cbd5e1;">${reg.sub} • <b style="color:#facc15;">${reg.level}</b></div>
            </div>

            <!-- Road/Pathway Leyline Overlays -->
            <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;">
              <!-- Central Leyline Convergence -->
              <circle cx="50%" cy="50%" r="22" fill="none" stroke="${reg.color}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.4" />
              ${n.north ? `<line x1="50%" y1="50%" x2="50%" y2="0%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
              ${n.south ? `<line x1="50%" y1="50%" x2="50%" y2="100%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
              ${n.west ? `<line x1="50%" y1="50%" x2="0%" y2="50%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
              ${n.east ? `<line x1="50%" y1="50%" x2="100%" y2="50%" stroke="${reg.color}" stroke-width="2" opacity="0.35" stroke-dasharray="4,2" />` : ''}
            </svg>

            <!-- Landmark Pins on Square Map -->
            ${(reg.landmarks || []).map((lm, idx) => `
              <div class="rs-map-pin"
                style="
                  position: absolute;
                  left: ${lm.x}%;
                  top: ${lm.y}%;
                  transform: translate(-50%, -50%);
                  cursor: pointer;
                  z-index: 5;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  transition: transform 0.15s ease;
                "
                title="${lm.name} • ${lm.sub}&#10;${lm.desc}">
                <div style="
                  background: rgba(10, 15, 30, 0.95);
                  border: 1.5px solid ${reg.color};
                  border-radius: 4px;
                  width: 22px;
                  height: 22px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  box-shadow: 0 0 8px rgba(0,0,0,0.8);
                ">
                  ${lm.icon}
                </div>
                <div style="
                  font-size: 8px;
                  font-weight: bold;
                  color: #e2e8f0;
                  background: rgba(4, 7, 15, 0.85);
                  border: 1px solid #334155;
                  border-radius: 2px;
                  padding: 1px 4px;
                  margin-top: 2px;
                  white-space: nowrap;
                  text-shadow: 0 1px 2px #000;
                  pointer-events: none;
                ">
                  ${lm.name}
                </div>
              </div>
            `).join('')}

            <!-- Player Location Pulse Marker -->
            ${isPlayerHere ? `
              <div style="
                position: absolute;
                left: ${playerMarkerX}%;
                top: ${playerMarkerY}%;
                transform: translate(-50%, -50%);
                z-index: 8;
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
              ">
                <div style="
                  width: 14px;
                  height: 14px;
                  background: #ffffff;
                  border: 2px solid #38bdf8;
                  border-radius: 50%;
                  box-shadow: 0 0 14px #ffffff, 0 0 24px #38bdf8;
                  animation: pulse 1.4s infinite;
                "></div>
                <div style="
                  font-size: 8px;
                  font-weight: 800;
                  color: #ffffff;
                  background: rgba(2, 132, 199, 0.9);
                  border: 1px solid #7dd3fc;
                  border-radius: 3px;
                  padding: 1px 5px;
                  margin-top: 2px;
                  white-space: nowrap;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.8);
                ">
                  📍 YOU ARE HERE
                </div>
              </div>
            ` : ''}

            <!-- Map Scale indicator in bottom-left -->
            <div style="position:absolute; bottom:6px; left:8px; font-size:8px; color:#64748b; font-family:monospace; user-select:none; z-index:10; background:rgba(6,10,20,0.7); padding:1px 5px; border-radius:2px; border:1px solid #1e293b;">
              SCALE: 100px ≈ 20 YARDS
            </div>
          </div>

          <!-- RIGHT EDGE SCROLL BAR (EAST) -->
          <div class="map-edge-scroll east"
            onmouseenter="edgeHoverScroll('east')"
            onmouseleave="cancelEdgeHoverScroll()"
            onclick="if ('${n.east || ''}') selectMapRegion('${n.east}', true)"
            style="
              width: 26px;
              background: ${eastReg ? '#0b162c' : '#05070f'};
              border-left: 1px solid ${eastReg ? '#38bdf8' : '#1e293b'};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: ${eastReg ? 'pointer' : 'default'};
              font-size: 10px;
              font-weight: bold;
              color: ${eastReg ? '#38bdf8' : '#475569'};
              writing-mode: vertical-rl;
              transition: all 0.15s ease;
              user-select: none;
              letter-spacing: 0.5px;
            "
            title="${eastReg ? 'Hover or click to scroll East into ' + eastReg.name : 'Eastern Boundary'}">
            ${eastReg ? `▶ EAST: ${eastReg.name.toUpperCase()}` : '— EAST BOUNDARY —'}
          </div>
        </div>

        <!-- BOTTOM EDGE SCROLL BAR (SOUTH) -->
        <div class="map-edge-scroll south"
          onmouseenter="edgeHoverScroll('south')"
          onmouseleave="cancelEdgeHoverScroll()"
          onclick="if ('${n.south || ''}') selectMapRegion('${n.south}', true)"
          style="
            height: 26px;
            background: ${southReg ? '#0b162c' : '#05070f'};
            border-top: 1px solid ${southReg ? '#38bdf8' : '#1e293b'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${southReg ? 'pointer' : 'default'};
            font-size: 10px;
            font-weight: bold;
            color: ${southReg ? '#38bdf8' : '#475569'};
            transition: all 0.15s ease;
            user-select: none;
            letter-spacing: 0.5px;
          "
          title="${southReg ? 'Hover or click to scroll South into ' + southReg.name : 'Southern Boundary'}">
          ${southReg ? `▼ HOVER EDGE TO SCROLL SOUTH: ${southReg.name.toUpperCase()} [${southReg.level}] ▼` : '— SOUTHERN FRONTIER BOUNDARY —'}
        </div>
      </div>
    `;
  }

  function renderContinentalGridView() {
    const realmOrder = [
      'ABYSSAL_RIFT',
      'CELESTIAL_ASCENT',
      'NEXUS_WARZONE',
      'STARFALL_CRATER',
      'NEXUS_FORGOTTEN_RUINS',
      'AETHER_SPIRE',
      'SANCTUARY_HUB',
      'SOLARI_CITADEL',
      'UMBRI_UNDERCITY',
      'TERRA_ORCHARD'
    ];

    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:10px; color:#94a3b8; margin-bottom:2px;">
          Click any continental realm below to inspect its Square Map:
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; max-height:380px; overflow-y:auto; padding-right:4px;">
          ${realmOrder.map((regId) => {
            const reg = WORLD_ATLAS_REGIONS[regId];
            if (!reg) return '';
            const isHere = String(currentRoomType || '').toUpperCase() === regId;
            const isSelected = selectedMapRegionId === regId;
            return `
              <div onclick="selectMapRegion('${reg.id}', true); setAtlasViewMode('square');"
                style="
                  background: #090e1d;
                  border: 2px solid ${isSelected ? '#ffffff' : reg.borderColor};
                  border-radius: 5px;
                  padding: 8px 10px;
                  cursor: pointer;
                  transition: all 0.15s ease;
                  ${isSelected ? 'box-shadow:0 0 14px rgba(255,255,255,0.25);' : ''}
                ">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <b style="font-family:var(--font-header); font-size:11.5px; color:${reg.color};">${reg.name}</b>
                  <span style="font-size:9px; color:${reg.color}; background:#070c18; border:1px solid ${reg.color}; padding:1px 5px; border-radius:3px; font-weight:bold;">
                    ${reg.dangerTag}
                  </span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:9.5px; color:#94a3b8;">
                  <span>${reg.level}</span>
                  ${isHere ? '<b style="color:#4ade80; background:rgba(34,197,94,0.2); padding:1px 5px; border-radius:3px; border:1px solid #22c55e;">📍 HERE</b>' : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderWorldAtlasView(body) {
    const currentReg = WORLD_ATLAS_REGIONS[selectedMapRegionId] || WORLD_ATLAS_REGIONS.SANCTUARY_HUB;

    body.innerHTML = `
      <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:var(--font-header); font-size:12.5px; color:#facc15; font-weight:bold; letter-spacing:0.5px;">
            🗺️ CONTINENTAL REALMS ATLAS
          </span>
          <div style="display:inline-flex; background:#070c18; border:1px solid #334155; border-radius:4px; overflow:hidden;">
            <button type="button" onclick="setAtlasViewMode('square')" style="background:${currentAtlasView === 'square' ? '#1e293b' : 'transparent'}; border:none; color:${currentAtlasView === 'square' ? '#facc15' : '#94a3b8'}; padding:3px 8px; font-size:9.5px; font-weight:bold; cursor:pointer;">
              🔲 SQUARE ZONE VIEW
            </button>
            <button type="button" onclick="setAtlasViewMode('grid')" style="background:${currentAtlasView === 'grid' ? '#1e293b' : 'transparent'}; border:none; color:${currentAtlasView === 'grid' ? '#facc15' : '#94a3b8'}; padding:3px 8px; font-size:9.5px; font-weight:bold; cursor:pointer;">
              🌐 CONTINENTAL GRID
            </button>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" onclick="centerMapOnPlayer()" style="background:#0f172a; border:1px solid #22c55e; color:#86efac; font-size:9.5px; font-weight:bold; padding:2px 8px; border-radius:3px; cursor:pointer;" title="Jump map directly to your character's active realm">
            📍 YOU ARE HERE (${WORLD_ATLAS_REGIONS[currentRoomType]?.name || currentRoomType})
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 340px; gap:12px; align-items:start;">
        <!-- Left: Square Map Viewport with 4 Edge-Hover Scroll Bars OR Grid Overview -->
        <div>
          ${currentAtlasView === 'square' ? renderSquareZoneView(currentReg) : renderContinentalGridView()}
        </div>

        <!-- Right: Real-time Region Codex & Entity Inspector -->
        <div id="atlas-inspector-panel">
          ${getRegionInspectorHtml(selectedMapRegionId)}
        </div>
      </div>
    `;
  }

  function renderQuestLogView(body) {
    const activeList = [];
    for (const qId of Object.keys(questState.activeQuests || {})) {
      if (QUEST_CATALOG[qId]) activeList.push(QUEST_CATALOG[qId]);
    }
    if (activeList.length === 0 && !questState.completedQuests?.quest_awakening) {
      const charName = String(localProfile?.displayName || localProfile?.name || '').toUpperCase();
      const isExperienced = (prog && (prog.level || 1) >= 2) || charName === 'EWACH';
      if (!isExperienced) {
        activeList.push(QUEST_CATALOG.quest_awakening);
      }
    }

    const completedList = [];
    for (const qId of Object.keys(questState.completedQuests || {})) {
      if (QUEST_CATALOG[qId]) completedList.push(QUEST_CATALOG[qId]);
    }

    const availableList = [];
    for (const qId of Object.keys(QUEST_CATALOG)) {
      const q = QUEST_CATALOG[qId];
      const isCompleted = Boolean(questState.completedQuests?.[qId]);
      const isActive = Boolean(questState.activeQuests?.[qId]);            const prereqMet = isQuestPrereqMet(q);
      if (!isCompleted && !isActive && prereqMet) {
        availableList.push(q);
      }
    }

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #1e293b; padding-bottom:6px;">
        <div>
          <span style="font-family:var(--font-header); font-size:13px; color:#facc15; font-weight:bold;">
            📜 SUMMONER QUEST JOURNAL
          </span>
          <span style="font-size:10px; color:#94a3b8; margin-left:8px;">
            Active: <b style="color:#38bdf8;">${activeList.length}</b> | Available: <b style="color:#fde047;">${availableList.length}</b> | Completed: <b style="color:#4ade80;">${completedList.length}</b> | 🛡️ Quest Points: <b style="color:#facc15;">${getTotalCompletedQuestPoints()} / ${getMaxQuestPoints()}</b>
          </span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="id-mini-btn" onclick="resetAllQuests(true)" title="Restart all quests from Awakening" style="font-size:9.5px; padding:3px 8px; border-color:#f59e0b; color:#fbbf24;">
            ↺ RESTART QUESTS
          </button>
          <button class="id-mini-btn" onclick="setAllQuestTracking(true)" title="Pin all active quests to HUD" style="font-size:9.5px; padding:3px 8px;">
            👁️ PIN ALL TO HUD
          </button>
          <button class="id-mini-btn" onclick="setAllQuestTracking(false)" title="Hide all quests from HUD" style="font-size:9.5px; padding:3px 8px;">
            UNPIN ALL
          </button>
        </div>
      </div>

      <!-- Section 1: Active Quests (In Progress) -->
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:11px; font-weight:bold; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">
            ⚔️ Active Quests in Progress (${activeList.length})
          </span>
          <span style="font-size:9.5px; color:#94a3b8;">Check the box to pin/display on your HUD tracker</span>
        </div>

        ${activeList.length === 0 ? `
          <div style="background:#090d1c; border:1px dashed #334155; padding:12px; text-align:center; color:#94a3b8; font-size:10.5px;">
            No quests currently in progress. Speak with NPCs with a golden <b style="color:#facc15;">[ ! ]</b> mark in the world to accept quests!
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${activeList.map((q) => {
              const isReady = q.isComplete();
              const isTracked = questState.trackedQuests?.[q.id] !== false;
              const completedTasks = q.tasks.filter(t => t.done()).length;
              return `
                <div style="background:#080d1e; border:2px solid ${isReady ? '#facc15' : isTracked ? '#38bdf8' : '#1e293b'}; border-radius:6px; padding:10px 12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; font-weight:bold; color:${isTracked ? '#38bdf8' : '#64748b'}; background:#0c1326; border:1px solid ${isTracked ? '#38bdf8' : '#334155'}; padding:2px 6px; border-radius:3px;">
                        <input type="checkbox" ${isTracked ? 'checked' : ''} onchange="toggleQuestTracking('${q.id}')" style="cursor:pointer; margin:0;">
                        <span>${isTracked ? '👁️ DISPLAYED ON HUD' : 'PIN TO HUD'}</span>
                      </label>
                      <span style="font-family:var(--font-header); font-size:12px; font-weight:bold; color:#fde047;">
                        📜 ${q.title.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span style="font-size:10px; font-weight:bold; background:${isReady ? 'rgba(250,204,21,0.2)' : 'rgba(56,189,248,0.15)'}; border:1px solid ${isReady ? '#facc15' : '#38bdf8'}; color:${isReady ? '#facc15' : '#38bdf8'}; padding:2px 7px; border-radius:3px;">
                        ${isReady ? '✨ READY TO TURN IN' : `PROGRESS: ${completedTasks}/${q.tasks.length}`}
                      </span>
                    </div>
                  </div>

                  <div style="font-size:10.5px; color:#cbd5e1; margin-bottom:8px; line-height:1.45;">
                    ${q.description}
                  </div>

                  <!-- Tasks Checklist -->
                  <div style="background:#050814; border:1px solid #1e293b; border-radius:4px; padding:6px 8px; margin-bottom:8px; display:flex; flex-direction:column; gap:4px;">
                    ${q.tasks.map((t) => {
                      const done = t.done();
                      const countStr = t.counter ? ` (${t.counter()})` : '';
                      return `
                        <div style="display:flex; align-items:center; gap:6px; font-size:10px;">
                          <span style="width:14px; height:14px; display:inline-flex; align-items:center; justify-content:center; border:1px solid ${done ? '#86efac' : '#38bdf8'}; background:${done ? '#15803d' : '#0a1020'}; color:#ffffff; font-weight:bold; font-size:9.5px; border-radius:2px;">
                            ${done ? '✓' : ''}
                          </span>
                          <span style="${done ? 'color:#94a3b8; text-decoration:line-through;' : 'color:#f8fafc;'}">
                            ${t.text}${countStr}
                          </span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px; color:#94a3b8;">
                    <span>Turn in to: <b style="color:#f1f5f9;">${getNpcName(q.turnInId)}</b></span>
                    <span style="color:#facc15; font-weight:bold;">
                      🎁 REWARDS: +${q.rewards.xp} XP | +${q.rewards.glimmer || 0} GLIMMER
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Section 2: Available Quests in the Realm -->
      ${availableList.length > 0 ? `
        <div style="margin-bottom:14px;">
          <div style="font-size:11px; font-weight:bold; color:#facc15; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            ⭐ Available Quests in the Realm (${availableList.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${availableList.map((q) => `
              <div style="background:#090e1d; border:1px solid #334155; border-radius:5px; padding:8px 10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                  <span style="font-family:var(--font-header); font-size:11px; font-weight:bold; color:#facc15;">
                    ⭐ ${q.title}
                  </span>
                  <span style="font-size:9.5px; color:#94a3b8;">
                    Giver: <b style="color:#38bdf8;">${getNpcName(q.giverId)}</b>
                  </span>
                </div>
                <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;">${q.description}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#64748b;">
                  <span>Speak with ${getNpcName(q.giverId)} to accept</span>
                  <span style="color:#fde047;">+${q.rewards.xp} XP | +${q.rewards.glimmer || 0} Glimmer</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section 3: Completed Quests Archive -->
      ${completedList.length > 0 ? `
        <div>
          <div style="font-size:11px; font-weight:bold; color:#4ade80; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            ✓ Completed Quests Archive (${completedList.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; max-height:120px; overflow-y:auto;">
            ${completedList.map((q) => `
              <div style="background:#070b16; border-left:3px solid #22c55e; padding:5px 8px; font-size:10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <b style="color:#86efac;">✓ ${q.title}</b>
                  <span style="color:#64748b; margin-left:6px;">— Turn-in: ${getNpcName(q.turnInId)}</span>
                </div>
                <span style="color:#4ade80; font-size:9px;">+${q.rewards.xp} XP CLAIMED</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  function renderChronicleView(body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="background:#080c18; border:2px solid #facc15; padding:10px; border-radius:4px;">
          <b style="color:#facc15; display:block; margin-bottom:4px; font-family:var(--font-header); font-size:12px;">
            I. THE CRYSTAL HEART &amp; THE GREAT GLIMMER FRACTURE
          </b>
          Before the continental caldera took shape, cosmic reality hung in perfect equilibrium between the radiant Golden Sun and the deep Abyssal Void. At the exact nexus of these primordial forces beat a solitary celestial organ: the <b>Crystal Heart</b>—an iridescent, multi-faceted anatomical heart glowing with pure rainbow prismatic light.<br/><br/>
          As cosmic tensions escalated, violent purple lightning fissures ruptured across the crystalline chambers. In an apocalyptic detonation, the <b>Crystal Heart shattered</b>! Flaming iridescent meteor shards fell from the heavens across the continent. With the Heart destroyed, the unified white Glimmer fractured into the four elemental aspects: <b>☀️ Solari Dawn</b>, <b>🌑 Umbri Dusk</b>, <b>🌿 Terra Earth</b>, and <b>🔮 Aether Chronoflux</b>.
        </div>
        <div style="background:#080c18; border:2px solid #1e293b; padding:10px; border-radius:4px;">
          <b style="color:#38bdf8; display:block; margin-bottom:4px; font-family:var(--font-header); font-size:12px;">
            II. YOUR AWAKENING FROM STASIS
          </b>
          Sealed in starlight crystal in <b>Sanctuary Haven</b> since the Fall, you awaken as a <b>Summoner-Knight</b>. Train with <b>Herald Lyra</b>, form 3-player squads [O], and venture into the outer realms—banishing enemies into Void smoke, defending our Sanctuary, and shattering rival Monoliths!
        </div>
        <div style="background:#080c18; border:2px solid #a855f7; padding:10px; border-radius:4px;">
          <b style="color:#c084fc; display:block; margin-bottom:4px; font-family:var(--font-header); font-size:12px;">
            III. SPOTLIGHT: THE GRAVEGLASS ORACLE (UMBRAL MYSTIC)
          </b>
          From the subterranean catacombs of the Undercity emerge the <b>Graveglass Oracles</b>. Masters of life-force drain, they trap enemies in <b>Nightfall Plague</b> (-45% slow), rip vitality into their own health pool with <b>Siphon Soul</b> (heals 60% of damage dealt), shield themselves with <b>Graveglass Ward</b>, and obliterate foes below 50% HP using the execution rite <b>Unmake</b> (+50% execution damage). Prioritize <b>Resonance &gt; Power &gt; Tempo</b>.
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:10px;">
          <div style="background:#080c18; border-left:3px solid #facc15; padding:8px; border-radius:3px;">
            <b style="color:#facc15;">☀️ SOLARI (The Light)</b><br/>Radiant citadels, angelic heralds, Bulwark shields &amp; burning Daystar Rites.
          </div>
          <div style="background:#080c18; border-left:3px solid #a855f7; padding:8px; border-radius:3px;">
            <b style="color:#c084fc;">🌑 UMBRI (The Shadow)</b><br/>Duskveil assassins, Soul Tithes, Stealth strikes &amp; whispers from the Void.
          </div>
          <div style="background:#080c18; border-left:3px solid #22c55e; padding:8px; border-radius:3px;">
            <b style="color:#4ade80;">🌿 TERRA (The Earth)</b><br/>Ancient stone Behemoths, Overwhelm stampedes &amp; Ironwood resilience.
          </div>
          <div style="background:#080c18; border-left:3px solid #38bdf8; padding:8px; border-radius:3px;">
            <b style="color:#38bdf8;">🔮 AETHER (The Magic)</b><br/>Starforged scholars bending time with Chrono Shifts &amp; Reality Fractures.
          </div>
        </div>
        <div style="text-align:center; padding-top:6px;">
          <a href="https://www.glimmerfalltcg.com" target="_blank" rel="noreferrer" style="color:#facc15; font-family:var(--font-header); font-size:10.5px; text-decoration:none;">
            ▸ EXPLORE ALL 322 CARDS AT GLIMMERFALLTCG.COM ◂
          </a>
        </div>
      </div>
    `;
  }

  window.renderLoreModal = renderLoreModal;
  function renderLoreModal() {
    const modal = document.getElementById('lore-modal');
    if (!modal) return;
    const body = document.getElementById('lore-modal-body');
    if (!body) return;

    const tabQuestsBtn = document.getElementById('lore-tab-quests');
    const tabMapBtn = document.getElementById('lore-tab-map');
    const tabChronicleBtn = document.getElementById('lore-tab-chronicle');
    if (tabQuestsBtn) tabQuestsBtn.className = `st-tab-btn ${currentLoreTab === 'quests' ? 'active' : ''}`;
    if (tabMapBtn) tabMapBtn.className = `st-tab-btn ${currentLoreTab === 'map' ? 'active' : ''}`;
    if (tabChronicleBtn) tabChronicleBtn.className = `st-tab-btn ${currentLoreTab === 'chronicle' ? 'active' : ''}`;

    if (currentLoreTab === 'quests') {
      renderQuestLogView(body);
    } else if (currentLoreTab === 'map') {
      renderWorldAtlasView(body);
    } else {
      renderChronicleView(body);
    }
  }

  return {
    renderLoreModal,
    openWorldMap: window.openWorldMap,
    openQuestLog: window.openQuestLog,
    toggleWorldAtlas: window.toggleWorldAtlas,
    switchLoreTab: window.switchLoreTab,
  };
}
