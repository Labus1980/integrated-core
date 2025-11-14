# Руководство по использованию CustomerData и улучшенного отображения звонков

## Обзор изменений

Мы добавили новые функции для улучшения отслеживания и отображения звонков:

1. **CustomerData** - метаданные о клиенте, прикрепляемые к звонкам
2. **Application Name** - отображение имени приложения вместо GUID
3. **Улучшенное форматирование** - звонки теперь отображаются как `webcall:tag → applicationName`

---

## 1. CustomerData - Метаданные клиента

### Что это?

`CustomerData` - это структурированная информация о клиенте, которая автоматически прикрепляется к каждому звонку и передается в Jambonz через заголовок `X-Customer-Data`.

### Структура CustomerData

```typescript
interface CustomerData {
  /** Уникальный ID клиента */
  clientId?: string;

  /** Имя клиента */
  clientName?: string;

  /** Тип звонка (например, 'webcall', 'mobile', 'desktop') */
  callType: string;

  /** ID сессии для отслеживания */
  sessionId?: string;

  /** Timestamp начала звонка (ISO 8601) */
  timestamp?: string;

  /** User Agent (информация о браузере/устройстве) */
  userAgent?: string;

  /** Географическая информация */
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };

  /** Дополнительные произвольные поля */
  customFields?: Record<string, unknown>;
}
```

### Пример использования

#### Вариант 1: Через переменные окружения

```env
# .env файл
CUSTOMER_DATA='{"clientId":"user_12345","clientName":"Иван Иванов","callType":"webcall","sessionId":"session_abc123","timestamp":"2025-11-14T12:00:00Z","userAgent":"Chrome/120.0.0.0","location":{"country":"RU","city":"Moscow"}}'
```

#### Вариант 2: Программная настройка

```typescript
import { createClient, CustomerData } from '@codex/web-widget';

const customerData: CustomerData = {
  clientId: 'user_12345',
  clientName: 'Иван Иванов',
  callType: 'webcall',
  sessionId: generateSessionId(), // ваша функция генерации ID
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  location: {
    country: 'RU',
    city: 'Moscow'
  },
  customFields: {
    department: 'Отдел продаж',
    priority: 'high',
    referrer: document.referrer
  }
};

const config = {
  JAMBONZ_SIP_DOMAIN: 'sip.example.com',
  // ... другие настройки
  CUSTOMER_DATA: JSON.stringify(customerData)
};

const client = createClient(config);
```

#### Вариант 3: Через SIP конфигурацию напрямую

```typescript
import { CodexSipClient } from '@codex/core-sip';

const sipConfig = {
  // ... базовые настройки
  customerData: {
    clientId: 'user_12345',
    clientName: 'Иван Иванов',
    callType: 'webcall',
    timestamp: new Date().toISOString()
  }
};

const client = new CodexSipClient(sipConfig);
```

#### Вариант 4: Динамически при каждом звонке

```typescript
// Передача customerData при конкретном звонке
await client.startCall({
  language: 'ru',
  customerData: {
    clientId: getCurrentUserId(),
    clientName: getCurrentUserName(),
    callType: 'webcall',
    timestamp: new Date().toISOString(),
    sessionId: generateCallSessionId()
  }
});
```

---

## 2. Application Name - Имя приложения

### Что это?

Вместо отображения GUID приложения Jambonz (например, `0397dc5f-2f8f-4778-8499-0af934dd1196`), теперь можно указать читаемое имя (например, `voicebot`).

### Настройка

#### Через переменные окружения

```env
TARGET_APPLICATION_NAME=voicebot
```

#### Программно

```typescript
const config = {
  JAMBONZ_SIP_DOMAIN: 'sip.example.com',
  TARGET_SIP_URI: 'sip:0397dc5f-2f8f-4778-8499-0af934dd1196@sip.example.com',
  TARGET_APPLICATION_NAME: 'voicebot', // <-- Имя вместо GUID
  // ... другие настройки
};

const client = createClient(config);
```

#### Через SIP конфигурацию

```typescript
const sipConfig = {
  // ... базовые настройки
  targetUri: 'sip:0397dc5f-2f8f-4778-8499-0af934dd1196@sip.example.com',
  targetApplicationName: 'voicebot'
};
```

---

## 3. Улучшенное отображение в логах

### До изменений

```
From: 170
To: 0397dc5f-2f8f-4778-8499-0af934dd1196
```

### После изменений

#### Без имени приложения

```
From: webcall:abc12345
To: voicebot
```

#### С именем приложения

```
From: webcall:abc12345 → voicebot
To: voicebot
```

---

## 4. Jambonz API для получения имен приложений

Мы добавили методы для автоматического получения имен приложений через Jambonz API.

### Использование JambonzApiClient

```typescript
import { JambonzApiClient } from '@/lib/jambonz-api';

const apiClient = new JambonzApiClient({
  apiBaseUrl: 'https://api.jambonz.example.com/v1',
  apiKey: 'your-api-key',
  accountSid: 'your-account-sid'
});

// Получить имя приложения по GUID
const appName = await apiClient.getApplicationName('0397dc5f-2f8f-4778-8499-0af934dd1196');
console.log(appName); // 'voicebot'

// Получить имя из URI
const nameFromUri = await apiClient.getApplicationNameFromUri('sip:0397dc5f-2f8f-4778-8499-0af934dd1196@sip.example.com');
console.log(nameFromUri); // 'voicebot'

// Получить все приложения (с кэшированием)
const apps = await apiClient.getApplications();
console.log(apps); // [ { application_sid: '...', name: 'voicebot', ... }, ... ]

// Очистить кэш
apiClient.clearCache();
```

---

## 5. События с новыми данными

Все события теперь включают `applicationName` и `customerData`:

### CallStateEvent

```typescript
client.on('call', (event) => {
  console.log('Call state:', event.state);
  console.log('Application:', event.applicationName); // 'voicebot'
  console.log('Customer data:', event.customerData); // { clientId: '...', ... }
  console.log('Tag:', event.tag); // 'abc12345'
});
```

### IncomingCallEvent

```typescript
client.on('incomingCall', (event) => {
  console.log('Incoming from:', event.displayFrom); // 'webcall:abc12345 → voicebot'
  console.log('Application:', event.applicationName); // 'voicebot'
  console.log('Customer data:', event.customerData); // { ... }
});
```

### MetricsEvent

```typescript
client.on('metrics', (event) => {
  console.log('RTT:', event.rttMs);
  console.log('Application:', event.applicationName); // 'voicebot'
});
```

---

## 6. Примеры полной интеграции

### Пример 1: Простой веб-виджет

```typescript
import { createClient, CustomerData } from '@codex/web-widget';

// Подготовка customer data
const customerData: CustomerData = {
  clientId: sessionStorage.getItem('userId') || 'anonymous',
  clientName: sessionStorage.getItem('userName') || 'Guest',
  callType: 'webcall',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  sessionId: crypto.randomUUID()
};

// Создание клиента
const client = createClient({
  JAMBONZ_SIP_DOMAIN: process.env.JAMBONZ_SIP_DOMAIN!,
  JAMBONZ_WSS_ADDRESS: process.env.JAMBONZ_WSS_ADDRESS!,
  JAMBONZ_SIP_USERNAME: '170',
  JAMBONZ_SIP_PASSWORD: process.env.JAMBONZ_SIP_PASSWORD!,
  TARGET_SIP_URI: 'sip:0397dc5f-2f8f-4778-8499-0af934dd1196@sip.example.com',
  TARGET_APPLICATION_NAME: 'voicebot',
  DEFAULT_LANG: 'ru',
  FALLBACK_LANG: 'en',
  STUN_URLS: 'stun:stun.l.google.com:19302',
  CUSTOMER_DATA: JSON.stringify(customerData)
});

// Подписка на события
client.on('call', (event) => {
  console.log(`[${event.applicationName}] Call ${event.state}`);
  if (event.customerData) {
    console.log(`Customer: ${event.customerData.clientName}`);
  }
});

// Регистрация и звонок
await client.register();
await client.startCall({ language: 'ru' });
```

### Пример 2: Интеграция с Zammad

При звонках в Zammad теперь будет регистрироваться:

**До:**
```
From: 170
```

**После:**
```
From: webcall:abc12345 → voicebot
Customer: Иван Иванов (user_12345)
Type: webcall
Session: session_abc123
```

---

## 7. Миграция существующего кода

Все изменения обратно совместимы. Существующий код продолжит работать без изменений.

### Если вы хотите добавить CustomerData:

```typescript
// Было:
const client = createClient(config);

// Стало:
const client = createClient({
  ...config,
  CUSTOMER_DATA: JSON.stringify({
    clientId: 'user_123',
    callType: 'webcall'
  })
});
```

### Если вы хотите добавить имя приложения:

```typescript
// Было:
const client = createClient(config);

// Стало:
const client = createClient({
  ...config,
  TARGET_APPLICATION_NAME: 'voicebot'
});
```

---

## 8. Проверка и тестирование

### Проверка в консоли браузера

```javascript
// Проверить, что customerData передается
client.on('call', (event) => {
  console.log('Customer Data:', event.customerData);
  console.log('Application Name:', event.applicationName);
});

// Сделать тестовый звонок
await client.startCall();
```

### Проверка в Jambonz

В логах Jambonz теперь будет виден заголовок:

```
X-Customer-Data: {"clientId":"user_12345","clientName":"Иван Иванов","callType":"webcall",...}
X-Display-From: webcall:abc12345 → voicebot
X-Display-To: voicebot
```

### Проверка в Zammad

В Zammad звонки будут регистрироваться с новым форматом:

```
Звонок от: webcall:abc12345 → voicebot
Клиент: Иван Иванов
Тип: webcall
```

---

## 9. FAQ

### Обязательно ли заполнять все поля CustomerData?

Нет, все поля кроме `callType` опциональные.

### Можно ли изменить CustomerData для каждого звонка?

Да, передайте новый объект в `startCall()`:

```typescript
await client.startCall({
  customerData: {
    clientId: 'different_user',
    callType: 'urgent_call'
  }
});
```

### Как получить имя приложения автоматически?

Используйте `JambonzApiClient.getApplicationNameFromUri()`:

```typescript
const appName = await apiClient.getApplicationNameFromUri(config.TARGET_SIP_URI);
```

### Где хранится CustomerData?

- В памяти клиента (SIP config)
- Передается в заголовке `X-Customer-Data` при INVITE
- Доступна в событиях звонка

### Кэшируются ли имена приложений?

Да, `JambonzApiClient` кэширует имена на 5 минут. Используйте `clearCache()` для сброса.

---

## 10. Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте, что все пакеты обновлены
2. Проверьте формат CustomerData (должен быть валидный JSON)
3. Проверьте логи браузера (F12 → Console)
4. Проверьте логи Jambonz

---

## Итоги

Теперь ваши звонки будут:
- ✅ Содержать метаданные о клиенте
- ✅ Отображаться с читаемыми именами вместо GUID
- ✅ Лучше отслеживаться в логах и Zammad
- ✅ Иметь улучшенный формат `webcall:tag → applicationName`
- ✅ CustomerData доступна в Jambonz webhooks через User-to-User header

Все изменения **обратно совместимы** и работают без модификации существующего кода!

---

## 📎 Дополнительные ресурсы

Для интеграции customerData с Jambonz webhooks см.:
- **JAMBONZ_CUSTOMER_DATA_INTEGRATION.md** - полное руководство по передаче данных в webhooks
- **N8N_JAMBONZ_WORKFLOW_EXAMPLE.json** - готовый N8N workflow для обработки звонков
