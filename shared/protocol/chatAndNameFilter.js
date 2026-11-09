// ==========================================
// GlimmerFall Online — Authoritative Chat & Name Filter
// Anti-Spam Rate Limiting • Profanity Masking • Anti-Duplication
// ==========================================

export const RESERVED_NAMES = new Set([
  'system',
  'moderator',
  'mod',
  'gm',
  'gamemaster',
  'server',
  'glimmerfall',
  'official',
  'staff',
  'support',
  'bot',
  'security',
  'root',
  'owner',
  'null',
  'undefined',
  'oracle',
  'herald',
  'chronicler',
  'aldric',
  'lyra',
  'valerius',
]);

export const PROFANITY_PATTERNS = [
  /\b(fuck|fucker|fucking|fucked|fuk|fck|f\*ck)\b/i,
  /\b(shit|shite|sh\*t)\b/i,
  /\b(bitch|bitches|b\*tch)\b/i,
  /\b(cunt|cunts|c\*nt)\b/i,
  /\b(asshole|assholes|a\$\$hole)\b/i,
  /\b(dick|dicks|d\*ck)\b/i,
  /\b(cock|cocks|c\*ck)\b/i,
  /\b(pussy|pussies|p\*ssy)\b/i,
  /\b(bastard|bastards)\b/i,
  /\b(nigger|niggers|nigga|niggas|n\*gger|n\*gga)\b/i,
  /\b(faggot|faggots|fag|fags|f\*ggot)\b/i,
  /\b(retard|retarded|r\*tard)\b/i,
  /\b(chink|chinks|spic|spics|kike|kikes)\b/i,
  /\b(whore|whores|slut|sluts)\b/i,
  /\b(penis|vagina|blowjob|handjob)\b/i,
  /\b(motherfucker|motherfucking)\b/i,
  /\b(twat|wanker)\b/i,
];

export function isReservedName(name) {
  if (!name) return false;
  const lower = String(name).trim().toLowerCase().replace(/[\s_\-]+/g, '');
  return RESERVED_NAMES.has(lower);
}

export const SUBSTRING_PROFANITY_PATTERN = /(fuck|fuk|fck|shit|bitch|cunt|dick|cock|pussy|nigger|nigga|faggot|retard|whore|slut)/i;

export function isProfane(text, { checkSubstrings = false } = {}) {
  if (!text) return false;
  const str = String(text);
  if (PROFANITY_PATTERNS.some((pattern) => pattern.test(str))) {
    return true;
  }
  if (checkSubstrings && SUBSTRING_PROFANITY_PATTERN.test(str.toLowerCase())) {
    return true;
  }
  return false;
}

export function maskProfanity(text) {
  if (!text) return '';
  let masked = String(text);
  for (const pattern of PROFANITY_PATTERNS) {
    masked = masked.replace(pattern, (match) => '*'.repeat(match.length));
  }
  return masked;
}

export function validateCharacterName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Character name is required.' };
  }

  const clean = name.trim();
  if (clean.length < 3) {
    return { valid: false, error: 'Character name must be at least 3 characters.' };
  }
  if (clean.length > 18) {
    return { valid: false, error: 'Character name cannot exceed 18 characters.' };
  }

  // Only letters, digits, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_\- ]*[a-zA-Z0-9]$/.test(clean)) {
    return { valid: false, error: 'Name must start and end with alphanumeric characters and contain only letters, numbers, spaces, or hyphens.' };
  }

  // Consecutive special characters check
  if (/[\s_\-]{2,}/.test(clean)) {
    return { valid: false, error: 'Name cannot contain consecutive spaces or symbols.' };
  }

  if (isReservedName(clean)) {
    return { valid: false, error: `Name "${clean}" is reserved by Glimmerfall realm authorities.` };
  }

  if (isProfane(clean, { checkSubstrings: true })) {
    return { valid: false, error: 'Character name contains prohibited or offensive language.' };
  }

  return { valid: true, cleanName: clean };
}

// ==========================================
// Authoritative Chat Rate Limiter & Anti-Spam
// ==========================================
export class ChatSpamFilter {
  constructor(options = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 750;
    this.maxInWindow = options.maxInWindow ?? 4;
    this.windowMs = options.windowMs ?? 4000;
    this.repeatCooldownMs = options.repeatCooldownMs ?? 6000;
    this.historyByPlayer = new Map(); // playerId -> { lastTs, queue: [ts], lastText }
  }

  checkMessage(playerId, text) {
    const now = Date.now();
    const clean = String(text || '').trim();
    if (!clean) return { allow: false, allowed: false, reason: 'Empty message' };

    let record = this.historyByPlayer.get(playerId);
    if (!record) {
      record = { lastTs: 0, queue: [], lastText: '' };
      this.historyByPlayer.set(playerId, record);
    }

    // 1. Min interval between messages: this.minIntervalMs
    if (now - record.lastTs < this.minIntervalMs) {
      const wait = (((this.minIntervalMs - (now - record.lastTs)) / 1000).toFixed(1));
      return {
        allow: false,
        allowed: false,
        reason: `⏳ [Chat Filter] Please slow down! Wait ${wait}s before speaking again.`,
      };
    }

    // 2. Sliding window velocity: maxInWindow in windowMs
    record.queue = record.queue.filter((t) => now - t < this.windowMs);
    if (record.queue.length >= this.maxInWindow) {
      return {
        allow: false,
        allowed: false,
        reason: '⏳ [Chat Filter] Rapid chat detected. Please wait a moment before sending more messages.',
      };
    }

    // 3. Exact duplicate message spam within repeatCooldownMs
    if (record.lastText && record.lastText.toLowerCase() === clean.toLowerCase() && (now - record.lastTs < this.repeatCooldownMs)) {
      return {
        allow: false,
        allowed: false,
        reason: '⚠️ [Chat Filter] Duplicate message blocked. Avoid repeating the same line.',
      };
    }

    // 4. Update tracking
    record.lastTs = now;
    record.queue.push(now);
    record.lastText = clean;

    // 5. Caps lock scream suppression (if text is > 8 chars and > 75% uppercase)
    let processedText = clean;
    if (clean.length > 8) {
      const upperCount = (clean.match(/[A-Z]/g) || []).length;
      const alphaCount = (clean.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount > 5 && upperCount / alphaCount > 0.75) {
        processedText = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      }
    }

    // 6. Mask profanity in chat text
    processedText = maskProfanity(processedText);

    return {
      allow: true,
      allowed: true,
      text: processedText,
      filteredText: processedText,
    };
  }

  processMessage(playerId, text) {
    return this.checkMessage(playerId, text);
  }

  cleanup() {
    const now = Date.now();
    for (const [id, rec] of this.historyByPlayer.entries()) {
      if (now - rec.lastTs > 60000) {
        this.historyByPlayer.delete(id);
      }
    }
  }
}
