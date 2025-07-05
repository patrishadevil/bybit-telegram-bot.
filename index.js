const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const lastSent = {};

const delayMinutes = 15;

async function sendTelegramMessage(message) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown"
  });
}

function shouldSend(symbol) {
  const now = Date.now();
  if (!lastSent[symbol] || now - lastSent[symbol] > delayMinutes * 60 * 1000) {
    lastSent[symbol] = now;
    return true;
  }
  return false;
}

async function scan() {
  try {
    const response = await axios.get("https://scanner.tradingview.com/crypto/scan", {
      method: "POST",
      data: {}
    });

    const coins = response.data.data;

    const matched = [];

    for (const coin of coins) {
      const s = coin.s;
      const d = coin.d;
      
      const relVol = d[4];
      const price = d[0];
      const chg1h = d[2];
      const ema5 = d[6];
      const ema20 = d[7];
      const exchange = d[5];

      const matchedFilters = [];

      if (relVol > 2 && price > 10) {
        matchedFilters.push("🔥 Break >2");
      }

      if (chg1h > 3 && price > 10) {
        matchedFilters.push("📉 Breakdown >3");
      }

      if (exchange === "BYBIT" && price > 10 && ema5 > ema20) {
        matchedFilters.push("⚡ EMA Cross (Bybit)");
      }

      if (matchedFilters.length && shouldSend(s)) {
        matched.push({ symbol: s, filters: matchedFilters });
      }
    }

    for (const m of matched) {
      const msg = `🚨 *${m.symbol}* splnil: ${m.filters.join(" + ")}`;
      await sendTelegramMessage(msg);
    }

  } catch (error) {
    console.error("❌ CHYBA PRI SKENOVANÍ:", error.message);
  }
}

setInterval(scan, 60 * 1000); // každú 1 minútu
