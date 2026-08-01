import React, { useState, useCallback } from 'react';
import StockSearchInput from '../components/StockSearchInput';
import ConfidenceMeter from '../components/ConfidenceMeter';
import { getFullStockAnalysis } from '../services/stockDataService';
import { compareStocksWithGemini } from '../services/geminiService';
import { Scale, Trophy, Sparkles, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wifi, WifiOff, BarChart2 } from 'lucide-react';

/* ─── Individual stock card ─────────────────────────────── */
function StockResultCard({ data, isWinner }) {
  const pctColor  = data.meta.pChange >= 0 ? '#00ff88' : '#ff4757';
  const sigStyle  = (sig) => {
    if (sig === 'BUY')  return { background: '#00ff88', color: '#061210', fontWeight: 900, padding: '5px 16px', borderRadius: 99, fontSize: 12, textTransform: 'uppercase' };
    if (sig === 'WAIT') return { background: '#ff4757', color: '#fff',    fontWeight: 900, padding: '5px 16px', borderRadius: 99, fontSize: 12, textTransform: 'uppercase' };
    return               { background: '#f59e0b', color: '#1a0f00',       fontWeight: 900, padding: '5px 16px', borderRadius: 99, fontSize: 12, textTransform: 'uppercase' };
  };

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
          <Trophy size={13} color="#ffd700" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AI Pick
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
            {data.meta.isLive
              ? <span className="ss-badge ss-badge-green" style={{ fontSize: 10, display: 'inline-flex', gap: 4 }}><Wifi size={9} /> Live</span>
              : <span className="ss-badge ss-badge-amber" style={{ fontSize: 10, display: 'inline-flex', gap: 4 }}><WifiOff size={9} /> Sim</span>
            }
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 24, fontWeight: 700, color: '#fff' }}>
            ₹{data.meta.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4, fontSize: 13, fontWeight: 800, color: pctColor }}>
            {data.meta.pChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {data.meta.change >= 0 ? '+' : ''}{data.meta.change} ({data.meta.pChange}%)
          </div>
        </div>
      </div>

      {/* AI Signal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', padding: '11px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#8892a4' }}>
          <Sparkles size={13} color="#00d4ff" />
          AI Signal
        </div>
        <span style={sigStyle(data.aiAnalysis.signal)}>{data.aiAnalysis.signal}</span>
      </div>

      {/* Metrics grid */}
      {[
        { label: 'RSI (14)',          val: `${data.rsi.value}  —  ${data.rsi.status}`,  highlight: data.rsi.value >= 70 ? '#ff4757' : data.rsi.value <= 30 ? '#00ff88' : '#00d4ff' },
        { label: 'MACD',              val: data.macd.status,                              highlight: data.macd.histogram >= 0 ? '#00ff88' : '#ff4757' },
        { label: 'Pattern Detected',  val: data.detectedPatterns[0]?.name || '—',        highlight: null },
        { label: 'Overall Verdict',   val: data.aiAnalysis.verdict,                       highlight: data.aiAnalysis.verdict === 'Bullish' ? '#00ff88' : data.aiAnalysis.verdict === 'Bearish' ? '#ff4757' : '#f59e0b' },
      ].map(({ label, val, highlight }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: '#8892a4', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono,monospace', color: highlight || '#c8d0e0' }}>{val}</span>
        </div>
      ))}

      {/* Confidence Score Widget */}
      <ConfidenceMeter confidence={data.confidence} />
    </div>
  );
}

/* ─── Search slot ───────────────────────────────────────── */
function SearchSlot({ label, icon: Icon, placeholder, color, onSelect, currentName }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color="#fff" />
        </div>
        <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>{label}</span>
        {currentName && (
          <span style={{ fontSize: 11, color: '#8892a4', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
            → {currentName}
          </span>
        )}
      </div>
      <StockSearchInput placeholder={placeholder} onSelect={onSelect} />
    </div>
  );
}

/* ─── Main Compare Page ─────────────────────────────────── */
export default function ComparePage({ geminiApiKey }) {
  const [stockA,      setStockA]      = useState(null);   // full analysis result
  const [stockB,      setStockB]      = useState(null);
  const [nameA,       setNameA]       = useState('');
  const [nameB,       setNameB]       = useState('');
  const [loadingA,    setLoadingA]    = useState(false);
  const [loadingB,    setLoadingB]    = useState(false);
  const [verdict,     setVerdict]     = useState(null);
  const [verdictLoading, setVerdictLoading] = useState(false);

  // Run Gemini comparison whenever both stocks are loaded
  const runComparison = useCallback(async (a, b) => {
    if (!a || !b) return;
    setVerdictLoading(true);
    try {
      const result = await compareStocksWithGemini({
        stockA: {
          symbol: a.meta.symbol,
          name:   a.meta.name,
          price:  a.meta.price,
          rsi:    `${a.rsi.value} (${a.rsi.status})`,
          rsiVal: a.rsi.value,
          macd:   a.macd.status,
        },
        stockB: {
          symbol: b.meta.symbol,
          name:   b.meta.name,
          price:  b.meta.price,
          rsi:    `${b.rsi.value} (${b.rsi.status})`,
          rsiVal: b.rsi.value,
          macd:   b.macd.status,
        },
        geminiApiKey,
      });
      setVerdict(result);
    } catch (err) {
      console.error('Compare error:', err);
    } finally {
      setVerdictLoading(false);
    }
  }, [geminiApiKey]);

  const handleSelectA = useCallback(async (sym, name) => {
    setNameA(name || sym.split('.')[0]);
    setStockA(null);
    setVerdict(null);
    setLoadingA(true);
    try {
      const data = await getFullStockAnalysis(sym, geminiApiKey);
      setStockA(data);
      setStockB(prev => { if (prev) runComparison(data, prev); return prev; });
    } finally { setLoadingA(false); }
  }, [geminiApiKey, runComparison]);

  const handleSelectB = useCallback(async (sym, name) => {
    setNameB(name || sym.split('.')[0]);
    setStockB(null);
    setVerdict(null);
    setLoadingB(true);
    try {
      const data = await getFullStockAnalysis(sym, geminiApiKey);
      setStockB(data);
      setStockA(prev => { if (prev) runComparison(prev, data); return prev; });
    } finally { setLoadingB(false); }
  }, [geminiApiKey, runComparison]);

  const winnerSym   = verdict?.winner?.split('.')?.[0];
  const isWinnerA   = verdict?.winner && stockA && verdict.winner.split('.')[0] === stockA.meta.symbol;
  const isWinnerB   = verdict?.winner && stockB && verdict.winner.split('.')[0] === stockB.meta.symbol;
  const bothLoaded  = stockA && stockB && !loadingA && !loadingB;

  return (
    <div className="fade-up">

      {/* ── Header ── */}
      <div className="ss-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
        <div className="ss-badge ss-badge-blue" style={{ display: 'inline-flex', gap: 6, marginBottom: 14 }}>
          <Scale size={13} /> Live Stock Battle
        </div>
        <h1 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          Compare 2 <span style={{ color: '#00d4ff' }}>NSE / BSE Stocks</span>
        </h1>
        <p style={{ fontSize: 14, color: '#8892a4', maxWidth: 520, margin: '0 auto 28px' }}>
          Search any two stocks live — get RSI, MACD, AI verdict side-by-side,
          and a Gemini AI analysis on which is technically stronger right now.
        </p>

        {/* Two Search Bars */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <SearchSlot
            label="Stock A"
            icon={TrendingUp}
            placeholder="Search first stock…  e.g. Reliance, TCS"
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
            placeholder="Search second stock… e.g. HDFC, Infosys"
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
            {loadingA && loadingB ? 'Fetching both stocks…' : loadingA ? `Analyzing ${nameA}…` : `Analyzing ${nameB}…`}
          </div>
        </div>
      )}

      {/* ── Prompt to start ── */}
      {!stockA && !stockB && !loadingA && !loadingB && (
        <div className="ss-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Scale size={26} color="#00d4ff" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#8892a4' }}>
            Search and select two stocks above to start the comparison
          </p>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 6 }}>
            Live Yahoo Finance data · Real RSI & MACD · Gemini AI verdict
          </p>
        </div>
      )}

      {/* ── AI Verdict Card ── */}
      {bothLoaded && (verdictLoading || verdict) && (
        <div style={{
          background:   winnerSym ? 'rgba(255,215,0,0.03)' : 'var(--bg-card)',
          border:       `2px solid ${winnerSym ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 'var(--radius-lg)',
          padding:      28,
          marginBottom: 24,
          boxShadow:    winnerSym ? '0 0 40px rgba(255,215,0,0.07)' : 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={20} color="#ffd700" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                {verdict?.isGeminiLive ? '✦ Gemini AI Comparison Verdict' : '✦ AI Comparison Verdict'}
              </div>
              {verdictLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8892a4', fontSize: 13 }}>
                  <div style={{ width: 14, height: 14, border: '2px solid #00d4ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Gemini is comparing both stocks…
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 800, color: '#fff' }}>
                    Recommended Watch This Week:
                  </span>
                  {winnerSym && (
                    <span style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.35)', padding: '4px 16px', borderRadius: 99, fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 14 }}>
                      {winnerSym}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

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
      {(stockA || stockB) && !loadingA && !loadingB && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {/* Stock A */}
          <div>
            {stockA ? (
              <StockResultCard data={stockA} isWinner={isWinnerA} />
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
