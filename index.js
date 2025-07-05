require('dotenv').config();
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const filters = [
  {
    name: "Break >2",
    body: {
      filter: [
        {
          left: "relative_volume_10d",
          operation: "greater",
          right: 2
        },
        {
          left: "close",
          operation: "greater",
          right: 10
        }
      ],
      symbols: { screener: "crypto", exchange: "BINANCE", type: "crypto" },
      columns: ["name", "close", "change", "relative_volume_10d"]
    }
  },
  {
    name: "Break >3",
    body: {
      filter: [
        {
          left: "change_1h",
          operation: "greater",
          right: 3
        },
        {
          left: "close",
          operation: "greater",
          right: 10
        }
      ],
      symbols: { screener: "crypto", exchange: "BINANCE", type: "crypto" },
      columns: ["name", "close", "change_1h"]
    }
  },
  {
    name: "EMA(5) > EMA(20)",
    body: {
      filter: [
        {
          left: "technical_ema_5",
          operation: "greater",
          right: "technical_ema_20"
        },
        {
          left: "close",
          operation: "greater",
          right: 10
        }
      ],
      symbols: { screener: "crypto", exchange: "BYBIT", type: "crypto" },
      columns: ["name", "close", "technical_ema_5", "technical_ema_20"]
    }
  }
];

async function checkFilters() {
  for (const filter of filters) {
    try {
      const response = await axios.post(
        'https://scanner.tradingview.com/crypto/scan',
        filter.body,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const matches = response.data.data;
      if (matches.length > 0) {
        const message = `📈 ${filter.name} našiel:\n` + matches.map(m => `• ${m.d[0]} @ ${m.d[1]}`).join('\n');
        await sendTelegramMessage(message);
      } else {
        console.log(`${filter.name}: nič nenašlo`);
      }
    } catch (error) {
      console.error(`${filter.name} Filter Error:`, error.message);
    }
  }
}

async function sendTelegramMessage(text) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: text
  });
}

// Opakovanie každú minútu
setInterval(checkFilters, 60 * 1000);
checkFilters();
