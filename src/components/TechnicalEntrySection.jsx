import React from 'react';
import StockChart from './StockChart';
import { Layers, Activity, Target, Shield, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

export default function TechnicalEntrySection({ analysis }) {
  if (!analysis) return null;

  const { meta, candles, rsi, macd, detectedPatterns, technicalEntrySignal, technicalEntryColor, supportLevel, multiData } = analysis;

  const rsiVal = rsi?.value || 50;
  const currentPrice = meta?.price || 0;

  // Ideal Entry advice
  const idealRsiText = rsiVal <= 45 ? 'Current level is favorable' : 'RSI below 45';

  return (
    <div className="ss-card" style={{ padding: 28, marginTop: 24, border: '1px solid rgba(0,212,255,0.2)' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={22} color="#00d4ff" /> 📊 Technical Entry Timing
            </h3>
            <p style={{ fontSize: 13, color: '#00d4ff', marginTop: 4, fontWeight: 600 }}>
              💡 Fundamentals strong hain — ab sahi entry point dhundho neeche ke chart se
            </p>
          </div>
          <div style={{
            background: `${technicalEntryColor}18`,
            color: technicalEntryColor,
            border: `1.5px solid ${technicalEntryColor}40`,
            padding: '8px 18px',
            borderRadius: 99,
            fontWeight: 800,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {technicalEntrySignal}
          </div>
        </div>
      </div>

      {/* 4-Box Technical Strategy Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>

        {/* Current RSI */}
        <div style={{ background: '#151c2e', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8892a4', fontWeight: 600 }}>
            <Activity size={14} color="#00d4ff" /> Current RSI
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: rsiVal >= 70 ? '#ff4757' : rsiVal <= 35 ? '#00ff88' : '#fff', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            RSI {rsiVal} <span style={{ fontSize: 11, color: '#8892a4' }}>({rsiVal < 45 ? 'Good Dip' : rsiVal > 65 ? 'Elevated' : 'Neutral'})</span>
          </div>
        </div>

        {/* Support Level */}
        <div style={{ background: '#151c2e', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8892a4', fontWeight: 600 }}>
            <Shield size={14} color="#00ff88" /> Support Level
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#00ff88', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            ₹{supportLevel.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Ideal Entry Zone */}
        <div style={{ background: '#151c2e', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8892a4', fontWeight: 600 }}>
            <Target size={14} color="#ffd700" /> Ideal Entry
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffd700', marginTop: 4 }}>
            {idealRsiText}
          </div>
        </div>

        {/* Entry Strategy */}
        <div style={{ background: '#151c2e', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8892a4', fontWeight: 600 }}>
            <ArrowDownCircle size={14} color="#a78bfa" /> Entry Strategy
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa', marginTop: 4 }}>
            Buy in 3 Tranches
          </div>
        </div>

      </div>

      {/* Tranche Buying Plan */}
      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Recommended 3-Tranche Accumulation Plan:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 13, color: '#c8d0e0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} color="#00d4ff" />
            <span><strong>Tranche 1 (33%):</strong> At current price ₹{currentPrice}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} color="#00ff88" />
            <span><strong>Tranche 2 (33%):</strong> At ₹{supportLevel} support level</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} color="#ffd700" />
            <span><strong>Tranche 3 (34%):</strong> If RSI hits oversold (below 35)</span>
          </div>
        </div>
      </div>

      {/* Candlestick Chart */}
      <StockChart candles={candles} symbol={meta.symbol} rawCandles={multiData?.rawCandles} />

      {/* Indicator Cards */}
      <div className="ss-indicators-grid" style={{ marginTop: 20 }}>
        {/* Candlestick Pattern */}
        <div className="ss-ind-card">
          <div className="ss-ind-header">
            <div className="ss-ind-title">
              <Layers size={15} color="#00d4ff" /> Candlestick Pattern
            </div>
          </div>
          <div className="ss-ind-body">
            {detectedPatterns.map((pat, i) => (
              <div key={i} className="ss-pattern-item">
                <div className="ss-pattern-name-row">
                  <span className="ss-pattern-name">{pat.name}</span>
                  <span className={`ss-badge ${pat.verdictImpact === 'Bullish' ? 'ss-badge-green' : pat.verdictImpact === 'Bearish' ? 'ss-badge-red' : 'ss-badge-amber'}`}>
                    {pat.type}
                  </span>
                </div>
                <p className="ss-pattern-desc">{pat.simpleLanguage}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RSI */}
        <div className="ss-ind-card">
          <div className="ss-ind-header">
            <div className="ss-ind-title">
              <span className="ss-ind-dot" style={{ background: '#00d4ff' }} /> RSI (14-period)
            </div>
            <span className="ss-ind-val-badge">{rsi.value} / 100</span>
          </div>
          <div className="ss-ind-body">
            <div className="ss-ind-row"><span>Status:</span><strong>{rsi.status}</strong></div>
            <div className="ss-ind-bar-track">
              <div className={`ss-ind-bar-fill ${rsi.value >= 70 ? 'red' : rsi.value <= 30 ? 'green' : 'blue'}`} style={{ width: `${rsi.value}%` }} />
            </div>
            <p className="ss-ind-desc" style={{ marginTop: 10 }}>{rsi.explanation}</p>
          </div>
        </div>

        {/* MACD */}
        <div className="ss-ind-card">
          <div className="ss-ind-header">
            <div className="ss-ind-title">
              <span className="ss-ind-dot" style={{ background: '#a78bfa' }} /> MACD (12,26,9)
            </div>
            <span className={`ss-badge ${macd.histogram >= 0 ? 'ss-badge-green' : 'ss-badge-red'}`}>
              {macd.status}
            </span>
          </div>
          <div className="ss-ind-body">
            <div className="ss-ind-row"><span>MACD Line:</span><strong>{macd.macd}</strong></div>
            <div className="ss-ind-row"><span>Signal Line:</span><strong>{macd.signal}</strong></div>
            <p className="ss-ind-desc" style={{ marginTop: 10 }}>{macd.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
