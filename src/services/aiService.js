const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Инициализация AI сервиса
   */
  initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('GOOGLE_AI_API_KEY not found in environment variables');
      }

      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      this.isInitialized = true;
      
      console.log('🧠 AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Генерация ответа от ИИ
   * @param {string} prompt - Запрос пользователя
   * @param {Array} context - Контекст разговора (опционально)
   * @returns {Promise<string>} - Ответ от ИИ
   */
  async generateResponse(prompt, context = []) {
    try {
      if (!this.isInitialized) {
        throw new Error('AI Service not initialized');
      }

      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Invalid prompt provided');
      }

      console.log('🤔 Generating AI response for prompt:', prompt.substring(0, 100) + '...');

      // Подготовка контекста для модели
      let fullPrompt = prompt;
      
      if (context && context.length > 0) {
        const contextString = this.formatContext(context);
        fullPrompt = `${contextString}\n\nПользователь: ${prompt}`;
      }

      // Настройки генерации
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      // Генерация ответа
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from AI model');
      }

      console.log('✅ AI response generated successfully:', {
        promptLength: prompt.length,
        responseLength: text.length,
        hasContext: context.length > 0
      });

      return text;

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      // Обработка различных типов ошибок
      if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('AI_QUOTA_EXCEEDED');
      } else if (error.message.includes('API key')) {
        throw new Error('AI_INVALID_KEY');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error('AI_NETWORK_ERROR');
      } else {
        throw new Error('AI_GENERAL_ERROR');
      }
    }
  }

  /**
   * Форматирование контекста для модели
   * @param {Array} context - Массив сообщений контекста
   * @returns {string} - Отформатированный контекст
   */
  formatContext(context) {
    if (!context || context.length === 0) {
      return '';
    }

    const contextMessages = context
      .slice(-10) // Берем последние 10 сообщений
      .map(msg => {
        const role = msg.role === 'user' ? 'Пользователь' : 'Ассистент';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    return `Контекст разговора:\n${contextMessages}\n`;
  }

  /**
   * Проверка доступности AI сервиса
   * @returns {Promise<boolean>} - Доступность сервиса
   */
  async isAvailable() {
    try {
      if (!this.isInitialized) {
        return false;
      }

      // Простой тест запрос для проверки доступности
      const testResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Привет' }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        },
      });

      const response = await testResult.response;
      return !!response.text();

    } catch (error) {
      console.error('⚠️ AI Service availability check failed:', error);
      return false;
    }
  }

  /**
   * Получение статуса AI сервиса
   * @returns {Object} - Информация о статусе
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasApiKey: !!this.apiKey,
      model: 'gemini-2.0-flash-exp',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Получение fallback сообщения при недоступности AI
   * @param {string} errorType - Тип ошибки
   * @returns {string} - Сообщение для пользователя
   */
  getFallbackMessage(errorType) {
    const messages = {
      'AI_QUOTA_EXCEEDED': '⏳ Превышен лимит запросов к ИИ. Попробуйте позже.',
      'AI_INVALID_KEY': '🔑 Проблема с ключом доступа к ИИ. Обратитесь к администратору.',
      'AI_NETWORK_ERROR': '🌐 Проблема с сетью. Попробуйте еще раз через несколько секунд.',
      'AI_GENERAL_ERROR': '🤖 Временная проблема с ИИ сервисом. Попробуйте позже.',
      'default': '😔 Извините, ИИ временно недоступен. Попробуйте позже.'
    };

    return messages[errorType] || messages['default'];
  }
}

module.exports = AIService;