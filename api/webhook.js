const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const API = 'https://api.telegram.org/bot' + TOKEN;

const GAME_URL_2048 = 'https://mohuan.asia/games/2048/index.html';
const GAME_URL_PARTICLE = 'https://mohuan.asia/games/particle/index.html';

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
      { command: 'play', description: '选择游戏' },
      { command: '2048', description: 'Neon 2048' },
      { command: 'particle', description: 'Particle Blast' },
      { command: 'help', description: '帮助信息' }
    ]
  });
}

let commandsRegistered = false;

function buildGameKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🎮 Neon 2048',
          web_app: { url: GAME_URL_2048 }
        }
      ],
      [
        {
          text: '💥 Particle Blast',
          web_app: { url: GAME_URL_PARTICLE }
        }
      ]
    ]
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    if (!commandsRegistered) {
      registerCommands().then(function() { commandsRegistered = true; }).catch(function() {});
    }
    return res.status(200).json({ status: 'ok', message: 'Telegram Bot Webhook is running' });
  }

  try {
    const update = req.body;

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = (msg.text || '').trim();

      if (text === '/start' || text === '/start@MyGame2048Bot') {
        var username = msg.from.username || msg.from.first_name;
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 欢迎 ' + username + ' 来到墨焕游戏！\n\n选择一个游戏开始吧：',
          reply_markup: buildGameKeyboard()
        });
      }
      else if (text === '/play' || text === '/play@MyGame2048Bot') {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 选择一个游戏：',
          reply_markup: buildGameKeyboard()
        });
      }
      else if (text === '/2048' || text === '/2048@MyGame2048Bot') {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 Neon 2048 - 点击开始：',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Play Neon 2048', web_app: { url: GAME_URL_2048 } }]
            ]
          }
        });
      }
      else if (text === '/particle' || text === '/particle@MyGame2048Bot') {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '💥 Particle Blast - 点击开始：',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💥 Play Particle Blast', web_app: { url: GAME_URL_PARTICLE } }]
            ]
          }
        });
      }
      else if (text === '/help' || text === '/help@MyGame2048Bot') {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 墨焕游戏 - 帮助\n\n/play - 选择游戏\n/2048 - Neon 2048\n/particle - Particle Blast\n/help - 显示此帮助'
        });
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ ok: true });
  }
};
