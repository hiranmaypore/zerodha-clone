import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const STOCKS_DIR = path.join(__dirname, '../public/stocks');

if (!fs.existsSync(STOCKS_DIR)) {
  fs.mkdirSync(STOCKS_DIR, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location.startsWith('http') ? res.headers.location : `https://www.google.com${res.headers.location}`, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function main() {
  console.log('Fetching stock logos...');
  for (const [symbol, domain] of Object.entries(STOCK_DOMAINS)) {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const dest = path.join(STOCKS_DIR, `${symbol}.png`);
    try {
      await downloadImage(url, dest);
      console.log(`✅ Saved ${symbol}.png`);
    } catch (err) {
      console.error(`❌ Failed ${symbol}: ${err.message}`);
      // fallback to clearbit if google fails, but use standard https
      try {
        const fallbackUrl = `https://icon.horse/icon/${domain}`;
        await downloadImage(fallbackUrl, dest);
        console.log(`✅ Saved ${symbol}.png (fallback)`);
      } catch (err2) {
        console.error(`❌ Fallback failed ${symbol}: ${err2.message}`);
      }
    }
    await delay(200); // polite rate limit
  }
  console.log('Done downloading logos.');
}

main().catch(console.error);
