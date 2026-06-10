# G-Chat v2.0

Корпоративный мессенджер с E2EE шифрованием.

## Функции

- E2EE шифрование сообщений
- 2FA (TOTP)
- Видео/аудио звонки (WebRTC)
- Групповые звонки
- Голосовые сообщения
- Реакции на сообщения
- Ответы на сообщения
- Закрепление сообщений
- Статусы "онлайн/печатает"
- Админ-панель
- Три темы (тёмная/светлая/AMOLED)
- Поиск по сообщениям
- Файловое хранилище

## Деплой на Render

1. Создай Web Service на Render
2. Подключи GitHub репозиторий
3. Укажи:
   - Language: Docker
   - Dockerfile Path: `./Dockerfile`
   - Docker Build Context Directory: `.`
4. Добавь Environment Variables
5. Нажми Create

## Переменные окружения

```
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
NODE_ENV=production
DATABASE_URL=file:./data/gchat.db
TOTP_ISSUER=G-Chat
MAX_FILE_SIZE=104857600
```

## Сборка десктопа

```bash
cd client
npm install
npm run build

cd ../desktop
npm install
npm run build:win
```
