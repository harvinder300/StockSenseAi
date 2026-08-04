import React, { useState, useEffect, useCallback } from 'react';
import { getFullStockAnalysis } from '../services/stockDataService';
import StockSearchInput from '../components/StockSearchInput';
import StockChart from '../components/StockChart';
import ConfidenceMeter from '../components/ConfidenceMeter';
import MultiTimeframeWidget from '../components/MultiTimeframeWidget';
import { Layers, Sparkles, ArrowUpRight, ArrowDownRight, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

const QUICK_PICKS = ['RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','TATAMOTORS.NS','BHARTIARTL.NS','ITC.NS','LT.NS','SBIN.NS','WIPRO.NS'];

export default function AnalyserPage({ selectedSymbol, onSymbolChange, geminiApiKey }) {
  const [symbol,   setSymbol]   = useState(selectedSymbol ? `${selectedSymbol}.NS` : 'RELIANCE.NS');
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Main analysis pipeline
  const runAnalysis = useCallback(async (sym) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const data = await getFullStockAnalysis(sym, geminiApiKey);
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis: something went wrong');
    } finally {
      setLoading(false);
    }
  }, [geminiApiKey]);

  useEffect(() => { runAnalysis(symbol); }, [symbol]);

  // Called by StockSearchInput when user picks a stock
  const handleSelect = (sym) => {
    const fullSym = sym.includes('.') ? sym : `${sym}.NS`;
    setSymbol(fullSym);
    onSymbolChange(fullSym.split('.')[0]);
  };

  const barColor = (rsi) => {
    if (rsi >= 70) return 'red';
    if (rsi <= 30) return 'green';
    return 'blue';
  };

  const signalRes = analysis?.signalResult || {};

  return (
    <div className="fade-up">

      {/* ── Search Card ── */}
      <div className="ss-card" style={{ padding: '32px', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            Stock <span style={{ color: '#00d4ff' }}>Analyser</span>
          </h1>
          <p style={{ fontSize: 14, color: '#8892a4' }}>
            Search any NSE/BSE stock — live Yahoo Finance data, weighted signal scoring, Gemini AI analysis.
          </p>
        </div>

        {/* Shared StockSearchInput */}
        <div style={{ maxWidth: 640, margin: '0 auto 20px' }}>
          <StockSearchInput
            placeholder="Type company name or NSE ticker e.g. Reliance, TCS, HDFC…"
            onSelect={handleSelect}
            defaultValue={symbol.replace(/\.(NS|BO)$/i, '')}
          />
        </div>

        {/* Quick pick chips */}
        <div className="ss-chip-row" style={{ justifyContent: 'center' }}>
          <span className="ss-chip-label">Quick:</span>
          {QUICK_PICKS.map(s => {
            const bare = s.replace('.NS','');
            return (
              <button key={s} className={`ss-chip${symbol === s ? ' active' : ''}`} onClick={() => handleSelect(s, bare)}>
                {bare}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="ss-loading">
          <div className="ss-spinner" />
          <div className="ss-loading-text">
            Fetching live data &amp; running technical analysis for {symbol.replace(/\.(NS|BO)$/i,'')}…
          </div>
        </div>
      )}

      {/* ── Full Analysis ── */}
      {!loading && analysis && (
        <div className="ss-space-y">

          {/* Stock Header Banner */}
          <div className="ss-stock-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="ss-stock-banner-sym">{analysis.meta.symbol}</span>
                <span className="ss-badge ss-badge-blue">{analysis.meta.sector}</span>
                {analysis.meta.isLive
                  ? <span className="ss-badge ss-badge-green" style={{ display: 'inline-flex', gap: 5 }}><Wifi size={11} /> Live Data</span>
                  : <span className="ss-badge ss-badge-amber" style={{ display: 'inline-flex', gap: 5 }}><WifiOff size={11} /> Simulated</span>
                }
                {analysis.aiAnalysis.isGeminiLive && (
                  <span className="ss-badge ss-badge-blue" style={{ display: 'inline-flex', gap: 5 }}><Sparkles size={11} /> Gemini AI</span>
                )}
              </div>
              <div className="ss-stock-banner-meta">{analysis.meta.name}</div>
            </div>
            <div>
              <div className="ss-stock-banner-price">₹{analysis.meta.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div className="ss-stock-banner-chg" style={{ color: analysis.meta.change >= 0 ? '#00ff88' : '#ff4757' }}>
                {analysis.meta.change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                {analysis.meta.change >= 0 ? '+' : ''}{analysis.meta.change} ({analysis.meta.pChange}%)
              </div>
            </div>
          </div>

          {/* 3-Month Candlestick Chart */}
          <StockChart candles={analysis.candles} symbol={analysis.meta.symbol} rawCandles={analysis.multiData?.rawCandles} />

          {/* Multi-Timeframe Analysis Widget */}
          <MultiTimeframeWidget multiData={analysis.multiData} />

          {/* ── Weighted Signal Analysis Card ── */}
          <div style={{
            background:   `${signalRes.color || '#00d4ff'}08`,
            border:       `2px solid ${signalRes.color || '#00d4ff'}40`,
            borderRadius: 'var(--radius-lg)',
            padding:      28,
          }}>
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${signalRes.color || '#00d4ff'}20`,
                  color: signalRes.color || '#00d4ff',
                }}>
                  <Sparkles size={22} />
                </div>
                {/* Verdict + Signal */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {analysis.aiAnalysis.isGeminiLive ? '✦ Gemini AI & Weighted Signal Engine' : '✦ Technical Signal Engine'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      color: signalRes.color || '#00d4ff',
                      fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 800,
                    }}>
                      {signalRes.emoji} {signalRes.verdict || analysis.aiAnalysis.verdict}
                    </span>
                    <span style={{ color: '#4a5568' }}>·</span>
                    <span style={{ fontSize: 13, color: '#8892a4', fontWeight: 600 }}>Action:</span>
                    <span style={{
                      background: `${signalRes.color || '#00d4ff'}20`,
                      color: signalRes.color || '#00d4ff',
                      border: `1px solid ${signalRes.color || '#00d4ff'}40`,
                      fontWeight: 900,
                      padding: '4px 14px',
                      borderRadius: 99,
                      fontSize: 12,
                      textTransform: 'uppercase'
                    }}>
                      {signalRes.action || analysis.aiAnalysis.signal}
                    </span>
                    <span style={{ color: '#4a5568' }}>·</span>
                    <span style={{ fontSize: 13, color: '#8892a4', fontWeight: 600 }}>Signal Score:</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 800, color: signalRes.color || '#00d4ff' }}>
                      {signalRes.score || 50}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signal Reasons Breakdown */}
            {signalRes.reasons && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Signal Score Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {signalRes.reasons.map((reason, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#c8d0e0', fontWeight: 500 }}>
                      <CheckCircle2 size={15} color="#00d4ff" style={{ flexShrink: 0 }} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Score Widget */}
            <ConfidenceMeter confidence={analysis.confidence} />

            {/* Gemini / Analysis Text */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius)', padding: '18px 20px', marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Detailed AI Analysis
              </div>
              <p style={{ fontSize: 14, color: '#c8d0e0', lineHeight: 1.75, fontWeight: 500, whiteSpace: 'pre-line' }}>
                {analysis.aiAnalysis.reason}
              </p>
            </div>
          </div>

          {/* ── Technical Breakdown Cards ── */}
          <div className="ss-indicators-grid">

            {/* Candlestick Pattern */}
            <div className="ss-ind-card">
              <div className="ss-ind-header">
                <div className="ss-ind-title">
                  <Layers size={15} color="#00d4ff" /> Candlestick Pattern
                </div>
              </div>
              <div className="ss-ind-body">
                {analysis.detectedPatterns.map((pat, i) => (
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
                <span className="ss-ind-val-badge">{analysis.rsi.value} / 100</span>
              </div>
              <div className="ss-ind-body">
                <div className="ss-ind-row">
                  <span>Status:</span>
                  <strong>{analysis.rsi.status}</strong>
                </div>
                <div className="ss-ind-bar-track">
                  <div className={`ss-ind-bar-fill ${barColor(analysis.rsi.value)}`} style={{ width: `${analysis.rsi.value}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4a5568', marginBottom: 10, fontWeight: 700 }}>
                  <span>0 — Oversold</span><span>30</span><span>70</span><span>Overbought — 100</span>
                </div>
                <p className="ss-ind-desc">{analysis.rsi.explanation}</p>
              </div>
            </div>

            {/* MACD */}
            <div className="ss-ind-card">
              <div className="ss-ind-header">
                <div className="ss-ind-title">
                  <span className="ss-ind-dot" style={{ background: '#a78bfa' }} /> MACD (12,26,9)
                </div>
                <span className={`ss-badge ${analysis.macd.histogram >= 0 ? 'ss-badge-green' : 'ss-badge-red'}`}>
                  {analysis.macd.status}
                </span>
              </div>
              <div className="ss-ind-body">
                <div className="ss-ind-row"><span>MACD Line:</span><strong>{analysis.macd.macd}</strong></div>
                <div className="ss-ind-row"><span>Signal Line:</span><strong>{analysis.macd.signal}</strong></div>
                <div className="ss-ind-row"><span>Histogram:</span><strong style={{ color: analysis.macd.histogram >= 0 ? '#00ff88' : '#ff4757' }}>{analysis.macd.histogram >= 0 ? '+' : ''}{analysis.macd.histogram}</strong></div>
                <p className="ss-ind-desc" style={{ marginTop: 10 }}>{analysis.macd.explanation}</p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
