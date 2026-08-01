# StockSense AI 📈🤖

StockSense AI is a premium, modern web application for Indian retail investors. It provides live technical analysis, beautiful charting, and an AI-powered stock verdict (using Google Gemini) to help users make informed trading decisions.

## ✨ Features
- **Live Search**: Autocomplete search for NSE & BSE stocks using live Yahoo Finance data.
- **Stock Analyser**: View beautiful candlestick charts (powered by lightweight-charts).
- **Technical Indicators**: Calculates real RSI (Relative Strength Index) and MACD directly in the browser.
- **Pattern Detection**: Automatically identifies common candlestick patterns (Doji, Engulfing, Hammer, etc.).
- **Confidence Score Engine**: A 0-100% confidence meter that weighs multiple technical factors and indicates the strength of the setup.
- **AI Verdict**: Uses Google Gemini to synthesize technical data into a simple "Buy/Hold/Wait" signal.
- **Stock Battle**: Side-by-side comparison of two stocks to determine which is technically stronger.

## 🚀 Tech Stack
- React.js + Vite
- Vanilla CSS with a bespoke "fintech premium" dark theme and glassmorphism UI
- Google Gemini API (for AI analysis)
- `technicalindicators` (for client-side indicator math)
- `lightweight-charts` (for high-performance canvas charts)

## 🛠️ Setup & Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file and add your Gemini API key:
   `VITE_GEMINI_API_KEY=your_api_key_here`
4. Run `npm run dev` to start the local development server

## ⚠️ Disclaimer
This tool is strictly for educational purposes. It performs technical analysis based on historical price action. It is NOT SEBI registered investment advice.
