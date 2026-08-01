import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function ConfidenceMeter({ confidence }) {
  if (!confidence) return null;

  return (
    <div className="ss-card" style={{ padding: '24px 28px', marginTop: 24, border: `1px solid ${confidence.color}40` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>AI Confidence Score</h3>
          <p style={{ fontSize: 13, color: '#8892a4' }}>Based on alignment of RSI, MACD, Patterns, and Volume</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: confidence.color, lineHeight: 1 }}>
            {confidence.score}%
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: confidence.color, marginTop: 4 }}>
            {confidence.level}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${confidence.score}%`, 
            background: confidence.color, 
            borderRadius: 4,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
          }} 
        />
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {confidence.breakdown.map((item, i) => {
          let Icon = Info;
          let iconColor = '#8892a4';
          
          if (item.status === 'pos') {
            Icon = CheckCircle2;
            iconColor = '#00ff88';
          } else if (item.status === 'neg') {
            Icon = AlertTriangle;
            iconColor = '#ff4757';
          } else {
            Icon = Info;
            iconColor = '#00d4ff'; // neu
          }

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 8 }}>
              <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#c8d0e0', fontWeight: 500 }}>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
