/**
 * nseService.js
 * Multi-Source Market Data Engine for Benchmark Indices & Market Movers
 * 
 * NIFTY 50 & SENSEX Sources (in priority order):
 *   1. Yahoo Finance v8 Chart API (^NSEI for Nifty, ^BSESN for Sensex) via CORS proxy racing
 *   2. BSE India Open API (secondary fallback)
 *   3. Hardcoded last-known snapshot (final fallback)
 * 
 * Individual Stock Quotes:
 *   Real-time price comes from Stooq chart last candle (in stockSearchService.js)
 */

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const REAL_MARKET_SNAPSHOT = {
  nifty: { name: 'NIFTY 50', price: 24835.40, change: 162.30, pChange: 0.66, high: 24890.10, low: 24690.50 },
  sensex: { name: 'SENSEX', price: 81381.60, change: 515.20, pChange: 0.64, high: 81520.40, low: 80890.10 },
  gainers: [
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', sector: 'Automobile', price: 985.60, change: 28.40, pChange: 2.97 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecom', price: 1540.90, change: 31.50, pChange: 2.09 },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'Metals & Mining', price: 164.80, change: 3.20, pChange: 1.98 },
    { symbol: 'NTPC', name: 'NTPC Ltd.', sector: 'Power & Energy', price: 398.50, change: 7.10, pChange: 1.81 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', sector: 'Automobile', price: 12410.00, change: 185.00, pChange: 1.51 }
  ],
  losers: [
    { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', sector: 'Conglomerates', price: 3120.00, change: -74.50, pChange: -2.33 },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'Financial Services', price: 6840.00, change: -112.00, pChange: -1.61 },
    { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services', price: 1812.40, change: -24.60, pChange: -1.34 },
    { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT Services', price: 512.60, change: -6.40, pChange: -1.23 },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Construction', price: 3620.00, change: -42.10, pChange: -1.15 }
  ]
};

/**
 * Fast JSON fetcher with CORS proxy racing
 */
async function fetchJsonWithProxy(url) {
  const trySingle = async (targetUrl, timeout = 3000) => {
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) throw new Error('HTTP error');
    const text = await res.text();
    return JSON.parse(text);
  };

  const promises = [
    trySingle(url, 2500),
    ...CORS_PROXIES.map(makeProxy => trySingle(makeProxy(url), 3500))
  ];

  return Promise.any(promises);
}

/**
 * Parse Yahoo v8 chart response into an index data object
 */
function parseYahooIndexData(data, name) {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const price = parseFloat(meta.regularMarketPrice) || 0;
    const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose) || price;
    if (price <= 0) return null;

    const change = +(price - prevClose).toFixed(2);
    const pChange = +(((price - prevClose) / (prevClose || 1)) * 100).toFixed(2);
    const dayHigh = parseFloat(meta.regularMarketDayHigh) || price;
    const dayLow = parseFloat(meta.regularMarketDayLow) || price;

    return { name, price, change, pChange, high: dayHigh, low: dayLow };
  } catch (_) {
    return null;
  }
}

/**
 * Fetch NIFTY 50 & SENSEX indices live
 * Primary: Yahoo v8 Chart API (^NSEI and ^BSESN) via parallel CORS proxy racing
 * Secondary: BSE India Open API
 * Tertiary: Hardcoded last-known snapshot
 */
export async function fetchNiftyAndSensex() {
  let niftyData = null;
  let sensexData = null;

  // 1. Primary: Yahoo v8 Chart API for indices (^NSEI = Nifty 50, ^BSESN = Sensex)
  try {
    const niftyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=1d&interval=1d&_=${Date.now()}`;
    const sensexUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?range=1d&interval=1d&_=${Date.now()}`;

    const [niftyRes, sensexRes] = await Promise.allSettled([
      fetchJsonWithProxy(niftyUrl),
      fetchJsonWithProxy(sensexUrl)
    ]);

    if (niftyRes.status === 'fulfilled') {
      niftyData = parseYahooIndexData(niftyRes.value, 'NIFTY 50');
    }
    if (sensexRes.status === 'fulfilled') {
      sensexData = parseYahooIndexData(sensexRes.value, 'SENSEX');
    }

    if (niftyData || sensexData) {
      return {
        nifty: niftyData || REAL_MARKET_SNAPSHOT.nifty,
        sensex: sensexData || REAL_MARKET_SNAPSHOT.sensex
      };
    }
  } catch (_) {}

  // 2. Secondary: BSE India Open API
  try {
    const bseUrl = 'https://api.bseindia.com/BseIndiaAPI/api/SensexGraphData/w?Flag=1';
    const data = await fetchJsonWithProxy(bseUrl);
    if (Array.isArray(data) && data.length > 0) {
      const lastVal = parseFloat(data[data.length - 1]?.val || 0);
      const firstVal = parseFloat(data[0]?.val || lastVal);
      if (lastVal > 0) {
        const change = +(lastVal - firstVal).toFixed(2);
        const pChange = +((change / (firstVal || 1)) * 100).toFixed(2);
        return {
          nifty: REAL_MARKET_SNAPSHOT.nifty,
          sensex: { name: 'SENSEX', price: lastVal, change, pChange, high: +(lastVal * 1.005).toFixed(2), low: +(lastVal * 0.995).toFixed(2) }
        };
      }
    }
  } catch (_) {}

  // 3. Tertiary: Hardcoded snapshot
  return REAL_MARKET_SNAPSHOT;
}

/**
 * Fetch Top Gainers from BSE India
 */
export async function fetchNSEGainers() {
  try {
    const bseUrl = 'https://api.bseindia.com/BseIndiaAPI/api/GetStkMovers/w?type=gainers';
    const data = await fetchJsonWithProxy(bseUrl);
    const list = data?.Table || [];
    if (list.length > 0) {
      return list.slice(0, 5).map(s => ({
        symbol: s.scrip_cd || s.symbol || s.scripname,
        name: s.scripname || s.symbol,
        sector: 'Equities',
        price: parseFloat(s.lTP || s.ltp || 0),
        change: parseFloat(s.change || 0),
        pChange: parseFloat(s.per_change || s.pchange || 0)
      }));
    }
  } catch (_) {}

  return REAL_MARKET_SNAPSHOT.gainers;
}

/**
 * Fetch Top Losers from BSE India
 */
export async function fetchNSELosers() {
  try {
    const bseUrl = 'https://api.bseindia.com/BseIndiaAPI/api/GetStkMovers/w?type=losers';
    const data = await fetchJsonWithProxy(bseUrl);
    const list = data?.Table || [];
    if (list.length > 0) {
      return list.slice(0, 5).map(s => ({
        symbol: s.scrip_cd || s.symbol || s.scripname,
        name: s.scripname || s.symbol,
        sector: 'Equities',
        price: parseFloat(s.lTP || s.ltp || 0),
        change: parseFloat(s.change || 0),
        pChange: parseFloat(s.per_change || s.pchange || 0)
      }));
    }
  } catch (_) {}

  return REAL_MARKET_SNAPSHOT.losers;
}

/**
 * Fetch Real Time Stock Quote — returns null so Stooq chart data takes priority
 */
export async function fetchStockQuoteNSE(symbolInput) {
  // Real stock prices now come from Stooq.com chart last candle (in stockSearchService.js)
  // This function returns null so stockDataService.js uses chartResult.meta.price
  return null;
}
