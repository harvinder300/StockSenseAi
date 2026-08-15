/**
 * StockSearchInput.jsx
 * Reusable Live Stock Search input with automated company name ticker resolution
 */
import React, { useState, useEffect, useRef } from 'react';
import { searchStocks, resolveTicker } from '../services/nseService';
import { stripHtml, rateLimiter } from '../utils/security';
import { Search, AlertTriangle } from 'lucide-react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StockSearchInput({ placeholder = 'Search stock...', onSelect, defaultValue = '' }) {
  const [inputText, setInputText] = useState(defaultValue);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [inputError, setInputError] = useState('');
  const wrapRef = useRef(null);

  const debouncedInput = useDebounce(inputText, 300);

  useEffect(() => {
    if (!debouncedInput || debouncedInput.trim().length < 1) {
      setSearchResults([]);
      setInputError('');
      return;
    }

    if (!rateLimiter.isAllowed()) {
      setInputError('Too many requests. Please wait a moment.');
      setSearching(false);
      return;
    }
    setInputError('');
    let cancelled = false;
    setSearching(true);

    searchStocks(debouncedInput)
      .then(results => { if (!cancelled) setSearchResults(results); })
      .catch(() => { if (!cancelled) setInputError('Something went wrong. Try again.'); })
      .finally(() => { if (!cancelled) setSearching(false); });

    return () => { cancelled = true; };
  }, [debouncedInput]);

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (r) => {
    const cleanSym = resolveTicker(r.symbol);
    const display = stripHtml(r.name || cleanSym);
    setInputText(display);
    setShowDropdown(false);
    setSearchResults([]);
    setInputError('');
    onSelect?.(cleanSym, display, stripHtml(r.exchange || 'NSE'));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    setInputError('');
    const resolvedSym = resolveTicker(raw);
    setInputText(raw);
    setShowDropdown(false);
    onSelect?.(resolvedSym, raw, 'NSE');
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
            maxLength={60}
            onChange={(e) => { setInputText(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            style={{ paddingRight: 100 }}
          />
          <button className="ss-search-btn" type="submit" style={{ fontSize: 12 }}>Search</button>
        </div>

        {/* Live Dropdown */}
        {showDropdown && inputText.length >= 1 && (
          <div className="ss-suggestions">

            {inputError && (
              <div style={{ padding: '13px 16px', color: '#ff4757', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {inputError}
              </div>
            )}

            {!inputError && searching && (
              <div style={{ padding: '13px 16px', color: '#8892a4', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 13, height: 13, border: '2px solid #00d4ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                Searching NSE/BSE Equities…
              </div>
            )}

            {!inputError && !searching && searchResults.length === 0 && inputText.length >= 2 && (
              <div style={{ padding: '13px 16px', color: '#8892a4', fontSize: 13 }}>
                Press Search or Enter to analyze "{inputText}"
              </div>
            )}

            {!inputError && searchResults.map((r) => {
              const ticker = stripHtml(r.symbol.replace(/\.(NS|BO)$/i, ''));
              const name = stripHtml(r.name);
              const exch = stripHtml(r.exchange || 'NSE');
              return (
                <div key={`${r.symbol}-${exch}`} className="ss-suggestion-item" onClick={() => handleSelect(r)}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>{ticker}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#8892a4' }}>{name}</span>
                  </div>
                  <span className="ss-badge ss-badge-blue" style={{ fontSize: 10 }}>{exch}</span>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}
