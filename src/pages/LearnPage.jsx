import React, { useState } from 'react';
import { CANDLESTICK_PATTERNS } from '../data/patternGuide';
import { BookOpen, HelpCircle, Lightbulb, ChevronRight, X } from 'lucide-react';

export default function LearnPage() {
  const [selectedPattern, setSelectedPattern] = useState(null);

  const getBadgeClass = (type) => {
    if (type.includes('Bullish')) return 'ss-badge ss-badge-green';
    if (type.includes('Bearish')) return 'ss-badge ss-badge-red';
    return 'ss-badge ss-badge-amber';
  };

  return (
    <div className="fade-up">

      {/* Page Hero */}
      <div className="ss-page-hero">
        <div className="ss-badge ss-badge-green" style={{ marginBottom: 14, display: 'inline-flex', gap: 6 }}>
          <BookOpen size={13} /> Retail Investor Academy
        </div>
        <h1>10 Essential <span>Candlestick Patterns</span></h1>
        <p>
          Master the top 10 candlestick patterns used by professional traders in the Indian stock market.
          Click any card below to get plain-English explanations and actionable trading rules.
        </p>
      </div>

      {/* Pattern Cards Grid */}
      <div className="ss-patterns-grid">
        {CANDLESTICK_PATTERNS.map((pat) => (
          <div
            key={pat.id}
            className="ss-pattern-card"
            onClick={() => setSelectedPattern(pat)}
          >
            {/* Top row */}
            <div>
              <div className="ss-pattern-card-top">
                <span className={getBadgeClass(pat.type)}>{pat.type}</span>
                <span className="ss-reliability">{pat.reliability}</span>
              </div>
              <div className="ss-pattern-card-name">{pat.name}</div>
              <p className="ss-pattern-card-desc">{pat.summary}</p>
            </div>

            {/* Footer */}
            <div className="ss-pattern-card-footer">
              <button className="ss-btn-blue" style={{ pointerEvents: 'none' }}>
                Inspect Explanation <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Drawer */}
      {selectedPattern && (
        <div className="ss-modal-overlay" onClick={() => setSelectedPattern(null)}>
          <div className="ss-modal" onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button className="ss-modal-close" onClick={() => setSelectedPattern(null)}>
              <X size={16} />
            </button>

            {/* Header */}
            <div className="ss-modal-badge-row">
              <span className={getBadgeClass(selectedPattern.type)}>
                {selectedPattern.type}
              </span>
            </div>
            <div className="ss-modal-title">{selectedPattern.name}</div>
            <div className="ss-modal-rel">{selectedPattern.reliability} Reliability</div>

            {/* Candlestick Illustration */}
            <div className="ss-candle-viz">
              <div className="ss-candle-viz-label">Visual Structure</div>
              <div className="ss-candle-row">
                {selectedPattern.shape?.first && (
                  <div
                    className="ss-candle"
                    style={{
                      height: selectedPattern.shape.first.height,
                      background: selectedPattern.shape.first.color,
                      boxShadow: `0 0 14px ${selectedPattern.shape.first.color}55`,
                    }}
                  />
                )}
                {selectedPattern.shape?.second && (
                  <div
                    className="ss-candle"
                    style={{
                      width: 36,
                      height: selectedPattern.shape.second.height,
                      background: selectedPattern.shape.second.color,
                      boxShadow: `0 0 14px ${selectedPattern.shape.second.color}55`,
                    }}
                  />
                )}
                {selectedPattern.shape?.third && (
                  <div
                    className="ss-candle"
                    style={{
                      height: selectedPattern.shape.third.height,
                      background: selectedPattern.shape.third.color,
                      boxShadow: `0 0 14px ${selectedPattern.shape.third.color}55`,
                    }}
                  />
                )}
              </div>
              <p className="ss-candle-caption">{selectedPattern.summary}</p>
            </div>

            {/* Retail Meaning */}
            <div className="ss-modal-section">
              <div className="ss-modal-section-title">
                <HelpCircle size={15} /> What It Means for Retail Investors
              </div>
              <div className="ss-modal-section-body">{selectedPattern.retailMeaning}</div>
            </div>

            {/* Actionable Tip */}
            <div className="ss-modal-section">
              <div className="ss-modal-section-title">
                <Lightbulb size={15} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#f59e0b' }}>Actionable Trading Advice</span>
              </div>
              <div className="ss-modal-tip">{selectedPattern.actionableTip}</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
