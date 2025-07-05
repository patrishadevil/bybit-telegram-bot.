
const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_TOKEN = "7797780157:AAGDbW7Gwndaajkx8GXYnYSmkoryAsj7GNs";
const CHAT_ID = "5955557541";
const bot = new TelegramBot(TELEGRAM_TOKEN);

const FILTERS = [
  { name: "Breakout >2", url: "https://www.tradingview.com/crypto-screener/" },
  { name: "Breakdown >3", url: "https://www.tradingview.com/crypto-screener/" },
  { name: "bybit pretínanie", url: "https://www.tradingview.com/crypto-screener/" }
];

const sentCoins = new Map();

async function checkFilters() {
  for (const filter of FILTERS) {
    try {
      const response = await fetch(filter.url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const text = await response.text();

      const matches = text.match(/"text":"([A-Z0-9]+)"/g) || [];
      const coins = [...new Set(matches.map(m => m.split('"')[3]))];

      const now = Date.now();
      const coinsToSend = [];

      for (const coin of coins) {
        const lastSent = sentCoins.get(`${filter.name}-${coin}`) || 0;
        if (now - lastSent > 15 * 60 * 1000) {
          coinsToSend.push(coin);
          sentCoins.set(`${filter.name}-${coin}`, now);
        }
      }

      if (coinsToSend.length > 0) {
        const message = `🔔 *${filter.name}*

🎯 Nájdené coiny:
${coinsToSend.map(c => `• ${c}`).join("
")}`;
        await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
      }
    } catch (error) {
      console.error(`❌ CHYBA PRI SKENOVANÍ (${filter.name}):`, error.message);
    }
  }
}

setInterval(checkFilters, 60 * 1000);
checkFilters();
