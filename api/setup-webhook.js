const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const API = 'https://api.telegram.org/bot' + TOKEN;
const WEBHOOK_URL = 'https://www.mohuan.asia/api/webhook';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({
      message: 'Webhook Setup',
      usage: 'POST to this endpoint to set webhook',
      webhook_url: WEBHOOK_URL
    });
  }

  try {
    const response = await fetch(API + '/setWebhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        drop_pending_updates: true
      })
    });

    const result = await response.json();

    if (result.ok) {
      const infoResponse = await fetch(API + '/getWebhookInfo');
      const info = await infoResponse.json();

      res.status(200).json({
        success: true,
        message: 'Webhook set successfully',
        webhook_result: result,
        webhook_info: info.result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Webhook setup failed',
        error: result
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Request failed',
      error: error.message
    });
  }
};
