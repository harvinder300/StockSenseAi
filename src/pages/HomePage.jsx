import React, { useState, useEffect } from 'react';
import { fetchWithProxy } from '../services/stockSearchService';
import MarketMoodGauge from '../components/MarketMoodGauge';
import { TrendingUp, TrendingDown, Activity, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

const DEFAULT_POPULAR = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy & Oil' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'IT Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecom' },
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'FMCG' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', sector: 'Automobile' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Construction' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT Services' },
];

export default function HomePage({ onSelectStock, onNavigate }) {
  const [indices, setIndices] = useState({
    nifty: { name: 'NIFTY 50', price: null, change: 0, pChange: 0, high: null, low: null },
    sensex: { name: 'SENSEX', price: null, change: 0, pChange: 0, high: null, low: null },
  });

  const [liveStocks, setLiveStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Live Nifty & Sensex indices from Yahoo Finance API
  useEffect(() => {
    let isMounted = true;

    async function loadLiveHomeData() {
      setLoading(true);
      try {
        // Fetch Nifty (^NSEI) and Sensex (^BSESN)
        const indicesUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5ENSEI,%5EBSESN&_=${Date.now()}`;
        const data = await fetchWithProxy(indicesUrl);
        const quotes = data?.quoteResponse?.result || [];

        const niftyQuote = quotes.find(q => q.symbol === '^NSEI');
        const sensexQuote = quotes.find(q => q.symbol === '^BSESN');

        if (isMounted && (niftyQuote || sensexQuote)) {
          setIndices({
            nifty: {
              name: 'NIFTY 50',
              price: niftyQuote?.regularMarketPrice || null,
              change: +(niftyQuote?.regularMarketChange || 0).toFixed(2),
              pChange: +(niftyQuote?.regularMarketChangePercent || 0).toFixed(2),
              high: niftyQuote?.regularMarketDayHigh || null,
              low: niftyQuote?.regularMarketDayLow || null,
            },
            sensex: {
              name: 'SENSEX',
              price: sensexQuote?.regularMarketPrice || null,
              change: +(sensexQuote?.regularMarketChange || 0).toFixed(2),
              pChange: +(sensexQuote?.regularMarketChangePercent || 0).toFixed(2),
              high: sensexQuote?.regularMarketDayHigh || null,
              low: sensexQuote?.regularMarketDayLow || null,
            }
          });
        }

        // Fetch Live quotes for Top Indian Stocks
        const symbolsParam = DEFAULT_POPULAR.map(s => `${s.symbol}.NS`).join(',');
        const stocksUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}&_=${Date.now()}`;
        const stockData = await fetchWithProxy(stocksUrl);
        const stockQuotes = stockData?.quoteResponse?.result || [];

        if (isMounted && stockQuotes.length > 0) {
          const parsed = stockQuotes.map(q => {
            const bareSym = q.symbol.replace(/\.NS$/, '');
            const local = DEFAULT_POPULAR.find(p => p.symbol === bareSym) || {};
            return {
              symbol: bareSym,
              name: q.shortName || q.longName || local.name || bareSym,
              sector: local.sector || 'NSE Equity',
              price: q.regularMarketPrice || 0,
              change: +(q.regularMarketChange || 0).toFixed(2),
              pChange: +(q.regularMarketChangePercent || 0).toFixed(2)
            };
          });

          setLiveStocks(parsed);
        }
      } catch (err) {
        console.warn('Home page live data fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLiveHomeData();
    return () => { isMounted = false; };
  }, []);

  // Calculate top gainers & losers dynamically from REAL live stocks
  const sortedStocks = [...liveStocks].sort((a, b) => b.pChange - a.pChange);
  const topGainers = sortedStocks.slice(0, 5);
  const topLosers  = sortedStocks.slice(-5).reverse();

  // Dynamic market mood score calculated from advances / declines
  const advances = liveStocks.filter(s => s.pChange > 0).length;
  const declines = liveStocks.filter(s => s.pChange < 0).length;
  const moodScore = liveStocks.length > 0 ? Math.round((advances / liveStocks.length) * 100) : 50;

  const marketMood = {
    verdict: moodScore >= 60 ? 'Bullish' : moodScore <= 40 ? 'Bearish' : 'Neutral',
    score: moodScore,
    description: moodScore >= 60
      ? `Strong market buying in major Indian equities (${advances}/${liveStocks.length} advancing).`
      : moodScore <= 40
      ? `Selling pressure observed across major sectors (${declines}/${liveStocks.length} declining).`
      : `Market trading in a rangebound sideways zone (${advances} advances / ${declines} declines).`,
    advances,
    declines,
    unchanged: liveStocks.length - (advances + declines)
  };

  const fmtPrice = (p) => typeof p === 'number' ? p.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'Loading…';

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
          NSE &amp; BSE Live API
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
              <div style={{ fontSize: 12, color: '#8892a4', marginTop: 4 }}>Connecting to Yahoo API…</div>
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

      {/* ── Real Live Gainers & Losers ── */}
      {liveStocks.length > 0 && (
        <div className="ss-movers-grid">

          {/* Gainers */}
          <div className="ss-movers-card">
            <div className="ss-movers-header">
              <div className="ss-movers-title">
                <span className="ss-movers-icon up"><TrendingUp size={16} /></span>
                Top Gaining Stocks (Live)
              </div>
              <span className="ss-badge ss-badge-green">Live API</span>
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
                Top Losing Stocks (Live)
              </div>
              <span className="ss-badge ss-badge-red">Live API</span>
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
      )}
    </div>
  );
}
