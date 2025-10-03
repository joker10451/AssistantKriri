require('dotenv').config();
const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ WEBHOOK_URL not found in environment variables');
  console.log('💡 Set WEBHOOK_URL to your Railway app URL + /webhook');
  console.log('   Example: https://your-app.up.railway.app/webhook');
  process.exit(1);
}

console.log('🔧 Setting up webhook...');
console.log('📡 Webhook URL:', WEBHOOK_URL);

const data = JSON.stringify({
  url: WEBHOOK_URL
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${BOT_TOKEN}/setWebhook`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      
      if (response.ok) {
        console.log('✅ Webhook set successfully!');
        console.log('📋 Response:', response.description);
      } else {
        console.error('❌ Failed to set webhook:', response.description);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(data);
req.end();