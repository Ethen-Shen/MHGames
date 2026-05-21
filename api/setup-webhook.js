const fetch = require('node-fetch');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const WEBHOOK_URL = 'https://www.mohuan.asia/api/webhook';

module.exports = async (req, res) => {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(200).json({
      message: 'Webhook Setup',
      usage: 'POST to this endpoint to set webhook',
      webhook_url: WEBHOOK_URL
    });
  }

  try {
    console.log('🔗 设置 Telegram Bot Webhook...');
    console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);

    // 设置 Webhook
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          drop_pending_updates: true
        })
      }
    );

    const result = await response.json();
    console.log('📋 响应:', result);

    if (result.ok) {
      // 获取当前 Webhook 状态
      const infoResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
      );
      const info = await infoResponse.json();

      res.status(200).json({
        success: true,
        message: '✅ Webhook 设置成功！',
        webhook_result: result,
        webhook_info: info.result
      });
    } else {
      res.status(500).json({
        success: false,
        message: '❌ Webhook 设置失败',
        error: result
      });
    }
  } catch (error) {
    console.error('❌ 错误:', error);
    res.status(500).json({
      success: false,
      message: '❌ 请求出错',
      error: error.message
    });
  }
};
