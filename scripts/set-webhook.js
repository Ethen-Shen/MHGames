const fetch = require('node-fetch');

const BOT1_TOKEN = '8979472034:AAF4E2qOXRiTsZWjlX5Kepxb47Eyy_QvHwk';
const BOT2_TOKEN = '8896711967:AAG8tStYIwVSCPMyCzx-wH22pYqQcXoet-E';

const WEBHOOK_URL_BOT1 = 'https://www.mohuan.asia/api/webhook';
const WEBHOOK_URL_BOT2 = 'https://www.mohuan.asia/api/webhook-greedysnakes';

async function setWebhook(token, url, name) {
  console.log('\n🔗 设置 ' + name + ' Webhook...');
  console.log('📡 Webhook URL: ' + url);

  try {
    const response = await fetch(
      'https://api.telegram.org/bot' + token + '/setWebhook',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, drop_pending_updates: true })
      }
    );

    const result = await response.json();

    if (result.ok) {
      console.log('✅ ' + name + ' Webhook 设置成功！');
    } else {
      console.error('❌ ' + name + ' Webhook 设置失败:', result);
    }
  } catch (error) {
    console.error('❌ ' + name + ' 请求出错:', error.message);
  }
}

async function getWebhookInfo(token, name) {
  try {
    const response = await fetch(
      'https://api.telegram.org/bot' + token + '/getWebhookInfo'
    );
    const result = await response.json();
    if (result.ok) {
      console.log('📋 ' + name + ' Webhook: ' + result.result.url);
    }
  } catch (error) {
    console.error('❌ ' + name + ' 获取信息出错:', error.message);
  }
}

async function main() {
  var args = process.argv[2];

  if (args === 'info' || args === '--info') {
    await getWebhookInfo(BOT1_TOKEN, 'Bot1');
    await getWebhookInfo(BOT2_TOKEN, 'Bot2');
  } else {
    await setWebhook(BOT1_TOKEN, WEBHOOK_URL_BOT1, 'Bot1 (Neon 2048)');
    await setWebhook(BOT2_TOKEN, WEBHOOK_URL_BOT2, 'Bot2 (Particle Blast)');

    console.log('\n⏳ 3秒后查看 Webhook 状态...');
    await new Promise(function(r) { setTimeout(r, 3000); });

    await getWebhookInfo(BOT1_TOKEN, 'Bot1');
    await getWebhookInfo(BOT2_TOKEN, 'Bot2');
  }
}

main();
