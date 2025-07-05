const axios = require("axios");
require("dotenv").config();

const filters = [
  { name: "Breakout >2", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "Breakdown >3", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "bybit pretínanie", url: "https://scanner.tradingview.com/crypto/scan" },
];

const alreadySent = {};
const DELAY_MINUTES = 15;
const CHECK_INTERVAL_MS = 60 * 1000;

const sendTelegramMessage = async (message) => {
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown"
  });
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const checkFilters = async () => {
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
        const newTickers = [];

        for (const item of response.data.data) {
          const ticker = item.d[0];
          const lastSent = alreadySent[ticker];
          const now = Date.now();

          if (!lastSent || now - lastSent > DELAY_MINUTES * 60 * 1000) {
            alreadySent[ticker] = now;
            const time = getCurrentTime();
            newTickers.push(`🎯 *Coin:* ${ticker}\n🕒 *Objavený:* ${time}`);
          }
        }

        if (newTickers.length > 0) {
          const message = `🔔 *Filter:* ${filter.name}\n\n${newTickers.join("\n\n")}`;
          await sendTelegramMessage(message);
        }
      }
    } catch (error) {
      console.error(`❌ Chyba pri filtre ${filter.name}:`, error.message);
    }
  }
};

setInterval(checkFilters, CHECK_INTERVAL_MS);
