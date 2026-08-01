import React from 'react';
import { TrendingUp, Search, Scale, BookOpen, Key, Home } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenGeminiModal, hasGeminiKey }) {
  const navItems = [
    { id: 'home',     label: 'Home',           icon: Home },
    { id: 'analyser', label: 'Stock Analyser',  icon: Search },
    { id: 'compare',  label: 'Compare',         icon: Scale },
    { id: 'learn',    label: 'Learn',           icon: BookOpen },
  ];

  return (
    <header className="ss-nav">
      <div className="ss-nav-inner">

        {/* Logo */}
        <div className="ss-logo" onClick={() => setActiveTab('home')}>
          <div className="ss-logo-icon">
            <TrendingUp size={18} color="#fff" />
          </div>
          <span className="ss-logo-text">
            StockSense <span>AI</span>
          </span>
        </div>

        {/* Nav Links */}
        <nav className="ss-nav-links">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`ss-nav-btn${activeTab === id ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Gemini Badge */}
        <button
          onClick={onOpenGeminiModal}
          className={`ss-gemini-badge${hasGeminiKey ? ' active' : ''}`}
        >
          <Key size={13} />
          {hasGeminiKey ? 'Gemini AI Active' : 'Gemini Key'}
          <span className={`ss-dot${hasGeminiKey ? ' live' : ''}`} />
        </button>

      </div>
    </header>
  );
}
