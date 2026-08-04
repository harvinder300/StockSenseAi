/**
 * geminiService.js
 * Google Gemini API integration with weighted scoring & Hinglish analysis
 */

const DEFAULT_KEY = '';
const GEMINI_MODEL = 'gemini-1.5-flash';

export async function analyzeStockWithGemini({
  symbol,
  name,
  price,
  change,
  pChange,
  rsi,
  macd,
  detectedPatterns,
  confidence,
  signalResult = null,
  multiData = null,
  geminiApiKey = null,
}) {
  const primaryPattern = detectedPatterns[0] || { name: 'No Pattern Detected', type: 'Neutral', simpleLanguage: 'Consolidating.' };
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const score = signalResult?.score ?? confidence?.score ?? 50;
  const verdict = signalResult?.verdict ?? 'Neutral';
  const action = signalResult?.action ?? 'HOLD';
  const reasons = signalResult?.reasons || [
    `RSI is ${rsi.value} (${rsi.status})`,
    `MACD signal is ${macd.status}`
  ];

  const priceVsMa50 = price > (confidence?.dma50 || price) ? 'Above 50 MA' : 'Below 50 MA';
  const volumeRatio = confidence?.isHighVol ? '1.5+' : '1.0';

  if (keyToUse) {
    try {
      const prompt = `You are an expert Indian stock market analyst.

Stock: ${name} (${symbol})
Price: ₹${price}
Signal Score: ${score}/100

Indicators:
RSI: ${rsi.value} (${rsi.status})
MACD: ${macd.status}
Price vs MA50: ${priceVsMa50}
Volume: ${volumeRatio}x average

Signal Breakdown:
${reasons.join('\n')}

Overall Verdict: ${verdict}

Write a 3-4 line analysis in simple Hindi-English (Hinglish) explaining:
1. Kya ho raha hai is stock mein abhi
2. ${score >= 55 ? 'Kyun yeh accha entry point lag raha hai' : 'Kyun abhi wait karna better hai'}
3. Kya watch karna chahiye

Score ${score}/100 mention karo.
End with: ⚠️ Technical analysis only, not SEBI registered investment advice.`;

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

        return {
          isGeminiLive: true,
          verdict,
          signal: action,
          keyPrice: null,
          reason: rawText,
          rawGeminiText: rawText,
          patternsExplanation: primaryPattern.simpleLanguage,
          rsiExplanation: rsi.explanation,
          macdExplanation: macd.explanation,
        };
      } else {
        console.warn('AI analysis: API returned non-OK status');
      }
    } catch (err) {
      console.warn('AI analysis: service unavailable, using fallback');
    }
  }

  // ── Fallback: Built-in AI rules engine ────────────────────
  const fallbackText = `Stock: ${name} (${symbol}) - Score ${score}/100.
${verdict === 'Strong Buy' || verdict === 'Moderate Buy' ? 'Abhi stock mein buying momentum dikh raha hai. Technical indicators positive hain.' : 'Abhi stock me mixed ya weak trend hai. Wait and watch approach better rahegi.'}
Keep an eye on key support levels before placing orders.

⚠️ Technical analysis only, not SEBI registered investment advice.`;

  return {
    isGeminiLive: false,
    verdict,
    signal: action,
    keyPrice: null,
    reason: fallbackText,
    rawGeminiText: fallbackText,
    patternsExplanation: primaryPattern.simpleLanguage,
    rsiExplanation: rsi.explanation,
    macdExplanation: macd.explanation,
  };
}

export async function compareStocksWithGemini({ stockA, stockB, geminiApiKey = null }) {
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const scoreA = stockA.signalResult?.score ?? stockA.confidence?.score ?? 50;
  const scoreB = stockB.signalResult?.score ?? stockB.confidence?.score ?? 50;

  if (keyToUse) {
    try {
      const prompt = `Compare these two Indian stocks for a retail investor:

Stock A: ${stockA.name} (${stockA.symbol}) — ₹${stockA.price} (Score: ${scoreA}/100, Action: ${stockA.signalResult?.action || 'HOLD'})
Stock B: ${stockB.name} (${stockB.symbol}) — ₹${stockB.price} (Score: ${scoreB}/100, Action: ${stockB.signalResult?.action || 'HOLD'})

Which stock is technically stronger right now and why? 
Provide a clear 3-bullet comparison in simple Hinglish. Mention scores for both stocks.
End with: ⚠️ Technical analysis only, not SEBI registered investment advice.`;

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
        const winner = scoreA > scoreB + 15 ? stockA.symbol : scoreB > scoreA + 15 ? stockB.symbol : null;

        return { isGeminiLive: true, text: rawText, winner };
      }
    } catch (err) {
      console.warn('AI comparison: service unavailable, using fallback');
    }
  }

  // Fallback comparison
  const winner = scoreA > scoreB + 15 ? stockA.name : scoreB > scoreA + 15 ? stockB.name : 'Too Close';
  const fallbackText = `${stockA.name} (Score: ${scoreA}%) vs ${stockB.name} (Score: ${scoreB}%).
${winner !== 'Too Close' ? `${winner} shows stronger technical setup right now.` : 'Both stocks have similar technical strength. Compare your risk appetite.'}

⚠️ Technical analysis only, not SEBI registered investment advice.`;

  return { isGeminiLive: false, text: fallbackText, winner };
}
