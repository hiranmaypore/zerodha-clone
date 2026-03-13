const STOCKS = require('../config/stocks');

// ── Realistic market news generator ──
// In production, this would connect to a real RSS/API feed
// For the clone, we generate contextual, realistic-looking news

const HEADLINE_TEMPLATES = {
  IT: [
    '{name} wins $400M cloud deal with Fortune 500 client',
    '{name} expands AI capabilities with new R&D center in Hyderabad',
    '{name} reports strong Q3 revenue beat, margins expand 120bps',
    'Analysts upgrade {symbol} citing robust digital transformation pipeline',
    '{name} announces 1:1 bonus share issue for shareholders',
    '{name} partners with Microsoft for enterprise AI solutions',
    'Foreign institutional investors increase stake in {symbol} by 2.3%',
  ],
  Banking: [
    '{name} Q3 NPA ratio drops to 1.2%, lowest in 5 years',
    'RBI approves {name}\'s ₹5,000 Cr QIP; shares rally',
    '{name} launches UPI 3.0 with real-time cross-border payments',
    '{symbol} sees 34% YoY growth in retail lending segment',
    'Credit Suisse maintains Outperform on {symbol}, raises target to ₹1,450',
    '{name} reports record profit of ₹12,800 Cr in Q3FY26',
  ],
  Energy: [
    '{name} acquires Houston-based green hydrogen startup for $1.2B',
    '{name}\'s Jio Platforms announces FTTH expansion to Tier-3 cities',
    '{symbol} surges 4% after oil refining margins hit 18-month high',
    'Mukesh Ambani outlines net-zero plan at {name} AGM',
  ],
  Telecom: [
    '{name} adds 8.2M subscribers in February, extends market lead',
    '{name} unveils 5G standalone network across 200 cities',
    'ARPU for {symbol} rises to ₹225, exceeding Street estimates',
  ],
  FMCG: [
    '{name} launches premium organic product line targeting urban millennials',
    '{symbol} dividend yield hits 5.2%, highest among FMCG peers',
    'Rural demand recovery boosts {name}\'s volume growth to 8%',
  ],
  Auto: [
    '{name} EV sales jump 180% YoY, Nexon EV leads segment',
    '{symbol} unveils new compact SUV at Auto Expo, bookings open',
    '{name} achieves record monthly exports of 42,000 units',
  ],
  Pharma: [
    '{name} receives USFDA approval for generic version of blockbuster drug',
    '{symbol} signs $800M licensing deal with Pfizer for biosimilar',
  ],
  Consumer: [
    '{name} expands into luxury watches segment, targets ₹5,000 Cr revenue',
    '{symbol} stock hits all-time high on strong wedding season demand',
  ],
  default: [
    'Markets rally as {symbol} leads sectoral gains',
    '{name} board approves ₹2,000 Cr share buyback program',
    'Institutional investors accumulate {symbol} ahead of quarterly results',
    'Technical breakout: {symbol} crosses key resistance of 200-DMA',
    'MSCI rejig: {symbol} added to India large-cap index',
  ],
};

const CATEGORIES = ['Markets', 'Earnings', 'IPO', 'Global', 'Commodities', 'Policy', 'Tech'];
const SOURCES = ['Moneycontrol', 'Economic Times', 'Livemint', 'Business Standard', 'CNBC-TV18', 'Bloomberg Quint', 'Reuters India'];

const SENTIMENT_TAGS = ['Bullish', 'Bearish', 'Neutral', 'Breaking', 'Analysis'];

function generateNews() {
  const news = [];
  const now = Date.now();

  // Generate 20 news items
  const shuffledStocks = [...STOCKS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 20; i++) {
    const stock = shuffledStocks[i % shuffledStocks.length];
    const sector = stock.sector || 'default';
    const templates = HEADLINE_TEMPLATES[sector] || HEADLINE_TEMPLATES.default;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const headline = template
      .replace('{name}', stock.name)
      .replace('{symbol}', stock.symbol);

    const minutesAgo = Math.floor(Math.random() * 720); // within last 12 hours
    const timestamp = new Date(now - minutesAgo * 60000);

    news.push({
      id: `news_${i}_${Date.now()}`,
      headline,
      symbol: stock.symbol,
      sector: sector,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      sentiment: SENTIMENT_TAGS[Math.floor(Math.random() * SENTIMENT_TAGS.length)],
      timestamp: timestamp.toISOString(),
      minutesAgo,
      impact: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
    });
  }

  // Sort by most recent
  news.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return news;
}

// Global feed (generated once per 5 minutes to simulate "live" feel)
let cachedNews = null;
let cacheTime = 0;

exports.getMarketNews = (req, res) => {
  try {
    const now = Date.now();
    if (!cachedNews || (now - cacheTime) > 5 * 60 * 1000) {
      cachedNews = generateNews();
      cacheTime = now;
    }

    const { symbol, category, limit } = req.query;
    let filtered = [...cachedNews];

    if (symbol) {
      filtered = filtered.filter(n => n.symbol === symbol.toUpperCase());
    }
    if (category) {
      filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }

    const count = parseInt(limit) || 20;
    res.json({ success: true, news: filtered.slice(0, count) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching news', error: error.message });
  }
};
