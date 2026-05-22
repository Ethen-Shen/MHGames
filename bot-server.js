const TelegramBot = require('node-telegram-bot-api');

const BOT1_TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const BOT2_TOKEN = '8896711967:AAG8tStYIwVSCPMyCzx-wH22pYqQcXoet-E';

const GAME_URL_2048 = 'https://mohuan.asia/games/2048/index.html';
const GAME_URL_PARTICLE = 'https://mohuan.asia/games/particle/index.html';

var bot1 = new TelegramBot(BOT1_TOKEN, {
  polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
});
var bot2 = new TelegramBot(BOT2_TOKEN, {
  polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
});

console.log('🤖 Bot1 (Neon 2048) 已启动！');
console.log('🤖 Bot2 (Particle Blast) 已启动！');

// ========== Bot1: Neon 2048 ==========

bot1.onText(/\/start/, function(msg) {
  var chatId = msg.chat.id;
  var username = msg.from.username || msg.from.first_name;
  bot1.sendMessage(chatId, '🎮 欢迎 ' + username + ' 来到 Neon 2048！\n\n点击下方按钮开始游戏：', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Play Neon 2048', web_app: { url: GAME_URL_2048 } }]
      ]
    }
  });
});

bot1.onText(/\/play/, function(msg) {
  var chatId = msg.chat.id;
  bot1.sendMessage(chatId, '🎮 Neon 2048 - 点击开始：', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Play Neon 2048', web_app: { url: GAME_URL_2048 } }]
      ]
    }
  });
});

bot1.onText(/\/help/, function(msg) {
  bot1.sendMessage(msg.chat.id,
    '🎮 Neon 2048 - 帮助\n\n' +
    '/start - 开始\n' +
    '/play - 开始游戏\n' +
    '/help - 帮助信息'
  );
});

// ========== Bot2: Particle Blast ==========

bot2.onText(/\/start/, function(msg) {
  var chatId = msg.chat.id;
  var username = msg.from.username || msg.from.first_name;
  bot2.sendMessage(chatId, '💥 欢迎 ' + username + ' 来到 Particle Blast！\n\n点击下方按钮开始游戏：', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💥 Play Particle Blast', web_app: { url: GAME_URL_PARTICLE } }]
      ]
    }
  });
});

bot2.onText(/\/play/, function(msg) {
  var chatId = msg.chat.id;
  bot2.sendMessage(chatId, '💥 Particle Blast - 点击开始：', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💥 Play Particle Blast', web_app: { url: GAME_URL_PARTICLE } }]
      ]
    }
  });
});

bot2.onText(/\/help/, function(msg) {
  bot2.sendMessage(msg.chat.id,
    '💥 Particle Blast - 帮助\n\n' +
    '/start - 开始\n' +
    '/play - 开始游戏\n' +
    '/help - 帮助信息'
  );
});

// ========== 错误处理 ==========

bot1.on('polling_error', function(err) { console.error('❌ Bot1 Polling错误:', err.message); });
bot1.on('error', function(err) { console.error('❌ Bot1 错误:', err.message); });
bot2.on('polling_error', function(err) { console.error('❌ Bot2 Polling错误:', err.message); });
bot2.on('error', function(err) { console.error('❌ Bot2 错误:', err.message); });

console.log('✨ 双 Bot 已准备好，等待消息！');
