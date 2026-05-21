const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';

const GAME_SHORT_NAMES = {
  '2048': 'Xiaoxiaole',
  'particle': 'particleblast'
};

const gameUrls = {
  'Xiaoxiaole': 'https://www.mohuan.asia/games/2048/',
  'particleblast': 'https://www.mohuan.asia/games/particle/'
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

console.log('🤖 墨焕游戏Bot已启动！');
console.log('📝 游戏列表：', Object.keys(GAME_SHORT_NAMES));
console.log('🔗 游戏URL：', gameUrls);

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  const message = `🎮 欢迎 ${username} 来到墨焕游戏！

选择你想玩的游戏：

/xiaoxiaole - 消消乐2048
/particle - 粒子消除

或者直接在聊天框输入：
@MyGame2048Bot 来搜索游戏！`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => console.log(`✅ 欢迎消息已发送给 ${chatId}`))
    .catch(err => console.error('❌ 发送失败:', err));
});

bot.onText(/\/xiaoxiaole/, (msg) => {
  const chatId = msg.chat.id;
  sendGame(chatId, GAME_SHORT_NAMES['2048']);
});

bot.onText(/\/particle/, (msg) => {
  const chatId = msg.chat.id;
  sendGame(chatId, GAME_SHORT_NAMES['particle']);
});

function sendGame(chatId, gameShortName) {
  console.log(`🎯 发送游戏 "${gameShortName}" 到 ${chatId}`);
  
  bot.sendGame(chatId, gameShortName)
    .then(() => console.log(`✅ 游戏 "${gameShortName}" 已发送到 ${chatId}`))
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
    
    let chatId = null;
    if (callbackQuery.message && callbackQuery.message.chat) {
      chatId = callbackQuery.message.chat.id;
    }

    console.log(`🎮 用户 ${userId} 点击游戏 ${gameShortName}`);

    let gameUrl = gameUrls[gameShortName];
    
    if (!gameUrl) {
      gameUrl = 'https://www.mohuan.asia/';
    }

    const fullUrl = `${gameUrl}?user_id=${userId}${chatId ? '&chat_id=' + chatId : ''}`;

    console.log(`🔗 打开游戏URL: ${fullUrl}`);

    bot.answerCallbackQuery(callbackQuery.id, {
      url: fullUrl
    }).then(() => {
      console.log(`✅ 成功打开游戏 ${gameShortName} 给用户 ${userId}`);
    }).catch(err => {
      console.error('❌ 回答回调失败:', err);
      if (chatId) {
        bot.sendMessage(chatId, `点击这里玩游戏: ${fullUrl}`)
          .catch(e => console.error('❌ 发送备用URL失败:', e));
      }
    });
  } catch (err) {
    console.error('❌ 处理回调查询时出错:', err);
  }
});

bot.on('inline_query', (inlineQuery) => {
  const results = [
    { type: 'game', id: '1', game_short_name: GAME_SHORT_NAMES['2048'] },
    { type: 'game', id: '2', game_short_name: GAME_SHORT_NAMES['particle'] }
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
