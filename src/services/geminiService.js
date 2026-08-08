/**
 * geminiService.js
 * Google Gemini API integration for Long Term Fundamental Analysis & 3-Factor Entry Advisory
 */

const DEFAULT_KEY = '';
const GEMINI_MODEL = 'gemini-1.5-flash';

export async function analyzeFundamentalWithGemini({
  symbol,
  name,
  sector = 'Indian Market',
  price,
  fundamentals,
  entryAnalysis,
  rsi,
  macd,
  geminiApiKey = null,
}) {
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const fundamentalScore = fundamentals?.overall?.total ?? 50;

  const entryScore = entryAnalysis?.entryScore ?? 50;
  const entryVerdict = entryAnalysis?.entryVerdict || 'Decent Entry';
  const entryInsights = entryAnalysis?.entryInsights || [];
  const keyLevels = entryAnalysis?.keyLevels || {};
  const tranchePlan = entryAnalysis?.tranchePlan || {};

  const currentPrice = price || keyLevels.currentPrice || 100;
  const high52 = keyLevels.fiftyTwoWeekHigh || 'N/A';
  const low52 = keyLevels.fiftyTwoWeekLow || 'N/A';
  const ma50 = keyLevels.fiftyDayAverage || 'N/A';
  const ma200 = keyLevels.twoHundredDayAverage || 'N/A';

  const raw = fundamentals?.raw || {};
  const trailingPE = raw.trailingPE ? raw.trailingPE.toFixed(1) : 'N/A';
  const forwardPE = raw.forwardPE ? raw.forwardPE.toFixed(1) : 'N/A';

  const rsiVal = rsi?.value ? rsi.value.toFixed(1) : '50.0';
  const macdSignal = macd?.status || 'Neutral';

  const strategyStr = tranchePlan.strategy || 'SIP Approach';
  const tranchesStr = tranchePlan.tranches ? tranchePlan.tranches.map(t => `${t.percent} @ ${t.price}`).join(', ') : '3 tranches';
  const targetsStr = tranchePlan.targets ? tranchePlan.targets.join(', ') : 'Target +15%';
  const reviewPrice = tranchePlan.reviewPrice || keyLevels.reviewPrice || 'N/A';

  if (keyToUse) {
    try {
      const prompt = `You are a long term investment advisor for Indian retail investors.

Stock: ${name} (${symbol})
Current Price: ₹${currentPrice}
Fundamental Score: ${fundamentalScore}/100

ENTRY ANALYSIS:
Entry Score: ${entryScore}/100
Verdict: ${entryVerdict}

Price Position:
→ 52 Week High: ₹${high52}
→ Current: ₹${currentPrice} (${entryAnalysis?.pricePosition ? entryAnalysis.pricePosition.toFixed(0) : 50}% of 52wk range)
→ 52 Week Low: ₹${low52}
→ 50-Day MA: ₹${ma50}
→ 200-Day MA: ₹${ma200}

Valuation:
→ Trailing P/E: ${trailingPE}x
→ Forward P/E: ${forwardPE}x

Technical:
→ RSI: ${rsiVal}
→ MACD: ${macdSignal}

Entry Insights:
${entryInsights.join('\n')}

Investment Strategy: ${strategyStr}
Tranches: ${tranchesStr}
Targets: ${targetsStr}
Review if falls below: ${reviewPrice}

Write 4-5 lines in simple Hinglish (Hindi + English mix):
1. Kya abhi entry leni chahiye aur kyun
2. Kis price pe zyada invest karna chahiye
3. Kitne time mein targets milne chahiye
4. Kab apni thesis review karni chahiye

Mention entry score ${entryScore}/100.
Be specific with prices.
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
          verdict: entryVerdict,
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
  const fallbackText = `Stock: ${name} (${symbol}) — Entry Score: ${entryScore}/100 (${entryVerdict}).
Current Price: ₹${currentPrice}. Strategy: ${strategyStr}.
Recommended Tranches: ${tranchesStr}. Review investment thesis if price falls below ${reviewPrice}.

⚠️ SEBI registered advisor se salah zaroor lein bade investments se pehle.`;

  return {
    isGeminiLive: false,
    verdict: entryVerdict,
    reason: fallbackText,
    rawGeminiText: fallbackText,
  };
}

export async function compareStocksWithGemini({ stockA, stockB, geminiApiKey = null }) {
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const scoreA = stockA.fundamentals?.overall?.total ?? 50;
  const scoreB = stockB.fundamentals?.overall?.total ?? 50;

  const entryScoreA = stockA.entryAnalysis?.entryScore ?? 50;
  const entryScoreB = stockB.entryAnalysis?.entryScore ?? 50;

  const nameA = stockA.name || stockA.symbol;
  const nameB = stockB.name || stockB.symbol;

  if (keyToUse) {
    try {
      const prompt = `Compare these two stocks for a long term Indian retail investor:

Stock A: ${nameA}
Fundamental Score: ${scoreA}/100 | Entry Score: ${entryScoreA}/100 (${stockA.entryAnalysis?.entryVerdict || 'N/A'})
Price: ₹${stockA.price} | 50-Day MA: ₹${stockA.entryAnalysis?.keyLevels?.fiftyDayAverage || 'N/A'}

Stock B: ${nameB}
Fundamental Score: ${scoreB}/100 | Entry Score: ${entryScoreB}/100 (${stockB.entryAnalysis?.entryVerdict || 'N/A'})
Price: ₹${stockB.price} | 50-Day MA: ₹${stockB.entryAnalysis?.keyLevels?.fiftyDayAverage || 'N/A'}

Konsa stock abhi better entry point pe hai aur kyun?
Price levels aur strategy batao simple Hinglish mein (under 100 words).
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
        const winner = entryScoreA > entryScoreB + 10 ? stockA.symbol : entryScoreB > entryScoreA + 10 ? stockB.symbol : null;

        return { isGeminiLive: true, text: rawText, winner };
      }
    } catch (err) {
      console.warn('AI comparison: service unavailable, using fallback');
    }
  }

  // Fallback comparison
  const winner = entryScoreA > entryScoreB + 10 ? nameA : entryScoreB > entryScoreA + 10 ? nameB : 'Too Close';
  const fallbackText = `${nameA} (Entry Score: ${entryScoreA}/100) vs ${nameB} (Entry Score: ${entryScoreB}/100).
${winner !== 'Too Close' ? `${winner} is currently at a better entry point.` : 'Both stocks have comparable entry timing scores. Consider gradual accumulation.'}

⚠️ SEBI registered advisor se salah zaroor lein bade investments se pehle.`;

  return { isGeminiLive: false, text: fallbackText, winner };
}
