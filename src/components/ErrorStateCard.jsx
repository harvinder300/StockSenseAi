import React from 'react';
import { AlertTriangle, RefreshCw, Search, HelpCircle } from 'lucide-react';

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
        ⚠️ Could not fetch data for "{symbol}"
      </h3>

      <p style={{ fontSize: 13, color: '#8892a4', maxWidth: 460, margin: '0 auto 16px' }}>
        This could be because:
      </p>

      <ul style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto 20px', fontSize: 13, color: '#c8d0e0', lineHeight: 1.6 }}>
        <li>• Stock symbol not found on NSE/BSE</li>
        <li>• Market data stream temporarily delayed</li>
        <li>• Suffix missing — try adding <strong>.NS</strong> (NSE) or <strong>.BO</strong> (BSE)</li>
      </ul>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ss-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
          >
            <RefreshCw size={14} /> Retry Fetch
          </button>
        )}
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

      <p style={{ fontSize: 14, color: '#ff9f43', fontWeight: 600, marginBottom: 12 }}>
        {message}
      </p>

      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: 8, maxWidth: 420, margin: '0 auto 20px', fontSize: 13, color: '#c8d0e0', textAlign: 'left' }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#00d4ff' }}>💡 Tip for Indian Stocks:</p>
        <p style={{ margin: '0 0 2px' }}>• Try adding <strong>.NS</strong> suffix for NSE stocks (e.g., <strong>VADILALIND.NS</strong>)</p>
        <p style={{ margin: 0 }}>• Try adding <strong>.BO</strong> suffix for BSE stocks (e.g., <strong>500400.BO</strong>)</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="ss-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 20px' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
