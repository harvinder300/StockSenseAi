/**
 * fundamentalScoring.js
 * Long-Term Fundamental Analysis Scoring Engine for StockSense AI
 * Evaluates 5 Pillars (20 pts each, Total 100): Valuation, Growth, Health, Profitability, Dividend
 */

// Helper to extract numeric values safely from Yahoo Finance objects (which look like { raw: 15.2, fmt: "15.20" } or numbers)
export function getVal(item) {
  if (item === null || item === undefined) return null;
  if (typeof item === 'number') return isNaN(item) ? null : item;
  if (typeof item === 'object' && item.raw !== undefined && item.raw !== null) {
    return typeof item.raw === 'number' && !isNaN(item.raw) ? item.raw : null;
  }
  return null;
}

// ── 1. VALUATION SCORE (20 points max) ─────────────────────
export const getValuationScore = (data = {}) => {
  let score = 0;
  const insights = [];

  const pe = getVal(data.trailingPE);
  const pb = getVal(data.priceToBook);
  const peg = getVal(data.pegRatio);

  // P/E Ratio (8 pts)
  if (pe !== null && pe > 0) {
    if (pe < 15) {
      score += 8;
      insights.push(`✅ P/E ${pe.toFixed(1)}x (below 15) — Undervalued`);
    } else if (pe < 25) {
      score += 6;
      insights.push(`✅ P/E ${pe.toFixed(1)}x (15-25) — Fairly valued`);
    } else if (pe < 40) {
      score += 3;
      insights.push(`⚠️ P/E ${pe.toFixed(1)}x (25-40) — Slightly expensive`);
    } else {
      score += 0;
      insights.push(`🔴 P/E ${pe.toFixed(1)}x (above 40) — High valuation`);
    }
  } else {
    insights.push('ℹ️ P/E ratio unavailable');
  }

  // P/B Ratio (6 pts)
  if (pb !== null && pb > 0) {
    if (pb < 1) {
      score += 6;
      insights.push(`✅ P/B ${pb.toFixed(1)}x (below 1) — Trading below book value`);
    } else if (pb < 3) {
      score += 4;
      insights.push(`✅ P/B ${pb.toFixed(1)}x — Reasonable price to book`);
    } else if (pb < 6) {
      score += 2;
      insights.push(`⚠️ P/B ${pb.toFixed(1)}x — Premium valuation`);
    } else {
      score += 0;
      insights.push(`🔴 P/B ${pb.toFixed(1)}x — Overvalued book risk`);
    }
  } else {
    insights.push('ℹ️ P/B ratio unavailable');
  }

  // PEG Ratio (6 pts)
  if (peg !== null && peg > 0) {
    if (peg < 1) {
      score += 6;
      insights.push(`✅ PEG ${peg.toFixed(2)} (below 1) — Growth at a discount`);
    } else if (peg < 2) {
      score += 3;
      insights.push(`✅ PEG ${peg.toFixed(2)} — Reasonable growth valuation`);
    } else {
      score += 0;
      insights.push(`⚠️ PEG ${peg.toFixed(2)} — Future growth priced in`);
    }
  } else {
    insights.push('ℹ️ PEG ratio unavailable');
  }

  return { score: Math.min(20, score), insights, pe, pb, peg };
};

// ── 2. GROWTH SCORE (20 points max) ────────────────────────
export const getGrowthScore = (data = {}) => {
  let score = 0;
  const insights = [];

  const rawRev = getVal(data.revenueGrowth);
  const rawEps = getVal(data.earningsGrowth);
  const rawQ = getVal(data.earningsQuarterlyGrowth);

  // Revenue Growth YoY (7 pts)
  if (rawRev !== null) {
    const revGrowth = rawRev * 100;
    if (revGrowth > 20) {
      score += 7;
      insights.push(`✅ Revenue growing ${revGrowth.toFixed(1)}% YoY — Excellent`);
    } else if (revGrowth > 10) {
      score += 5;
      insights.push(`✅ Revenue growing ${revGrowth.toFixed(1)}% YoY — Good`);
    } else if (revGrowth > 0) {
      score += 2;
      insights.push(`⚠️ Revenue growing ${revGrowth.toFixed(1)}% YoY — Slow`);
    } else {
      score += 0;
      insights.push(`🔴 Revenue declining ${revGrowth.toFixed(1)}% YoY`);
    }
  } else {
    insights.push('ℹ️ Revenue growth data unavailable');
  }

  // Earnings Growth YoY (7 pts)
  if (rawEps !== null) {
    const epsGrowth = rawEps * 100;
    if (epsGrowth > 20) {
      score += 7;
      insights.push(`✅ Earnings growing ${epsGrowth.toFixed(1)}% YoY — Strong`);
    } else if (epsGrowth > 10) {
      score += 5;
      insights.push(`✅ Earnings growing ${epsGrowth.toFixed(1)}% YoY — Good`);
    } else if (epsGrowth > 0) {
      score += 2;
      insights.push(`⚠️ Earnings growth slow ${epsGrowth.toFixed(1)}% YoY`);
    } else {
      score += 0;
      insights.push(`🔴 Earnings declining ${epsGrowth.toFixed(1)}% YoY`);
    }
  } else {
    insights.push('ℹ️ Earnings growth data unavailable');
  }

  // Quarterly Earnings Growth (6 pts)
  if (rawQ !== null) {
    const qGrowth = rawQ * 100;
    if (qGrowth > 15) {
      score += 6;
      insights.push(`✅ Strong quarterly momentum (+${qGrowth.toFixed(1)}%)`);
    } else if (qGrowth > 0) {
      score += 3;
      insights.push(`✅ Positive quarterly growth (+${qGrowth.toFixed(1)}%)`);
    } else {
      score += 0;
      insights.push(`🔴 Quarterly earnings weak (${qGrowth.toFixed(1)}%)`);
    }
  } else {
    insights.push('ℹ️ Quarterly momentum data unavailable');
  }

  return {
    score: Math.min(20, score),
    insights,
    revenueGrowthPct: rawRev !== null ? rawRev * 100 : null,
    earningsGrowthPct: rawEps !== null ? rawEps * 100 : null,
    quarterlyGrowthPct: rawQ !== null ? rawQ * 100 : null
  };
};

// ── 3. FINANCIAL HEALTH SCORE (20 points max) ──────────────
export const getHealthScore = (data = {}) => {
  let score = 0;
  const insights = [];

  const rawDe = getVal(data.debtToEquity);
  const cr = getVal(data.currentRatio);
  const fcf = getVal(data.freeCashflow);

  // Debt to Equity (8 pts) — Note: Yahoo returns D/E as percentage e.g. 32.5 = 0.325 ratio
  if (rawDe !== null) {
    const de = rawDe > 10 ? rawDe / 100 : rawDe; // convert % to ratio if > 10
    if (de < 0.3) {
      score += 8;
      insights.push(`✅ Very low debt (${de.toFixed(2)} D/E) — Financially strong`);
    } else if (de < 0.7) {
      score += 6;
      insights.push(`✅ Manageable debt level (${de.toFixed(2)} D/E)`);
    } else if (de < 1.5) {
      score += 3;
      insights.push(`⚠️ Moderate debt (${de.toFixed(2)} D/E) — Watch interest costs`);
    } else {
      score += 0;
      insights.push(`🔴 High debt (${de.toFixed(2)} D/E) — Risky for long term`);
    }
  } else {
    insights.push('ℹ️ Debt to Equity ratio unavailable');
  }

  // Current Ratio (6 pts)
  if (cr !== null && cr > 0) {
    if (cr > 2.0) {
      score += 6;
      insights.push(`✅ Current ratio ${cr.toFixed(2)} — Strong liquidity`);
    } else if (cr > 1.5) {
      score += 4;
      insights.push(`✅ Current ratio ${cr.toFixed(2)} — Good liquidity`);
    } else if (cr > 1.0) {
      score += 2;
      insights.push(`⚠️ Current ratio ${cr.toFixed(2)} — Adequate liquidity`);
    } else {
      score += 0;
      insights.push(`🔴 Current ratio ${cr.toFixed(2)} — Liquidity concern`);
    }
  } else {
    insights.push('ℹ️ Current ratio unavailable');
  }

  // Free Cash Flow (6 pts)
  if (fcf !== null) {
    if (fcf > 0) {
      score += 6;
      insights.push('✅ Positive free cash flow');
    } else {
      score += 0;
      insights.push('🔴 Negative free cash flow — Cash burn concern');
    }
  } else {
    insights.push('ℹ️ Free cash flow data unavailable');
  }

  return {
    score: Math.min(20, score),
    insights,
    debtToEquity: rawDe !== null ? (rawDe > 10 ? rawDe / 100 : rawDe) : null,
    currentRatio: cr,
    freeCashflow: fcf
  };
};

// ── 4. PROFITABILITY SCORE (20 points max) ─────────────────
export const getProfitabilityScore = (data = {}) => {
  let score = 0;
  const insights = [];

  const rawRoe = getVal(data.returnOnEquity);
  const rawNpm = getVal(data.profitMargins);
  const rawOm = getVal(data.operatingMargins);

  // Return on Equity (7 pts)
  if (rawRoe !== null) {
    const roe = rawRoe * 100;
    if (roe > 20) {
      score += 7;
      insights.push(`✅ ROE ${roe.toFixed(1)}% — Excellent capital efficiency`);
    } else if (roe > 15) {
      score += 5;
      insights.push(`✅ ROE ${roe.toFixed(1)}% — Good returns`);
    } else if (roe > 10) {
      score += 3;
      insights.push(`⚠️ ROE ${roe.toFixed(1)}% — Average returns`);
    } else {
      score += 0;
      insights.push(`🔴 ROE ${roe.toFixed(1)}% — Low returns`);
    }
  } else {
    insights.push('ℹ️ ROE data unavailable');
  }

  // Net Profit Margin (7 pts)
  if (rawNpm !== null) {
    const npm = rawNpm * 100;
    if (npm > 20) {
      score += 7;
      insights.push(`✅ Net margin ${npm.toFixed(1)}% — Excellent profitability`);
    } else if (npm > 10) {
      score += 5;
      insights.push(`✅ Net margin ${npm.toFixed(1)}% — Good profitability`);
    } else if (npm > 5) {
      score += 2;
      insights.push(`⚠️ Net margin ${npm.toFixed(1)}% — Thin margin`);
    } else {
      score += 0;
      insights.push(`🔴 Net margin ${npm.toFixed(1)}% — Very thin margin`);
    }
  } else {
    insights.push('ℹ️ Net margin data unavailable');
  }

  // Operating Margin (6 pts)
  if (rawOm !== null) {
    const om = rawOm * 100;
    if (om > 20) {
      score += 6;
      insights.push(`✅ Operating margin ${om.toFixed(1)}% — Strong operations`);
    } else if (om > 10) {
      score += 4;
      insights.push(`✅ Operating margin ${om.toFixed(1)}% — Decent operations`);
    } else {
      score += 0;
      insights.push(`⚠️ Operating margin ${om.toFixed(1)}% — Low operating margin`);
    }
  } else {
    insights.push('ℹ️ Operating margin data unavailable');
  }

  return {
    score: Math.min(20, score),
    insights,
    roePct: rawRoe !== null ? rawRoe * 100 : null,
    netMarginPct: rawNpm !== null ? rawNpm * 100 : null,
    operatingMarginPct: rawOm !== null ? rawOm * 100 : null
  };
};

// ── 5. DIVIDEND SCORE (20 points max) ──────────────────────
export const getDividendScore = (data = {}) => {
  let score = 0;
  const insights = [];

  const rawYield = getVal(data.dividendYield);
  const rawPayout = getVal(data.payoutRatio);
  const fiveYrYield = getVal(data.fiveYearAvgDividendYield);

  // Dividend Yield (8 pts)
  if (rawYield !== null && rawYield > 0) {
    const yield_ = rawYield * 100;
    if (yield_ > 3) {
      score += 8;
      insights.push(`✅ Dividend yield ${yield_.toFixed(1)}% — Good passive income`);
    } else if (yield_ > 1) {
      score += 5;
      insights.push(`✅ Dividend yield ${yield_.toFixed(1)}% — Moderate dividend`);
    } else {
      score += 2;
      insights.push(`⚠️ Low dividend yield ${yield_.toFixed(1)}%`);
    }
  } else {
    insights.push('ℹ️ No dividend — Growth focused company');
  }

  // Payout Ratio (6 pts)
  if (rawPayout !== null && rawPayout > 0) {
    const payout = rawPayout * 100;
    if (payout < 50) {
      score += 6;
      insights.push(`✅ Sustainable dividend payout ratio (${payout.toFixed(1)}%)`);
    } else if (payout < 75) {
      score += 3;
      insights.push(`⚠️ High payout ratio (${payout.toFixed(1)}%) — monitor cash`);
    } else {
      score += 0;
      insights.push(`🔴 Very high payout ratio (${payout.toFixed(1)}%) — risk`);
    }
  }

  // 5 Year Consistency (6 pts)
  if (fiveYrYield !== null && fiveYrYield > 0) {
    if (fiveYrYield > 2) {
      score += 6;
      insights.push(`✅ Consistent dividend history (${fiveYrYield.toFixed(1)}% 5yr avg)`);
    } else {
      score += 3;
      insights.push(`✅ Some 5-year dividend history (${fiveYrYield.toFixed(1)}% avg)`);
    }
  }

  return {
    score: Math.min(20, score),
    insights,
    divYieldPct: rawYield !== null ? rawYield * 100 : null,
    payoutRatioPct: rawPayout !== null ? rawPayout * 100 : null,
    fiveYrAvgYield: fiveYrYield
  };
};

// ── OVERALL LONG TERM SCORE ────────────────────────────────
export const getLongTermScore = (valuation, growth, health, profit, dividend) => {
  const total = (valuation?.score || 0) + (growth?.score || 0) + (health?.score || 0) + (profit?.score || 0) + (dividend?.score || 0);

  let verdict, color, emoji, strategy;

  if (total >= 80) {
    verdict = 'Excellent Long Term Buy';
    color = '#00ff88';
    emoji = '💎';
    strategy = 'Invest full amount in 2-3 parts over 3 months';
  } else if (total >= 65) {
    verdict = 'Good Long Term Buy';
    color = '#00d4ff';
    emoji = '✅';
    strategy = 'Start SIP — invest monthly in small amounts';
  } else if (total >= 50) {
    verdict = 'Average — Invest Carefully';
    color = '#ffd700';
    emoji = '⚖️';
    strategy = 'Invest only 5-10% of portfolio. Monitor quarterly results';
  } else if (total >= 35) {
    verdict = 'Weak — Avoid for Long Term';
    color = '#ff9f43';
    emoji = '⚠️';
    strategy = 'Wait for fundamentals to improve. Check next 2 quarters';
  } else {
    verdict = 'Poor — Do Not Invest';
    color = '#ff4757';
    emoji = '❌';
    strategy = 'Fundamentals are weak. High risk for long term holding';
  }

  return { total, verdict, color, emoji, strategy };
};
