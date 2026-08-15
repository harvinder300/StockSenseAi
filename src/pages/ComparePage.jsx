import React, { useState, useCallback } from 'react';
import StockSearchInput from '../components/StockSearchInput';
import { getFullStockAnalysis } from '../services/stockDataService';
import { compareStocksWithGemini } from '../services/geminiService';
import { NotFoundState } from '../components/ErrorStateCard';
import { Scale, Trophy, TrendingUp, BarChart2, ArrowUpRight, ArrowDownRight, Wifi, Award, CheckCircle2, Target } from 'lucide-react';

/* ─── Individual Fundamental stock card ─────────────────────────────── */
function StockResultCard({ data, isWinner }) {
  const pctColor = data.meta.pChange >= 0 ? '#00ff88' : '#ff4757';
  const overall = data.fundamentals?.overall || { total: 50, verdict: 'Average', color: '#ffd700', emoji: '⚖️' };
  const entryRes = data.entryAnalysis || {};

  const pillars = [
    { name: 'Valuation', score: data.fundamentals?.valuation?.score || 0, color: '#00d4ff' },
    { name: 'Growth', score: data.fundamentals?.growth?.score || 0, color: '#00ff88' },
    { name: 'Financial Health', score: data.fundamentals?.health?.score || 0, color: '#a78bfa' },
    { name: 'Profitability', score: data.fundamentals?.profitability?.score || 0, color: '#ffd700' },
    { name: 'Dividend', score: data.fundamentals?.dividend?.score || 0, color: '#ff9f43' },
  ];

  return (
    <div style={{
      background:   isWinner ? 'rgba(255,215,0,0.03)' : 'var(--bg-card)',
      border:       `2px solid ${isWinner ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 'var(--radius-lg)',
      padding:      24,
      transition:   'var(--transition)',
      boxShadow:    isWinner ? '0 0 30px rgba(255,215,0,0.08)' : 'var(--shadow-card)',
      position:     'relative',
      overflow:     'hidden',
    }}>
      {/* Gold top bar for winner */}
      {isWinner && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ffd700, #f59e0b, #ffd700)' }} />
      )}

      {/* Winner badge */}
      {isWinner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Trophy size={14} color="#ffd700" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Winner — Overall Rating
          </span>
        </div>
      )}

      {/* Symbol + Price row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 24, fontWeight: 900, color: '#fff' }}>
            {data.meta.symbol}
          </div>
          <div style={{ fontSize: 12, color: '#8892a4', marginTop: 3, maxWidth: 160, lineHeight: 1.3 }}>
            {data.meta.name}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="ss-badge ss-badge-blue" style={{ fontSize: 10 }}>{data.meta.sector}</span>
            {data.meta.isRealTime ? (
              <span className="ss-badge ss-badge-green" style={{ fontSize: 10, display: 'inline-flex', gap: 4 }}><Wifi size={9} /> NSE REAL-TIME</span>
            ) : (
              <span className="ss-badge" style={{ fontSize: 10, display: 'inline-flex', gap: 4, background: 'rgba(255,255,255,0.08)', color: '#8892a4' }}>NSE EOD</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: '#fff' }}>
            ₹{data.meta.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          {(() => {
            const pVal = data.meta.pChange !== null && data.meta.pChange !== undefined ? parseFloat(data.meta.pChange) : null;
            const cVal = data.meta.change !== null && data.meta.change !== undefined ? parseFloat(data.meta.change) : null;
            const hasData = pVal !== null && !isNaN(pVal);
            const isPos = hasData ? pVal >= 0 : true;
            const color = !hasData ? '#8892a4' : (isPos ? '#00ff88' : '#ff4757');
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4, fontSize: 13, fontWeight: 800, color }}>
                {hasData ? (
                  <>
                    {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {isPos ? '+' : ''}{cVal} ({isPos ? '+' : ''}{pVal.toFixed(2)}%)
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#8892a4' }}>Live % N/A</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Long Term Score Box */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${overall.color}12`, border: `1px solid ${overall.color}35`, borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase' }}>Fundamental Rating</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: overall.color, marginTop: 2 }}>
            {overall.emoji} {overall.verdict}
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 900, color: overall.color }}>
          {overall.total}<span style={{ fontSize: 14, color: '#8892a4' }}>/100</span>
        </div>
      </div>

      {/* 3-Factor Entry Timing Box */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${entryRes.entryColor || '#00d4ff'}12`, border: `1px solid ${entryRes.entryColor || '#00d4ff'}35`, borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Target size={12} color={entryRes.entryColor || '#00d4ff'} /> Entry Timing Score
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: entryRes.entryColor || '#00d4ff', marginTop: 2 }}>
            {entryRes.entryEmoji} {entryRes.entryVerdict || 'Decent Entry'}
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 900, color: entryRes.entryColor || '#00d4ff' }}>
          {entryRes.entryScore || 50}<span style={{ fontSize: 14, color: '#8892a4' }}>/100</span>
        </div>
      </div>

      {/* 5 Pillars Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase' }}>5 Pillars Breakdown:</div>
        {pillars.map((p) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: '#c8d0e0', fontWeight: 600 }}>{p.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(p.score / 20) * 100}%`, height: '100%', background: p.color }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: p.color }}>{p.score}/20</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Insights */}
      {data.fundamentals?.allInsights && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', marginBottom: 6 }}>Key Fundamental Insights:</div>
          {data.fundamentals.allInsights.slice(0, 3).map((insight, idx) => (
            <div key={idx} style={{ fontSize: 11, color: '#c8d0e0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} color="#00d4ff" style={{ flexShrink: 0 }} />
              <span>{insight.replace(/^(✅|⚠️|🔴|ℹ️)\s*/, '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Search slot ───────────────────────────────────────── */
function SearchSlot({ label, icon: Icon, placeholder, color, onSelect, currentName }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color="#fff" />
        </div>
        <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 800, color: '#fff' }}>
          {label} {currentName && <span style={{ color: '#00d4ff', fontWeight: 600 }}>({currentName})</span>}
        </span>
      </div>
      <StockSearchInput
        placeholder={placeholder}
        onSelect={onSelect}
        defaultValue={currentName}
      />
    </div>
  );
}

/* ─── Main Compare Page ─────────────────────────────────── */
export default function ComparePage({ geminiApiKey }) {
  const [stockA, setStockA] = useState(null);
  const [stockB, setStockB] = useState(null);
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [failedA, setFailedA] = useState(false);
  const [failedB, setFailedB] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [verdictLoading, setVerdictLoading] = useState(false);

  const alphaKey = localStorage.getItem('alphavantage_api_key') || null;

  // Run Gemini comparison whenever both stocks are loaded
  const runComparison = useCallback(async (a, b) => {
    if (!a || !b) return;
    setVerdictLoading(true);
    try {
      const result = await compareStocksWithGemini({
        stockA: {
          symbol: a.meta.symbol,
          name: a.meta.name,
          price: a.meta.price,
          fundamentals: a.fundamentals,
          entryAnalysis: a.entryAnalysis
        },
        stockB: {
          symbol: b.meta.symbol,
          name: b.meta.name,
          price: b.meta.price,
          fundamentals: b.fundamentals,
          entryAnalysis: b.entryAnalysis
        },
        geminiApiKey,
      });

      setVerdict(result);
    } catch (err) {
      console.error('Comparison: something went wrong');
    } finally {
      setVerdictLoading(false);
    }
  }, [geminiApiKey]);

  const handleSelectA = useCallback(async (sym, name) => {
    const bare = sym.replace(/\.(NS|BO)$/i, '');
    setNameA(name || bare);
    setStockA(null);
    setFailedA(false);
    setVerdict(null);
    setLoadingA(true);
    try {
      const res = await getFullStockAnalysis(bare, geminiApiKey, alphaKey);
      if (res?.data) {
        setStockA(res.data);
        setStockB(prev => { if (prev) runComparison(res.data, prev); return prev; });
      } else {
        setFailedA(true);
      }
    } finally { setLoadingA(false); }
  }, [geminiApiKey, alphaKey, runComparison]);

  const handleSelectB = useCallback(async (sym, name) => {
    const bare = sym.replace(/\.(NS|BO)$/i, '');
    setNameB(name || bare);
    setStockB(null);
    setFailedB(false);
    setVerdict(null);
    setLoadingB(true);
    try {
      const res = await getFullStockAnalysis(bare, geminiApiKey, alphaKey);
      if (res?.data) {
        setStockB(res.data);
        setStockA(prev => { if (prev) runComparison(prev, res.data); return prev; });
      } else {
        setFailedB(true);
      }
    } finally { setLoadingB(false); }
  }, [geminiApiKey, alphaKey, runComparison]);

  const bothLoaded = Boolean(stockA && stockB);

  const scoreA = stockA?.fundamentals?.overall?.total ?? 0;
  const scoreB = stockB?.fundamentals?.overall?.total ?? 0;

  const entryScoreA = stockA?.entryAnalysis?.entryScore ?? 0;
  const entryScoreB = stockB?.entryAnalysis?.entryScore ?? 0;

  const winnerName = scoreA > scoreB + 5 ? stockA?.meta.name : scoreB > scoreA + 5 ? stockB?.meta.name : 'Tie / Similar Quality';
  const isWinnerA = scoreA > scoreB + 5;
  const isWinnerB = scoreB > scoreA + 5;

  return (
    <div className="fade-up">

      {/* ── Page Header + Search Card ── */}
      <div className="ss-card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <Award size={14} /> Fundamental &amp; Entry Timing Comparison
          </div>
          <h1 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            Compare 2 <span style={{ color: '#00d4ff' }}>Long-Term Stocks</span>
          </h1>
          <p style={{ fontSize: 14, color: '#8892a4', maxWidth: 540, margin: '0 auto' }}>
            Compare 5-Pillar Fundamentals &amp; 3-Factor Entry Timing Scores side-by-side.
          </p>
        </div>

        {/* Two Search Bars */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <SearchSlot
            label="Stock A"
            icon={TrendingUp}
            placeholder="Search first stock… e.g. RELIANCE, TCS"
            color="rgba(0,212,255,0.5)"
            onSelect={handleSelectA}
            currentName={nameA}
          />
          {/* VS divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 40 }}>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 900, color: '#4a5568', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
              VS
            </div>
          </div>
          <SearchSlot
            label="Stock B"
            icon={BarChart2}
            placeholder="Search second stock… e.g. HDFCBANK, INFY"
            color="rgba(0,255,136,0.4)"
            onSelect={handleSelectB}
            currentName={nameB}
          />
        </div>
      </div>

      {/* ── Loading states ── */}
      {(loadingA || loadingB) && (
        <div className="ss-loading" style={{ marginBottom: 20 }}>
          <div className="ss-spinner" />
          <div className="ss-loading-text">
            {loadingA && loadingB ? 'Fetching fundamentals for both stocks…' : loadingA ? `Analyzing ${nameA}…` : `Analyzing ${nameB}…`}
          </div>
        </div>
      )}

      {/* ── Prompt to start ── */}
      {!stockA && !stockB && !loadingA && !loadingB && !failedA && !failedB && (
        <div className="ss-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Scale size={26} color="#00d4ff" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#8892a4' }}>
            Search and select two stocks above to compare fundamentals &amp; entry timing
          </p>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 6 }}>
            5-Pillar Fundamentals · 3-Factor Entry Timing · Tranche Strategy
          </p>
        </div>
      )}

      {/* ── AI & Fundamental Verdict Card ── */}
      {bothLoaded && (
        <div style={{
          background:   winnerName !== 'Tie / Similar Quality' ? 'rgba(255,215,0,0.03)' : 'var(--bg-card)',
          border:       `2px solid ${winnerName !== 'Tie / Similar Quality' ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 'var(--radius-lg)',
          padding:      28,
          marginBottom: 24,
          boxShadow:    winnerName !== 'Tie / Similar Quality' ? '0 0 40px rgba(255,215,0,0.07)' : 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={20} color="#ffd700" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                {verdict?.isGeminiLive ? '✦ Gemini Long-Term AI Comparison' : '✦ Fundamental & Entry Comparison Verdict'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  Better Long-Term Pick:
                </span>
                <span style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.35)', padding: '4px 16px', borderRadius: 99, fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 14 }}>
                  {winnerName} (Fund: {scoreA} vs {scoreB} | Entry: {entryScoreA} vs {entryScoreB})
                </span>
              </div>
            </div>
          </div>

          {/* Gemini text */}
          {!verdictLoading && verdict?.text && (
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
              <p style={{ fontSize: 14, color: '#c8d0e0', lineHeight: 1.75, fontWeight: 500, whiteSpace: 'pre-line' }}>
                {verdict.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Side-by-side stock cards ── */}
      {(stockA || stockB || failedA || failedB) && !loadingA && !loadingB && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Stock A */}
          <div>
            {stockA ? (
              <StockResultCard data={stockA} isWinner={isWinnerA} />
            ) : failedA ? (
              <NotFoundState symbol={nameA} onRetry={() => handleSelectA(nameA)} />
            ) : (
              <div className="ss-card" style={{ padding: 32, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <TrendingUp size={28} color="#4a5568" />
                <p style={{ fontSize: 13, color: '#4a5568', fontWeight: 600 }}>Search Stock A above</p>
              </div>
            )}
          </div>

          {/* Stock B */}
          <div>
            {stockB ? (
              <StockResultCard data={stockB} isWinner={isWinnerB} />
            ) : failedB ? (
              <NotFoundState symbol={nameB} onRetry={() => handleSelectB(nameB)} />
            ) : (
              <div className="ss-card" style={{ padding: 32, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <BarChart2 size={28} color="#4a5568" />
                <p style={{ fontSize: 13, color: '#4a5568', fontWeight: 600 }}>Search Stock B above</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
