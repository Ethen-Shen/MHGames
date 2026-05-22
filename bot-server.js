const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';

const GAME_SHORT_NAME = 'Xiaoxiaole';

const gameUrls = {
  'Xiaoxiaole': 'https://t.me/MyGame2048Bot/Xiaoxiaole'
};

const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

console.log('🤖 Neon 2048 Bot已启动！');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  const message = `🎮 欢迎 ${username} 来到 Neon 2048！

/play - 开始游戏
/xiaoxiaole - Neon 2048
/help - 帮助信息

或者直接在聊天框输入：
@MyGame2048Bot 来搜索游戏！`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => console.log(`✅ 欢迎消息已发送给 ${chatId}`))
    .catch(err => console.error('❌ 发送失败:', err));
});

bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  sendGame(chatId);
});

bot.onText(/\/xiaoxiaole/, (msg) => {
  const chatId = msg.chat.id;
  sendGame(chatId);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🎮 Neon 2048 - 帮助\n\n' +
    '/play - 开始 Neon 2048 游戏\n' +
    '/xiaoxiaole - Neon 2048\n' +
    '/rank - 查看排行榜\n' +
    '/help - 显示此帮助\n\n' +
    '💡 你也可以在聊天框输入 @MyGame2048Bot 来搜索游戏！'
  );
});

bot.onText(/\/rank/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🏆 排行榜功能即将上线，敬请期待！');
});

function sendGame(chatId) {
  console.log(`🎯 发送游戏 "${GAME_SHORT_NAME}" 到 ${chatId}`);
  
  bot.sendGame(chatId, GAME_SHORT_NAME)
    .then(() => console.log(`✅ 游戏 "${GAME_SHORT_NAME}" 已发送到 ${chatId}`))
    .catch(err => {
      console.error('❌ 发送游戏失败:', err.message);
      bot.sendMessage(chatId, '⚠️ 抱歉，游戏暂时无法发送，请稍后再试！')
        .catch(e => console.error('❌ 发送错误消息失败:', e));
    });
}

bot.on('callback_query', (callbackQuery) => {
  try {
    const gameShortName = callbackQuery.game_short_name;
    const userId = callbackQuery.from.id;

    console.log(`🎮 用户 ${userId} 点击游戏 ${gameShortName}`);

    let gameUrl = gameUrls[gameShortName] || 'https://www.mohuan.asia/';

    console.log(`🔗 打开游戏URL: ${gameUrl}`);

    bot.answerCallbackQuery(callbackQuery.id, {
      url: gameUrl
    }).then(() => {
      console.log(`✅ 成功打开游戏 ${gameShortName} 给用户 ${userId}`);
    }).catch(err => {
      console.error('❌ 回答回调失败:', err);
    });
  } catch (err) {
    console.error('❌ 处理回调查询时出错:', err);
  }
});

bot.on('inline_query', (inlineQuery) => {
  const results = [
    { type: 'game', id: '1', game_short_name: GAME_SHORT_NAME }
  ];

  bot.answerInlineQuery(inlineQuery.id, results, {
    cache_time: 0,
    is_personal: true
  }).catch(err => console.error('❌ 内联查询失败:', err));
});

bot.on('polling_error', (err) => {
  console.error('❌ Polling错误:', err.message);
});

bot.on('error', (err) => {
  console.error('❌ Bot错误:', err.message);
});

console.log('✨ Bot已准备好，等待消息！');
