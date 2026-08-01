import React from 'react';
import { Gauge, Flame, ShieldAlert, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MarketMoodGauge({ mood }) {
  const isUp   = mood.verdict === 'Bullish';
  const isDown = mood.verdict === 'Bearish';
  const needle = (mood.score / 100) * 180 - 90;

  const scoreColor = isUp ? '#00ff88' : isDown ? '#ff4757' : '#f59e0b';

  return (
    <div className="ss-mood-card">
      <div className="ss-mood-header">
        <div>
          <div className="ss-mood-title">Indian Market Mood Index</div>
          <div className="ss-mood-subtitle">NSE Sentiment &amp; Breadth Indicator</div>
        </div>
        <span
          className={`ss-badge ${isUp ? 'ss-badge-green' : isDown ? 'ss-badge-red' : 'ss-badge-amber'}`}
          style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}
        >
          {isUp && <Flame size={12} />}
          {isDown && <ShieldAlert size={12} />}
          {!isUp && !isDown && <Scale size={12} />}
          {mood.verdict} Index
        </span>
      </div>

      {/* Gauge */}
      <div className="ss-gauge-wrap">
        <div className="ss-gauge-arc">
          <div className="ss-gauge-track" />
          <div className="ss-gauge-needle" style={{ transform: `rotate(${needle}deg)` }} />
        </div>
        <div className="ss-gauge-score" style={{ color: scoreColor }}>{mood.score}</div>
        <div className="ss-gauge-label">Mood Score (0 – 100)</div>
      </div>

      <div className="ss-mood-desc">{mood.description}</div>

      <div className="ss-mood-stats">
        <div className="ss-mood-stat up">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpRight size={14} /> Advances
          </span>
          <span className="ss-mood-stat-val">{mood.advances}</span>
        </div>
        <div className="ss-mood-stat down">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowDownRight size={14} /> Declines
          </span>
          <span className="ss-mood-stat-val">{mood.declines}</span>
        </div>
      </div>
    </div>
  );
}
