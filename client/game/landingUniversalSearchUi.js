// ==========================================
// Pre-Game Landing Overlay Universal Search Modal & Searchable Continental Map UI
// Shared data imported from ../../landing/src/data/universalSearchData.js
// ==========================================

import {
  UNIVERSAL_SEARCH_ALL,
  UNIVERSAL_SEARCH_ZONES,
  resolveUniversalEntry,
  searchMapZones,
  searchUniversalCatalog,
} from '../../landing/src/data/universalSearchData.js';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'item', label: 'Items' },
  { id: 'npc', label: 'NPCs' },
  { id: 'character', label: 'Characters' },
  { id: 'quest', label: 'Quests' },
  { id: 'zone', label: 'Map Zones' },
  { id: 'skill', label: 'Skills' },
];

const QUICK_LOOKUP_CHIPS = [
  { label: 'Sunbloom Petal', ref: 'sunbloom_herb' },
  { label: 'Chrono-Lotus', ref: 'chrono_lotus' },
  { label: 'Empyrean Starleaf', ref: 'empyrean_starleaf' },
  { label: 'Alchemist Faye', ref: 'merchant_apothecary' },
  { label: 'Herald Lyra', ref: 'npc_aurora' },
  { label: 'Starfall Moon-Owl', ref: 'starfall_moon_owl' },
  { label: 'Rite-Binding', ref: 'rite_binding' },
];

const QUICK_MAP_FILTERS = [
  { label: 'All 17 Realms', query: '' },
  { label: 'Safe Havens', query: 'Sanctuary' },
  { label: 'Chrono-Lotus', query: 'Chrono-Lotus' },
  { label: 'Starmetal Ore', query: 'Starmetal' },
  { label: 'Alchemist Faye', query: 'Alchemist Faye' },
  { label: 'Ignis-Core', query: 'Ignis-Core' },
  { label: "Xal'Korath", query: "Xal'Korath" },
];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTypeBadgeLabel(entry) {
  if (!entry) return '';
  if (entry.type === 'item') return entry.rarity || 'Item';
  if (entry.type === 'npc') return `${entry.faction || 'Realm'} NPC`;
  if (entry.type === 'character') return entry.kind || 'Character';
  if (entry.type === 'quest') return entry.kind || 'Quest';
  if (entry.type === 'zone') return entry.level || 'Map Zone';
  if (entry.type === 'skill') return `${entry.category || ''} Skill`;
  return entry.type || '';
}

function renderRewardPillsHtml(rewards) {
  if (!rewards) return '';
  const chips = [];
  if (rewards.xp > 0) {
    chips.push(`<span class="gf-us-pill is-sky">+${rewards.xp} Character XP</span>`);
  }
  if (rewards.glimmer > 0) {
    chips.push(`<span class="gf-us-pill is-purple">+${rewards.glimmer} Glimmer</span>`);
  }
  if (rewards.gold > 0) {
    chips.push(`<span class="gf-us-pill is-gold">+${rewards.gold} Gold</span>`);
  }
  for (const p of rewards.professionXp || []) {
    chips.push(
      `<span class="gf-us-pill is-emerald">+${p.xp} ${escapeHtml(p.professionName)} XP</span>`
    );
  }
  for (const it of rewards.items || []) {
    chips.push(`
      <button type="button" class="gf-us-chip-btn"
              onclick="window._landing.inspectUniversalEntry('${escapeHtml(it.id)}')">
        ${escapeHtml(it.icon)} ${escapeHtml(it.name)} &times;${it.qty || 1}
      </button>
    `);
  }
  for (const u of rewards.unlocks || []) {
    chips.push(`<span class="gf-us-pill is-gold">✨ Unlocks: ${escapeHtml(u)}</span>`);
  }
  return `<div class="gf-us-chip-row">${chips.join('')}</div>`;
}

function renderInspectorHtml(entry) {
  if (!entry) {
    return `<div style="padding:36px 16px; text-align:center; color:#94a3b8; font-size:13px;">Select any item, NPC, class, familiar, quest, zone, or skill to view full details.</div>`;
  }

  let bodyHtml = '';

  if (entry.type === 'item') {
    bodyHtml += `
      <div class="gf-us-card">
        <div class="gf-us-eyebrow is-emerald">What It Does &amp; Effects</div>
        <div style="font-size:13.5px; font-weight:700; color:#fff; margin-top:4px;">${escapeHtml(entry.whatItDoes)}</div>
        ${entry.desc && entry.desc !== entry.whatItDoes ? `<p style="font-size:12px; color:#cbd5e1; margin:6px 0 0; line-height:1.5;">${escapeHtml(entry.desc)}</p>` : ''}
        ${entry.guidePrice > 0 ? `<div style="margin-top:6px; font-size:11.5px; color:#fde047; font-weight:700;">🪙 Guide Value: ${Number(entry.guidePrice).toLocaleString()} Gold</div>` : ''}
      </div>
    `;

    if (entry.harvestSources?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card is-emerald-box">
          <div class="gf-us-eyebrow is-emerald">⛏️ How to Harvest (Resonance Extraction [E])</div>
          ${entry.harvestSources
            .map(
              (src) => `
            <div class="gf-us-subcard">
              <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap;">
                <strong style="color:#fff;">${escapeHtml(src.nodeName)} <span style="color:#6ee7b7;">(Req Lv. ${src.reqLevel})</span></strong>
                <span style="color:#cbd5e1;">${src.chancePct}% yield &bull; +${src.xp} XP</span>
              </div>
              ${
                src.zones?.length > 0
                  ? `<div class="gf-us-chip-row" style="margin-top:6px;">
                      <span style="font-size:10px; color:#94a3b8; font-weight:700;">Where:</span>
                      ${src.zones
                        .map(
                          (z) => `<button type="button" class="gf-us-chip-btn is-sky" onclick="window._landing.jumpToAtlasZone('${escapeHtml(z.zoneId)}')">📍 ${escapeHtml(z.zoneName)}</button>`
                        )
                        .join('')}
                    </div>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    if (entry.craftedBy?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card is-purple-box">
          <div class="gf-us-eyebrow is-purple">🔨 How to Craft It (Click Ingredient to Trace)</div>
          ${entry.craftedBy
            .map(
              (rec) => `
            <div class="gf-us-subcard">
              <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                <strong style="color:#fff;">${escapeHtml(rec.stationIcon)} ${escapeHtml(rec.professionName)} Lv. ${rec.reqLevel} @ ${escapeHtml(rec.stationName)}</strong>
                <span style="color:#fde047; font-weight:700;">+${rec.xp} XP</span>
              </div>
              <div class="gf-us-chip-row">
                ${(rec.ingredients || [])
                  .map(
                    (ing) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(ing.id)}')">${escapeHtml(ing.icon)} ${escapeHtml(ing.name)} &times;${ing.qty} &#8599;</button>`
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    if (entry.soldBy?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card is-amber-box">
          <div class="gf-us-eyebrow is-gold">🛍️ Sold by Merchants</div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            ${entry.soldBy
              .map(
                (s) => `
              <button type="button" class="gf-us-list-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(s.merchantId)}')">
                <span><strong>${escapeHtml(s.merchantName)}</strong> &bull; <span style="color:#94a3b8;">${escapeHtml(s.location)}</span></span>
                <span style="color:#fde047; font-weight:700;">${s.price} Gold</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    if (entry.droppedBy?.length > 0 || entry.bountyRewards?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card">
          <div class="gf-us-eyebrow is-rose">⚔️ Drops, Quests &amp; Bounties</div>
          <ul style="margin:6px 0 0; padding-left:16px; color:#e2e8f0; font-size:12px; line-height:1.6;">
            ${(entry.droppedBy || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            ${(entry.bountyRewards || [])
              .map(
                (b) =>
                  `<li><button type="button" class="gf-us-link-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(b.bountyId)}')">Bounty: ${escapeHtml(b.title)} (&times;${b.qty})</button></li>`
              )
              .join('')}
          </ul>
        </div>
      `;
    }

    if (entry.extractsTo || entry.decodedFrom?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card is-sky-box">
          <div class="gf-us-eyebrow is-sky">🔮 Harmonic Extractor Synergy</div>
          ${
            entry.extractsTo
              ? `<div style="margin-top:6px; font-size:12px; color:#e2e8f0;">
                  Extracts to <button type="button" class="gf-us-chip-btn is-sky" onclick="window._landing.inspectUniversalEntry('${escapeHtml(entry.extractsTo.cipherId)}')">${escapeHtml(entry.extractsTo.cipherName)} &times;${entry.extractsTo.qty}</button>
                  <strong style="color:#fde047; margin-left:6px;">+${entry.extractsTo.xp} Extraction XP</strong>
                 </div>`
              : ''
          }
          ${
            entry.decodedFrom?.length > 0
              ? `<div class="gf-us-chip-row" style="margin-top:6px;">
                  ${entry.decodedFrom
                    .map(
                      (df) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(df.rawId)}')">${escapeHtml(df.rawName)} &rarr; &times;${df.qty}</button>`
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>
      `;
    }

    if (entry.usedInRecipes?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card">
          <div class="gf-us-eyebrow is-gold">📦 Used to Craft / Compile (${entry.usedInRecipes.length})</div>
          <div class="gf-us-chip-row" style="margin-top:6px;">
            ${entry.usedInRecipes
              .map(
                (u) => `
              <button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(u.outputId)}')">
                ${escapeHtml(u.outputIcon)} ${escapeHtml(u.outputName)} <small style="color:#94a3b8;">(Lv.${u.reqLevel} &bull; &times;${u.qtyNeeded})</small>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }
  } else if (entry.type === 'npc') {
    bodyHtml += `
      <div class="gf-us-chip-row">
        ${entry.zoneId ? `<button type="button" class="gf-us-chip-btn is-sky" onclick="window._landing.jumpToAtlasZone('${escapeHtml(entry.zoneId)}')">📍 Locate on Map Atlas</button>` : ''}
        ${entry.teachesSkill ? `<button type="button" class="gf-us-chip-btn is-gold" onclick="window._landing.jumpToSkillGuide('${escapeHtml(entry.teachesSkill.id)}')">${escapeHtml(entry.teachesSkill.icon)} ${escapeHtml(entry.teachesSkill.name)} 1–99 Guide</button>` : ''}
      </div>
      <div class="gf-us-card">
        <div class="gf-us-eyebrow is-sky">💬 What ${escapeHtml(entry.name)} Says (${entry.whatTheySay?.length || 0} Quotes)</div>
        ${
          entry.whatTheySay?.length > 0
            ? entry.whatTheySay
                .map((q) => `<blockquote class="gf-us-quote">&ldquo;${escapeHtml(q)}&rdquo;</blockquote>`)
                .join('')
            : '<div style="color:#94a3b8; font-size:12px; margin-top:4px;">Direct station or vendor specialist.</div>'
        }
      </div>
      <div class="gf-us-card is-purple-box">
        <div class="gf-us-eyebrow is-purple">📜 Quests &amp; Rewards Held (${entry.quests?.length || 0})</div>
        ${
          entry.quests?.length > 0
            ? entry.quests
                .map(
                  (q) => `
                <div class="gf-us-subcard">
                  <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                    <button type="button" class="gf-us-link-btn" style="font-size:13px;" onclick="window._landing.inspectUniversalEntry('${escapeHtml(q.id)}')">${escapeHtml(q.title)} &rarr;</button>
                    <span class="gf-us-pill is-purple">${escapeHtml(q.relation)}</span>
                  </div>
                  ${q.desc ? `<p style="font-size:11.5px; color:#cbd5e1; margin:0 0 6px;">${escapeHtml(q.desc)}</p>` : ''}
                  ${renderRewardPillsHtml(q.rewards)}
                </div>
              `
                )
                .join('')
            : '<div style="color:#94a3b8; font-size:12px; margin-top:4px;">No direct questline held; check Merchant wares or Bounty Boards.</div>'
        }
      </div>
    `;

    if (entry.shopWares?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card is-amber-box">
          <div class="gf-us-eyebrow is-gold">🛍️ Merchant Stock (${entry.shopWares.length} Items)</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:6px; margin-top:6px;">
            ${entry.shopWares
              .map(
                (w) => `
              <button type="button" class="gf-us-list-btn" style="flex-direction:column; align-items:flex-start;" onclick="window._landing.inspectUniversalEntry('${escapeHtml(w.itemId)}')">
                <div style="display:flex; justify-content:space-between; width:100%; gap:6px;">
                  <strong>${escapeHtml(w.icon)} ${escapeHtml(w.itemName)}</strong>
                  <span style="color:#fde047; font-weight:700;">${w.price}g</span>
                </div>
                <span style="font-size:10.5px; color:#94a3b8;">${escapeHtml(w.note)}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }
  } else if (entry.type === 'character') {
    bodyHtml += `
      <div class="gf-us-card">
        <div class="gf-us-eyebrow is-emerald">${escapeHtml(entry.kind)} Summary</div>
        <div style="font-size:13px; font-weight:700; color:#fde047; margin-top:4px;">${escapeHtml(entry.passiveLabel)}</div>
        <p style="font-size:12px; color:#cbd5e1; margin:6px 0 0; line-height:1.5;">${escapeHtml(entry.desc)}</p>
      </div>
    `;
    if (entry.starterGear?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card">
          <div class="gf-us-eyebrow is-sky">Starter Equipment</div>
          <div class="gf-us-chip-row" style="margin-top:6px;">
            ${entry.starterGear
              .map(
                (g) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(g.id)}')">${escapeHtml(g.icon)} ${escapeHtml(g.name)} (${escapeHtml(g.slot)})</button>`
              )
              .join('')}
          </div>
        </div>
      `;
    }
    if (entry.ingredients?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card is-purple-box">
          <div class="gf-us-eyebrow is-purple">Construct Cradle Ingredients (Req Lv. ${entry.reqLevel || 1} &bull; +${entry.compileXp || 90} XP)</div>
          <div class="gf-us-chip-row" style="margin-top:6px;">
            ${entry.ingredients
              .map(
                (ing) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(ing.id)}')">${escapeHtml(ing.icon)} ${escapeHtml(ing.name)} &times;${ing.qty}</button>`
              )
              .join('')}
          </div>
        </div>
      `;
    }
    if (entry.abilities?.length > 0) {
      bodyHtml += `
        <div class="gf-us-card">
          <div class="gf-us-eyebrow is-gold">Signature Rites &amp; Flashes</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:6px; margin-top:6px;">
            ${entry.abilities
              .map(
                (ab) => `
              <div class="gf-us-subcard">
                <div style="display:flex; justify-content:space-between; gap:6px;">
                  <strong style="color:#fff;">${escapeHtml(ab.name)}</strong>
                  <span style="color:#38bdf8; font-size:10px; font-weight:700;">${escapeHtml(ab.kind)} Lv.${ab.reqLevel}</span>
                </div>
                <div style="font-size:11px; color:#94a3b8; margin-top:3px;">${escapeHtml(ab.desc)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }
  } else if (entry.type === 'quest') {
    bodyHtml += `
      <div class="gf-us-card">
        <p style="font-size:12.5px; color:#e2e8f0; margin:0 0 8px; line-height:1.5;">${escapeHtml(entry.desc)}</p>
        <div class="gf-us-chip-row">
          ${entry.giverId ? `<button type="button" class="gf-us-chip-btn is-sky" onclick="window._landing.inspectUniversalEntry('${escapeHtml(entry.giverId)}')">Giver: ${escapeHtml(entry.giverName)}</button>` : ''}
          ${entry.turnInId ? `<button type="button" class="gf-us-chip-btn is-emerald" onclick="window._landing.inspectUniversalEntry('${escapeHtml(entry.turnInId)}')">Turn-In: ${escapeHtml(entry.turnInName)}</button>` : ''}
        </div>
      </div>
      ${
        entry.tasks?.length > 0
          ? `<div class="gf-us-card"><div class="gf-us-eyebrow is-sky">Objectives</div><ul style="margin:6px 0 0; padding-left:16px; color:#e2e8f0; font-size:12px;">${entry.tasks.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`
          : ''
      }
      <div class="gf-us-card is-amber-box">
        <div class="gf-us-eyebrow is-gold">Rewards</div>
        <div style="margin-top:6px;">${renderRewardPillsHtml(entry.rewards)}</div>
      </div>
      ${
        entry.dialogues?.length > 0
          ? `<div class="gf-us-card"><div class="gf-us-eyebrow is-purple">Spoken Quest Script</div>${entry.dialogues
              .map(
                (l) => `<blockquote class="gf-us-quote"><strong style="color:#fde047;">${escapeHtml(l.speaker)}:</strong> &ldquo;${escapeHtml(l.text)}&rdquo;</blockquote>`
              )
              .join('')}</div>`
          : ''
      }
    `;
  } else if (entry.type === 'zone') {
    bodyHtml += `
      <div class="gf-us-card">
        <p style="font-size:12.5px; color:#e2e8f0; margin:0 0 6px; line-height:1.5;">${escapeHtml(entry.desc)}</p>
        <div style="font-size:11.5px; color:#7dd3fc; font-weight:600; margin-bottom:8px;">Route: ${escapeHtml(entry.travel)}</div>
        <button type="button" class="gf-us-chip-btn is-sky" onclick="window._landing.jumpToAtlasZone('${escapeHtml(entry.id)}')">🗺️ Open in Map Atlas</button>
      </div>
      ${
        entry.npcsHere?.length > 0
          ? `<div class="gf-us-card"><div class="gf-us-eyebrow is-gold">NPCs Here</div><div class="gf-us-chip-row" style="margin-top:6px;">${entry.npcsHere
              .map((n) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(n.id)}')">${escapeHtml(n.icon)} ${escapeHtml(n.name)}</button>`)
              .join('')}</div></div>`
          : ''
      }
      ${
        entry.gatheringNodes?.length > 0
          ? `<div class="gf-us-card is-emerald-box"><div class="gf-us-eyebrow is-emerald">Harvestable Resources</div>${entry.gatheringNodes
              .map(
                (g) => `<div class="gf-us-subcard"><strong style="color:#fff;">${escapeHtml(g.nodeName)} <span style="color:#6ee7b7;">(Lv.${g.reqLevel})</span></strong><div class="gf-us-chip-row" style="margin-top:5px;">${(g.yields || []).map((y) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(y.id)}')">${escapeHtml(y.icon)} ${escapeHtml(y.name)}</button>`).join('')}</div></div>`
              )
              .join('')}</div>`
          : ''
      }
    `;
  } else if (entry.type === 'skill') {
    bodyHtml += `
      <div class="gf-us-card">
        <p style="font-size:12.5px; color:#e2e8f0; margin:0 0 6px;">${escapeHtml(entry.quickStart)}</p>
        <div style="font-size:12px; color:#fde047; font-weight:700; margin-bottom:8px;">${escapeHtml(entry.passiveSummary)}</div>
        <div class="gf-us-chip-row">
          <button type="button" class="gf-us-chip-btn is-gold" onclick="window._landing.jumpToSkillGuide('${escapeHtml(entry.id)}')">📖 Open Full 1–99 Guide</button>
          ${entry.instructor ? `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(entry.instructor)}')">Mentor: ${escapeHtml(entry.instructor)}</button>` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div style="display:flex; align-items:flex-start; gap:12px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:12px;">
      <div class="gf-us-hero-icon">${escapeHtml(entry.icon || '📦')}</div>
      <div style="min-width:0; flex:1;">
        <div class="gf-us-chip-row">
          <span class="gf-us-pill is-gold">${escapeHtml(getTypeBadgeLabel(entry))}</span>
          ${entry.faction ? `<span class="gf-us-pill">${escapeHtml(entry.faction)}</span>` : ''}
          <span style="font-size:10px; font-family:monospace; color:#64748b;">${escapeHtml(entry.id)}</span>
        </div>
        <h3 style="margin:4px 0 2px; font-size:20px; color:#fff; font-family:var(--font-header);">${escapeHtml(entry.name)}</h3>
        ${entry.role || entry.location || entry.sub ? `<div style="font-size:12px; color:#7dd3fc;">${escapeHtml(entry.role || entry.sub || '')}${entry.location ? ` &bull; ${escapeHtml(entry.location)}` : ''}</div>` : ''}
      </div>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${bodyHtml}
    </div>
  `;
}

export function renderUniversalSearchHeaderBar(state = {}) {
  const q = state.universalSearchQuery || '';
  return `
    <div class="gf-header-search-wrap">
      <span class="gf-header-search-icon">🔍</span>
      <input
        id="gf-header-search-input"
        type="text"
        value="${escapeHtml(q)}"
        placeholder="Search items, ingredients (chrono_lotus, sunbloom_herb), NPCs, dialogue quotes, quests & rewards, or realms..."
        aria-label="Universal Search Bar"
        onfocus="window._landing.openUniversalSearch()"
        onclick="window._landing.openUniversalSearch()"
        oninput="window._landing.setUniversalSearchQuery(this.value, { preserveFocusId: 'gf-header-search-input' })"
      />
      <kbd class="gf-header-kbd">Ctrl+K</kbd>
    </div>
  `;
}

export function renderUniversalSearchModal(state = {}) {
  if (!state.universalSearchOpen) return '';
  const query = state.universalSearchQuery || '';
  const category = state.universalSearchCategory || 'all';
  const { results, countsByType } = searchUniversalCatalog(query, category, 60);
  const selectedEntry =
    (state.selectedSearchEntryId &&
      (UNIVERSAL_SEARCH_ALL.find((e) => e.id === state.selectedSearchEntryId) ||
        resolveUniversalEntry(state.selectedSearchEntryId))) ||
    results[0] ||
    null;

  return `
    <div id="gf-universal-search-modal" class="gf-us-backdrop" onclick="window._landing.closeUniversalSearch()">
      <div class="gf-us-dialog" onclick="event.stopPropagation()">
        <div class="gf-us-head">
          <div class="gf-us-search-row">
            <span class="gf-us-search-icon">🔍</span>
            <input
              id="gf-us-modal-input"
              type="text"
              value="${escapeHtml(query)}"
              placeholder="Search items, ingredients (chrono_lotus, sunbloom_herb), NPCs, quotes, quests, rewards, or realms..."
              oninput="window._landing.setUniversalSearchQuery(this.value, { preserveFocusId: 'gf-us-modal-input' })"
            />
            <button type="button" class="gf-us-close-btn" onclick="window._landing.closeUniversalSearch()">&#10005; Close</button>
          </div>

          <div class="gf-us-tabs-and-quick">
            <div class="gf-us-cat-tabs">
              ${CATEGORY_TABS.map(
                (t) => `
                <button type="button"
                        class="gf-us-cat-btn ${category === t.id ? 'active' : ''}"
                        onclick="window._landing.setUniversalSearchCategory('${t.id}')">
                  ${t.label} <span>(${countsByType[t.id] || 0})</span>
                </button>
              `
              ).join('')}
            </div>
            <div class="gf-us-quick-row">
              <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Quick:</span>
              ${QUICK_LOOKUP_CHIPS.map(
                (c) =>
                  `<button type="button" class="gf-us-chip-btn is-sky" onclick="window._landing.inspectUniversalEntry('${escapeHtml(c.ref)}')">${escapeHtml(c.label)}</button>`
              ).join('')}
            </div>
          </div>
        </div>

        <div id="gf-us-body-grid" class="gf-us-body-grid">
          <div id="gf-us-results-list" class="gf-us-results-list">
            ${
              results.length === 0
                ? `<div style="padding:28px; text-align:center; color:#94a3b8; font-size:12.5px;">No matches for &ldquo;${escapeHtml(query)}&rdquo;. Try item IDs, NPCs, quests, or realms.</div>`
                : results
                    .map((e) => {
                      const active = selectedEntry && selectedEntry.id === e.id;
                      const sub = e.whatItDoes || e.role || e.level || e.desc || e.id;
                      return `
                        <button type="button"
                                class="gf-us-result-item ${active ? 'active' : ''}"
                                onclick="window._landing.selectSearchEntry('${escapeHtml(e.id)}')">
                          <span class="gf-us-res-icon">${escapeHtml(e.icon || '📦')}</span>
                          <span class="gf-us-res-meta">
                            <span class="gf-us-res-top">
                              <strong>${escapeHtml(e.name)}</strong>
                              <span>${escapeHtml(getTypeBadgeLabel(e))}</span>
                            </span>
                            <small>${escapeHtml(sub)}</small>
                          </span>
                        </button>
                      `;
                    })
                    .join('')
            }
          </div>
          <div id="gf-us-inspector-pane" class="gf-us-inspector-pane">
            ${renderInspectorHtml(selectedEntry)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSearchableAtlasSection(state = {}) {
  const mapQuery = state.mapSearchQuery || '';
  const selectedZoneId = state.selectedAtlasZoneId || 'SANCTUARY_HUB';
  const matches = searchMapZones(mapQuery);
  const activeZone =
    matches.find((m) => m.zone.id === selectedZoneId)?.zone ||
    matches[0]?.zone ||
    UNIVERSAL_SEARCH_ZONES.find((z) => z.id === selectedZoneId) ||
    UNIVERSAL_SEARCH_ZONES[0];

  return `
    <section id="atlas" class="landing-section-box gf-atlas-shell">
      <div class="section-header-row" style="gap:14px; flex-wrap:wrap;">
        <div>
          <span class="section-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">
            SEAMLESS TRAVERSAL &bull; ${UNIVERSAL_SEARCH_ZONES.length} REALMS
          </span>
          <h2 class="section-heading">🗺️ CONTINENTAL REALMS ATLAS &amp; MAP SEARCH</h2>
        </div>
        <div class="gf-map-search-box">
          <span>🔍</span>
          <input
            id="gf-map-search-input"
            type="text"
            value="${escapeHtml(mapQuery)}"
            placeholder="Search map by zone, resource (Chrono-Lotus), NPC, or boss..."
            oninput="window._landing.setMapSearchQuery(this.value, { preserveFocusId: 'gf-map-search-input' })"
          />
        </div>
      </div>

      <div class="gf-us-chip-row" style="justify-content:space-between; margin-bottom:14px;">
        <div class="gf-us-chip-row">
          ${QUICK_MAP_FILTERS.map(
            (f) => `
            <button type="button"
                    class="gf-us-chip-btn ${mapQuery.trim().toLowerCase() === f.query.toLowerCase() ? 'is-sky' : ''}"
                    onclick="window._landing.setMapSearchQuery('${escapeHtml(f.query)}')">
              ${escapeHtml(f.label)}
            </button>
          `
          ).join('')}
        </div>
        <span style="font-size:11px; color:#94a3b8;">Showing ${matches.length} of ${UNIVERSAL_SEARCH_ZONES.length} Realms</span>
      </div>

      <div id="gf-atlas-grid-wrap" class="gf-atlas-grid-wrap">
        <div class="gf-atlas-cards-grid">
          ${
            matches.length === 0
              ? `<div style="padding:24px; color:#94a3b8; font-size:12.5px;">No realms matched &ldquo;${escapeHtml(mapQuery)}&rdquo;.</div>`
              : matches
                  .map(({ zone, matchReasons }) => {
                    const isSel = activeZone && activeZone.id === zone.id;
                    return `
                      <button type="button"
                              class="gf-atlas-zone-card ${isSel ? 'active' : ''}"
                              style="border-color:${isSel ? zone.borderColor || zone.color || '#38bdf8' : 'rgba(255,255,255,0.1)'};"
                              onclick="window._landing.selectAtlasZone('${escapeHtml(zone.id)}')">
                        <div class="gf-atlas-zone-head">
                          <span style="color:${zone.color || '#38bdf8'}; font-size:10px; font-weight:800;">${escapeHtml(zone.level)}</span>
                          <span class="gf-us-pill">${escapeHtml(zone.faction)}</span>
                        </div>
                        <strong>${escapeHtml(zone.name)}</strong>
                        <p>${escapeHtml(zone.desc)}</p>
                        ${
                          matchReasons.length > 0
                            ? `<div class="gf-us-chip-row">${matchReasons
                                .map((r) => `<span class="gf-us-pill is-emerald">${escapeHtml(r)}</span>`)
                                .join('')}</div>`
                            : ''
                        }
                      </button>
                    `;
                  })
                  .join('')
          }
        </div>

        ${
          activeZone
            ? `<div class="gf-atlas-inspector">
                <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:10px;">
                  <span class="gf-us-pill is-sky">${escapeHtml(activeZone.level)} &bull; ${escapeHtml(activeZone.dangerTag || activeZone.faction)}</span>
                  <h3 style="margin:6px 0 4px; color:#fff; font-size:18px; font-family:var(--font-header);">${escapeHtml(activeZone.name)}</h3>
                  <p style="font-size:12px; color:#cbd5e1; margin:0 0 6px;">${escapeHtml(activeZone.desc)}</p>
                  <div style="font-size:11px; color:#7dd3fc;">🧭 ${escapeHtml(activeZone.travel)}</div>
                </div>
                ${
                  activeZone.npcsHere?.length > 0
                    ? `<div style="margin-bottom:10px;"><div class="gf-us-eyebrow is-gold" style="margin-bottom:5px;">NPCs (Click for Quotes &amp; Quests)</div><div class="gf-us-chip-row">${activeZone.npcsHere
                        .map((n) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(n.id)}')">${escapeHtml(n.icon)} ${escapeHtml(n.name)}</button>`)
                        .join('')}</div></div>`
                    : ''
                }
                ${
                  activeZone.gatheringNodes?.length > 0
                    ? `<div style="margin-bottom:10px;"><div class="gf-us-eyebrow is-emerald" style="margin-bottom:5px;">Harvestable Resources</div><div style="display:flex; flex-direction:column; gap:6px;">${activeZone.gatheringNodes
                        .slice(0, 8)
                        .map(
                          (g) => `<div class="gf-us-subcard"><strong style="font-size:11px; color:#fff;">${escapeHtml(g.nodeName)} (Lv.${g.reqLevel})</strong><div class="gf-us-chip-row" style="margin-top:4px;">${(g.yields || []).map((y) => `<button type="button" class="gf-us-chip-btn" onclick="window._landing.inspectUniversalEntry('${escapeHtml(y.id)}')">${escapeHtml(y.icon)} ${escapeHtml(y.name)}</button>`).join('')}</div></div>`
                        )
                        .join('')}</div></div>`
                    : ''
                }
                ${
                  activeZone.entities?.length > 0
                    ? `<div><div class="gf-us-eyebrow is-rose" style="margin-bottom:5px;">Entities &amp; Bosses</div>${activeZone.entities
                        .map((e) => `<div class="gf-us-subcard"><strong style="color:#fff;">${escapeHtml(e.name)}</strong> <span style="color:#fda4af; font-size:10px;">(${escapeHtml(e.tier)})</span><div style="font-size:11px; color:#94a3b8;">${escapeHtml(e.desc)}</div></div>`)
                        .join('')}</div>`
                    : ''
                }
              </div>`
            : ''
        }
      </div>
    </section>
  `;
}
