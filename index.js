const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const TELEGRAM_TOKEN = '7797780157:AAGDbW7Gwndaajkx8GXYnYSmkoryAsj7GNs';
const TELEGRAM_CHAT_ID = '5955557541';

const filters = [
  'Breakout>2',
  'breakdown >3',
  'bybit pretínanie'
];

const alreadyAlerted = {};
const ALERT_DELAY_MINUTES = 15;
const SCAN_INTERVAL_MS = 60 * 1000;

async function fetchFilterResults(filter) {
  try {
    const url = `https://www.tradingview.com/crypto-screener/?filter=${encodeURIComponent(filter)}`;
    const response = await axios.get(url);
    const html = response.data;

    const regex = /"ticker":"(.*?)"/g;
    const matches = html.matchAll(regex);
    const tickers = [...matches].map(m => m[1]);

    const now = Date.now();
    const freshTickers = tickers.filter(ticker => {
      if (!alreadyAlerted[ticker]) return true;
      return now - alreadyAlerted[ticker] > ALERT_DELAY_MINUTES * 60 * 1000;
    });

    for (const ticker of freshTickers) {
      alreadyAlerted[ticker] = now;
    }

    if (freshTickers.length > 0) {
      console.log(`✅ Filter: ${filter} | Tickery: ${freshTickers.join(', ')}`);
    }

    return freshTickers;
  } catch (error) {
    console.error(`❌ Chyba pri filtrovaní ${filter}:`, error.message);
    return [];
  }
}

async function scanAndAlert() {
  for (const filter of filters) {
    const coins = await fetchFilterResults(filter);
    if (coins.length > 0) {
      const message = `🚨 *Filter:* ${filter}\n🎯 *Tickery:* ${coins.join(', ')}`;
      await sendTelegramMessage(message);
    }
  }
}

async function sendTelegramMessage(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('❌ Chyba pri posielaní správy do Telegramu:', error.message);
  }
}

app.get('/', (req, res) => {
  res.send('🚀 TradingView Telegram Alert beží!');
});

app.listen(port, async () => {
  console.log(`🚀 Server beží na porte ${port}`);
  await sendTelegramMessage('✅ Test: Server beží a Telegram funguje!');
  setInterval(scanAndAlert, SCAN_INTERVAL_MS);
});
