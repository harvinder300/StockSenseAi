import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShieldCheck, PieChart, Gift, ChevronDown, ChevronUp, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export function FundamentalSkeleton() {
  return (
    <div className="ss-space-y">
      {/* Header Banner Skeleton */}
      <div className="ss-stock-banner" style={{ opacity: 0.6, animation: 'pulse 1.5s infinite' }}>
        <div style={{ width: 200, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }} />
        <div style={{ width: 120, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }} />
      </div>

      {/* Main Score Skeleton */}
      <div className="ss-card" style={{ padding: 32, opacity: 0.6, animation: 'pulse 1.5s infinite' }}>
        <div style={{ width: 150, height: 40, background: 'rgba(255,255,255,0.08)', borderRadius: 8, margin: '0 auto 16px' }} />
        <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 16 }} />
        <div style={{ width: '60%', height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 6, margin: '0 auto' }} />
      </div>

      {/* Pillar Cards Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="ss-card" style={{ padding: 20, height: 160, opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );
}

function PillarCard({ icon: Icon, title, score, insights, metrics, color }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="ss-card"
      style={{
        padding: 20,
        background: '#151c2e',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 15px ${color}15`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}
    >
      <div>
        {/* Title + Score Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#fff' }}>
            <Icon size={18} color={color} />
            <span>{title}</span>
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 12,
            background: `${color}20`,
            color,
            border: `1px solid ${color}40`,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            Score {score}/20
          </span>
        </div>

        {/* Metrics Overview List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {metrics.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#8892a4', fontWeight: 500 }}>{m.label}:</span>
              <span style={{ fontWeight: 700, color: m.statusColor || '#c8d0e0', fontFamily: 'JetBrains Mono, monospace' }}>
                {m.val} {m.badge && <span style={{ fontSize: 11 }}>{m.badge}</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Expandable Insights List */}
        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Scoring Insights:
            </div>
            {insights.map((insight, idx) => {
              let IconComp = Info;
              let iconColor = '#00d4ff';
              if (insight.startsWith('✅')) { IconComp = CheckCircle2; iconColor = '#00ff88'; }
              else if (insight.startsWith('⚠️')) { IconComp = AlertTriangle; iconColor = '#ffd700'; }
              else if (insight.startsWith('🔴')) { IconComp = AlertCircle; iconColor = '#ff4757'; }

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#c8d0e0', lineHeight: 1.4 }}>
                  <IconComp size={13} color={iconColor} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{insight.replace(/^(✅|⚠️|🔴|ℹ️)\s*/, '')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expand / Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#00d4ff',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          marginTop: 12,
          cursor: 'pointer',
          padding: '6px 0',
          width: '100%'
        }}
      >
        {expanded ? <>Show Less <ChevronUp size={14} /></> : <>See more breakdown <ChevronDown size={14} /></>}
      </button>
    </div>
  );
}

export default function FundamentalDashboard({ fundamentals, meta }) {
  if (!fundamentals) return <FundamentalSkeleton />;

  const { valuation, growth, health, profitability, dividend, overall, raw } = fundamentals;

  // Format Market Cap (Cr / T)
  const formatMarketCap = (val) => {
    if (!val || isNaN(val)) return 'N/A';
    const cr = val / 10000000;
    if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
    if (cr >= 100) return `₹${(cr / 100).toFixed(2)} Cr`;
    return `₹${cr.toFixed(0)} Cr`;
  };

  const marketCapStr = formatMarketCap(raw.marketCap);

  return (
    <div className="ss-space-y">

      {/* Long Term Score Card */}
      <div
        className="ss-card"
        style={{
          padding: '28px 32px',
          background: `radial-gradient(circle at top right, ${overall.color}15, #151c2e 70%)`,
          border: `2px solid ${overall.color}40`,
          boxShadow: `0 0 30px ${overall.color}15`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8892a4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Fundamental Rating
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{overall.emoji}</span> {overall.verdict}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 900, color: overall.color, lineHeight: 1 }}>
              {overall.total}<span style={{ fontSize: 20, color: '#8892a4' }}>/100</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: overall.color, marginTop: 4 }}>
              Long-Term Score
            </div>
          </div>
        </div>

        {/* Score Progress Bar */}
        <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
          <div
            style={{
              height: '100%',
              width: `${overall.total}%`,
              background: `linear-gradient(90deg, ${overall.color}cc, ${overall.color})`,
              borderRadius: 5,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Strategy & Horizon banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase' }}>Recommended Strategy:</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d0e0', marginTop: 2 }}>{overall.strategy}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase' }}>Ideal Time Horizon:</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4ff', marginTop: 2 }}>3 to 5+ Years</div>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase' }}>Market Cap:</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{marketCapStr}</div>
          </div>
        </div>
      </div>

      {/* 5 Pillar Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>

        {/* 1. Valuation Card */}
        <PillarCard
          icon={DollarSign}
          title="Valuation"
          score={valuation.score}
          insights={valuation.insights}
          color="#00d4ff"
          metrics={[
            { label: 'P/E Ratio', val: valuation.pe !== null ? `${valuation.pe.toFixed(1)}x` : 'N/A', statusColor: valuation.pe < 25 ? '#00ff88' : '#ff4757' },
            { label: 'P/B Ratio', val: valuation.pb !== null ? `${valuation.pb.toFixed(1)}x` : 'N/A', statusColor: valuation.pb < 3 ? '#00ff88' : '#ffd700' },
            { label: 'PEG Ratio', val: valuation.peg !== null ? `${valuation.peg.toFixed(2)}` : 'N/A', statusColor: valuation.peg < 1.5 ? '#00ff88' : '#ffd700' },
            { label: 'EV / EBITDA', val: raw.enterpriseToEbitda ? `${raw.enterpriseToEbitda.toFixed(1)}x` : 'N/A' }
          ]}
        />

        {/* 2. Growth Card */}
        <PillarCard
          icon={TrendingUp}
          title="Growth"
          score={growth.score}
          insights={growth.insights}
          color="#00ff88"
          metrics={[
            { label: 'Revenue (YoY)', val: growth.revenueGrowthPct !== null ? `${growth.revenueGrowthPct >= 0 ? '+' : ''}${growth.revenueGrowthPct.toFixed(1)}%` : 'N/A', statusColor: growth.revenueGrowthPct > 10 ? '#00ff88' : '#ff4757' },
            { label: 'Earnings (YoY)', val: growth.earningsGrowthPct !== null ? `${growth.earningsGrowthPct >= 0 ? '+' : ''}${growth.earningsGrowthPct.toFixed(1)}%` : 'N/A', statusColor: growth.earningsGrowthPct > 10 ? '#00ff88' : '#ff4757' },
            { label: 'Quarterly EPS', val: growth.quarterlyGrowthPct !== null ? `${growth.quarterlyGrowthPct >= 0 ? '+' : ''}${growth.quarterlyGrowthPct.toFixed(1)}%` : 'N/A' }
          ]}
        />

        {/* 3. Financial Health Card */}
        <PillarCard
          icon={ShieldCheck}
          title="Financial Health"
          score={health.score}
          insights={health.insights}
          color="#a78bfa"
          metrics={[
            { label: 'Debt / Equity', val: health.debtToEquity !== null ? health.debtToEquity.toFixed(2) : 'N/A', statusColor: health.debtToEquity < 0.7 ? '#00ff88' : '#ff4757' },
            { label: 'Current Ratio', val: health.currentRatio !== null ? health.currentRatio.toFixed(2) : 'N/A', statusColor: health.currentRatio > 1.5 ? '#00ff88' : '#ffd700' },
            { label: 'Free Cash Flow', val: health.freeCashflow !== null ? (health.freeCashflow > 0 ? '+Positive' : 'Negative') : 'N/A', statusColor: health.freeCashflow > 0 ? '#00ff88' : '#ff4757' }
          ]}
        />

        {/* 4. Profitability Card */}
        <PillarCard
          icon={PieChart}
          title="Profitability"
          score={profitability.score}
          insights={profitability.insights}
          color="#ffd700"
          metrics={[
            { label: 'ROE', val: profitability.roePct !== null ? `${profitability.roePct.toFixed(1)}%` : 'N/A', statusColor: profitability.roePct > 15 ? '#00ff88' : '#ffd700' },
            { label: 'Net Margin', val: profitability.netMarginPct !== null ? `${profitability.netMarginPct.toFixed(1)}%` : 'N/A', statusColor: profitability.netMarginPct > 10 ? '#00ff88' : '#ffd700' },
            { label: 'Operating Margin', val: profitability.operatingMarginPct !== null ? `${profitability.operatingMarginPct.toFixed(1)}%` : 'N/A' }
          ]}
        />

        {/* 5. Dividend Card */}
        <PillarCard
          icon={Gift}
          title="Dividend"
          score={dividend.score}
          insights={dividend.insights}
          color="#ff9f43"
          metrics={[
            { label: 'Dividend Yield', val: dividend.divYieldPct !== null ? `${dividend.divYieldPct.toFixed(1)}%` : '0.0%', statusColor: dividend.divYieldPct > 1 ? '#00ff88' : '#8892a4' },
            { label: 'Payout Ratio', val: dividend.payoutRatioPct !== null ? `${dividend.payoutRatioPct.toFixed(1)}%` : 'N/A', statusColor: dividend.payoutRatioPct < 60 ? '#00ff88' : '#ffd700' },
            { label: '5yr Avg Yield', val: dividend.fiveYrAvgYield !== null ? `${dividend.fiveYrAvgYield.toFixed(1)}%` : 'N/A' }
          ]}
        />

      </div>

      {/* Data Source Footer Notice */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#8892a4', paddingTop: 8 }}>
        Data: Alpha Vantage & NSE Direct API | Updated: Daily
      </div>

    </div>
  );
}
