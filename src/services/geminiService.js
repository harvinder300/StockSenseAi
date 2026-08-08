/**
 * geminiService.js
 * Google Gemini API integration for Long Term Fundamental Analysis & Comparison
 */

const DEFAULT_KEY = '';
const GEMINI_MODEL = 'gemini-1.5-flash';

export async function analyzeFundamentalWithGemini({
  symbol,
  name,
  sector = 'Indian Market',
  price,
  fundamentals,
  geminiApiKey = null,
}) {
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const valuation = fundamentals?.valuation || { score: 10 };
  const growth = fundamentals?.growth || { score: 10 };
  const health = fundamentals?.health || { score: 10 };
  const profit = fundamentals?.profitability || { score: 10 };
  const dividend = fundamentals?.dividend || { score: 10 };
  const overall = fundamentals?.overall || { total: 50, verdict: 'Average' };
  const raw = fundamentals?.raw || {};

  const pe = raw.trailingPE ? raw.trailingPE.toFixed(1) : 'N/A';
  const pb = raw.priceToBook ? raw.priceToBook.toFixed(1) : 'N/A';
  const roe = raw.returnOnEquity ? (raw.returnOnEquity * 100).toFixed(1) : 'N/A';
  const margin = raw.profitMargins ? (raw.profitMargins * 100).toFixed(1) : 'N/A';
  const revGrowth = raw.revenueGrowth ? (raw.revenueGrowth * 100).toFixed(1) : 'N/A';
  const de = raw.debtToEquity ? (raw.debtToEquity > 10 ? raw.debtToEquity / 100 : raw.debtToEquity).toFixed(2) : 'N/A';
  const divYield = raw.dividendYield ? (raw.dividendYield * 100).toFixed(1) : '0.0';

  const allInsights = fundamentals?.allInsights || [];

  if (keyToUse) {
    try {
      const prompt = `You are an expert long term investment advisor for Indian retail investors.

Stock: ${name} (${symbol})
Sector: ${sector}
Current Price: ₹${price}

FUNDAMENTAL SCORES:
Valuation: ${valuation.score}/20
Growth: ${growth.score}/20
Financial Health: ${health.score}/20
Profitability: ${profit.score}/20
Dividend: ${dividend.score}/20
TOTAL: ${overall.total}/100 — ${overall.verdict}

KEY METRICS:
P/E: ${pe} | P/B: ${pb}
ROE: ${roe}% | Net Margin: ${margin}%
Revenue Growth: ${revGrowth}%
Debt/Equity: ${de}
Dividend Yield: ${divYield}%

KEY INSIGHTS FROM SCORING:
${allInsights.slice(0, 10).join('\n')}

Write a 5-6 line analysis in simple Hinglish (Hindi + English mix) covering:
1. Company ki overall financial health kaisi hai — simple words mein
2. Kya yeh stock long term ke liye suitable hai aur kyun
3. Kya risk hai is investment mein
4. Investment strategy kya honi chahiye — ek baar mein invest karein ya SIP karein
5. Kaunsa number/metric sabse impressive ya concerning lag raha hai

Tone: Knowledgeable dost ki tarah baat karo — na bahut technical, na bahut simple.
Score ${overall.total}/100 zaroor mention karo.
End with: ⚠️ SEBI registered advisor se salah zaroor lein bade investments se pehle.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${keyToUse}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          isGeminiLive: true,
          verdict: overall.verdict,
          reason: rawText,
          rawGeminiText: rawText,
        };
      } else {
        console.warn('AI analysis: API returned non-OK status');
      }
    } catch (err) {
      console.warn('AI analysis: service unavailable, using fallback');
    }
  }

  // Fallback
  const fallbackText = `Stock: ${name} (${symbol}) — Overall Long Term Score: ${overall.total}/100 (${overall.verdict}).
Company ki overall financial health ${overall.total >= 65 ? 'kaafi solid aur healthy lag rahi hai.' : 'average hai, cautious rehna zaroori hai.'}
P/E: ${pe}, ROE: ${roe}%, Net Margin: ${margin}%, Debt/Equity: ${de}.
Strategy: ${overall.strategy}. Always diversify across 10-15 stocks.

⚠️ SEBI registered advisor se salah zaroor lein bade investments se pehle.`;

  return {
    isGeminiLive: false,
    verdict: overall.verdict,
    reason: fallbackText,
    rawGeminiText: fallbackText,
  };
}

export async function compareStocksWithGemini({ stockA, stockB, geminiApiKey = null }) {
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const scoreA = stockA.fundamentals?.overall?.total ?? stockA.score ?? 50;
  const scoreB = stockB.fundamentals?.overall?.total ?? stockB.score ?? 50;

  const nameA = stockA.name || stockA.symbol;
  const nameB = stockB.name || stockB.symbol;

  const fA = stockA.fundamentals?.raw || {};
  const fB = stockB.fundamentals?.raw || {};

  const peA = fA.trailingPE ? fA.trailingPE.toFixed(1) : 'N/A';
  const peB = fB.trailingPE ? fB.trailingPE.toFixed(1) : 'N/A';

  const roeA = fA.returnOnEquity ? (fA.returnOnEquity * 100).toFixed(1) : 'N/A';
  const roeB = fB.returnOnEquity ? (fB.returnOnEquity * 100).toFixed(1) : 'N/A';

  const deA = fA.debtToEquity ? (fA.debtToEquity > 10 ? fA.debtToEquity / 100 : fA.debtToEquity).toFixed(2) : 'N/A';
  const deB = fB.debtToEquity ? (fB.debtToEquity > 10 ? fB.debtToEquity / 100 : fB.debtToEquity).toFixed(2) : 'N/A';

  if (keyToUse) {
    try {
      const prompt = `Compare these two stocks for a long term Indian retail investor:

Stock A: ${nameA} — Score ${scoreA}/100
P/E: ${peA} | ROE: ${roeA}% | Debt/Equity: ${deA}
Valuation: ${stockA.fundamentals?.valuation?.score || 10}/20, Growth: ${stockA.fundamentals?.growth?.score || 10}/20, Health: ${stockA.fundamentals?.health?.score || 10}/20, Profit: ${stockA.fundamentals?.profitability?.score || 10}/20, Div: ${stockA.fundamentals?.dividend?.score || 10}/20

Stock B: ${nameB} — Score ${scoreB}/100
P/E: ${peB} | ROE: ${roeB}% | Debt/Equity: ${deB}
Valuation: ${stockB.fundamentals?.valuation?.score || 10}/20, Growth: ${stockB.fundamentals?.growth?.score || 10}/20, Health: ${stockB.fundamentals?.health?.score || 10}/20, Profit: ${stockB.fundamentals?.profitability?.score || 10}/20, Div: ${stockB.fundamentals?.dividend?.score || 10}/20

Tell in simple Hinglish:
1. Long term ke liye konsa better hai
2. Kyun ek doosre se better hai
3. Dono mein se kaunsa zyada safe hai
4. Kya dono rakh sakte hain portfolio mein

Under 100 words. Simple language.
End with: ⚠️ SEBI registered advisor se salah zaroor lein bade investments se pehle.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${keyToUse}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const winner = scoreA > scoreB + 10 ? stockA.symbol : scoreB > scoreA + 10 ? stockB.symbol : null;

        return { isGeminiLive: true, text: rawText, winner };
      }
    } catch (err) {
      console.warn('AI comparison: service unavailable, using fallback');
    }
  }

  // Fallback comparison
  const winner = scoreA > scoreB + 10 ? nameA : scoreB > scoreA + 10 ? nameB : 'Too Close';
  const fallbackText = `${nameA} (Score: ${scoreA}/100) vs ${nameB} (Score: ${scoreB}/100).
${winner !== 'Too Close' ? `${winner} is fundamental-wise stronger for long-term holding right now.` : 'Both stocks have balanced fundamentals. Consider diversification.'}

⚠️ SEBI registered advisor se salah zaroor lein bade investments se pehle.`;

  return { isGeminiLive: false, text: fallbackText, winner };
}
