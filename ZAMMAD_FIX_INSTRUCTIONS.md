# Инструкция по исправлению Zammad чата

## Проблемы которые были решены

1. **WebSocket connection failed** - WebSocket соединение к `wss://zammad.okta-solutions.com/` отклонялось
2. **Cannot read properties of undefined (reading 'querySelector')** - ошибка инициализации виджета чата

## Что было исправлено

### 1. Код приложения (apps/admin)

✅ **apps/admin/src/hooks/useZammadChat.ts**
- Добавлена задержка 500ms перед инициализацией чата для загрузки DOM и скриптов
- Добавлена проверка готовности document.body
- Добавлен try-catch для отлова ошибок инициализации
- Улучшено логирование для диагностики

✅ **apps/admin/src/components/ZammadChatContainer.tsx**
- Увеличена задержка с 300ms до 1000ms перед открытием чата
- Добавлены try-catch блоки для безопасного вызова API
- Улучшено логирование состояния чата

✅ **apps/admin/index.html**
- Обновлена Content-Security-Policy для поддержки Zammad:
  - Добавлен `https://zammad.okta-solutions.com` в script-src
  - Добавлены `wss://zammad.okta-solutions.com` и `ws://zammad.okta-solutions.com` в connect-src
  - Добавлены поддержка fonts, frames и media для Zammad

### 2. Конфигурация nginx

✅ **nginx-zammad-config.conf** (готовый файл конфигурации)
- Правильная настройка WebSocket проксирования
- CORS заголовки для кросс-доменных запросов
- Увеличенные таймауты для долгих WebSocket соединений
- Обработка preflight OPTIONS запросов

---

## Шаги по применению исправлений

### Шаг 1: Применить изменения в коде (уже сделано)

Изменения в следующих файлах уже применены:
- `apps/admin/src/hooks/useZammadChat.ts`
- `apps/admin/src/components/ZammadChatContainer.tsx`
- `apps/admin/index.html`

### Шаг 2: Пересобрать приложение

```bash
cd /home/user/integrated-core
npm run build
# или
pnpm build
```

### Шаг 3: Настроить nginx на сервере

**КРИТИЧНО:** Это самая важная часть - без правильной настройки nginx чат не заработает!

#### Опция А: Использовать готовый конфиг

```bash
# 1. Скопируйте файл на сервер
scp nginx-zammad-config.conf your-server:/etc/nginx/sites-available/zammad.conf

# 2. На сервере отредактируйте конфиг
sudo nano /etc/nginx/sites-available/zammad.conf

# Важно изменить:
# - upstream zammad_backend (адрес вашего Zammad сервера)
# - ssl_certificate (путь к SSL сертификату)
# - ssl_certificate_key (путь к ключу)

# 3. Включите сайт
sudo ln -s /etc/nginx/sites-available/zammad.conf /etc/nginx/sites-enabled/

# 4. Проверьте конфигурацию
sudo nginx -t

# 5. Перезагрузите nginx
sudo systemctl reload nginx
```

#### Опция Б: Добавить в существующий конфиг

Если у вас уже есть nginx конфиг для Zammad, добавьте следующие секции:

**1. WebSocket проксирование (ОБЯЗАТЕЛЬНО!):**

```nginx
location ~ ^/(ws|cable|websocket) {
    proxy_pass http://your-zammad-backend;
    proxy_http_version 1.1;

    # Критичные заголовки для WebSocket
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Таймауты для долгих соединений (24 часа)
    proxy_read_timeout 86400s;
    proxy_connect_timeout 86400s;
    proxy_send_timeout 86400s;

    # Отключаем буферизацию
    proxy_buffering off;
}
```

**2. CORS заголовки для API:**

```nginx
location / {
    # CORS заголовки
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With, X-CSRF-Token' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Preflight запросы
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With, X-CSRF-Token' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    proxy_pass http://your-zammad-backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Шаг 4: Проверка работы

1. **Проверьте логи nginx:**
```bash
tail -f /var/log/nginx/zammad-error.log
tail -f /var/log/nginx/zammad-access.log
```

2. **Откройте консоль браузера (F12) и проверьте:**
   - Должно появиться: `Zammad chat initialized successfully`
   - Не должно быть: `WebSocket connection failed`
   - WebSocket соединение должно установиться: `ws State: OPEN`

3. **Проверьте Network вкладку в DevTools:**
   - Должен быть успешный WebSocket запрос (101 Switching Protocols)
   - Статус: `101` или `200`

### Шаг 5: Диагностика проблем

Если чат всё ещё не работает:

#### Проблема: WebSocket всё ещё не подключается

**Проверьте:**
```bash
# 1. Проверьте, слушает ли Zammad на нужном порту
netstat -tuln | grep 3000

# 2. Проверьте логи Zammad
docker logs zammad  # если Docker
# или
journalctl -u zammad -f  # если systemd

# 3. Проверьте firewall
sudo ufw status
sudo iptables -L
```

**Тестируйте WebSocket напрямую:**
```bash
# Из браузера (Console):
const ws = new WebSocket('wss://zammad.okta-solutions.com/');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

#### Проблема: CORS ошибки

В nginx конфиге проверьте:
- `Access-Control-Allow-Origin` должен быть '*' или точный домен вашего приложения
- Все CORS заголовки должны иметь `always` флаг
- Preflight OPTIONS обработан корректно

#### Проблема: querySelector ошибка всё ещё появляется

**Проверьте в консоли:**
```javascript
// Убедитесь что инстанс существует
console.log('Chat instance:', window.zammadChatInstance);

// Проверьте что метод open доступен
console.log('Open method:', typeof window.zammadChatInstance?.open);

// Проверьте DOM
console.log('Body exists:', !!document.body);
```

**Увеличьте задержки:**
В `useZammadChat.ts` измените таймаут с 500 на 1000-2000ms
В `ZammadChatContainer.tsx` измените таймаут с 1000 на 2000-3000ms

---

## Важные параметры nginx для Zammad

### Обязательные заголовки для WebSocket:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Обязательные таймауты:

```nginx
proxy_read_timeout 86400s;    # 24 часа для WebSocket
proxy_connect_timeout 86400s;
proxy_send_timeout 86400s;
```

### Обязательные CORS заголовки:

```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

---

## Контрольный список (Checklist)

- [ ] Применены изменения в коде приложения
- [ ] Пересобрано приложение (`npm run build`)
- [ ] Настроен nginx для WebSocket проксирования
- [ ] Добавлены CORS заголовки в nginx
- [ ] Установлены правильные таймауты в nginx
- [ ] Выполнена проверка конфигурации nginx (`nginx -t`)
- [ ] Перезагружен nginx (`systemctl reload nginx`)
- [ ] Проверены логи nginx на ошибки
- [ ] Проверена консоль браузера на ошибки
- [ ] Проверено WebSocket соединение в DevTools Network

---

## Дополнительная информация

### CSP политики которые были добавлены:

```
script-src: https://zammad.okta-solutions.com
connect-src: wss://zammad.okta-solutions.com ws://zammad.okta-solutions.com
font-src: https://zammad.okta-solutions.com data:
frame-src: https://zammad.okta-solutions.com
media-src: https://zammad.okta-solutions.com blob:
```

### Порты и протоколы:

- HTTP API: `https://zammad.okta-solutions.com` (443)
- WebSocket: `wss://zammad.okta-solutions.com` (443)
- Backend (пример): `http://localhost:3000`

### Полезные команды:

```bash
# Проверить статус nginx
sudo systemctl status nginx

# Перезапустить nginx
sudo systemctl restart nginx

# Проверить конфигурацию
sudo nginx -t

# Посмотреть активные WebSocket соединения
sudo netstat -anp | grep ESTABLISHED | grep nginx

# Отладка с curl
curl -I https://zammad.okta-solutions.com

# Проверка SSL
openssl s_client -connect zammad.okta-solutions.com:443
```

---

## Поддержка

Если проблема не решена:

1. Предоставьте логи nginx
2. Предоставьте скриншот консоли браузера (F12)
3. Предоставьте вывод `nginx -T` (полный конфиг)
4. Предоставьте результаты Network вкладки для WebSocket запроса

## Ссылки

- [Zammad Документация](https://docs.zammad.org/)
- [nginx WebSocket Proxying](http://nginx.org/en/docs/http/websocket.html)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
