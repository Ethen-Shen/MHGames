const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';

const GAME_URL_2048 = 'https://mohuan.asia/games/2048/index.html';
const GAME_URL_PARTICLE = 'https://mohuan.asia/games/particle/index.html';

const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

console.log('🤖 墨焕游戏 Bot 已启动！');

bot.onText(/\/start/, function(msg) {
  var chatId = msg.chat.id;
  var username = msg.from.username || msg.from.first_name;

  var opts = {
    parse_mode: 'Markdown',
    reply_markup: {
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
    }
  };

  bot.sendMessage(chatId, '🎮 欢迎 ' + username + ' 来到墨焕游戏！\n\n选择一个游戏开始吧：', opts)
    .then(function() { console.log('✅ 欢迎消息已发送给 ' + chatId); })
    .catch(function(err) { console.error('❌ 发送失败:', err); });
});

bot.onText(/\/play/, function(msg) {
  var chatId = msg.chat.id;

  var opts = {
    reply_markup: {
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
    }
  };

  bot.sendMessage(chatId, '🎮 选择一个游戏：', opts)
    .then(function() { console.log('✅ 游戏列表已发送给 ' + chatId); })
    .catch(function(err) { console.error('❌ 发送失败:', err); });
});

bot.onText(/\/2048/, function(msg) {
  var chatId = msg.chat.id;

  var opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Play Neon 2048',
            web_app: { url: GAME_URL_2048 }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, '🎮 Neon 2048 - 点击开始：', opts);
});

bot.onText(/\/particle/, function(msg) {
  var chatId = msg.chat.id;

  var opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '💥 Play Particle Blast',
            web_app: { url: GAME_URL_PARTICLE }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, '💥 Particle Blast - 点击开始：', opts);
});

bot.onText(/\/help/, function(msg) {
  var chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '🎮 墨焕游戏 - 帮助\n\n' +
    '/play - 选择游戏\n' +
    '/2048 - Neon 2048\n' +
    '/particle - Particle Blast\n' +
    '/help - 显示此帮助'
  );
});

bot.on('polling_error', function(err) {
  console.error('❌ Polling错误:', err.message);
});

bot.on('error', function(err) {
  console.error('❌ Bot错误:', err.message);
});

console.log('✨ Bot已准备好，等待消息！');
