const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const API = 'https://api.telegram.org/bot' + TOKEN;

const GAME_URL_2048 = 'https://mohuan.asia/games/2048/index.html';

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
      { command: 'help', description: '帮助信息' }
    ]
  });
}

let commandsRegistered = false;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    if (!commandsRegistered) {
      registerCommands().then(function() { commandsRegistered = true; }).catch(function() {});
    }
    return res.status(200).json({ status: 'ok', message: 'Bot1 (Neon 2048) Webhook is running' });
  }

  try {
    const update = req.body;

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = (msg.text || '').trim();

      if (text.startsWith('/start') || text.startsWith('/play')) {
        var username = msg.from.username || msg.from.first_name;
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 ' + (text.startsWith('/start') ? '欢迎 ' + username + ' 来到 Neon 2048！' : 'Neon 2048') + '\n\n点击下方按钮开始游戏：',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Play Neon 2048', web_app: { url: GAME_URL_2048 } }]
            ]
          }
        });
      }
      else if (text.startsWith('/help')) {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🎮 Neon 2048 - 帮助\n\n/start - 开始\n/play - 开始游戏\n/help - 帮助信息'
        });
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ ok: true });
  }
};
