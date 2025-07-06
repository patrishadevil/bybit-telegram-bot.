const axios = require("axios");
require("dotenv").config();

const filters = [
  { name: "Breakout >2", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "Breakdown >3", url: "https://scanner.tradingview.com/crypto/scan" },
  { name: "bybit pretínanie", url: "https://scanner.tradingview.com/crypto/scan" },
];

const alreadyAlerted = {};
const ALERT_DELAY_MS = 15 * 60 * 1000; // 15 minút

const sendTelegramMessage = async (message) => {
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
  });
};

const checkFilters = async () => {
  const now = new Date();
  const currentTime = now.toTimeString().split(" ")[0]; // napr. "10:22:14"

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
        const coins = response.data.data
          .map(entry => entry.s) // napr. "BYBIT:BTCUSDT"
          .filter(ticker => {
            const lastAlert = alreadyAlerted[ticker];
            return !lastAlert || (now - lastAlert > ALERT_DELAY_MS);
          });

        coins.forEach(ticker => {
          alreadyAlerted[ticker] = now;
        });

        if (coins.length > 0) {
          const message = `🔔 *${filter.name}* našiel ${coins.length} tickerov:\n` +
            coins.map(c => `🎯 ${c} (čas: ${currentTime})`).join("\n");

          await sendTelegramMessage(message);
        }
      }
    } catch (error) {
      console.error(`❌ ${filter.name} Filter Error:`, error.message);
    }
  }
};

setInterval(checkFilters, 60 * 1000); // Spúšťaj každú minútu
