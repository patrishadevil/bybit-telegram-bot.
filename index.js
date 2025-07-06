
const axios = require("axios");
require("dotenv").config();

const filters = [
  { name: "Breakout >2", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "Breakdown >3", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "bybit pretínanie", url: "https://scanner.tradingview.com/crypto/scan" },
];

const alreadySent = {};
const COOLDOWN = 15 * 60 * 1000; // 15 minút

const sendTelegramMessage = async (message) => {
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown"
  });
};

const checkFilters = async () => {
  const now = Date.now();
  for (const filter of filters) {
    try {
      const response = await axios.post(filter.url, {
        filter: [],
        symbols: { query: { types: [] }, tickers: [] },
        columns: ["name", "close"],
      }, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 && response.data.data.length > 0) {
        const freshCoins = [];
        for (const entry of response.data.data) {
          const ticker = entry.s;
          if (!alreadySent[ticker] || now - alreadySent[ticker] > COOLDOWN) {
            alreadySent[ticker] = now;
            const time = new Date(now).toLocaleTimeString("sk-SK");
            freshCoins.push(`➡️ ${ticker} (_${time}_)`);
          }
        }

        if (freshCoins.length > 0) {
          const message = `🔔 *${filter.name}* našiel ${freshCoins.length} tickerov:\n${freshCoins.join("\n")}`;
          await sendTelegramMessage(message);
        }
      }
    } catch (error) {
      console.error(`❌ ${filter.name} Filter Error:`, error.message);
    }
  }
};

setInterval(checkFilters, 60 * 1000); // Každú 1 minútu
