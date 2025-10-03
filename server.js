require('dotenv').config();
const express = require('express');
const BotController = require('./src/bot/botController');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация бота
let botController;
try {
  botController = new BotController();
  console.log('🤖 Bot controller initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize bot controller:', error);
  process.exit(1);
}

// Middleware для парсинга JSON
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    let botInfo = null;
    if (botController) {
      botInfo = await botController.getBotInfo();
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      bot: botInfo ? {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name
      } : null
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      bot: null,
      bot_error: 'Unable to get bot info'
    });
  }
});

// Webhook endpoint для Telegram
app.post('/webhook', async (req, res) => {
  if (botController) {
    await botController.handleWebhook(req, res);
  } else {
    console.error('❌ Bot controller not initialized');
    res.status(500).json({ error: 'Bot controller not available' });
  }
});

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Telegram AI Assistant Bot is running!',
    status: 'active'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});