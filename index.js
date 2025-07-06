const axios = require("axios");
require("dotenv").config();

const filters = [
  { name: "Breakout >2", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "Breakdown >3", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "bybit pretínanie", url: "https://scanner.tradingview.com/crypto/scan" },
];

const lastAlertTime = {}; // coin -> timestamp posledného poslania
const firstSeenTime = {}; // coin -> timestamp prvého nájdenia
const DELAY_MS = 15 * 60 * 1000; // 15 minút

const sendTelegramMessage = async (message) => {
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown"
  });
};

const getTimeString = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const checkFilters = async () => {
  for (const filter of filters) {
    try {
      const response = await axios.post(filter.url, {
        filter: [],
        symbols: { query: { types: [] }, tickers: [] }
      }, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 && response.data.data.length > 0) {
        const now = Date.now();
        const newCoins = response.data.data
          .map(entry => entry.s)
          .filter(coin => {
            if (!lastAlertTime[coin]) return true;
            return now - lastAlertTime[coin] > DELAY_MS;
          })
          .slice(0, 10); // max 10 coinov

        if (newCoins.length > 0) {
          const coinList = newCoins.map(coin => {
            if (!firstSeenTime[coin]) firstSeenTime[coin] = now;
            lastAlertTime[coin] = now;

            const time = getTimeString(firstSeenTime[coin]);
            const isNew = now - firstSeenTime[coin] < 10000; // nový = našlo pred <10 sek
            return `${isNew ? "🎯 " : ""}• ${coin} 🕒 ${time}`;
          }).join("\n");

          const message = `🚨 *${filter.name}* našiel ${newCoins.length} coinov:\n\n${coinList}`;
          await sendTelegramMessage(message);
        }
      }
    } catch (error) {
      console.error(`❌ ${filter.name} Filter Error:`, error.message);
    }
  }
};

setInterval(checkFilters, 60 * 1000); // každú 1 minútu
