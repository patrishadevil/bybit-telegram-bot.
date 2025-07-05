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

async function fetchFilterResults(filter) {
  try {
    const url = `https://www.tradingview.com/crypto-screener/?filter=${encodeURIComponent(filter)}`;
    const response = await axios.get(url);
    const html = response.data;

    const regex = /"ticker":"(.*?)"/g;
    const matches = html.matchAll(regex);
    const tickers = [...matches].map(m => m[1]);

    return tickers;
  } catch (error) {
    console.error(`❌ Chyba pri filtrovaní ${filter}:`, error.message);
    return [];
  }
}

async function scanAndAlert() {
  for (const filter of filters) {
    const coins = await fetchFilterResults(filter);
    if (coins.length > 0) {
      const message = `🚨 *Filter:* ${filter}\n💥 *Tickery:* ${coins.join(', ')}`;
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
  res.send('✅ TradingView Alert beží!');
});

app.listen(port, () => {
  console.log(`🚀 Server beží na porte ${port}`);
  setInterval(scanAndAlert, 60 * 1000); // každú 1 minútu
});
