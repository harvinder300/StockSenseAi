import React from 'react';
import StockChart from './StockChart';
import { Layers, Activity, Target, Shield, ArrowDownCircle, CheckCircle2, AlertTriangle, AlertCircle, Info, TrendingUp, DollarSign } from 'lucide-react';

export default function TechnicalEntrySection({ analysis }) {
  if (!analysis) return null;

  const { meta, candles, rsi, macd, detectedPatterns, entryAnalysis, multiData } = analysis;

  const entryScore = entryAnalysis?.entryScore || 50;
  const verdict = entryAnalysis?.entryVerdict || 'Good Entry Point';
  const color = entryAnalysis?.entryColor || '#00d4ff';
  const emoji = entryAnalysis?.entryEmoji || '✅';

  const f1 = entryAnalysis?.factor1Score || 0;
  const f2 = entryAnalysis?.factor2Score || 0;
  const f3 = entryAnalysis?.factor3Score || 0;

  const keyLevels = entryAnalysis?.keyLevels || {};
  const plan = entryAnalysis?.tranchePlan || {};
  const insights = entryAnalysis?.entryInsights || [];

  return (
    <div className="ss-card" style={{ padding: 28, marginTop: 24, border: `1.5px solid ${color}35`, boxShadow: `0 0 25px ${color}12` }}>

      {/* Entry Point Analysis Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Poppins, sans-serif' }}>
              <Activity size={24} color={color} /> 📊 Entry Point Analysis
            </h3>
            <p style={{ fontSize: 13, color: '#8892a4', marginTop: 4 }}>
              Comprehensive 3-Factor System for Long-Term Investors (Price Position + Valuation + Technicals)
            </p>
          </div>
          <div style={{
            background: `${color}18`,
            color,
            border: `1.5px solid ${color}40`,
            padding: '8px 20px',
            borderRadius: 99,
            fontWeight: 800,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>{emoji}</span> {verdict}
          </div>
        </div>
      </div>

      {/* Score Progress & Factor Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, background: '#151c2e', padding: 20, borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase' }}>Entry Score:</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 900, color }}>
              {entryScore}<span style={{ fontSize: 14, color: '#8892a4' }}>/100</span>
            </span>
          </div>

          <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${entryScore}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: 5, transition: 'width 0.8s ease' }} />
          </div>
        </div>

        {/* Factor Breakdown */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', marginBottom: 8 }}>
            Factor Breakdown:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c8d0e0', display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={13} color="#00d4ff" /> 📍 Price Position</span>
              <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00d4ff' }}>{f1}/33</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c8d0e0', display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={13} color="#00ff88" /> 💰 Valuation</span>
              <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00ff88' }}>{f2}/34</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c8d0e0', display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={13} color="#a78bfa" /> 📈 Technicals</span>
              <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>{f3}/33</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Key Levels Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Key Price Levels:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { label: 'Current Price', val: `₹${(keyLevels.currentPrice || 0).toLocaleString('en-IN')}`, color: '#fff' },
            { label: '52-Week High', val: `₹${(keyLevels.fiftyTwoWeekHigh || 0).toLocaleString('en-IN')}`, color: '#ff4757' },
            { label: '52-Week Low', val: `₹${(keyLevels.fiftyTwoWeekLow || 0).toLocaleString('en-IN')}`, color: '#00ff88' },
            { label: '50-Day MA', val: `₹${(keyLevels.fiftyDayAverage || 0).toLocaleString('en-IN')}`, color: '#00d4ff' },
            { label: '200-Day MA', val: `₹${(keyLevels.twoHundredDayAverage || 0).toLocaleString('en-IN')}`, color: '#a78bfa' },
            { label: 'Strong Support', val: `₹${(keyLevels.support1 || 0).toLocaleString('en-IN')}`, color: '#00ff88' },
            { label: 'Resistance', val: `₹${(keyLevels.resistance || 0).toLocaleString('en-IN')}`, color: '#ffd700' },
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#151c2e', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: '#8892a4', fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: item.color, marginTop: 4 }}>
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 Investment Strategy & Tranche Plan */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          <Target size={18} color="#00d4ff" /> 🎯 Investment Strategy: <span style={{ color }}>{plan.strategy}</span>
        </div>

        {/* Tranches */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
          {plan.tranches && plan.tranches.map((tranche, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color }}>Tranche {idx + 1}: {tranche.percent}</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#fff', marginTop: 2 }}>{tranche.price}</div>
              <div style={{ fontSize: 11, color: '#8892a4', marginTop: 4 }}>{tranche.reason}</div>
            </div>
          ))}
        </div>

        {/* Targets & Review Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.08)', fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {plan.targets && plan.targets.map((tgt, i) => (
              <span key={i} style={{ color: '#00ff88', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                🎯 {tgt}
              </span>
            ))}
          </div>
          <div style={{ color: '#ff4757', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={14} /> Review thesis if falls below: <strong>{plan.reviewPrice || keyLevels.reviewPrice}</strong>
          </div>
        </div>
      </div>

      {/* Entry Signals Checklist */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          3-Factor Entry Signals:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
          {insights.map((insight, idx) => {
            let IconComp = Info;
            let iconColor = '#00d4ff';
            if (insight.startsWith('💎') || insight.startsWith('✅')) { IconComp = CheckCircle2; iconColor = '#00ff88'; }
            else if (insight.startsWith('⚠️')) { IconComp = AlertTriangle; iconColor = '#ffd700'; }
            else if (insight.startsWith('🔴')) { IconComp = AlertCircle; iconColor = '#ff4757'; }

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#c8d0e0', fontWeight: 500 }}>
                <IconComp size={15} color={iconColor} style={{ flexShrink: 0 }} />
                <span>{insight}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candlestick Chart */}
      <StockChart candles={candles} symbol={meta.symbol} rawCandles={multiData?.rawCandles} />

      {/* Indicator Breakdown Cards */}
      <div className="ss-indicators-grid" style={{ marginTop: 20 }}>
        {/* Pattern */}
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
