
import axios from "axios";
import cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SENT_COINS = new Map(); // coin+filter => lastSentTime

const FILTERS = [
  {
    name: "🚀 Break >2",
    url: "https://www.tradingview.com/crypto-screener/?filter=bitfinex~relvolume_above_2_and_price_above_10",
  },
  {
    name: "📈 Bybit pretínanie EMA",
    url: "https://www.tradingview.com/crypto-screener/?filter=bybit~ema5_cross_ema20_and_price_above_10",
  },
  {
    name: "⚡ Break >3",
    url: "https://www.tradingview.com/crypto-screener/?filter=bitfinex~change1h_above_3_and_price_above_10",
  },
  {
    name: "🔻 Breakdown >2",
    url: "https://www.tradingview.com/crypto-screener/?filter=bitfinex~chg1h_below_-2_and_price_above_10",
  },
  {
    name: "💤 Low Volume <2",
    url: "https://www.tradingview.com/crypto-screener/?filter=bitfinex~price_below_10_and_volume_below_2",
  },
];

async function sendToTelegram(message) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });
}

async function scrapeFilter(filter) {
  try {
    const { data } = await axios.get(filter.url);
    const $ = cheerio.load(data);
    const rows = $('a[href*="/symbols/"]');

    const now = Date.now();

    for (let i = 0; i < rows.length; i++) {
      const symbol = $(rows[i]).text().trim();
      const key = `${symbol}-${filter.name}`;
      const lastSent = SENT_COINS.get(key);

      if (!lastSent || now - lastSent > 15 * 60 * 1000) {
        await sendToTelegram(`🔍 <b>${filter.name}</b>\n🎯 Coin: <code>${symbol}</code>`);
        SENT_COINS.set(key, now);
      }
    }
  } catch (err) {
    console.error(`Error with filter ${filter.name}:`, err.message);
  }
}

async function runAllFilters() {
  for (const filter of FILTERS) {
    await scrapeFilter(filter);
  }
}

setInterval(runAllFilters, 60 * 1000); // Každú 1 minútu
console.log("⏳ Bot beží a skenuje filtre každú minútu...");

