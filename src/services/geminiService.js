/**
 * geminiService.js
 * FIX 3 — Google Gemini API integration
 * Uses gemini-1.5-flash with exact prompt specified by user
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
  geminiApiKey = null,
}) {
  const primaryPattern = detectedPatterns[0] || { name: 'No Pattern Detected', type: 'Neutral', simpleLanguage: 'Consolidating.' };
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  // ── FIX 3: Exact Gemini API call as specified ──────────────
  if (keyToUse) {
    try {
      const prompt = `You are an expert Indian stock market technical analyst. Analyze:
Stock: ${name} (${symbol})
Current Price: ₹${price} (${change >= 0 ? '+' : ''}${change}, ${pChange}%)

Signals detected: RSI=${rsi.value} (${rsi.status}), MACD=${macd.status}, Pattern=${primaryPattern.name}, Volume=${confidence.isHighVol ? '> 1.5x Avg' : '< 1.5x Avg'}, Confidence Score: ${confidence.score}%

Give:
1. What this means in 2 simple lines. Mention the confidence score in your explanation. If score is below 40%, warn the user that signals are weak and to wait for confirmation.
2. Overall verdict: Bullish/Bearish/Neutral
3. Signal: Buy/Hold/Wait
4. Key price to watch

Keep it simple for retail investors.
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

        // Parse verdict, signal, and key price from Gemini's free-text response
        const verdictMatch = rawText.match(/verdict[:\s]*(Bullish|Bearish|Neutral)/i);
        const signalMatch  = rawText.match(/signal[:\s]*(Buy|Hold|Wait|Sell)/i);
        const priceMatch   = rawText.match(/(?:key price|watch|support|resistance)[^\d]*₹?([\d,]+\.?\d*)/i);

        const verdict   = verdictMatch?.[1] || 'Neutral';
        const rawSignal = signalMatch?.[1]  || 'Hold';
        const signal    = rawSignal === 'Sell' ? 'WAIT' : rawSignal.toUpperCase();
        const keyPrice  = priceMatch?.[1] || null;

        return {
          isGeminiLive:    true,
          verdict,
          signal,
          keyPrice,
          reason:          rawText,        // full Gemini text displayed directly
          rawGeminiText:   rawText,
          patternsExplanation: primaryPattern.simpleLanguage,
          rsiExplanation:  rsi.explanation,
          macdExplanation: macd.explanation,
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('Gemini API error:', response.status, errData?.error?.message);
      }
    } catch (err) {
      console.warn('Gemini call failed, using fallback engine:', err.message);
    }
  }

  // ── Fallback: Built-in AI rules engine ────────────────────
  let score = 0;
  if (rsi.value >= 50 && rsi.value <= 68) score += 1;
  if (rsi.value > 70)  score -= 1;
  if (rsi.value < 30)  score += 1.5;
  if (macd.status.includes('Bullish')) score += 1.5;
  if (macd.status.includes('Bearish')) score -= 1.5;
  if (primaryPattern.verdictImpact === 'Bullish') score += 1;
  if (primaryPattern.verdictImpact === 'Bearish') score -= 1;

  let verdict, signal, reason;
  if (score >= 1.5) {
    verdict = 'Bullish';
    signal  = 'BUY';
    reason  = `${symbol} shows strong bullish alignment — MACD is positive and RSI momentum is healthy.\nConsider entering on minor dips with a stop-loss below recent support.\n\n⚠️ Technical analysis only, not SEBI registered investment advice.`;
  } else if (score <= -1.5) {
    verdict = 'Bearish';
    signal  = 'WAIT';
    reason  = `${symbol} is under selling pressure — MACD bearish and RSI declining.\nAvoid fresh positions until technical recovery signals appear.\n\n⚠️ Technical analysis only, not SEBI registered investment advice.`;
  } else {
    verdict = 'Neutral';
    signal  = 'HOLD';
    reason  = `${symbol} is consolidating with mixed signals — RSI is balanced and MACD shows no strong direction.\nExisting investors may hold. Fresh buyers should wait for a clear breakout.\n\n⚠️ Technical analysis only, not SEBI registered investment advice.`;
  }

  return {
    isGeminiLive:    false,
    verdict,
    signal,
    keyPrice:        null,
    reason,
    rawGeminiText:   null,
    patternsExplanation: primaryPattern.simpleLanguage,
    rsiExplanation:  rsi.explanation,
    macdExplanation: macd.explanation,
  };
}

/**
 * Compare two stocks using Gemini API (exact user-specified prompt)
 */
export async function compareStocksWithGemini({ stockA, stockB, geminiApiKey = null }) {
  const keyToUse = (geminiApiKey && geminiApiKey.trim().length > 10) ? geminiApiKey.trim() : DEFAULT_KEY;

  const prompt = `Compare these two Indian stocks:
Stock A: ${stockA.name} (${stockA.symbol}), Price: ₹${stockA.price}, RSI: ${stockA.rsi}, MACD: ${stockA.macd}, Confidence Score: ${stockA.confidence.score}%
Stock B: ${stockB.name} (${stockB.symbol}), Price: ₹${stockB.price}, RSI: ${stockB.rsi}, MACD: ${stockB.macd}, Confidence Score: ${stockB.confidence.score}%

Tell me in simple language:
1. Which is technically stronger RIGHT NOW? (Mention their confidence scores)
2. Which suits a short term trader?
3. Which suits a long term investor?
4. Simple verdict: which one to watch this week?

Keep it under 100 words. Simple English.
End with: ⚠️ Technical analysis only, not SEBI registered investment advice.`;

  if (keyToUse) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${keyToUse}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
          }),
        }
      );

      if (response.ok) {
        const data    = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Try to detect winner symbol from response
        const symA = stockA.symbol.split('.')[0];
        const symB = stockB.symbol.split('.')[0];
        const mentionsA = (rawText.match(new RegExp(symA, 'gi')) || []).length;
        const mentionsB = (rawText.match(new RegExp(symB, 'gi')) || []).length;
        const winner = mentionsA > mentionsB ? stockA.symbol : mentionsB > mentionsA ? stockB.symbol : null;

        return { isGeminiLive: true, text: rawText, winner };
      }
    } catch (err) {
      console.warn('Gemini compare failed, using fallback:', err.message);
    }
  }

  // Fallback: simple rules-based comparison
  const scoreA = (stockA.rsiVal >= 50 && stockA.rsiVal <= 68 ? 1 : 0) + (stockA.macd.includes('Bullish') ? 1.5 : -1.5);
  const scoreB = (stockB.rsiVal >= 50 && stockB.rsiVal <= 68 ? 1 : 0) + (stockB.macd.includes('Bullish') ? 1.5 : -1.5);
  const winner = scoreA > scoreB ? stockA.symbol : scoreB > scoreA ? stockB.symbol : null;
  const winnerName = winner === stockA.symbol ? stockA.name : stockB.name;

  const text = winner
    ? `${winnerName} (${winner.split('.')[0]}) appears technically stronger right now based on RSI momentum and MACD signal.\n\nFor short-term traders, ${winnerName} offers better momentum. For long-term investors, both stocks need further fundamental analysis beyond technical indicators.\n\nWatch ${winnerName} this week for a potential continuation.\n\n⚠️ Technical analysis only, not SEBI registered investment advice.`
    : `Both ${stockA.name} and ${stockB.name} show similar technical strength right now. Neither has a clear advantage based on RSI and MACD alone.\n\nShort-term traders should wait for a clearer signal. Long-term investors should evaluate fundamentals.\n\n⚠️ Technical analysis only, not SEBI registered investment advice.`;

  return { isGeminiLive: false, text, winner };
}
