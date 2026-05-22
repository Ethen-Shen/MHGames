const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const API = 'https://api.telegram.org/bot' + TOKEN;

const GAME_SHORT_NAMES = {
  '2048': 'Xiaoxiaole',
  'particle': 'particleblast'
};

const gameUrls = {
  'Xiaoxiaole': 'https://www.mohuan.asia/games/2048/index.html',
  'particleblast': 'https://www.mohuan.asia/games/particle/index.html'
};

async function telegramAPI(method, body) {
  const res = await fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'Telegram Bot Webhook is running' });
  }

  try {
    const update = req.body;

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';

      if (text === '/start' || text === '/play') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['2048']
        });
      }
      else if (text === '/xiaoxiaole') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['2048']
        });
      }
      else if (text === '/particle') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['particle']
        });
      }
    }
    else if (update.callback_query) {
      const cb = update.callback_query;
      const gameShortName = cb.game_short_name;

      let gameUrl = gameUrls[gameShortName] || 'https://www.mohuan.asia/';

      await telegramAPI('answerCallbackQuery', {
        callback_query_id: cb.id,
        url: gameUrl
      });
    }
    else if (update.inline_query) {
      const iq = update.inline_query;
      await telegramAPI('answerInlineQuery', {
        inline_query_id: iq.id,
        cache_time: 0,
        is_personal: true,
        results: [
          { type: 'game', id: '1', game_short_name: GAME_SHORT_NAMES['2048'] },
          { type: 'game', id: '2', game_short_name: GAME_SHORT_NAMES['particle'] }
        ]
      });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ ok: true });
  }
};