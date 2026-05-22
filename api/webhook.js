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

async function registerCommands() {
  await telegramAPI('setMyCommands', {
    commands: [
      { command: 'start', description: '开始游戏' },
      { command: 'play', description: '开始游戏' },
      { command: 'help', description: '帮助信息' },
      { command: 'rank', description: '排行榜' },
      { command: 'xiaoxiaole', description: 'Neon 2048' },
      { command: 'particle', description: '粒子消除' }
    ]
  });
}

let commandsRegistered = false;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    if (!commandsRegistered) {
      registerCommands().then(() => { commandsRegistered = true; }).catch(() => {});
    }
    return res.status(200).json({ status: 'ok', message: 'Telegram Bot Webhook is running' });
  }

  try {
    const update = req.body;

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = (msg.text || '').trim();
      const userId = msg.from.id;

      if (text === '/start' || text === '/start@MyGame2048Bot') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['2048']
        });
      }
      else if (text === '/play' || text === '/play@MyGame2048Bot') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['2048']
        });
      }
      else if (text === '/xiaoxiaole' || text === '/xiaoxiaole@MyGame2048Bot') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['2048']
        });
      }
      else if (text === '/particle' || text === '/particle@MyGame2048Bot') {
        await telegramAPI('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAMES['particle']
        });
      }
      else if (text === '/help' || text === '/help@MyGame2048Bot') {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 墨焕游戏 - 帮助\n\n' +
            '/play - 开始 Neon 2048 游戏\n' +
            '/xiaoxiaole - Neon 2048\n' +
            '/particle - 粒子消除\n' +
            '/rank - 查看排行榜\n' +
            '/help - 显示此帮助\n\n' +
            '💡 你也可以在聊天框输入 @MyGame2048Bot 来搜索游戏！'
        });
      }
      else if (text === '/rank' || text === '/rank@MyGame2048Bot') {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🏆 排行榜功能即将上线，敬请期待！'
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