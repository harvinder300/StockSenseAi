import React, { useState } from 'react';
import { X, Key, ShieldCheck, Sparkles, Check, Trash2, ExternalLink, Layers, Activity } from 'lucide-react';

export default function GeminiKeyModal({ isOpen, onClose, apiKey, onSaveKey, onClearKey }) {
  const [geminiKey, setGeminiKey] = useState(apiKey || '');
  const [twelveKey, setTwelveKey] = useState(localStorage.getItem('twelvedata_api_key') || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(geminiKey.trim());
    if (twelveKey.trim()) {
      localStorage.setItem('twelvedata_api_key', twelveKey.trim());
    } else {
      localStorage.removeItem('twelvedata_api_key');
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  };

  const hasGemini = Boolean(geminiKey && geminiKey.trim().length > 5);
  const hasTwelve = Boolean(twelveKey && twelveKey.trim().length > 5);

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
            <div className="ss-gemini-sub">Configure Gemini AI &amp; Twelve Data live stock data</div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div style={{ background: '#151c2e', padding: '14px 16px', borderRadius: 10, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', marginBottom: 8 }}>
            Data Engine Status Indicators:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8d0e0' }}>
                <Layers size={14} color="#00ff88" /> Stock Charts Engine:
              </span>
              <span style={{ color: '#00ff88', fontWeight: 700 }}>
                🟢 Active &amp; Unlimited (Stooq.com Free)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8d0e0' }}>
                <Activity size={14} color="#a78bfa" /> Live Quotes &amp; Fundamentals:
              </span>
              <span style={{ color: hasTwelve ? '#00ff88' : '#00d4ff', fontWeight: 700 }}>
                {hasTwelve ? '🟢 Twelve Data Key Active (800/day)' : '🟢 Open Market Data Engine'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8d0e0' }}>
                <Sparkles size={14} color="#00d4ff" /> Gemini AI Engine:
              </span>
              <span style={{ color: hasGemini ? '#00ff88' : '#ffd700', fontWeight: 700 }}>
                {hasGemini ? '🟢 AI Analysis Active (Gemini)' : '🟡 Demo Built-in Advisory'}
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

          {/* 2. Twelve Data API Key Input */}
          <div style={{ marginBottom: 18 }}>
            <div className="ss-form-label">
              <span>2. Twelve Data Key (Optional — Free 800 calls/day)</span>
              <a href="https://twelvedata.com/" target="_blank" rel="noreferrer">
                Get Free Key <ExternalLink size={11} />
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <Key size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
              <input
                className="ss-key-input"
                type="password"
                value={twelveKey}
                onChange={(e) => setTwelveKey(e.target.value)}
                placeholder="Twelve Data API Key..."
              />
            </div>
          </div>

          <div className="ss-privacy-note">
            <ShieldCheck size={15} />
            <p><strong>Privacy:</strong> Keys are stored safely in browser localStorage. Stooq.com provides unlimited free historical charts for Indian equities.</p>
          </div>

          <div className="ss-gemini-actions" style={{ marginTop: 20 }}>
            <button type="submit" className="ss-gemini-save">
              {saved ? <><Check size={16} /> Saved Keys!</> : 'Save & Enable Keys'}
            </button>
            {(apiKey || localStorage.getItem('twelvedata_api_key')) && (
              <button
                type="button"
                className="ss-gemini-clear"
                onClick={() => {
                  setGeminiKey('');
                  setTwelveKey('');
                  onClearKey();
                  localStorage.removeItem('twelvedata_api_key');
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
