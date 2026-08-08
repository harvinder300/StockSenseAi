import React, { useState, useEffect, useCallback } from 'react';
import { getFullStockAnalysis } from '../services/stockDataService';
import StockSearchInput from '../components/StockSearchInput';
import FundamentalDashboard, { FundamentalSkeleton } from '../components/FundamentalDashboard';
import TechnicalEntrySection from '../components/TechnicalEntrySection';
import { Sparkles, ArrowUpRight, ArrowDownRight, Wifi, WifiOff, ShieldCheck, Award } from 'lucide-react';

const QUICK_PICKS = ['RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','TATAMOTORS.NS','BHARTIARTL.NS','ITC.NS','LT.NS','SBIN.NS','WIPRO.NS'];

export default function AnalyserPage({ selectedSymbol, onSymbolChange, geminiApiKey }) {
  const [symbol, setSymbol] = useState(selectedSymbol ? `${selectedSymbol}.NS` : 'RELIANCE.NS');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="fade-up">

      {/* ── Search Card ── */}
      <div className="ss-card" style={{ padding: '32px', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            <Award size={14} /> Long-Term Fundamental Engine
          </div>
          <h1 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            Fundamental <span style={{ color: '#00d4ff' }}>Stock Analyser</span>
          </h1>
          <p style={{ fontSize: 14, color: '#8892a4', maxWidth: 600, margin: '0 auto' }}>
            Built for Long-Term Investors — Evaluate 5 Pillars of Wealth: Valuation, Growth, Health, Profitability &amp; Dividends.
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

      {/* ── Loading Skeleton ── */}
      {loading && <FundamentalSkeleton />}

      {/* ── Full Long-Term Analysis ── */}
      {!loading && analysis && (
        <div className="ss-space-y">

          {/* Stock Header Banner */}
          <div className="ss-stock-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="ss-stock-banner-sym">{analysis.meta.symbol}</span>
                <span className="ss-badge ss-badge-blue">{analysis.meta.sector}</span>
                {analysis.meta.isLive
                  ? <span className="ss-badge ss-badge-green" style={{ display: 'inline-flex', gap: 5 }}><Wifi size={11} /> Live Fundamentals</span>
                  : <span className="ss-badge ss-badge-amber" style={{ display: 'inline-flex', gap: 5 }}><WifiOff size={11} /> Simulated Data</span>
                }
                {analysis.aiAnalysis.isGeminiLive && (
                  <span className="ss-badge ss-badge-blue" style={{ display: 'inline-flex', gap: 5 }}><Sparkles size={11} /> Gemini Long-Term AI</span>
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

          {/* ── PART 4: Fundamental Analysis Dashboard ── */}
          <FundamentalDashboard fundamentals={analysis.fundamentals} meta={analysis.meta} />

          {/* ── PART 5: Gemini AI Long-Term Advisory Card ── */}
          <div style={{
            background: 'rgba(0,212,255,0.04)',
            border: '2px solid rgba(0,212,255,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            marginTop: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff' }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {analysis.aiAnalysis.isGeminiLive ? '✦ Gemini AI Long-Term Investment Analysis' : '✦ Long-Term Investment Analysis'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  Long-Term Outlook: <span style={{ color: analysis.fundamentals?.overall?.color || '#00d4ff' }}>{analysis.fundamentals?.overall?.verdict}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <p style={{ fontSize: 14, color: '#c8d0e0', lineHeight: 1.75, fontWeight: 500, whiteSpace: 'pre-line' }}>
                {analysis.aiAnalysis.reason}
              </p>
            </div>
          </div>

          {/* ── PART 6: Technical Entry Timing Section (Chart + RSI/MACD) ── */}
          <TechnicalEntrySection analysis={analysis} />

        </div>
      )}

    </div>
  );
}
