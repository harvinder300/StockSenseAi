import React, { useState, useEffect } from 'react';
import { fetchNiftyAndSensex, fetchNSEGainers, fetchNSELosers } from '../services/nseService';
import MarketMoodGauge from '../components/MarketMoodGauge';
import { TrendingUp, TrendingDown, Activity, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

export default function HomePage({ onSelectStock, onNavigate }) {
  const [indices, setIndices] = useState({
    nifty: { name: 'NIFTY 50', price: null, change: 0, pChange: 0, high: null, low: null },
    sensex: { name: 'SENSEX', price: null, change: 0, pChange: 0, high: null, low: null },
  });

  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Live Nifty, Sensex, Gainers & Losers from NSE Direct API
  useEffect(() => {
    let isMounted = true;

    async function loadLiveHomeData() {
      setLoading(true);
      try {
        const [indicesData, gainersData, losersData] = await Promise.all([
          fetchNiftyAndSensex(),
          fetchNSEGainers(),
          fetchNSELosers()
        ]);

        if (isMounted) {
          if (indicesData.nifty || indicesData.sensex) {
            setIndices({
              nifty: indicesData.nifty || { name: 'NIFTY 50', price: null, change: 0, pChange: 0, high: null, low: null },
              sensex: indicesData.sensex || { name: 'SENSEX', price: null, change: 0, pChange: 0, high: null, low: null }
            });
          }

          if (gainersData && gainersData.length > 0) setTopGainers(gainersData);
          if (losersData && losersData.length > 0) setTopLosers(losersData);
        }
      } catch (err) {
        console.warn('Home page NSE fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLiveHomeData();
    return () => { isMounted = false; };
  }, []);

  // Dynamic market mood score calculated from advances / declines
  const totalMovers = topGainers.length + topLosers.length;
  const advances = topGainers.length;
  const declines = topLosers.length;
  const moodScore = totalMovers > 0 ? Math.round((advances / totalMovers) * 100) : 50;

  const marketMood = {
    verdict: moodScore >= 60 ? 'Bullish' : moodScore <= 40 ? 'Bearish' : 'Neutral',
    score: moodScore,
    description: moodScore >= 60
      ? `Strong market buying in major Indian equities (${advances} gaining / ${declines} losing).`
      : moodScore <= 40
      ? `Selling pressure observed across major sectors (${declines} losing / ${advances} gaining).`
      : `Market trading in a rangebound sideways zone (${advances} advances / ${declines} declines).`,
    advances,
    declines,
    unchanged: 0
  };

  const fmtPrice = (p) => typeof p === 'number' && p > 0 ? p.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'Loading…';

  return (
    <div className="fade-up">

      {/* ── Hero ── */}
      <div className="ss-hero">
        <div className="ss-hero-badge">
          <Sparkles size={12} /> Powered by Google Gemini AI
        </div>
        <h1>
          Institutional Market Insights for<br />
          <span className="grad">Indian Retail Investors</span>
        </h1>
        <p>
          Real-time 3-month TradingView candlestick charts, automated RSI &amp; MACD breakdowns,
          and Gemini AI trading signals — all in plain English.
        </p>
        <div className="ss-hero-btns">
          <button className="ss-btn-primary" onClick={() => onNavigate('analyser')}>
            Analyze Any Stock <ArrowRight size={16} />
          </button>
          <button className="ss-btn-secondary" onClick={() => onNavigate('learn')}>
            Learn 10 Patterns
          </button>
        </div>
      </div>

      {/* ── Indices ── */}
      <div className="ss-section-head">
        <div className="ss-section-title">
          <Activity size={20} /> Live Benchmark Indices
        </div>
        <div className="ss-live-dot">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          NSE Direct API Live
        </div>
      </div>

      <div className="ss-index-grid">
        {[indices.nifty, indices.sensex].map((idx) => (
          <div key={idx.name} className="ss-index-card">
            <div className="ss-index-label">{idx.name === 'NIFTY 50' ? 'Benchmark Index (NSE)' : 'Benchmark Index (BSE)'}</div>
            <div className="ss-index-name">{idx.name}</div>
            <div className="ss-index-price">₹{fmtPrice(idx.price)}</div>
            {idx.price !== null ? (
              <div className={`ss-index-change ${idx.change >= 0 ? 'up' : 'down'}`}>
                {idx.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {idx.change >= 0 ? '+' : ''}{idx.change} ({idx.pChange}%)
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#8892a4', marginTop: 4 }}>Connecting to NSE API…</div>
            )}
            <div className="ss-index-meta">
              <span>Day High: <strong>{idx.high ? `₹${fmtPrice(idx.high)}` : '—'}</strong></span>
              <span>Day Low: <strong>{idx.low ? `₹${fmtPrice(idx.low)}` : '—'}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Dynamic Market Mood Gauge ── */}
      <MarketMoodGauge mood={marketMood} />

      {/* ── Real Live Gainers & Losers from NSE Direct API ── */}
      <div className="ss-movers-grid">

        {/* Gainers */}
        <div className="ss-movers-card">
          <div className="ss-movers-header">
            <div className="ss-movers-title">
              <span className="ss-movers-icon up"><TrendingUp size={16} /></span>
              Top 5 Gaining Stocks (NSE Direct)
            </div>
            <span className="ss-badge ss-badge-green">NSE Live</span>
          </div>
          {topGainers.map((s) => (
            <div key={s.symbol} className="ss-stock-row" onClick={() => onSelectStock(s.symbol)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="ss-stock-sym">{s.symbol}</span>
                  <span className="ss-stock-sect">{s.sector}</span>
                </div>
                <div className="ss-stock-name">{s.name}</div>
              </div>
              <div>
                <div className="ss-stock-price">₹{typeof s.price === 'number' ? s.price.toFixed(2) : s.price}</div>
                <div className="ss-stock-pct up">+{s.pChange}%</div>
              </div>
            </div>
          ))}
          {topGainers.length === 0 && (
            <div style={{ fontSize: 13, color: '#8892a4', padding: 16 }}>Market closed or fetching NSE data…</div>
          )}
        </div>

        {/* Losers */}
        <div className="ss-movers-card">
          <div className="ss-movers-header">
            <div className="ss-movers-title">
              <span className="ss-movers-icon down"><TrendingDown size={16} /></span>
              Top 5 Losing Stocks (NSE Direct)
            </div>
            <span className="ss-badge ss-badge-red">NSE Live</span>
          </div>
          {topLosers.map((s) => (
            <div key={s.symbol} className="ss-stock-row" onClick={() => onSelectStock(s.symbol)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="ss-stock-sym">{s.symbol}</span>
                  <span className="ss-stock-sect">{s.sector}</span>
                </div>
                <div className="ss-stock-name">{s.name}</div>
              </div>
              <div>
                <div className="ss-stock-price">₹{typeof s.price === 'number' ? s.price.toFixed(2) : s.price}</div>
                <div className="ss-stock-pct down">{s.pChange}%</div>
              </div>
            </div>
          ))}
          {topLosers.length === 0 && (
            <div style={{ fontSize: 13, color: '#8892a4', padding: 16 }}>Market closed or fetching NSE data…</div>
          )}
        </div>

      </div>
    </div>
  );
}
