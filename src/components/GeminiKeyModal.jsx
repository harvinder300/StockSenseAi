import React, { useState } from 'react';
import { X, Key, ShieldCheck, Sparkles, Check, Trash2, ExternalLink } from 'lucide-react';

export default function GeminiKeyModal({ isOpen, onClose, apiKey, onSaveKey, onClearKey }) {
  const [inputKey,  setInputKey]  = useState(apiKey || '');
  const [saved,     setSaved]     = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-gemini-modal" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button className="ss-modal-close" onClick={onClose}><X size={15} /></button>

        {/* Header */}
        <div className="ss-gemini-header">
          <div className="ss-gemini-icon"><Sparkles size={18} /></div>
          <div>
            <div className="ss-gemini-title">Google Gemini API Key</div>
            <div className="ss-gemini-sub">Power live AI insights in StockSense</div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="ss-form-label">
            <span>Your API Key (stored locally only)</span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
              Get Free Key <ExternalLink size={11} />
            </a>
          </div>

          <div style={{ position: 'relative' }}>
            <Key size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
            <input
              className="ss-key-input"
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>

          <div className="ss-privacy-note">
            <ShieldCheck size={15} />
            <p><strong>Privacy:</strong> Your key stays in your browser localStorage only. Without a key, StockSense uses its built-in AI rules engine automatically.</p>
          </div>

          <div className="ss-gemini-actions">
            <button type="submit" className="ss-gemini-save">
              {saved ? <><Check size={16} /> Saved!</> : 'Save & Enable Gemini'}
            </button>
            {apiKey && (
              <button type="button" className="ss-gemini-clear" onClick={() => { setInputKey(''); onClearKey(); }} title="Remove key">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
