const { getHistoricalData } = require('../services/priceHistoryService');
const STOCKS = require('../config/stocks');

/**
 * Maps every timeframe the chart can request to:
 *   ms         — total lookback window in milliseconds
 *   limit      — max bars to return
 *   barMinutes — OHLC aggregation bucket size in minutes
 *
 * Chart timeframes: '1m' '5m' '15m' '30m' '1h' '4h' '1d' '1W'
 * API period param: '1h' '6h' '1d' '1w' '1m'   (legacy REST calls)
 */
const PERIOD_MAP = {
  // ── Chart timeframes (sent by ChartPanel as activeTimeframe) ─────────────
  '1m':  { ms: 2   * 60 * 60 * 1000,        limit: 120, barMinutes: 1   },  // 2 h  of 1-min  bars
  '5m':  { ms: 8   * 60 * 60 * 1000,        limit: 96,  barMinutes: 5   },  // 8 h  of 5-min  bars
  '15m': { ms: 24  * 60 * 60 * 1000,        limit: 96,  barMinutes: 15  },  // 1 d  of 15-min bars
  '30m': { ms: 48  * 60 * 60 * 1000,        limit: 96,  barMinutes: 30  },  // 2 d  of 30-min bars
  '1h':  { ms: 24  * 60 * 60 * 1000,        limit: 96,  barMinutes: 60  },  // 4 d  of 1-h    bars
  '4h':  { ms: 14  * 24 * 60 * 60 * 1000,   limit: 84,  barMinutes: 240 },  // 14 d of 4-h    bars
  '1d':  { ms: 30  * 24 * 60 * 60 * 1000,   limit: 90,  barMinutes: 1440},  // 30 d of 1-day  bars
  '1W':  { ms: 365 * 24 * 60 * 60 * 1000,   limit: 52,  barMinutes: 10080}, // 1 yr of weekly bars

  // ── Legacy REST aliases ──────────────────────────────────────────────────
  '6h':  { ms: 6   * 60 * 60 * 1000,        limit: 72,  barMinutes: 5   },
  '1w':  { ms: 7   * 24 * 60 * 60 * 1000,   limit: 168, barMinutes: 60  },
};

/**
 * GET /api/prices/history/:symbol
 * Query params:
 *   period    — one of the keys in PERIOD_MAP   (preferred)
 *   from      — ISO start date override
 *   to        — ISO end date override
 *   limit     — integer 1–1000 override
 */
const getStockHistory = async (req, res) => {
  try {
    const { symbol }              = req.params;
    const { period, from, to, limit } = req.query;

    const upperSymbol = symbol.toUpperCase();
    const validSymbols = Array.isArray(STOCKS) ? STOCKS.map(s => s.symbol) : [];
    if (!validSymbols.includes(upperSymbol)) {
      return res.status(400).json({ message: `Invalid stock symbol: ${upperSymbol}` });
    }

    let fromDate   = from  ? new Date(from)  : null;
    let toDate     = to    ? new Date(to)     : null;
    let limitNum   = limit ? parseInt(limit, 10) : null;
    let barMinutes = 1;

    if (limitNum !== null && (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000)) {
      return res.status(400).json({ message: 'limit must be an integer between 1 and 1000' });
    }

    // period drives the window — overrides from/to/limit
    if (period) {
      const cfg = PERIOD_MAP[period];
      if (!cfg) {
        return res.status(400).json({
          message: `Invalid period "${period}". Allowed: ${Object.keys(PERIOD_MAP).join(', ')}`,
        });
      }
      toDate     = new Date();
      fromDate   = new Date(toDate.getTime() - cfg.ms);
      limitNum   = cfg.limit;
      barMinutes = cfg.barMinutes;
    }

    if (limitNum === null) limitNum = 100;

    const history = await getHistoricalData(
      upperSymbol,
      fromDate   ? fromDate.toISOString()   : undefined,
      toDate     ? toDate.toISOString()     : undefined,
      limitNum,
      barMinutes,
    );

    return res.json({
      success: true,
      symbol:     upperSymbol,
      period:     period || null,
      barMinutes,
      from:       fromDate ? fromDate.toISOString() : null,
      to:         toDate   ? toDate.toISOString()   : null,
      count:      history.length,
      data: history.map(r => ({
        timestamp: r.timestamp,
        price:     r.price  ?? r.close,
        open:      r.open   ?? r.price ?? r.close,
        high:      r.high   ?? r.price ?? r.close,
        low:       r.low    ?? r.price ?? r.close,
        close:     r.close  ?? r.price,
      })),
    });

  } catch (error) {
    console.error('getStockHistory error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/prices/:symbol
 */
const getLatestPrice = (req, res) => {
  try {
    const { symbol }  = req.params;
    const upperSymbol = symbol.toUpperCase();
    const { getPrices } = require('../services/priceSimulator');
    const price = getPrices()[upperSymbol];

    if (!price) return res.status(404).json({ message: `Stock not found: ${upperSymbol}` });

    return res.json({
      success:   true,
      symbol:    upperSymbol,
      price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('getLatestPrice error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getStockHistory, getLatestPrice };
