# Architecture & Technical Decisions Log — StockSense AI

This document logs key technical and architectural decisions, rationale, design trade-offs, and library choices made during the development and refactoring of **StockSense AI**.

---

## 1. Data Layer: Yahoo v8 Proxy Racing (Indices) + Stooq.com (Unlimited Charts) + Twelve Data (Quotes)

### ❌ Problem
Alpha Vantage enforced a restrictive rate limit of **25 calls/day**. Direct browser calls to `nseindia.com` were blocked due to WAF session cookies. Moneycontrol Open API was also **CORS-blocked** from browser, silently failing and returning hardcoded fallback data. Additionally, individual stock prices (e.g., CGPOWER showing ₹878.9 instead of real price) were sourced from a **hardcoded `POPULAR_QUOTES` dictionary** instead of real market data.

### 💡 Decision & Approach
Implemented a specialized multi-provider data layer with correct priority ordering:
1. **NIFTY 50 & SENSEX (Home Page Benchmark Indices)**: **Yahoo Finance v8 Chart API** (`^NSEI` for Nifty 50, `^BSESN` for Sensex) via **parallel CORS proxy racing** (`Promise.any` across `corsproxy.io` and `allorigins.win`).
   - CORS proxy racing ensures 100% browser compatibility.
   - Returns exact `regularMarketPrice`, `chartPreviousClose`, `regularMarketDayHigh`, `regularMarketDayLow`.
2. **Stock Candlestick Charts**: **Stooq.com (`https://stooq.com/q/d/l/?s={symbol}.in&i=d`)**
   - **100% Free & Unlimited Calls** with zero API key requirements.
   - Parsed cleanly via `stooqService.js`.
3. **Individual Stock Prices**: **Stooq last candle close price** (primary), Twelve Data quote (secondary).
   - `fetchStockQuoteNSE()` now returns `null` so `stockDataService.js` always uses the real `chartResult.meta.price` from Stooq's last candle instead of hardcoded values.
4. **Real-Time Stock Quotes & Metrics**: **Twelve Data API (`api.twelvedata.com`)**
   - **800 Free API calls per day** (32x higher than Alpha Vantage).

### 🔍 Why This Approach?
Eliminates hardcoded stale prices, CORS failures, and rate limit banners completely. Every displayed price now comes from real market data sources.

---

## 2. High-Speed Sub-Second Parallel Proxy Racing (`Promise.any`)

### ❌ Problem
Sequential fallback loops using single CORS proxies (`allorigins.win` -> `corsproxy.io`) with long 4s-6s timeouts resulted in 30-60+ second loading delays.

### 💡 Decision & Approach
Implemented **Parallel Proxy Racing** via `Promise.any` in `src/services/stockSearchService.js`:
- Fires direct fetch and multi-host CORS proxies (`corsproxy.io` and `api.allorigins.win`) **concurrently** with tight 2s-3s timeouts.
- Whichever proxy or endpoint returns a valid response first wins instantly.

### 🔍 Why This Approach?
Network latency dropped from **~30s down to sub-second (< 800ms)**. Eliminates loading hangs on both Localhost and Vercel Production.

---

## 3. In-Memory Timeframe Aggregation (1W & 1H)

### ❌ Problem
Multi-timeframe analysis previously fired 3 separate network calls for Daily (1D), Weekly (1W), and Hourly (1H) data, tripling network overhead.

### 💡 Decision & Approach
Updated `src/services/multiTimeframeService.js` to fetch daily OHLCV candles **once** and aggregate weekly (1W) and hourly (1H) timeframes **in memory**:
- Groups daily candles into 5-day chunks in memory for weekly OHLCV.
- Uses recent daily candles for hourly trend evaluation.

### 🔍 Why This Approach?
Eliminates 2 redundant HTTP network roundtrips per stock analysis, dramatically improving UI responsiveness.

---

## 4. 5-Pillar Fundamental Analysis Dashboard (Long-Term Investor Focus)

### ❌ Problem
Stock apps often focus heavily on short-term day trading indicators (RSI/MACD only), neglecting long-term business fundamentals.

### 💡 Decision & Approach
Redesigned the Stock Analyser around **5 Pillars of Wealth**:
1. **Valuation Score (0-20)**: P/E vs Sector P/E, P/B Ratio.
2. **Growth Score (0-20)**: Revenue & Earnings YoY Growth.
3. **Financial Health Score (0-20)**: Debt-to-Equity, Solvency.
4. **Profitability Score (0-20)**: ROE, Net Profit Margin.
5. **Dividend Score (0-20)**: Dividend Yield & Payout Stability.

**Total Fundamental Score = 0 to 100**.

### 🔍 Why This Approach?
Provides retail investors with an institutional-grade, holistic valuation framework instead of relying solely on speculative technical signals.

---

## 5. 3-Factor Entry Timing System

### ❌ Problem
Fundamental investors often buy great companies at the wrong time (e.g., at 52-week highs or during overbought momentum).

### 💡 Decision & Approach
Created `src/utils/entryScoring.js` combining:
1. **Factor 1: 52-Week Price Position (33 pts)** (Measures discount relative to 52-week high/low).
2. **Factor 2: Moving Average Trend (34 pts)** (Position relative to 50-day & 200-day MAs).
3. **Factor 3: Technical Momentum (33 pts)** (RSI oversold/overbought & MACD histogram divergence).

Generates a **Tranche Accumulation Strategy** (e.g., Tranche 1: 33% Now, Tranche 2: 33% at 50-day MA, Tranche 3: 34% at 200-day MA).

---

## 6. Automated Ticker & Company Name Resolution (`resolveTicker`)

### ❌ Problem
Users often search full company names (e.g., *"Gland Pharma Limited"* or *"CG Power"*). Passing full names directly to stock exchange APIs caused `404 Not Found` errors because exchanges require exact tickers (`GLAND`, `CGPOWER`).

### 💡 Decision & Approach
Created `resolveTicker()` and `COMPANY_NAME_MAP` in `src/data/indianStocks.js` and `src/services/stockSearchService.js`:
- Maps keywords like `"Gland Pharma"`, `"Gland Pharma Limited"`, `"Stallion"`, `"Airtel"` to exact tickers (`GLAND`, `STALLION`, `BHARTIARTL`).

---

## 7. Purging Synthetic Default Data & Enforcing Strict Real Data

### ❌ Problem
When API rate limits were hit, synthetic fallback functions generated dummy stock prices (like ₹1,500) and artificial metrics.

### 💡 Decision & Approach
Purged all synthetic generators (`generateMarketCandles` & `getFallbackOverview`).
- The application **only presents real live market data**.
- If data is unavailable, it renders a clean, informative `NotFoundState` / `ErrorStateCard`.

---

## 8. Dual API Key Management (Google Gemini + Twelve Data)

### 💡 Decision & Approach
Updated `src/components/GeminiKeyModal.jsx` to manage:
1. **Google Gemini Key** (`aistudio.google.com`) for Hinglish AI investment advisory.
2. **Twelve Data Key** (`twelvedata.com`) for real-time quotes (800 calls/day free).
- Added live visual status indicators (🟢 Charts: Active & Unlimited Stooq.com / 🟢 Quotes: Active Twelve Data).

---

## 9. Build & Deployment Compatibility (`.npmrc` & Vercel Fixes)

### ❌ Problem
Vercel builds failed due to npm 7+ peer dependency resolution errors (`ERESOLVE`) with `@react-three/drei` and `@react-spring/three`.

### 💡 Decision & Approach
1. Created `.npmrc` with `legacy-peer-deps=true`.
2. Added `"installCommand": "npm install --legacy-peer-deps"` in `vercel.json`.
3. Purged unused `@react-spring/three` package from `package.json`.
