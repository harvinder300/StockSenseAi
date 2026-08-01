import React from 'react';
import { INDICES_DATA, MARKET_MOOD, POPULAR_STOCKS } from '../data/indianStocks';
import MarketMoodGauge from '../components/MarketMoodGauge';
import { TrendingUp, TrendingDown, Activity, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage({ onSelectStock, onNavigate }) {
  const sortedStocks = [...POPULAR_STOCKS].sort((a, b) => b.pChange - a.pChange);
  const topGainers = sortedStocks.slice(0, 5);
  const topLosers  = sortedStocks.slice(-5).reverse();

  const fmtPrice = (p) => p.toLocaleString('en-IN', { maximumFractionDigits: 2 });

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
          NSE Live
        </div>
      </div>

      <div className="ss-index-grid">
        {[INDICES_DATA.nifty, INDICES_DATA.sensex].map((idx) => (
          <div key={idx.name} className="ss-index-card">
            <div className="ss-index-label">{idx.name === INDICES_DATA.nifty.name ? 'Benchmark Index' : 'BSE Benchmark'}</div>
            <div className="ss-index-name">{idx.name}</div>
            <div className="ss-index-price">₹{fmtPrice(idx.price)}</div>
            <div className={`ss-index-change ${idx.change >= 0 ? 'up' : 'down'}`}>
              {idx.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {idx.change >= 0 ? '+' : ''}{idx.change} ({idx.pChange}%)
            </div>
            <div className="ss-index-meta">
              <span>Day High: <strong>₹{fmtPrice(idx.high)}</strong></span>
              <span>Day Low: <strong>₹{fmtPrice(idx.low)}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Market Mood ── */}
      <MarketMoodGauge mood={MARKET_MOOD} />

      {/* ── Gainers & Losers ── */}
      <div className="ss-movers-grid">

        {/* Gainers */}
        <div className="ss-movers-card">
          <div className="ss-movers-header">
            <div className="ss-movers-title">
              <span className="ss-movers-icon up"><TrendingUp size={16} /></span>
              Top 5 Gaining Stocks
            </div>
            <span className="ss-badge ss-badge-green">Today's Leaders</span>
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
                <div className="ss-stock-price">₹{s.price.toFixed(2)}</div>
                <div className="ss-stock-pct up">+{s.pChange}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Losers */}
        <div className="ss-movers-card">
          <div className="ss-movers-header">
            <div className="ss-movers-title">
              <span className="ss-movers-icon down"><TrendingDown size={16} /></span>
              Top 5 Losing Stocks
            </div>
            <span className="ss-badge ss-badge-red">Today's Laggards</span>
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
                <div className="ss-stock-price">₹{s.price.toFixed(2)}</div>
                <div className="ss-stock-pct down">{s.pChange}%</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
