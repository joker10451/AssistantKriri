# Развертывание на Railway

## Шаги для развертывания:

### 1. Подготовка
1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Подключите ваш GitHub аккаунт
3. Репозиторий: https://github.com/joker10451/AssistantKriri.git

### 2. Создание проекта на Railway
1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически определит Node.js проект

### 3. Настройка переменных окружения
В разделе Variables добавьте:

```
TELEGRAM_BOT_TOKEN=8288082034:AAHu7QmlL-m-lKILkW6Kuuom7NhNqtEgb-s
GOOGLE_AI_API_KEY=AIzaSyApwSoNEmeDNpIvKUf91fDwqnfdf_AjOqc
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

### 4. Получение URL приложения
После развертывания Railway предоставит URL вида:
`https://your-app-name.up.railway.app`

### 5. Настройка webhook
Выполните запрос для установки webhook:

```bash
curl -X POST "https://api.telegram.org/bot8288082034:AAHu7QmlL-m-lKILkW6Kuuom7NhNqtEgb-s/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app-name.up.railway.app/webhook"}'
```

Замените `your-app-name.up.railway.app` на ваш реальный URL.

### 6. Проверка
1. Откройте `https://your-app-name.up.railway.app/health`
2. Должен показать статус OK и информацию о боте
3. Протестируйте бота в Telegram

## Локальное тестирование

Для локального тестирования используйте:
```bash
npm run dev
```

Это запустит test-bot.js с polling вместо webhook.

## Мониторинг

- Логи доступны в Railway Dashboard
- Health check: `/health`
- Статус бота: команда `/status` в Telegram

## Troubleshooting

### Бот не отвечает
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что webhook настроен правильно
3. Проверьте переменные окружения

### Ошибки ИИ
1. Проверьте GOOGLE_AI_API_KEY
2. Убедитесь, что не превышен лимит запросов
3. Используйте команду `/status` для диагностики