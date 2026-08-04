/**
 * StockSearchInput.jsx
 * Reusable live Yahoo Finance stock search input.
 * Used by both AnalyserPage and ComparePage.
 */
import React, { useState, useEffect, useRef } from 'react';
import { searchStocks } from '../services/stockSearchService';
import { isValidStockSymbol, stripHtml, rateLimiter } from '../utils/security';
import { Search, AlertTriangle } from 'lucide-react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Highlights matching substring in blue */
function HighlightText({ text, query }) {
  if (!query || query.length < 1) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#00d4ff', fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * Props:
 *   placeholder  - string, e.g. "Search first stock..."
 *   onSelect     - callback(symbol: string, name: string)
 *   defaultValue - initial display text (optional)
 */
export default function StockSearchInput({ placeholder = 'Search stock...', onSelect, defaultValue = '' }) {
  const [inputText,     setInputText]     = useState(defaultValue);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [searching,     setSearching]     = useState(false);
  const [inputError,    setInputError]    = useState('');
  const wrapRef = useRef(null);

  const debouncedInput = useDebounce(inputText, 400);

  // Live Yahoo Finance search as user types
  useEffect(() => {
    if (!debouncedInput || debouncedInput.trim().length < 1) {
      setSearchResults([]);
      setInputError('');
      return;
    }
    // Validate input before making API call
    if (!isValidStockSymbol(debouncedInput)) {
      setSearchResults([]);
      setInputError('Invalid characters detected — only letters, numbers, dots allowed');
      setSearching(false);
      return;
    }
    // Rate limit check
    if (!rateLimiter.isAllowed()) {
      setInputError('Too many requests. Please wait a moment.');
      setSearching(false);
      return;
    }
    setInputError('');
    let cancelled = false;
    setSearching(true);
    searchStocks(debouncedInput)
      .then(results  => { if (!cancelled) setSearchResults(results); })
      .catch(()      => { if (!cancelled) setInputError('Something went wrong. Try again.'); })
      .finally(()    => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (r) => {
    const display = stripHtml(r.name || r.symbol.replace(/\.(NS|BO)$/i, ''));
    setInputText(display);
    setShowDropdown(false);
    setSearchResults([]);
    setInputError('');
    onSelect?.(stripHtml(r.symbol), display, stripHtml(r.exchange));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const raw = inputText.trim().toUpperCase();
    if (!raw) return;
    if (!isValidStockSymbol(raw)) {
      setInputError('Invalid characters detected — only letters, numbers, dots allowed');
      return;
    }
    setInputError('');
    const sym = raw.includes('.') ? raw : `${raw}.NS`;
    const display = raw.replace(/\.(NS|BO)$/i, '');
    setInputText(display);
    setShowDropdown(false);
    onSelect?.(sym, display, 'NSE');
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div className="ss-search-wrap">
          <Search size={17} className="ss-search-icon-left" />
          <input
            className="ss-search-input"
            type="text"
            value={inputText}
            placeholder={placeholder}
            maxLength={50}
            onChange={(e) => { setInputText(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            style={{ paddingRight: 100 }}
          />
          <button className="ss-search-btn" type="submit" style={{ fontSize: 12 }}>Search</button>
        </div>

        {/* Live Dropdown */}
        {showDropdown && inputText.length >= 1 && (
          <div className="ss-suggestions">

            {/* Validation error */}
            {inputError && (
              <div style={{ padding: '13px 16px', color: '#ff4757', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {inputError}
              </div>
            )}

            {/* Searching spinner */}
            {!inputError && searching && (
              <div style={{ padding: '13px 16px', color: '#8892a4', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 13, height: 13, border: '2px solid #00d4ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                Searching Yahoo Finance…
              </div>
            )}

            {/* No results */}
            {!inputError && !searching && searchResults.length === 0 && inputText.length >= 2 && (
              <div style={{ padding: '13px 16px', color: '#8892a4', fontSize: 13 }}>
                No results found — try a different name or ticker
              </div>
            )}

            {/* Results list with match highlighting */}
            {!inputError && searchResults.map((r) => {
              const ticker = stripHtml(r.symbol.replace(/\.(NS|BO)$/i, ''));
              const name   = stripHtml(r.name);
              return (
                <div key={r.symbol} className="ss-suggestion-item" onClick={() => handleSelect(r)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                    <span className="ss-suggestion-sym">
                      <HighlightText text={ticker} query={inputText.trim()} />
                    </span>
                    <span className="ss-suggestion-name">
                      <HighlightText text={name} query={inputText.trim()} />
                    </span>
                  </div>
                  <span className="ss-badge ss-badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>{stripHtml(r.exchange)}</span>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}

