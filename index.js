require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN);

const sendMessage = async (message) => {
  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
  } catch (error) {
    console.error('Telegram Error:', error.message);
  }
};

const filters = [
  {
    name: "Break >2",
    url: "https://scanner.tradingview.com/crypto/scan",
    payload: {
      symbols: { screener: "crypto", exchange: "BINANCE" },
      columns: ["name", "close"],
      filter: [
        { left: "relative_volume_10d", operation: "greater", right: 2 },
        { left: "close", operation: "greater", right: 10 }
      ]
    }
  },
  {
    name: "Break >3",
    url: "https://scanner.tradingview.com/crypto/scan",
    payload: {
      symbols: { screener: "crypto", exchange: "BYBIT" },
      columns: ["name", "close"],
      filter: [
        { left: "change_1h", operation: "greater", right: 3 },
        { left: "close", operation: "greater", right: 10 }
      ]
    }
  },
  {
    name: "EMA(5) > EMA(20)",
    url: "https://scanner.tradingview.com/crypto/scan",
    payload: {
      symbols: { screener: "crypto", exchange: "BYBIT" },
      columns: ["name", "close"],
      filter: [
        { left: "close", operation: "greater", right: 10 },
        { left: "ta.ema(5)", operation: "greater", right: { left: "ta.ema(20)" } }
      ]
    }
  }
];

const scanFilters = async () => {
  for (const filter of filters) {
    try {
      const res = await axios.post(filter.url, filter.payload);
      const results = res.data.data;

      if (results.length > 0) {
        let message = `📡 *${filter.name}* Alert:\n`;
        results.forEach(r => {
          message += `・${r.d[0]} → $${r.d[1]}\n`;
        });
        await sendMessage(message);
      }
    } catch (err) {
      console.error(`${filter.name} Filter Error:`, err.message);
    }
  }
};

setInterval(scanFilters, 60000);
