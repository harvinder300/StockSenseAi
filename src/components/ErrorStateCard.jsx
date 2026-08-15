import React from 'react';
import { AlertTriangle, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';

export function LoadingState({ message = 'Fetching real market data...' }) {
  return (
    <div className="ss-card" style={{ padding: '40px 24px', textAlign: 'center', margin: '24px 0' }}>
      <div className="ss-spinner" style={{ margin: '0 auto 16px' }} />
      <p style={{ fontSize: 15, fontWeight: 700, color: '#00d4ff', marginBottom: 6 }}>{message}</p>
      <p style={{ fontSize: 12, color: '#8892a4' }}>Connecting to live market data streams...</p>
    </div>
  );
}

export function NotFoundState({ symbol, onRetry }) {
  return (
    <div className="ss-card" style={{ padding: '36px 28px', textAlign: 'center', border: '1px solid rgba(255,71,87,0.3)', background: 'rgba(255,71,87,0.03)', margin: '24px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ff4757' }}>
        <AlertTriangle size={24} />
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
        ⚠️ Could not load data for "{symbol}"
      </h3>

      <div style={{ textAlign: 'left', maxWidth: 440, margin: '16px auto 20px', fontSize: 13, color: '#c8d0e0', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: '16px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontWeight: 700, color: '#ffd700', marginBottom: 6 }}>Troubleshooting Checklist:</p>
        <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>Use exact NSE symbol: <strong>RELIANCE</strong>, <strong>TCS</strong>, <strong>ADANIENT</strong>, <strong>STALLION</strong></li>
          <li>Check Twelve Data API key in Settings modal</li>
          <li>Verify daily limit (800 calls/day free) is not exceeded</li>
          <li>Market may be closed — check back on next trading session</li>
        </ul>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ss-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
          >
            <RefreshCw size={14} /> Retry Fetch
          </button>
        )}
        <a
          href="https://twelvedata.com"
          target="_blank"
          rel="noreferrer"
          className="ss-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
        >
          Check API Status <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

export function ErrorStateCard({ symbol, message = 'Data unavailable for this stock.', onRetry }) {
  return (
    <div className="ss-card" style={{ padding: '36px 28px', textAlign: 'center', border: '1px solid rgba(255,159,67,0.3)', background: 'rgba(255,159,67,0.03)', margin: '24px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,159,67,0.12)', border: '1px solid rgba(255,159,67,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ff9f43' }}>
        <HelpCircle size={24} />
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
        Data Unavailable
      </h3>

      <p style={{ fontSize: 13, color: '#8892a4', maxWidth: 460, margin: '0 auto 16px' }}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="ss-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
