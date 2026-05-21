const fetch = require('node-fetch');

// 配置
const BOT_TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const WEBHOOK_URL = 'https://www.mohuan.asia/api/webhook'; // 你的 Vercel 域名

async function setWebhook() {
  console.log('🔗 设置 Telegram Bot Webhook...');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  
  try {
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
    
    if (result.ok) {
      console.log('✅ Webhook 设置成功！');
      console.log('📋 结果:', result);
    } else {
      console.error('❌ Webhook 设置失败:', result);
    }
  } catch (error) {
    console.error('❌ 请求出错:', error.message);
  }
}

async function getWebhookInfo() {
  console.log('🔍 获取当前 Webhook 信息...');
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ 获取成功！');
      console.log('📋 Webhook 信息:', JSON.stringify(result.result, null, 2));
    } else {
      console.error('❌ 获取失败:', result);
    }
  } catch (error) {
    console.error('❌ 请求出错:', error.message);
  }
}

// 主函数
async function main() {
  const args = process.argv[2];
  
  if (args === 'info' || args === '--info') {
    await getWebhookInfo();
  } else {
    await setWebhook();
    console.log('\n📌 5秒后查看 Webhook 状态...');
    await new Promise(r => setTimeout(r, 5000));
    await getWebhookInfo();
  }
}

main();
