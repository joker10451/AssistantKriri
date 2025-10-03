require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const AIService = require('./src/services/aiService');

// Создаем бота с polling для локального тестирования
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const aiService = new AIService();

console.log('🤖 Test bot started with polling...');

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, '👋 Привет! Я ваш ИИ-ассистент. Задайте мне любой вопрос!');
});

// Обработка команды /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const helpText = `📋 Доступные команды:
/start - Запуск бота
/help - Справка
/status - Статус бота

Просто напишите мне сообщение, и я отвечу!`;
  await bot.sendMessage(chatId, helpText);
});

// Обработка команды /status
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const aiStatus = aiService.getStatus();
    const aiAvailable = await aiService.isAvailable();
    
    const statusMessage = `🤖 Статус бота

🧠 ИИ Сервис: ${aiAvailable ? '✅ Доступен' : '❌ Недоступен'}
🔧 Инициализация: ${aiStatus.initialized ? '✅ OK' : '❌ Ошибка'}
🔑 API Ключ: ${aiStatus.hasApiKey ? '✅ Настроен' : '❌ Отсутствует'}
🤖 Модель: ${aiStatus.model}

⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    await bot.sendMessage(chatId, statusMessage);
  } catch (error) {
    console.error('❌ Error getting status:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении статуса бота.');
  }
});

// Обработка обычных сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Пропускаем команды
  if (text && text.startsWith('/')) {
    return;
  }
  
  if (!text) {
    await bot.sendMessage(chatId, 'Пожалуйста, отправьте текстовое сообщение.');
    return;
  }
  
  try {
    console.log('💬 Received message:', text.substring(0, 50) + '...');
    
    // Показываем индикатор "печатает"
    await bot.sendChatAction(chatId, 'typing');
    
    // Генерируем ответ с помощью ИИ
    const aiResponse = await aiService.generateResponse(text);
    
    // Отправляем ответ
    await bot.sendMessage(chatId, aiResponse);
    
    console.log('✅ Response sent successfully');
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    
    // Получаем fallback сообщение
    const fallbackMessage = aiService.getFallbackMessage(error.message);
    await bot.sendMessage(chatId, fallbackMessage);
  }
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

console.log('🚀 Bot is ready! Send /start to begin.');
console.log('📱 Go to Telegram and find your bot to test it.');