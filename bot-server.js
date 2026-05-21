const TelegramBot = require('node-telegram-bot-api');

// 替换为你的Bot Token
const TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';

// 游戏简称
const GAME_SHORT_NAMES = {
  '2048': 'neon2048',
  'particle': 'particleblast'
};

// 🎮 游戏URL配置 - 使用正式域名
const gameUrls = {
  'neon2048': 'https://www.mohuan.asia/games/2048/',
  'particleblast': 'https://www.mohuan.asia/games/particle/'
};

// 创建Bot - 加入更多配置选项
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

// 处理 /start 命令
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  const message = `🎮 欢迎 ${username} 来到墨焕游戏！

选择你想玩的游戏：

/neon2048 - 2048霓虹灯版
/particle - 粒子消除

或者直接在聊天框输入：
@MoHuanGamesBot 来搜索游戏！`;

  const options = {
    parse_mode: 'Markdown'
  };

  bot.sendMessage(chatId, message, options)
    .then(() => console.log(`✅ 欢迎消息已发送给 ${chatId}`))
    .catch(err => console.error('❌ 发送失败:', err));
});

// 处理游戏命令
bot.onText(/\/neon2048/, (msg) => {
  const chatId = msg.chat.id;
  sendGame(chatId, GAME_SHORT_NAMES['2048']);
});

bot.onText(/\/particle/, (msg) => {
  const chatId = msg.chat.id;
  sendGame(chatId, GAME_SHORT_NAMES['particle']);
});

// 发送游戏
function sendGame(chatId, gameShortName) {
  console.log(`🎯 发送游戏 "${gameShortName}" 到 ${chatId}`);
  
  bot.sendGame(chatId, gameShortName)
    .then(() => console.log(`✅ 游戏 "${gameShortName}" 已发送到 ${chatId}`))
    .catch(err => {
      console.error('❌ 发送游戏失败:', err.message);
      
      // 如果游戏发送失败，给用户一个友好的提示
      bot.sendMessage(chatId, '⚠️ 抱歉，游戏暂时无法发送，请稍后再试！')
        .catch(e => console.error('❌ 发送错误消息失败:', e));
    });
}

// 处理回调查询（用户点击"开始游戏"按钮）
bot.on('callback_query', (callbackQuery) => {
  try {
    const gameShortName = callbackQuery.game_short_name;
    const userId = callbackQuery.from.id;
    
    let chatId = null;
    if (callbackQuery.message && callbackQuery.message.chat) {
      chatId = callbackQuery.message.chat.id;
    }

    console.log(`🎮 用户 ${userId} 点击游戏 ${gameShortName}`);

    // 获取游戏URL
    let gameUrl = gameUrls[gameShortName];
    
    // 如果找不到URL，使用默认首页
    if (!gameUrl) {
      gameUrl = 'https://www.mohuan.asia/';
    }

    // 添加用户ID到URL，让游戏知道是谁在玩
    const fullUrl = `${gameUrl}?user_id=${userId}${chatId ? '&chat_id=' + chatId : ''}`;

    console.log(`🔗 打开游戏URL: ${fullUrl}`);

    // 回答回调，打开游戏
    bot.answerCallbackQuery(callbackQuery.id, {
      url: fullUrl
    }).then(() => {
      console.log(`✅ 成功打开游戏 ${gameShortName} 给用户 ${userId}`);
    }).catch(err => {
      console.error('❌ 回答回调失败:', err);
      
      // 如果回调失败，尝试发送URL
      if (chatId) {
        bot.sendMessage(chatId, `点击这里玩游戏: ${fullUrl}`)
          .catch(e => console.error('❌ 发送备用URL失败:', e));
      }
    });
  } catch (err) {
    console.error('❌ 处理回调查询时出错:', err);
  }
});

// 内联查询支持
bot.on('inline_query', (inlineQuery) => {
  const results = [
    {
      type: 'game',
      id: '1',
      game_short_name: GAME_SHORT_NAMES['2048']
    },
    {
      type: 'game',
      id: '2',
      game_short_name: GAME_SHORT_NAMES['particle']
    }
  ];

  bot.answerInlineQuery(inlineQuery.id, results, {
    cache_time: 0,
    is_personal: true
  }).catch(err => console.error('❌ 内联查询失败:', err));
});

// 处理各种错误
bot.on('polling_error', (err) => {
  console.error('❌ Polling错误:', err.message);
});

bot.on('error', (err) => {
  console.error('❌ Bot错误:', err.message);
});

console.log('✨ Bot已准备好，等待消息！');
