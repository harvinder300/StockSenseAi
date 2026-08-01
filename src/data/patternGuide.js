export const CANDLESTICK_PATTERNS = [
  {
    id: 'bullish-engulfing',
    name: 'Bullish Engulfing',
    type: 'Bullish Reversal',
    reliability: 'High',
    candlesCount: 2,
    summary: 'A small red candle followed by a large green candle that completely covers or "engulfs" the previous day\'s body.',
    retailMeaning: 'Sellers were in control initially, but buyers aggressively rushed in and pushed prices up, overwhelming sellers. Signals a strong price reversal from downtrend to uptrend.',
    actionableTip: 'Consider buying near the close of the green candle or next morning. Place stop loss just below the lowest shadow of the engulfing green candle.',
    shape: {
      first: { color: '#EF4444', height: '40%' },
      second: { color: '#10B981', height: '90%' }
    }
  },
  {
    id: 'bearish-engulfing',
    name: 'Bearish Engulfing',
    type: 'Bearish Reversal',
    reliability: 'High',
    candlesCount: 2,
    summary: 'A small green candle followed by a huge red candle whose body completely covers the previous green candle.',
    retailMeaning: 'Buyers tried to push the price up, but big institution sellers dumped heavily, completely taking over control. Signals top of an uptrend and potential drop.',
    actionableTip: 'Warning signal to exit long positions or take profits. Short sellers look for confirmation below the red candle low.',
    shape: {
      first: { color: '#10B981', height: '40%' },
      second: { color: '#EF4444', height: '90%' }
    }
  },
  {
    id: 'hammer',
    name: 'Hammer',
    type: 'Bullish Reversal',
    reliability: 'Medium-High',
    candlesCount: 1,
    summary: 'Small body at the top with a long lower tail (at least 2x the body length) and almost no upper tail.',
    retailMeaning: 'During the day, sellers tried to crash the stock, but buyers pushed the price back up near the opening price before close. Shows strong buyer defense.',
    actionableTip: 'Formed at the bottom of a downtrend, it signals bottoming out. Confirm with a green candle next day before entering.',
    shape: {
      first: { color: '#10B981', height: '30%', tailLower: '70%' }
    }
  },
  {
    id: 'shooting-star',
    name: 'Shooting Star',
    type: 'Bearish Reversal',
    reliability: 'Medium-High',
    candlesCount: 1,
    summary: 'Small body near the bottom with a very long upper tail and tiny lower wick.',
    retailMeaning: 'Buyers pushed prices to new highs during the session, but profit booking drove prices back down near open. Shows exhaustion of buyers.',
    actionableTip: 'Appears at the peak of a rally. Retail investors should avoid buying fresh at this level and lock in profits.',
    shape: {
      first: { color: '#EF4444', height: '30%', tailUpper: '70%' }
    }
  },
  {
    id: 'morning-star',
    name: 'Morning Star',
    type: 'Bullish Reversal',
    reliability: 'High',
    candlesCount: 3,
    summary: 'Three-candle pattern: 1st is long red, 2nd is small body (star/doji), 3rd is strong long green closing above midpoint of 1st candle.',
    retailMeaning: 'Like a sunrise after dark. Indicates sellers losing steam on day 2 and buyers seizing full control on day 3.',
    actionableTip: 'One of the most trustworthy trend reversal setups. Strong buy candidate when confirmed with rising volume.',
    shape: {
      first: { color: '#EF4444', height: '70%' },
      second: { color: '#F59E0B', height: '25%' },
      third: { color: '#10B981', height: '80%' }
    }
  },
  {
    id: 'evening-star',
    name: 'Evening Star',
    type: 'Bearish Reversal',
    reliability: 'High',
    candlesCount: 3,
    summary: 'Three-candle pattern: 1st long green, 2nd tiny body gap up, 3rd strong red closing well into 1st candle body.',
    retailMeaning: 'Opposite of Morning Star. The sun setting on an uptrend. Buying momentum fizzles out and heavy selling takes over.',
    actionableTip: 'Strong sell/exit signal for swing traders. Avoid buying dips immediately after an Evening Star.',
    shape: {
      first: { color: '#10B981', height: '70%' },
      second: { color: '#F59E0B', height: '25%' },
      third: { color: '#EF4444', height: '80%' }
    }
  },
  {
    id: 'doji',
    name: 'Doji',
    type: 'Neutral Reversal',
    reliability: 'Medium',
    candlesCount: 1,
    summary: 'Opening price and closing price are almost identical, creating a thin horizontal cross shape.',
    retailMeaning: 'Tug of war between buyers and sellers ending in a deadlock. Indicates indecision in the market.',
    actionableTip: 'Do not trade Doji alone. Wait for next day candle to see who wins the battle (above Doji high = bullish, below = bearish).',
    shape: {
      first: { color: '#9CA3AF', height: '5%', tailUpper: '45%', tailLower: '45%' }
    }
  },
  {
    id: 'piercing-line',
    name: 'Piercing Line',
    type: 'Bullish Reversal',
    reliability: 'Medium-High',
    candlesCount: 2,
    summary: 'Day 1 long red candle, Day 2 opens lower but rallies aggressively to close above 50% of Day 1 body.',
    retailMeaning: 'Bears thought they would push price down, but bulls aggressively hijacked the session and reclaimed ground.',
    actionableTip: 'Good dip-buying opportunity in quality blue-chip stocks during market corrections.',
    shape: {
      first: { color: '#EF4444', height: '80%' },
      second: { color: '#10B981', height: '65%' }
    }
  },
  {
    id: 'dark-cloud-cover',
    name: 'Dark Cloud Cover',
    type: 'Bearish Reversal',
    reliability: 'Medium-High',
    candlesCount: 2,
    summary: 'Day 1 bullish green, Day 2 opens higher (gap up) but falls heavily to close below 50% of Day 1 body.',
    retailMeaning: 'Retail trap! Gapped up enticing buyers, but big players dumped into the gap up.',
    actionableTip: 'Cautionary signal to tighten trailing stop losses on active swing positions.',
    shape: {
      first: { color: '#10B981', height: '80%' },
      second: { color: '#EF4444', height: '65%' }
    }
  },
  {
    id: 'hanging-man',
    name: 'Hanging Man',
    type: 'Bearish Reversal',
    reliability: 'Medium',
    candlesCount: 1,
    summary: 'Looks identical to a Hammer (small body, long lower wick), but appears at the end of an UPTREND.',
    retailMeaning: 'Even though price recovered, intense selling pressure emerged during the day, revealing underlying vulnerability.',
    actionableTip: 'Needs confirmation next day with a red candle close below the Hanging Man lower tail before taking action.',
    shape: {
      first: { color: '#EF4444', height: '30%', tailLower: '70%' }
    }
  }
];
