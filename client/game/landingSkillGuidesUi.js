// ==========================================
// GlimmerFall Online — Pre-Game Landing Overlay Skill Guides Tab Renderer
// Renders the 1–99 Skill Leveling Guides compendium inside client/landing.js
// ==========================================

import {
  SKILL_GUIDE_CATEGORIES,
  SKILL_MAX_LEVEL,
  SKILL_TOTAL_MAX,
  SKILL_TRIAL_CAP,
  SKILL_XP_BENCHMARKS,
  computeSkillActionsNeeded,
  filterSkillGuides,
  getSkillGuideById,
  getSkillXpForLevel,
} from '../../landing/src/data/skillGuidesData.js';
import { findUniversalMentions } from '../../landing/src/data/universalSearchData.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render the interactive 1–99 Skill Guides tab HTML for LandingPageController.
 */
export function renderLandingSkillGuidesTab(state = {}) {
  const category = state.category || 'All';
  const filteredSkills = filterSkillGuides(category);
  const candidate = getSkillGuideById(state.selectedSkillId || 'combat_mastery');
  const activeSkill =
    category !== 'All' &&
    candidate.filterGroup !== category &&
    filteredSkills.length > 0
      ? filteredSkills[0]
      : candidate;

  const safeBracketIdx = Math.min(
    Math.max(0, Number(state.selectedBracketIdx) || 0),
    Math.max(0, activeSkill.brackets.length - 1)
  );
  const activeBracket = activeSkill.brackets[safeBracketIdx] || activeSkill.brackets[0];

  const calcResult = computeSkillActionsNeeded({
    fromLevel: state.calcFromLevel ?? 1,
    toLevel: state.calcToLevel ?? SKILL_MAX_LEVEL,
    xpPerAction: activeBracket?.xpPerAction || 50,
    moonOwlBonus: Boolean(state.calcMoonOwl),
  });

  const searchQuery = String(state.searchQuery || '').trim();
  const qLower = searchQuery.toLowerCase();
  const filteredMilestones = qLower
    ? activeSkill.milestones.filter((m) =>
        `lv ${m.level} ${m.unlock} ${m.detail}`.toLowerCase().includes(qLower)
      )
    : activeSkill.milestones;

  const currentXpPct = Math.min(
    100,
    Math.round(
      (getSkillXpForLevel(calcResult.fromLevel) /
        Math.max(1, getSkillXpForLevel(calcResult.toLevel))) *
        1000
    ) / 10
  );

  const keyBenchmarks = [
    SKILL_XP_BENCHMARKS[0],
    SKILL_XP_BENCHMARKS[2],
    SKILL_XP_BENCHMARKS[4],
    SKILL_XP_BENCHMARKS[6],
    SKILL_XP_BENCHMARKS[8],
    SKILL_XP_BENCHMARKS[12],
    SKILL_XP_BENCHMARKS[13],
  ];

  return `
    <section id="skill-guides" class="landing-section-box gf-sg-root">
      <div class="section-header-row" style="align-items:flex-start; gap:14px;">
        <div>
          <span class="enc-badge" style="color:#facc15; background:rgba(250,204,21,0.12); border-color:rgba(250,204,21,0.35);">
            1–99 MASTERY COMPENDIUM &bull; MAX TOTAL ${SKILL_TOTAL_MAX}
          </span>
          <h2 class="section-heading">📖 SKILLS 1–99 LEVELING GUIDES</h2>
          <p class="gf-sg-subtitle">
            All 7 GlimmerFall skills scale from <strong>Lv. 1 (0 XP)</strong> to <strong>Lv. ${SKILL_MAX_LEVEL} (9,477,643 XP)</strong>
            for a <strong>${SKILL_TOTAL_MAX}</strong> Total Level. Free Trial realms train to <strong>Lv. ${SKILL_TRIAL_CAP} (105,871 XP)</strong>;
            Founder domains unlock Lv. 31–99 Endgame &amp; <strong>+5 All-Stats Skillcapes</strong>.
          </p>
        </div>
        <div class="gf-sg-header-actions">
          <button type="button" class="gf-sg-cta-btn" onclick="window._landing.enterWorld(null, '${escapeHtml(activeSkill.id)}')">
            ⚡ Train ${escapeHtml(activeSkill.name)} Now
          </button>
          <button type="button" class="gf-sg-secondary-btn" onclick="window._landing.setTab('armory')">
            🛡️ View Skillcapes
          </button>
        </div>
      </div>

      <!-- Key XP Curve Milestones -->
      <div class="gf-sg-benchmarks-grid">
        ${keyBenchmarks
          .map(
            (bm) => `
          <div class="gf-sg-benchmark-card ${
            bm.level === SKILL_TRIAL_CAP
              ? 'is-trial'
              : bm.level === SKILL_MAX_LEVEL
                ? 'is-max'
                : ''
          }">
            <div class="gf-sg-bm-lvl">Lv. ${bm.level}</div>
            <div class="gf-sg-bm-xp">${bm.xp.toLocaleString()} XP</div>
            <div class="gf-sg-bm-lbl">${escapeHtml(bm.label)}</div>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Category Filter Pills -->
      <div class="gf-sg-cat-row">
        ${SKILL_GUIDE_CATEGORIES.map(
          (cat) => `
          <button type="button"
                  class="gf-filter-btn ${category === cat.id ? 'active' : ''}"
                  onclick="window._landing.setSkillGuideCategory('${cat.id}')">
            ${cat.icon} ${escapeHtml(cat.label)}
          </button>
        `
        ).join('')}
      </div>

      <!-- 7 Skill Selector Cards -->
      <div class="gf-sg-skill-cards">
        ${filteredSkills
          .map((sk) => {
            const isSel = sk.id === activeSkill.id;
            return `
            <button type="button"
                    class="gf-sg-skill-card ${isSel ? 'active' : ''}"
                    style="${isSel ? `border-color:${sk.color}; box-shadow:0 0 18px ${sk.color}38;` : ''}"
                    onclick="window._landing.setSkillGuide('${sk.id}')">
              <div class="gf-sg-skill-card-top">
                <span class="gf-sg-skill-icon">${sk.icon}</span>
                <span class="gf-sg-skill-cat" style="color:${sk.color}; border-color:${sk.color}55; background:${sk.color}18;">
                  ${escapeHtml(sk.category)}
                </span>
              </div>
              <div class="gf-sg-skill-name">${escapeHtml(sk.name)}</div>
              <div class="gf-sg-skill-role">${escapeHtml(sk.role)}</div>
            </button>
          `;
          })
          .join('')}
      </div>

      <!-- Main Split Guide Panel -->
      <div class="gf-sg-workbench">
        <aside class="gf-sg-sidebar">
          <div class="gf-sg-panel" style="border-color:${activeSkill.color}55;">
            <div class="gf-sg-skill-hero">
              <div class="gf-sg-hero-badge" style="background:${activeSkill.color}1c; border-color:${activeSkill.color}55;">
                ${activeSkill.icon}
              </div>
              <div>
                <div class="gf-sg-eyebrow" style="color:${activeSkill.color};">
                  ${escapeHtml(activeSkill.category)} Discipline &bull; 1–99
                </div>
                <h3 class="gf-sg-skill-title">${escapeHtml(activeSkill.name)}</h3>
              </div>
            </div>

            <p class="gf-sg-desc">${escapeHtml(activeSkill.quickStart)}</p>

            <div class="gf-sg-meta-list">
              <div>
                <span class="gf-sg-meta-lbl">Instructor &amp; Trainer Hub</span>
                <div class="gf-sg-meta-val">${escapeHtml(activeSkill.instructor)} &mdash; ${escapeHtml(activeSkill.trainerLocation)}</div>
              </div>
              <div>
                <span class="gf-sg-meta-lbl">Passive Scaling &amp; Impact</span>
                <div class="gf-sg-meta-val" style="color:#fde047;">${escapeHtml(activeSkill.passiveSummary)}</div>
              </div>
              <div>
                <span class="gf-sg-meta-lbl">XP Mechanic</span>
                <div class="gf-sg-meta-val">${escapeHtml(activeSkill.xpMechanic)}</div>
              </div>
            </div>

            <div class="gf-sg-cape-box">
              <div class="gf-sg-cape-tag">🏆 Lv. 99 Mastery Reward</div>
              <div class="gf-sg-cape-name">${escapeHtml(activeSkill.cape.name)}</div>
              <div class="gf-sg-cape-stats">${escapeHtml(activeSkill.cape.stats)}</div>
              <p class="gf-sg-cape-desc">${escapeHtml(activeSkill.cape.desc)}</p>
            </div>
          </div>

          <!-- Interactive 1–99 Calculator -->
          <div class="gf-sg-panel">
            <div class="gf-sg-calc-head">
              <strong>🧮 1–99 XP &amp; Action Calculator</strong>
              <span class="gf-sg-live-pill">Live Curve</span>
            </div>

            <div class="gf-sg-calc-inputs">
              <label>
                <span>Current Lv.</span>
                <input type="number" min="1" max="98" value="${calcResult.fromLevel}"
                       onchange="window._landing.setSkillCalcLevels(this.value, ${calcResult.toLevel})" />
              </label>
              <label>
                <span>Target Lv.</span>
                <input type="number" min="2" max="99" value="${calcResult.toLevel}"
                       onchange="window._landing.setSkillCalcLevels(${calcResult.fromLevel}, this.value)" />
              </label>
            </div>

            <div class="gf-sg-presets">
              ${[
                { label: 'Lv. 30 Trial', to: 30 },
                { label: 'Lv. 50', to: 50 },
                { label: 'Lv. 70', to: 70 },
                { label: 'Lv. 92', to: 92 },
                { label: 'Lv. 99 Cape', to: 99 },
              ]
                .map(
                  (p) => `
                <button type="button"
                        class="gf-sg-preset-btn ${calcResult.toLevel === p.to ? 'active' : ''}"
                        onclick="window._landing.setSkillCalcLevels(${calcResult.fromLevel >= p.to ? Math.max(1, p.to - 5) : calcResult.fromLevel}, ${p.to})">
                  ${p.label}
                </button>
              `
                )
                .join('')}
            </div>

            <label class="gf-sg-select-label">
              <span>Training Method Bracket</span>
              <select onchange="window._landing.setSkillGuideBracket(this.value)">
                ${activeSkill.brackets
                  .map(
                    (br, idx) => `
                  <option value="${idx}" ${idx === safeBracketIdx ? 'selected' : ''}>
                    ${escapeHtml(br.range)} — ${escapeHtml(br.title)} (${br.xpPerAction} XP/${br.actionUnit})
                  </option>
                `
                  )
                  .join('')}
              </select>
            </label>

            <label class="gf-sg-owl-toggle">
              <span>
                <strong>🦉 Starfall Moon-Owl (+6% XP)</strong>
                <small>Rite-Binding Lv. 18 Familiar Bonus</small>
              </span>
              <input type="checkbox" ${state.calcMoonOwl ? 'checked' : ''}
                     onchange="window._landing.toggleSkillCalcOwl(this.checked)" />
            </label>

            <div class="gf-sg-calc-stats">
              <div>
                <span>XP Remaining</span>
                <strong style="color:#fde047;">${calcResult.xpNeeded.toLocaleString()}</strong>
              </div>
              <div>
                <span>XP / ${escapeHtml(activeBracket.actionUnit)}</span>
                <strong style="color:#4ade80;">${calcResult.effectiveXpPerAction}</strong>
              </div>
              <div>
                <span>Est. Actions</span>
                <strong style="color:#38bdf8;">${calcResult.actionsNeeded.toLocaleString()}</strong>
              </div>
            </div>

            <div class="gf-sg-progress-wrap">
              <div class="gf-sg-progress-labels">
                <span>Lv. ${calcResult.fromLevel} (${getSkillXpForLevel(calcResult.fromLevel).toLocaleString()} XP)</span>
                <span>${currentXpPct}% of Lv. ${calcResult.toLevel}</span>
              </div>
              <div class="gf-sg-progress-bar">
                <div class="gf-sg-progress-fill" style="width:${Math.max(2, currentXpPct)}%; background:${activeSkill.color};"></div>
              </div>
            </div>
          </div>

          <!-- Pro Synergies -->
          <div class="gf-sg-panel">
            <div class="gf-sg-eyebrow" style="color:#fbbf24;">🔥 Efficiency &amp; Synergies</div>
            <ul class="gf-sg-synergy-list">
              ${activeSkill.synergies
                .map(
                  (tip) => `
                <li><span style="color:${activeSkill.color};">▸</span> ${escapeHtml(tip)}</li>
              `
                )
                .join('')}
            </ul>
          </div>
        </aside>

        <div class="gf-sg-main">
          <!-- Step-by-Step 1–99 Brackets -->
          <div class="gf-sg-panel">
            <div class="gf-sg-main-head">
              <div>
                <div class="gf-sg-eyebrow" style="color:#38bdf8;">Step-by-Step 1–99 Leveling Path</div>
                <h3 class="gf-sg-main-title">${activeSkill.icon} ${escapeHtml(activeSkill.name)}: Lv. 1 &rarr; 99 Brackets</h3>
              </div>
              <span style="font-size:11px; color:#94a3b8;">Click any bracket to sync Calculator</span>
            </div>

            <div class="gf-sg-brackets-list">
              ${activeSkill.brackets
                .map((br, idx) => {
                  const isActive = idx === safeBracketIdx;
                  const brCalc = computeSkillActionsNeeded({
                    fromLevel: br.minLevel,
                    toLevel: br.maxLevel,
                    xpPerAction: br.xpPerAction,
                    moonOwlBonus: Boolean(state.calcMoonOwl),
                  });
                  const crossesTrial =
                    br.minLevel <= SKILL_TRIAL_CAP && br.maxLevel >= SKILL_TRIAL_CAP;
                  const mentioned = findUniversalMentions(
                    `${br.ingredients} ${br.bestMethod} ${br.altMethod}`,
                    6
                  );

                  return `
                  <div class="gf-sg-bracket-card ${isActive ? 'active' : ''}"
                       style="${isActive ? `border-color:${activeSkill.color};` : ''}"
                       onclick="window._landing.setSkillGuideBracket(${idx})">
                    <div class="gf-sg-bracket-top">
                      <div class="gf-sg-bracket-badges">
                        <span class="gf-sg-range-pill" style="color:${activeSkill.color}; border-color:${activeSkill.color}55; background:${activeSkill.color}18;">
                          ${escapeHtml(br.range)}
                        </span>
                        <strong>${escapeHtml(br.title)}</strong>
                        ${
                          crossesTrial
                            ? `<span class="gf-sg-trial-pill">Lv. 30 Trial Cap Checkpoint</span>`
                            : ''
                        }
                      </div>
                      <div class="gf-sg-bracket-xp">
                        <strong>~${br.xpPerAction} XP / ${escapeHtml(br.actionUnit)}</strong>
                        <span>${brCalc.xpNeeded.toLocaleString()} XP &bull; ~${brCalc.actionsNeeded.toLocaleString()} ${escapeHtml(br.actionUnit)}s</span>
                      </div>
                    </div>

                    <div class="gf-sg-methods-grid">
                      <div class="gf-sg-method-box">
                        <span class="is-fast">Fastest Method</span>
                        <div>${escapeHtml(br.bestMethod)}</div>
                      </div>
                      <div class="gf-sg-method-box">
                        <span class="is-alt">Alternative Route</span>
                        <div>${escapeHtml(br.altMethod)}</div>
                      </div>
                    </div>

                    <div class="gf-sg-bracket-meta">
                      <span>📍 <strong>Location:</strong> ${escapeHtml(br.zone)}</span>
                      <span>🎒 <strong>Prep:</strong> ${escapeHtml(br.ingredients)}</span>
                    </div>

                    ${
                      mentioned.length > 0
                        ? `<div class="gf-us-chip-row" style="margin:6px 0;">
                            <span style="font-size:10px; color:#7dd3fc; font-weight:700; text-transform:uppercase;">Inspect Sources:</span>
                            ${mentioned
                              .map(
                                (ref) => `
                              <button type="button"
                                      class="gf-us-chip-btn is-sky"
                                      onclick="event.stopPropagation(); window._landing.inspectUniversalEntry('${escapeHtml(ref.id)}')">
                                ${escapeHtml(ref.icon)} ${escapeHtml(ref.name)}
                              </button>
                            `
                              )
                              .join('')}
                          </div>`
                        : ''
                    }

                    <div class="gf-sg-tip-box">
                      <strong>Tip:</strong> ${escapeHtml(br.tip)}
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Searchable Unlock Ledger -->
          <div class="gf-sg-panel">
            <div class="gf-sg-main-head">
              <div>
                <div class="gf-sg-eyebrow" style="color:#facc15;">Complete Unlock Ledger</div>
                <h4 class="gf-sg-main-title">${escapeHtml(activeSkill.name)} Milestones (Lv. 1–99)</h4>
              </div>
              <input type="text"
                     class="gf-sg-search-input"
                     placeholder="Filter unlocks (e.g. Shrine, Sigil, Lv. 70)..."
                     value="${escapeHtml(searchQuery)}"
                     oninput="window._landing.setSkillGuideSearch(this.value)" />
            </div>

            <div class="gf-sg-table-wrap">
              <table class="gf-sg-table">
                <thead>
                  <tr>
                    <th>Req. Lv.</th>
                    <th>Cumulative XP</th>
                    <th>Unlock / Method</th>
                    <th>Notes &amp; Scaling</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    filteredMilestones.length > 0
                      ? filteredMilestones
                          .map(
                            (m) => `
                        <tr>
                          <td>
                            <span class="gf-sg-lvl-tag" style="color:${m.level === 99 ? '#fde047' : activeSkill.color}; background:${m.level === 99 ? 'rgba(242,169,0,0.18)' : `${activeSkill.color}18`};">
                              Lv. ${m.level}
                            </span>
                          </td>
                          <td style="white-space:nowrap; font-weight:700;">${getSkillXpForLevel(m.level).toLocaleString()} XP</td>
                          <td style="font-weight:700; color:#f8fafc;">${escapeHtml(m.unlock)}</td>
                          <td style="color:#94a3b8;">${escapeHtml(m.detail)}</td>
                        </tr>
                      `
                          )
                          .join('')
                      : `
                        <tr>
                          <td colspan="4" style="text-align:center; padding:18px; color:#94a3b8;">
                            No ${escapeHtml(activeSkill.name)} unlocks match "${escapeHtml(searchQuery)}".
                          </td>
                        </tr>
                      `
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
