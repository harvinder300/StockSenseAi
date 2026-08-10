import React, { useState } from 'react';
import { X, Key, ShieldCheck, Sparkles, Check, Trash2, ExternalLink, Activity, Layers } from 'lucide-react';

export default function GeminiKeyModal({ isOpen, onClose, apiKey, onSaveKey, onClearKey }) {
  const [geminiKey, setGeminiKey] = useState(apiKey || '');
  const [alphaKey, setAlphaKey] = useState(localStorage.getItem('alphavantage_api_key') || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(geminiKey.trim());
    if (alphaKey.trim()) {
      localStorage.setItem('alphavantage_api_key', alphaKey.trim());
    } else {
      localStorage.removeItem('alphavantage_api_key');
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  };

  const hasGemini = Boolean(geminiKey && geminiKey.trim().length > 5);
  const hasAlpha = Boolean(alphaKey && alphaKey.trim().length > 5);

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-gemini-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>

        {/* Close */}
        <button className="ss-modal-close" onClick={onClose}><X size={15} /></button>

        {/* Header */}
        <div className="ss-gemini-header">
          <div className="ss-gemini-icon"><Sparkles size={20} /></div>
          <div>
            <div className="ss-gemini-title">API Settings &amp; Keys</div>
            <div className="ss-gemini-sub">Configure Gemini AI &amp; Alpha Vantage live stock data</div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div style={{ background: '#151c2e', padding: '14px 16px', borderRadius: 10, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', marginBottom: 8 }}>
            API Status Indicators:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8d0e0' }}>
                <Sparkles size={14} color="#00d4ff" /> Gemini AI Engine:
              </span>
              <span style={{ color: hasGemini ? '#00ff88' : '#ffd700', fontWeight: 700 }}>
                {hasGemini ? '🟢 AI Analysis Active (Gemini)' : '🟡 Demo Built-in Advisory'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8d0e0' }}>
                <Layers size={14} color="#a78bfa" /> Stock Charts &amp; Fundamentals:
              </span>
              <span style={{ color: hasAlpha ? '#00ff88' : '#ff4757', fontWeight: 700 }}>
                {hasAlpha ? '🟢 Stock Data Active (Alpha Vantage)' : '🔴 Add Alpha Vantage Key'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* 1. Gemini API Key Input */}
          <div style={{ marginBottom: 18 }}>
            <div className="ss-form-label">
              <span>1. Google Gemini API Key (AI Analysis)</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                Get Free Key <ExternalLink size={11} />
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <Key size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
              <input
                className="ss-key-input"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
              />
            </div>
          </div>

          {/* 2. Alpha Vantage API Key Input */}
          <div style={{ marginBottom: 18 }}>
            <div className="ss-form-label">
              <span>2. Alpha Vantage Key (Charts &amp; Fundamentals — Free 25/day)</span>
              <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer">
                Get Free Key <ExternalLink size={11} />
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <Key size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
              <input
                className="ss-key-input"
                type="password"
                value={alphaKey}
                onChange={(e) => setAlphaKey(e.target.value)}
                placeholder="Key e.g. demo or your key..."
              />
            </div>
          </div>

          <div className="ss-privacy-note">
            <ShieldCheck size={15} />
            <p><strong>Privacy:</strong> Keys are stored safely in browser localStorage. Real-time Nifty, Sensex, Quotes &amp; Search run on NSE Direct API.</p>
          </div>

          <div className="ss-gemini-actions" style={{ marginTop: 20 }}>
            <button type="submit" className="ss-gemini-save">
              {saved ? <><Check size={16} /> Saved Keys!</> : 'Save & Enable Keys'}
            </button>
            {(apiKey || localStorage.getItem('alphavantage_api_key')) && (
              <button
                type="button"
                className="ss-gemini-clear"
                onClick={() => {
                  setGeminiKey('');
                  setAlphaKey('');
                  onClearKey();
                  localStorage.removeItem('alphavantage_api_key');
                }}
                title="Remove keys"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
