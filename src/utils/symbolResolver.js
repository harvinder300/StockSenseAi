/**
 * symbolResolver.js
 * Universal Symbol Resolver for Twelve Data API and Stooq.com
 */

const SYMBOL_CORRECTIONS = {
  'ADANIENT': 'ADANIENT',
  'ADANIPORTS': 'ADANIPORTS', 
  'BAJAJFINSV': 'BAJAJFINSV',
  'BHARTIARTL': 'BHARTIARTL',
  'BPCL': 'BPCL',
  'BRITANNIA': 'BRITANNIA',
  'CGPOWER': 'CGPOWER',
  'CIPLA': 'CIPLA',
  'COALINDIA': 'COALINDIA',
  'DRREDDY': 'DRREDDY',
  'EICHERMOT': 'EICHERMOT',
  'GLAND': 'GLAND',
  'GRASIM': 'GRASIM',
  'HAL': 'HAL',
  'HCLTECH': 'HCLTECH',
  'HDFC': 'HDFCBANK',
  'HDFCBANK': 'HDFCBANK',
  'HDFCLIFE': 'HDFCLIFE',
  'HEROMOTOCO': 'HEROMOTOCO',
  'HINDALCO': 'HINDALCO',
  'HINDUNILVR': 'HINDUNILVR',
  'ICICIBANK': 'ICICIBANK',
  'INDUSINDBK': 'INDUSINDBK',
  'INFY': 'INFY',
  'ITC': 'ITC',
  'JIOFIN': 'JIOFIN',
  'JSWSTEEL': 'JSWSTEEL',
  'KOTAKBANK': 'KOTAKBANK',
  'LT': 'LT',
  'LTIM': 'LTIM',
  'MARUTI': 'MARUTI',
  'MM': 'M&M',
  'NESTLEIND': 'NESTLEIND',
  'NTPC': 'NTPC',
  'ONGC': 'ONGC',
  'POWERGRID': 'POWERGRID',
  'RELIANCE': 'RELIANCE',
  'SBIN': 'SBIN',
  'SHRIRAMFIN': 'SHRIRAMFIN',
  'STALLION': 'STALLION',
  'SUNPHARMA': 'SUNPHARMA',
  'SUZLON': 'SUZLON',
  'TATACONSUM': 'TATACONSUM',
  'TATAMOTORS': 'TATAMOTORS',
  'TATASTEEL': 'TATASTEEL',
  'TCS': 'TCS',
  'TECHM': 'TECHM',
  'TITAN': 'TITAN',
  'TRENT': 'TRENT',
  'ULTRACEMCO': 'ULTRACEMCO',
  'UPL': 'UPL',
  'VADILALIND': 'VADILALIND',
  'WIPRO': 'WIPRO',
  'ZOMATO': 'ZOMATO'
};

export const resolveSymbolForTwelveData = (input) => {
  if (!input) return 'RELIANCE:NSE';

  // Clean input
  const clean = input
    .trim()
    .toUpperCase()
    .replace(/\.NS$/i, '')
    .replace(/\.BO$/i, '')
    .replace(/\.NSE$/i, '')
    .replace(/\.BSE$/i, '')
    .replace(/:NSE$/i, '')
    .replace(/:BSE$/i, '')
    .replace(/\.IN$/i, '');

  // Check corrections map
  const corrected = SYMBOL_CORRECTIONS[clean] || clean;

  // Return Twelve Data format: SYMBOL:NSE
  return `${corrected}:NSE`;
};

export const resolveSymbolForStooq = (input) => {
  if (!input) return 'reliance.in';

  const clean = input
    .trim()
    .toUpperCase()
    .replace(/\.NS$/i, '')
    .replace(/\.BO$/i, '')
    .replace(/\.NSE$/i, '')
    .replace(/:NSE$/i, '')
    .replace(/\.IN$/i, '');

  const corrected = SYMBOL_CORRECTIONS[clean] || clean;

  // Stooq format: reliance.in (lowercase)
  return `${corrected.toLowerCase()}.in`;
};
