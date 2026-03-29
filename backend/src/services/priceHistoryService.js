const { getPrices } = require('./priceSimulator');
const logger = require('../utils/logger');


/**
 * In-memory OHLC history per symbol.
 *
 * Design:
 *  - Every 5 seconds we capture the current price.
 *  - We maintain a rolling set of 1-minute OHLC bars (the "current bar" is
 *    open when the minute starts and sealed at the next minute boundary).
 *  - Sealed bars are stored in memHistory[symbol] (ring-buffer of MAX_BARS).
 *  - The DB path still uses the old 60-second PriceHistory model for backward compat.
 *
 * Why per-minute bars instead of raw ticks?
 *  - A 1-minute bar is the smallest unit the chart uses.
 *  - Coarser timeframes (5m, 15m, 30m, 1h …) are assembled from 1-minute bars
 *    inside getHistoricalData(), keeping a single source of truth.
 */

const MAX_BARS   = 2000;   // ~33 hours of 1-minute bars — covers any period up to 1 month of coarse bars
const SNAP_MS    = 5_000;  // snapshot interval

// memHistory[symbol] = array of sealed 1-min OHLC bars  { open, high, low, close, price, timestamp: Date }
const memHistory = {};

// currentBar[symbol] = the bar we are currently building  { open, high, low, close, minuteKey }
const currentBar = {};

let historyInterval = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const minuteKey = (d) => {
  // "2026-03-06T09:15" — unique string per calendar minute
  return d.toISOString().slice(0, 16);
};

// ── Snapshot ──────────────────────────────────────────────────────────────────
const capturePriceSnapshot = async () => {
  const now    = new Date();
  const mk     = minuteKey(now);
  const prices = getPrices();
  if (!prices || !Object.keys(prices).length) return;


  if (!global.dbConnected) {
    for (const [symbol, price] of Object.entries(prices)) {
      if (!price) continue;

      if (!currentBar[symbol] || currentBar[symbol].minuteKey !== mk) {
        // Seal the previous bar (if any) into memHistory
        if (currentBar[symbol]) {
          if (!memHistory[symbol]) memHistory[symbol] = [];
          memHistory[symbol].push({
            symbol,
            price:     currentBar[symbol].close,
            open:      currentBar[symbol].open,
            high:      currentBar[symbol].high,
            low:       currentBar[symbol].low,
            close:     currentBar[symbol].close,
            timestamp: currentBar[symbol].closeTime,
          });
          if (memHistory[symbol].length > MAX_BARS) memHistory[symbol].shift();
        }
        // Start a new bar
        currentBar[symbol] = { minuteKey: mk, open: price, high: price, low: price, close: price, closeTime: now };
      } else {
        // Extend the current bar
        const b = currentBar[symbol];
        if (price > b.high) b.high = price;
        if (price < b.low)  b.low  = price;
        b.close     = price;
        b.closeTime = now;
      }
    }
    return;
  }

  // ── DB path — keep the old simple behaviour (one row per snapshot) ─────────
  try {
    const PriceHistory = require('../models/PriceHistory');
    const rows = Object.entries(prices).map(([symbol, price]) => ({
      symbol, price, close: price, open: price, high: price, low: price, timestamp: now,
    }));
    if (rows.length) await PriceHistory.insertMany(rows);
  } catch (err) {
    // Fallback to memory on DB error
    capturePriceSnapshot._memFallback = true;
  }
};

// ── Service start/stop ────────────────────────────────────────────────────────
const startPriceHistoryService = () => {
  logger.info('📊 Price History Service Started (5s OHLC bars)...');
  capturePriceSnapshot();
  historyInterval = setInterval(capturePriceSnapshot, SNAP_MS);
};

const stopPriceHistoryService = () => {
  if (historyInterval) clearInterval(historyInterval);
};

// ── Aggregate 1-min bars into coarser buckets ────────────────────────────────
/**
 * Given an array of sorted 1-minute OHLC bars and a desired bar-size in minutes,
 * returns aggregated OHLC bars.
 */
function aggregate(bars, barMinutes) {
  if (barMinutes <= 1) return bars;
  const result = [];
  let bucket = null;
  for (const b of bars) {
    const ts = new Date(b.timestamp);
    const slot = Math.floor(ts.getTime() / (barMinutes * 60_000));
    if (!bucket || bucket.slot !== slot) {
      if (bucket) result.push(bucket.bar);
      bucket = {
        slot,
        bar: {
          open:      b.open,
          high:      b.high,
          low:       b.low,
          close:     b.close,
          price:     b.close,
          timestamp: b.timestamp,
        },
      };
    } else {
      if (b.high  > bucket.bar.high) bucket.bar.high  = b.high;
      if (b.low   < bucket.bar.low)  bucket.bar.low   = b.low;
      bucket.bar.close = b.close;
      bucket.bar.price = b.close;
    }
  }
  if (bucket) result.push(bucket.bar);
  return result;
}

// ── Main query function ───────────────────────────────────────────────────────
/**
 * @param {string}  symbol
 * @param {string}  fromDate   ISO string or undefined
 * @param {string}  toDate     ISO string or undefined
 * @param {number}  limit      max bars to return
 * @param {number}  barMinutes bar size in minutes (1 = raw 1-min bars)
 */
const getHistoricalData = async (symbol, fromDate, toDate, limit = 100, barMinutes = 1) => {
  if (!global.dbConnected) {
    let data = memHistory[symbol] || [];

    // 1. Date-range filter FIRST (important — don't clip before filtering)
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate).getTime() : 0;
      const to   = toDate   ? new Date(toDate).getTime()   : Infinity;
      data = data.filter(d => {
        const t = new Date(d.timestamp).getTime();
        return t >= from && t <= to;
      });
    }

    // 2. Aggregate into coarser bars if needed
    if (barMinutes > 1) data = aggregate(data, barMinutes);

    // 3. Return the most-recent `limit` bars
    return data.slice(-limit);
  }

  try {
    const PriceHistory = require('../models/PriceHistory');
    const query = { symbol };
    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = new Date(fromDate);
      if (toDate)   query.timestamp.$lte = new Date(toDate);
    }
    const history = await PriceHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * barMinutes)   // fetch more raw rows so aggregation has enough
      .lean();
    const sorted = history.reverse();
    return barMinutes > 1 ? aggregate(sorted, barMinutes).slice(-limit) : sorted;
  } catch {
    return (memHistory[symbol] || []).slice(-limit);
  }
};

const getMemHistory = () => memHistory;

module.exports = {
  startPriceHistoryService,
  stopPriceHistoryService,
  getHistoricalData,
  getMemHistory,
  capturePriceSnapshot,
};
