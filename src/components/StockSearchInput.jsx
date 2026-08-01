/**
 * StockSearchInput.jsx
 * Reusable live Yahoo Finance stock search input.
 * Exact same logic as AnalyserPage search — extracted into a shared component.
 */
import React, { useState, useEffect, useRef } from 'react';
import { searchStocks } from '../services/stockSearchService';
import { Search } from 'lucide-react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
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
  const wrapRef = useRef(null);

  const debouncedInput = useDebounce(inputText, 380);

  // Live Yahoo Finance search as user types
  useEffect(() => {
    if (!debouncedInput || debouncedInput.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchStocks(debouncedInput)
      .then(results  => { if (!cancelled) setSearchResults(results); })
      .catch(()      => {})
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
    const display = r.name || r.symbol.replace(/\.(NS|BO)$/i, '');
    setInputText(display);
    setShowDropdown(false);
    setSearchResults([]);
    onSelect?.(r.symbol, r.name, r.exchange);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const raw = inputText.trim().toUpperCase();
    if (!raw) return;
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
            onChange={(e) => { setInputText(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            style={{ paddingRight: 100 }}
          />
          <button className="ss-search-btn" type="submit" style={{ fontSize: 12 }}>Search</button>
        </div>

        {/* Live Dropdown */}
        {showDropdown && inputText.length >= 1 && (
          <div className="ss-suggestions">

            {/* Searching spinner */}
            {searching && (
              <div style={{ padding: '13px 16px', color: '#8892a4', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 13, height: 13, border: '2px solid #00d4ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                Searching Yahoo Finance…
              </div>
            )}

            {/* No results */}
            {!searching && searchResults.length === 0 && inputText.length >= 2 && (
              <div style={{ padding: '13px 16px', color: '#8892a4', fontSize: 13 }}>
                No results — try full ticker e.g. RELIANCE.NS
              </div>
            )}

            {/* Results list */}
            {searchResults.map((r) => (
              <div key={r.symbol} className="ss-suggestion-item" onClick={() => handleSelect(r)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                  <span className="ss-suggestion-sym">{r.symbol.replace(/\.(NS|BO)$/i, '')}</span>
                  <span className="ss-suggestion-name">{r.name}</span>
                </div>
                <span className="ss-badge ss-badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>{r.exchange}</span>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
