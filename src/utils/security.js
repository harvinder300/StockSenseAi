/**
 * security.js — Central security utilities for StockSense AI
 * XSS sanitization, input validation, secure storage, rate limiting
 */

// ── XSS Sanitization ────────────────────────────────────────

/** Escape HTML entities to prevent XSS injection */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/** Validate stock symbol — only alphanumeric, dots, hyphens, spaces, ampersand */
export const isValidStockSymbol = (symbol) => {
  if (!symbol || typeof symbol !== 'string') return false;
  return /^[A-Za-z0-9\s.\-&]{1,50}$/.test(symbol.trim());
};

/** Strip HTML tags from a string */
export const stripHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
};

/** Recursively sanitize an API response object */
export const sanitizeApiResponse = (data) => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return stripHtml(data);
  if (Array.isArray(data)) return data.map(sanitizeApiResponse);
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, sanitizeApiResponse(v)])
    );
  }
  return data; // numbers, booleans pass through
};

// ── Secure Storage (base64 obfuscation for API keys) ────────

export const secureStorage = {
  set: (key, value) => {
    try {
      const encoded = btoa(encodeURIComponent(value));
      localStorage.setItem(key, encoded);
    } catch (_) {
      // Silently fail — do not leak storage errors
    }
  },
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return decodeURIComponent(atob(item));
    } catch (_) {
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (_) {
      // Silently fail
    }
  },
};

// ── Rate Limiter ─────────────────────────────────────────────

export const rateLimiter = {
  calls: [],
  maxCalls: 10,
  timeWindow: 60000, // 1 minute

  isAllowed() {
    const now = Date.now();
    this.calls = this.calls.filter((time) => now - time < this.timeWindow);
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    this.calls.push(now);
    return true;
  },

  reset() {
    this.calls = [];
  },
};
