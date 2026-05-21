const TelegramBot = require('node-telegram-bot-api');

// 获取环境变量中的 Token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';

// 游戏简称
const GAME_SHORT_NAMES = {
  '2048': 'neon2048',
  'particle': 'particleblast'
};

// 🎮 游戏URL配置
const gameUrls = {
  'neon2048': 'https://www.mohuan.asia/games/2048/',
  'particleblast': 'https://www.mohuan.asia/games/particle/'
};

// 创建Bot（Webhook模式，不启动polling）
const bot = new TelegramBot(TOKEN, { polling: false });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'Telegram Bot Webhook' });
  }

  try {
    const update = req.body;
    
    console.log('📥 收到更新:', JSON.stringify(update, null, 2));

    // 处理消息
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';

      console.log(`💬 来自 ${chatId} 的消息: ${text}`);

      // 处理 /start 命令
      if (text === '/start') {
        const username = msg.from.username || msg.from.first_name;
        const message = `🎮 欢迎 ${username} 来到墨焕游戏！

选择你想玩的游戏：

/neon2048 - 2048霓虹灯版
/particle - 粒子消除

或者直接在聊天框输入：
@MoHuanGamesBot 来搜索游戏！`;

        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown'
        });
        console.log(`✅ 欢迎消息已发送给 ${chatId}`);
      }

      // 处理 /neon2048 命令
      else if (text === '/neon2048') {
        await sendGame(chatId, GAME_SHORT_NAMES['2048']);
      }

      // 处理 /particle 命令
      else if (text === '/particle') {
        await sendGame(chatId, GAME_SHORT_NAMES['particle']);
      }
    }

    // 处理回调查询（用户点击"开始游戏"按钮）
    else if (update.callback_query) {
      const callbackQuery = update.callback_query;
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

      // 添加用户ID到URL
      const fullUrl = `${gameUrl}?user_id=${userId}${chatId ? '&chat_id=' + chatId : ''}`;

      console.log(`🔗 打开游戏URL: ${fullUrl}`);

      // 回答回调，打开游戏
      await bot.answerCallbackQuery(callbackQuery.id, {
        url: fullUrl
      });
      console.log(`✅ 成功打开游戏 ${gameShortName} 给用户 ${userId}`);
    }

    // 处理内联查询
    else if (update.inline_query) {
      const inlineQuery = update.inline_query;
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

      await bot.answerInlineQuery(inlineQuery.id, results, {
        cache_time: 0,
        is_personal: true
      });
      console.log(`✅ 内联查询已回答`);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ 处理更新时出错:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 发送游戏
async function sendGame(chatId, gameShortName) {
  console.log(`🎯 发送游戏 "${gameShortName}" 到 ${chatId}`);
  
  try {
    await bot.sendGame(chatId, gameShortName);
    console.log(`✅ 游戏 "${gameShortName}" 已发送到 ${chatId}`);
  } catch (err) {
    console.error('❌ 发送游戏失败:', err.message);
  }
}
