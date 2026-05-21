const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const API = 'https://api.telegram.org/bot' + TOKEN;

const GAME_SHORT_NAMES = {
  '2048': 'Xiaoxiaole',
  'particle': 'particleblast'
};

const gameUrls = {
  'Xiaoxiaole': 'https://www.mohuan.asia/games/2048/',
  'particleblast': 'https://www.mohuan.asia/games/particle/'
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

      if (text === '/start') {
        const username = msg.from.username || msg.from.first_name;
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 欢迎 ' + username + ' 来到墨焕游戏！\n\n选择你想玩的游戏：\n\n/xiaoxiaole - 消消乐2048\n/particle - 粒子消除\n\n或者直接在聊天框输入：\n@MyGame2048Bot 来搜索游戏！'
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
      const userId = cb.from.id;
      let chatId = null;
      if (cb.message && cb.message.chat) {
        chatId = cb.message.chat.id;
      }

      let gameUrl = gameUrls[gameShortName] || 'https://www.mohuan.asia/';
      const fullUrl = gameUrl + '?user_id=' + userId + (chatId ? '&chat_id=' + chatId : '');

      await telegramAPI('answerCallbackQuery', {
        callback_query_id: cb.id,
        url: fullUrl
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
