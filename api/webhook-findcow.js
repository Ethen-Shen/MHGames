const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN_FINDCOW || '8888888888:PLACEHOLDER_BOT3_TOKEN_FINDCOW';
const API = 'https://api.telegram.org/bot' + TOKEN;

const GAME_URL_FINDCOW = 'https://mohuan.asia/games/findcow/index.html';

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
    return res.status(200).json({ status: 'ok', message: 'Bot3 (Find the Bull) Webhook is running' });
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
          text: '🐂 ' + (text.startsWith('/start') ? '欢迎 ' + username + ' 来到 Find the Bull！' : 'Find the Bull') + '\n\n点击下方按钮开始游戏：',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🐂 Play Find the Bull', web_app: { url: GAME_URL_FINDCOW } }]
            ]
          }
        });
      }
      else if (text.startsWith('/help')) {
        await telegramAPI('sendMessage', {
          chat_id: chatId,
          text: '🐂 Find the Bull - 帮助\n\n/start - 开始\n/play - 开始游戏\n/help - 帮助信息'
        });
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ ok: true });
  }
};
