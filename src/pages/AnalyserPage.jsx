import React, { useState, useEffect, useCallback } from 'react';
import { getFullStockAnalysis } from '../services/stockDataService';
import StockSearchInput from '../components/StockSearchInput';
import FundamentalDashboard, { FundamentalSkeleton } from '../components/FundamentalDashboard';
import TechnicalEntrySection from '../components/TechnicalEntrySection';
import { NotFoundState } from '../components/ErrorStateCard';
import { Sparkles, ArrowUpRight, ArrowDownRight, Wifi, Award, AlertTriangle } from 'lucide-react';

const QUICK_PICKS = ['RELIANCE','TCS','HDFCBANK','INFY','TATAMOTORS','BHARTIARTL','ITC','LT','SBIN','WIPRO'];

export default function AnalyserPage({ selectedSymbol, onSymbolChange, geminiApiKey }) {
  const [symbol, setSymbol] = useState(selectedSymbol ? selectedSymbol.replace(/\.(NS|BO)$/i, '') : 'RELIANCE');
  const [analysisRes, setAnalysisRes] = useState({ data: null, isLimitReached: false });
  const [loading, setLoading] = useState(true);

  const alphaKey = localStorage.getItem('alphavantage_api_key') || null;

  // Main analysis pipeline
  const runAnalysis = useCallback(async (sym) => {
    setLoading(true);
    setAnalysisRes({ data: null, isLimitReached: false });
    try {
      const result = await getFullStockAnalysis(sym, geminiApiKey, alphaKey);
      setAnalysisRes(result);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [geminiApiKey, alphaKey]);

  useEffect(() => { runAnalysis(symbol); }, [symbol]);

  // Called by StockSearchInput when user picks a stock
  const handleSelect = (sym) => {
    const bare = sym.replace(/\.(NS|BO)$/i, '');
    setSymbol(bare);
    onSymbolChange(bare);
  };

  const analysis = analysisRes?.data;
  const isLimitReached = analysisRes?.isLimitReached;

  return (
    <div className="fade-up">

      {/* ── Search Card ── */}
      <div className="ss-card" style={{ padding: '32px', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            <Award size={14} /> Stooq &amp; Twelve Data Engine (Unlimited Charts)
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
            placeholder="Type company name or NSE ticker e.g. RELIANCE, TCS, HDFCBANK, TATAMOTORS…"
            onSelect={handleSelect}
            defaultValue={symbol}
          />
        </div>

        {/* Quick pick chips */}
        <div className="ss-chip-row" style={{ justifyContent: 'center' }}>
          <span className="ss-chip-label">Quick:</span>
          {QUICK_PICKS.map(bare => (
            <button key={bare} className={`ss-chip${symbol === bare ? ' active' : ''}`} onClick={() => handleSelect(bare)}>
              {bare}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rate Limit Warning Notice ── */}
      {isLimitReached && (
        <div style={{ background: 'rgba(255,159,67,0.12)', border: '1px solid rgba(255,159,67,0.4)', borderRadius: 10, padding: '14px 20px', color: '#ff9f43', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Alpha Vantage Daily Limit Reached (25 stocks/day):</strong> Resets at midnight. NSE Real-Time Quote &amp; AI Analysis remain active! Enter your free Alpha Vantage key in Settings to increase limit.
          </span>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && <FundamentalSkeleton />}

      {/* ── Error / Not Found State ── */}
      {!loading && !analysis && (
        <NotFoundState symbol={symbol} onRetry={() => runAnalysis(symbol)} />
      )}

      {/* ── Full Long-Term Analysis ── */}
      {!loading && analysis && (
        <div className="ss-space-y">

          {/* Stock Header Banner */}
          <div className="ss-stock-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="ss-stock-banner-sym">{analysis.meta.symbol}</span>
                <span className="ss-badge ss-badge-blue">{analysis.meta.sector}</span>
                <span className="ss-badge ss-badge-green" style={{ display: 'inline-flex', gap: 5 }}><Wifi size={11} /> NSE Real-Time</span>
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
          {analysis.fundamentals && (
            <FundamentalDashboard fundamentals={analysis.fundamentals} meta={analysis.meta} />
          )}

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
                  Long-Term Outlook: <span style={{ color: analysis.fundamentals?.overall?.color || '#00d4ff' }}>{analysis.fundamentals?.overall?.verdict || 'Good Entry'}</span>
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
