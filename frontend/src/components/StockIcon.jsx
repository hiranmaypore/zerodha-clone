import { useState } from 'react';

// Company domain mapping for Clearbit logo API
const STOCK_DOMAINS = {
  TCS:        'tcs.com',
  INFY:       'infosys.com',
  RELIANCE:   'ril.com',
  HDFC:       'hdfcbank.com',
  ICICI:      'icicibank.com',
  SBIN:       'sbi.co.in',
  BHARTIARTL: 'airtel.com',
  HCLTECH:    'hcltech.com',
  ITC:        'itcportal.com',
  KOTAKBANK:  'kotak.com',
  LT:         'larsentoubro.com',
  AXISBANK:   'axisbank.com',
  WIPRO:      'wipro.com',
  BAJFINANCE: 'bajajfinserv.in',
  MARUTI:     'marutisuzuki.com',
  TITAN:      'titancompany.in',
  SUNPHARMA:  'sunpharma.com',
  TATAMOTORS: 'tatamotors.com',
  ASIANPAINT: 'asianpaints.com',
  ULTRACEMCO: 'ultratechcement.com',
};

// Per-symbol fallback gradient when logo fails to load
const SYMBOL_COLORS = {
  TCS:        'from-blue-500   to-blue-700',
  INFY:       'from-indigo-500 to-indigo-700',
  RELIANCE:   'from-red-500    to-red-700',
  HDFC:       'from-red-600    to-rose-800',
  ICICI:      'from-orange-500 to-orange-700',
  SBIN:       'from-sky-500    to-sky-700',
  BHARTIARTL: 'from-red-500    to-pink-700',
  HCLTECH:    'from-cyan-500   to-cyan-700',
  ITC:        'from-green-600  to-green-800',
  KOTAKBANK:  'from-red-500    to-red-700',
  LT:         'from-teal-500   to-teal-700',
  AXISBANK:   'from-purple-500 to-purple-700',
  WIPRO:      'from-blue-400   to-blue-600',
  BAJFINANCE: 'from-blue-600   to-indigo-800',
  MARUTI:     'from-slate-500  to-slate-700',
  TITAN:      'from-amber-500  to-amber-700',
  SUNPHARMA:  'from-orange-400 to-orange-600',
  TATAMOTORS: 'from-blue-500   to-indigo-600',
  ASIANPAINT: 'from-red-400    to-red-600',
  ULTRACEMCO: 'from-stone-500  to-stone-700',
};

/**
 * StockIcon — shows a real company logo (Clearbit) with a colored-initial fallback.
 *
 * Props:
 *   symbol    — stock symbol string
 *   className — size + any extra classes (default: "w-8 h-8")
 *   textSize  — text size for fallback initial (default: "text-xs")
 */
export function StockIcon({ symbol = '', className = 'w-8 h-8', textSize = 'text-xs' }) {
  const [failed, setFailed] = useState(false);
  const gradient = SYMBOL_COLORS[symbol] || 'from-purple-500 to-indigo-600';


  if (!failed) {
    return (
      <img
        src={`/stocks/${symbol}.png`}
        alt={symbol}
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-contain bg-white p-0.5 shrink-0`}
      />
    );
  }

  return (
    <div className={`${className} rounded-full bg-linear-to-br ${gradient} flex items-center justify-center text-white font-bold shrink-0 ${textSize}`}>
      {symbol.charAt(0)}
    </div>
  );
}
