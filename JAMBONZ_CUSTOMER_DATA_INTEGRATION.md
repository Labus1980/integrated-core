# Интеграция CustomerData с Jambonz Webhooks

## Проблема

Вы добавили `customerData` в виджет звонков, данные передаются в SIP заголовке `X-Customer-Data`, но они не появляются в status webhook'ах Jambonz.

**Причина**: Jambonz по умолчанию не пересылает произвольные X-* заголовки в webhooks.

---

## 🎯 Решения

Есть несколько способов получить customerData в webhooks:

### ✅ Решение 1: Использование SIP User-to-User Header (Рекомендуется)

Jambonz автоматически пересылает заголовок `User-to-User` в webhooks.

#### Изменения в коде

Обновите `packages/core-sip/src/index.ts` в методе `startCall`:

```typescript
// Вместо X-Customer-Data используйте User-to-User
if (customerData) {
  try {
    const customerDataJson = JSON.stringify(customerData);
    // User-to-User header автоматически попадает в webhooks
    inviteHeaders.push(`User-to-User: ${Buffer.from(customerDataJson).toString('base64')};encoding=base64`);
  } catch (error) {
    this.emit("log", {
      level: "warn",
      message: "Failed to serialize customer data",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
```

#### В N8N webhook вы получите:

```json
{
  "user_to_user": "eyJjbGllbnRJZCI6InVzZXJfMTIzNDUiLCJjbGllbnROYW1lIjoi0JjQstCw0L0g0JjQstCw0L3QvtCyIiwiY2FsbFR5cGUiOiJ3ZWJjYWxsIn0=",
  "from": "170",
  "to": "0397dc5f-2f8f-4778-8499-0af934dd1196"
}
```

Декодирование в N8N:

```javascript
// Function node в N8N
const userToUser = $json.user_to_user;
if (userToUser) {
  const decoded = Buffer.from(userToUser, 'base64').toString('utf-8');
  const customerData = JSON.parse(decoded);
  return {
    ...json,
    customerData
  };
}
return $json;
```

---

### ✅ Решение 2: Использование Jambonz Application Custom Headers

Настройте Jambonz Application для пересылки определенных headers в webhooks.

#### Шаг 1: Обновите Application через Jambonz API

```bash
curl -X PUT https://jambonz-api.okta-solutions.com/v1/Accounts/e32f2361-ad6f-4ee1-b516-06461d65c932/Applications/0397dc5f-2f8f-4778-8499-0af934dd1196 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "call_hook": {
      "url": "https://n8n.okta-solutions.com/webhook/jb-call",
      "method": "POST",
      "custom_headers": [
        "X-Customer-Data",
        "X-Display-From",
        "X-Display-To",
        "X-Call-Tag"
      ]
    },
    "call_status_hook": {
      "url": "https://n8n.okta-solutions.com/webhook/jb-status",
      "method": "POST",
      "custom_headers": [
        "X-Customer-Data",
        "X-Display-From",
        "X-Display-To",
        "X-Call-Tag"
      ]
    }
  }'
```

#### Шаг 2: В webhook вы получите

```json
{
  "call_sid": "524547d2-c1bb-43d6-9cc6-df509ce73e02",
  "from": "170",
  "to": "0397dc5f-2f8f-4778-8499-0af934dd1196",
  "sip_headers": {
    "X-Customer-Data": "{\"clientId\":\"user_12345\",\"clientName\":\"Иван Иванов\",\"callType\":\"webcall\"}",
    "X-Display-From": "webcall:abc12345 → voicebot",
    "X-Display-To": "voicebot",
    "X-Call-Tag": "abc12345"
  }
}
```

---

### ✅ Решение 3: Добавление metadata через REST API после создания звонка

Обновите metadata звонка сразу после получения call_sid.

#### Обработчик в N8N для call webhook:

```javascript
// Function node 1: Извлечь customerData из SIP headers
const sipHeaders = $('Webhook').item.json.headers;
const customerDataHeader = sipHeaders['x-customer-data'];
const displayFrom = sipHeaders['x-display-from'];

let customerData = null;
if (customerDataHeader) {
  try {
    customerData = JSON.parse(customerDataHeader);
  } catch (e) {
    console.error('Failed to parse customer data', e);
  }
}

return {
  callSid: $json.call_sid,
  customerData,
  displayFrom,
  from: $json.from,
  to: $json.to
};
```

```javascript
// Function node 2: Обновить call через REST API
const callSid = $json.callSid;
const customerData = $json.customerData;

if (!customerData) {
  return $json;
}

// HTTP Request node будет вызван с этими данными
return {
  url: `https://jambonz-api.okta-solutions.com/v1/Accounts/e32f2361-ad6f-4ee1-b516-06461d65c932/Calls/${callSid}`,
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: {
    metadata: customerData
  }
};
```

Теперь в status webhook metadata будет доступна:

```json
{
  "call_sid": "524547d2-c1bb-43d6-9cc6-df509ce73e02",
  "from": "170",
  "to": "0397dc5f-2f8f-4778-8499-0af934dd1196",
  "metadata": {
    "clientId": "user_12345",
    "clientName": "Иван Иванов",
    "callType": "webcall",
    "sessionId": "session_abc123"
  }
}
```

---

### ✅ Решение 4: Использование Query Parameters в Webhook URL

Добавьте customerData прямо в URL webhook'а.

#### В конфигурации виджета:

```typescript
const customerData = {
  clientId: 'user_12345',
  clientName: 'Иван Иванов',
  callType: 'webcall'
};

// Создайте webhook URL с query params
const webhookParams = new URLSearchParams({
  clientId: customerData.clientId,
  clientName: customerData.clientName,
  callType: customerData.callType
});

// Настройте application с динамическим URL
const webhookUrl = `https://n8n.okta-solutions.com/webhook/jb-status?${webhookParams}`;
```

В webhook вы получите:

```json
{
  "query": {
    "clientId": "user_12345",
    "clientName": "Иван Иванов",
    "callType": "webcall"
  },
  "body": {
    "call_sid": "524547d2-c1bb-43d6-9cc6-df509ce73e02",
    "from": "170",
    "to": "0397dc5f-2f8f-4778-8499-0af934dd1196"
  }
}
```

---

## 🔍 Решение 5: Извлечение данных из SIP INVITE в N8N

Создайте промежуточный webhook, который будет парсить SIP INVITE перед отправкой в Jambonz.

Это решение требует установки SIP прокси между виджетом и Jambonz.

---

## 📊 Сравнение решений

| Решение | Сложность | Надежность | Производительность | Рекомендация |
|---------|-----------|------------|-------------------|--------------|
| 1. User-to-User | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **Лучший** |
| 2. Custom Headers | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Хороший |
| 3. REST API | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Сложный |
| 4. Query Params | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Ограниченный |
| 5. SIP Proxy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ Избыточный |

---

## 🚀 Рекомендуемая реализация (Решение 1 + 2)

### Шаг 1: Обновите core-sip для использования User-to-User

```typescript
// packages/core-sip/src/index.ts в методе startCall()

// Заменить:
if (customerData) {
  try {
    const customerDataJson = JSON.stringify(customerData);
    inviteHeaders.push(`X-Customer-Data: ${customerDataJson}`);
  } catch (error) {
    // ...
  }
}

// На:
if (customerData) {
  try {
    const customerDataJson = JSON.stringify(customerData);
    // User-to-User header для Jambonz webhooks
    const base64Data = Buffer.from(customerDataJson).toString('base64');
    inviteHeaders.push(`User-to-User: ${base64Data};encoding=base64`);

    // Также оставляем X-Customer-Data для других целей
    inviteHeaders.push(`X-Customer-Data: ${customerDataJson}`);
  } catch (error) {
    this.emit("log", {
      level: "warn",
      message: "Failed to serialize customer data",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
```

### Шаг 2: Обработка в N8N

#### Webhook node (jb-status):

```javascript
// Function node: Parse Customer Data
const userToUser = $json.user_to_user;
const displayFrom = $json.sip_headers?.['x-display-from'] || $json.from;
const displayTo = $json.sip_headers?.['x-display-to'] || $json.to;
const callTag = $json.sip_headers?.['x-call-tag'];

let customerData = null;
if (userToUser) {
  try {
    // Decode base64
    const decoded = Buffer.from(userToUser, 'base64').toString('utf-8');
    customerData = JSON.parse(decoded);
  } catch (e) {
    console.error('Failed to parse User-to-User header', e);
  }
}

// Обогащенные данные
return {
  call_sid: $json.call_sid,
  call_status: $json.call_status,
  from: displayFrom || $json.from,  // Используем displayFrom если есть
  to: displayTo || $json.to,        // Используем displayTo если есть
  tag: callTag,
  customerData: customerData || {},
  originalFrom: $json.from,
  originalTo: $json.to,
  trace_id: $json.trace_id,
  account_sid: $json.account_sid,
  application_sid: $json.application_sid
};
```

#### Результат:

```json
{
  "call_sid": "524547d2-c1bb-43d6-9cc6-df509ce73e02",
  "call_status": "trying",
  "from": "webcall:abc12345 → voicebot",
  "to": "voicebot",
  "tag": "abc12345",
  "customerData": {
    "clientId": "user_12345",
    "clientName": "Иван Иванов",
    "callType": "webcall",
    "sessionId": "session_abc123",
    "timestamp": "2025-11-14T12:00:00Z"
  },
  "originalFrom": "170",
  "originalTo": "0397dc5f-2f8f-4778-8499-0af934dd1196"
}
```

---

## 📝 Регистрация звонков в Zammad

После получения обогащенных данных в N8N, отправьте их в Zammad:

```javascript
// Function node: Prepare Zammad Ticket
const customerData = $json.customerData || {};
const from = $json.from || 'Unknown';
const to = $json.to || 'Unknown';
const tag = $json.tag || '';

// Создать заметку для Zammad
const note = `
📞 Звонок от ${customerData.clientName || 'Неизвестно'}

**Детали звонка:**
- От: ${from}
- Кому: ${to}
- Тег: ${tag}
- Статус: ${$json.call_status}

**Информация о клиенте:**
- ID клиента: ${customerData.clientId || 'N/A'}
- Тип звонка: ${customerData.callType || 'N/A'}
- Сессия: ${customerData.sessionId || 'N/A'}
- Время: ${customerData.timestamp || 'N/A'}

**Техническая информация:**
- Call SID: ${$json.call_sid}
- Trace ID: ${$json.trace_id}
`;

return {
  title: `Звонок: ${from} → ${to}`,
  customer_email: customerData.clientId ? `${customerData.clientId}@system.local` : 'unknown@system.local',
  customer_name: customerData.clientName || 'Unknown Customer',
  article: {
    subject: `Звонок ${$json.call_status}`,
    body: note,
    type: 'phone',
    internal: false
  },
  tags: [
    'webcall',
    customerData.callType || 'unknown',
    tag || 'no-tag'
  ]
};
```

---

## ✅ Итоговый чеклист

- [ ] Обновить `core-sip` для использования User-to-User header
- [ ] Создать N8N workflow для декодирования User-to-User
- [ ] Настроить Jambonz Application для пересылки custom headers (опционально)
- [ ] Создать функцию обогащения данных в N8N
- [ ] Настроить регистрацию звонков в Zammad с customerData
- [ ] Протестировать полный flow от виджета до Zammad

---

## 🧪 Тестирование

### 1. Проверка SIP INVITE

Посмотрите логи Jambonz или используйте Wireshark:

```
INVITE sip:0397dc5f-2f8f-4778-8499-0af934dd1196@sip.example.com SIP/2.0
...
User-to-User: eyJjbGllbnRJZCI6InVzZXJfMTIzNDUiLCJjbGllbnROYW1lIjoi0JjQstCw0L0g0JjQstCw0L3QvtCyIiwiY2FsbFR5cGUiOiJ3ZWJjYWxsIn0=;encoding=base64
X-Customer-Data: {"clientId":"user_12345","clientName":"Иван Иванов","callType":"webcall"}
X-Display-From: webcall:abc12345 → voicebot
X-Display-To: voicebot
X-Call-Tag: abc12345
...
```

### 2. Проверка N8N webhook

Добавьте debug node в N8N workflow:

```javascript
// Debug node
console.log('Raw webhook data:', JSON.stringify($json, null, 2));
console.log('User-to-User:', $json.user_to_user);
console.log('SIP Headers:', $json.sip_headers);
```

### 3. Проверка в Zammad

После звонка проверьте, что в Zammad создан тикет с правильными данными:
- Заголовок содержит displayFrom и displayTo
- Тело содержит customerData
- Теги содержат callType и tag

---

## 🆘 Troubleshooting

### User-to-User header не приходит в webhook

**Решение**: Убедитесь, что Jambonz настроен на пересылку этого header. Обновите application configuration.

### CustomerData не декодируется

**Решение**: Проверьте формат base64. Используйте правильный encoding в SIP header.

### Звонки не регистрируются в Zammad

**Решение**:
1. Проверьте N8N workflow на ошибки
2. Убедитесь, что все необходимые поля присутствуют
3. Проверьте Zammad API credentials

---

## 📚 Полезные ссылки

- [Jambonz Webhooks Documentation](https://www.jambonz.org/docs/webhooks/)
- [Jambonz REST API](https://www.jambonz.org/docs/rest-api/)
- [N8N HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Zammad API Documentation](https://docs.zammad.org/en/latest/api/intro.html)

---

Теперь ваши звонки будут отображаться в Zammad как:

```
📞 Звонок от Иван Иванов
От: webcall:abc12345 → voicebot
Тип: webcall
Статус: trying
```

Вместо:

```
📞 Звонок от Unknown
От: 170
Тип: N/A
Статус: trying
```
