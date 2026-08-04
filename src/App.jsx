import React, { useState } from 'react';
import Header from './components/Header';
import GeminiKeyModal from './components/GeminiKeyModal';
import HomePage from './pages/HomePage';
import AnalyserPage from './pages/AnalyserPage';
import ComparePage from './pages/ComparePage';
import LearnPage from './pages/LearnPage';
import { TrendingUp } from 'lucide-react';
import { secureStorage } from './utils/security';

const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export default function App() {
  const [activeTab,       setActiveTab]       = useState('home');
  const [selectedSymbol,  setSelectedSymbol]  = useState('RELIANCE');
  const [geminiApiKey,    setGeminiApiKey]    = useState(() => secureStorage.get('stocksense_gemini_key') || DEFAULT_GEMINI_KEY);
  const [modalOpen,       setModalOpen]       = useState(false);

  const saveKey  = (k) => { setGeminiApiKey(k); secureStorage.set('stocksense_gemini_key', k); };
  const clearKey = ()  => { setGeminiApiKey(''); secureStorage.remove('stocksense_gemini_key'); };

  const goStock  = (sym) => { setSelectedSymbol(sym); setActiveTab('analyser'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="ss-app">

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGeminiModal={() => setModalOpen(true)}
        hasGeminiKey={Boolean(geminiApiKey && geminiApiKey.trim().length > 10)}
      />

      <main className="ss-main">
        {activeTab === 'home'     && <HomePage     onSelectStock={goStock} onNavigate={setActiveTab} />}
        {activeTab === 'analyser' && <AnalyserPage selectedSymbol={selectedSymbol} onSymbolChange={setSelectedSymbol} geminiApiKey={geminiApiKey} />}
        {activeTab === 'compare'  && <ComparePage  geminiApiKey={geminiApiKey} />}
        {activeTab === 'learn'    && <LearnPage />}
      </main>

      <GeminiKeyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveKey={saveKey}
        onClearKey={clearKey}
      />

      <footer className="ss-footer">
        <div className="ss-footer-inner">
          <div className="ss-footer-logo">
            <div className="ss-footer-logo-icon">
              <TrendingUp size={14} color="#fff" />
            </div>
            <span className="ss-footer-logo-text">StockSense <span>AI</span></span>
          </div>
          <div className="ss-footer-links">
            {['home','analyser','compare','learn'].map(tab => (
              <span key={tab} className="ss-footer-link" onClick={() => setActiveTab(tab)}>
                {tab === 'analyser' ? 'Stock Analyser' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            ))}
          </div>
          <p className="ss-footer-copy">
            StockSense AI — Built for Indian Retail Investors.<br />
            Educational &amp; Technical Insights Only. Not SEBI Registered Financial Advice.
          </p>
        </div>
      </footer>

    </div>
  );
}
