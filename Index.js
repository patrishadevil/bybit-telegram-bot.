
const axios = require("axios");
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

const TradingView = require("@mathieuc/tradingview-scraper");

const client = new TradingView.Client();

async function scanAndSend() {
    const screener = new TradingView.Screener('crypto', 'crypto_mkt');

    // 1. Break >2
    const break2 = await screener.scan([
        { left: "relative_volume", operation: "greater", right: 2 },
        { left: "close", operation: "greater", right: 10 }
    ]);

    // 2. Bybit pretinanie
    const bybitCross = await screener.scan([
        { left: "exchange", operation: "equal", right: "BYBIT" },
        { left: "close", operation: "greater", right: 10 },
        {
            left: "TA.EMA|5",
            operation: "greater",
            right: "TA.EMA|20"
        }
    ]);

    // 3. Break >3
    const break3 = await screener.scan([
        { left: "change_1h", operation: "greater", right: 3 },
        { left: "close", operation: "greater", right: 10 }
    ]);

    const allResults = [
        { name: "Break >2", matches: break2 },
        { name: "Bybit pretinanie", matches: bybitCross },
        { name: "Break >3", matches: break3 }
    ];

    for (const filter of allResults) {
        if (filter.matches.length > 0) {
            const tickers = filter.matches.map(m => m.s).join(", ");
            const text = `📊 *${filter.name}*
Tickers: ${tickers}`;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: "Markdown"
            });
        }
    }

    client.end();
}

setInterval(scanAndSend, 60 * 1000); // každú minútu
