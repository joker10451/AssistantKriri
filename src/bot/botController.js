const TelegramBot = require('node-telegram-bot-api');
const AIService = require('../services/aiService');

class BotController {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    this.aiService = new AIService();
    this.setupBot();
  }

  setupBot() {
    // Настройка бота без polling (используем webhook)
    console.log('🤖 Bot controller initialized');
  }

  /**
   * Обработка webhook от Telegram
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleWebhook(req, res) {
    try {
      const update = req.body;
      
      // Валидация входящего запроса
      if (!this.validateWebhook(update)) {
        console.warn('⚠️ Invalid webhook received:', update);
        return res.status(400).json({ error: 'Invalid webhook data' });
      }

      console.log('📨 Webhook received:', {
        updateId: update.update_id,
        messageId: update.message?.message_id,
        chatId: update.message?.chat?.id,
        hasMessage: !!update.message
      });

      // Обработка сообщения
      if (update.message) {
        await this.processMessage(update.message);
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('❌ Error handling webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Валидация webhook данных
   * @param {Object} update - Telegram update object
   * @returns {boolean}
   */
  validateWebhook(update) {
    // Базовая валидация структуры webhook
    if (!update || typeof update !== 'object') {
      return false;
    }

    // Проверяем наличие update_id
    if (!update.update_id || typeof update.update_id !== 'number') {
      return false;
    }

    // Если есть сообщение, проверяем его структуру
    if (update.message) {
      const message = update.message;
      if (!message.message_id || !message.chat || !message.chat.id) {
        return false;
      }
    }

    return true;
  }

  /**
   * Обработка входящего сообщения
   * @param {Object} message - Telegram message object
   */
  async processMessage(message) {
    try {
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text || '';
      const isCommand = text.startsWith('/');

      console.log('💬 Processing message:', {
        chatId,
        userId,
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        isCommand
      });

      // Базовая обработка (будет расширена в следующих задачах)
      if (isCommand) {
        await this.handleCommand(chatId, text);
      } else {
        await this.handleTextMessage(chatId, userId, text);
      }

    } catch (error) {
      console.error('❌ Error processing message:', error);
      // Отправляем сообщение об ошибке пользователю
      await this.sendMessage(message.chat.id, 'Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.');
    }
  }

  /**
   * Обработка команд (базовая реализация)
   * @param {number} chatId - ID чата
   * @param {string} command - Команда
   */
  async handleCommand(chatId, command) {
    console.log('🔧 Handling command:', command);
    
    switch (command.toLowerCase()) {
      case '/start':
        await this.sendMessage(chatId, '👋 Привет! Я ваш ИИ-ассистент. Задайте мне любой вопрос!');
        break;
      case '/help':
        await this.sendMessage(chatId, `📋 Доступные команды:
/start - Запуск бота
/help - Справка
/clear - Очистить контекст
/status - Статус бота

Просто напишите мне сообщение, и я отвечу!`);
        break;
      case '/status':
        await this.handleStatusCommand(chatId);
        break;
      default:
        await this.sendMessage(chatId, 'Неизвестная команда. Используйте /help для списка команд.');
    }
  }

  /**
   * Обработка текстовых сообщений с ИИ
   * @param {number} chatId - ID чата
   * @param {number} userId - ID пользователя
   * @param {string} text - Текст сообщения
   */
  async handleTextMessage(chatId, userId, text) {
    console.log('💭 Handling text message from user:', userId);
    
    try {
      // Отправляем индикатор "печатает"
      await this.bot.sendChatAction(chatId, 'typing');
      
      // Генерируем ответ с помощью ИИ
      const aiResponse = await this.aiService.generateResponse(text);
      
      // Отправляем ответ пользователю
      await this.sendMessage(chatId, aiResponse);
      
    } catch (error) {
      console.error('❌ Error handling text message:', error);
      
      // Получаем fallback сообщение в зависимости от типа ошибки
      const fallbackMessage = this.aiService.getFallbackMessage(error.message);
      await this.sendMessage(chatId, fallbackMessage);
    }
  }

  /**
   * Отправка сообщения в Telegram
   * @param {number} chatId - ID чата
   * @param {string} text - Текст сообщения
   * @param {Object} options - Дополнительные опции
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const result = await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...options
      });
      
      console.log('✅ Message sent:', {
        chatId,
        messageId: result.message_id,
        textLength: text.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Обработка команды /status
   * @param {number} chatId - ID чата
   */
  async handleStatusCommand(chatId) {
    try {
      const aiStatus = this.aiService.getStatus();
      const aiAvailable = await this.aiService.isAvailable();
      
      const statusMessage = `🤖 <b>Статус бота</b>

🧠 <b>ИИ Сервис:</b> ${aiAvailable ? '✅ Доступен' : '❌ Недоступен'}
🔧 <b>Инициализация:</b> ${aiStatus.initialized ? '✅ OK' : '❌ Ошибка'}
🔑 <b>API Ключ:</b> ${aiStatus.hasApiKey ? '✅ Настроен' : '❌ Отсутствует'}
🤖 <b>Модель:</b> ${aiStatus.model}

⏰ <b>Время проверки:</b> ${new Date().toLocaleString('ru-RU')}`;

      await this.sendMessage(chatId, statusMessage);
    } catch (error) {
      console.error('❌ Error getting status:', error);
      await this.sendMessage(chatId, '❌ Ошибка при получении статуса бота.');
    }
  }

  /**
   * Получение информации о боте
   */
  async getBotInfo() {
    try {
      const me = await this.bot.getMe();
      return me;
    } catch (error) {
      console.error('❌ Error getting bot info:', error);
      throw error;
    }
  }
}

module.exports = BotController;