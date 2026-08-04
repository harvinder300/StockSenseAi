import React from 'react';
import { Calendar, Clock, Activity, ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MultiTimeframeWidget({ multiData }) {
  if (!multiData) return null;

  const { weekly, daily, hourly, agreement } = multiData;
  const timeframes = [
    { key: 'weekly', icon: Calendar, label: 'Weekly', iconEmoji: '🗓️', data: weekly },
    { key: 'daily', icon: Calendar, label: 'Daily', iconEmoji: '📅', data: daily },
    { key: 'hourly', icon: Clock, label: 'Hourly', iconEmoji: '⏰', data: hourly },
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'Bullish') return <TrendingUp size={16} color="#00ff88" />;
    if (trend === 'Bearish') return <TrendingDown size={16} color="#ff4757" />;
    return <Minus size={16} color="#00d4ff" />;
  };

  const getTrendBadge = (trend) => {
    if (trend === 'Bullish') return <span style={{ color: '#00ff88', fontWeight: 700 }}>🟢 Bullish</span>;
    if (trend === 'Bearish') return <span style={{ color: '#ff4757', fontWeight: 700 }}>🔴 Bearish</span>;
    return <span style={{ color: '#00d4ff', fontWeight: 700 }}>🔵 Neutral</span>;
  };

  return (
    <div className="ss-card" style={{ padding: '24px 28px', marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="#00d4ff" /> Multi-Timeframe Analysis
          </h3>
          <p style={{ fontSize: 13, color: '#8892a4', marginTop: 4 }}>
            Alignment across Weekly, Daily &amp; Hourly timeframes for high-probability signals
          </p>
        </div>
        <div className="ss-badge" style={{ background: `${agreement.color}20`, color: agreement.color, border: `1px solid ${agreement.color}40`, fontSize: 12, padding: '6px 14px' }}>
          Action: {agreement.action}
        </div>
      </div>

      {/* 3 Timeframe Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {timeframes.map(({ key, label, iconEmoji, data }) => {
          const glowColor = data.color;
          return (
            <div
              key={key}
              style={{
                background: '#151c2e',
                borderRadius: 'var(--radius)',
                padding: '20px',
                border: `1px solid ${glowColor}`,
                boxShadow: `0 0 16px ${glowColor}25`,
                transition: 'all 0.3s ease'
              }}
            >
              {/* Card Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  <span>{iconEmoji}</span> {label}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: `${glowColor}20`,
                  color: glowColor,
                  border: `1px solid ${glowColor}40`
                }}>
                  {data.verdict}
                </span>
              </div>

              {/* Card Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8892a4' }}>Trend:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getTrendBadge(data.trend)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8892a4' }}>RSI (14):</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: data.rsiVal >= 70 ? '#ff4757' : data.rsiVal <= 30 ? '#00ff88' : '#c8d0e0' }}>
                    {data.rsiVal} <span style={{ fontSize: 11, color: '#8892a4' }}>({data.rsiSignal})</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8892a4' }}>MACD:</span>
                  <span style={{ fontWeight: 700, color: data.macdText === 'Bullish' ? '#00ff88' : '#ff4757' }}>
                    {data.macdText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeframe Agreement Box */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        border: `1px solid ${agreement.color}40`,
        borderRadius: 'var(--radius)',
        padding: '18px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color={agreement.color} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Overall Timeframe Agreement</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: agreement.color }}>
            {agreement.label} ({agreement.score}%)
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${agreement.score}%`,
              background: `linear-gradient(90deg, ${agreement.color}cc, ${agreement.color})`,
              borderRadius: 5,
              transition: 'width 0.8s ease-in-out'
            }}
          />
        </div>
      </div>
    </div>
  );
}
