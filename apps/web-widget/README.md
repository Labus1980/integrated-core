# Jambonz Voice Widget

Веб-плагин голосового ассистента на базе Jambonz с дизайном в стиле ElevenLabs.

## 🎯 Возможности

- ✅ **WebRTC звонки** через Jambonz
- ✅ **Floating виджет** с пульсирующей анимацией
- ✅ **Визуализация звуковых волн** в реальном времени
- ✅ **Мультиязычность** (RU/EN) с флагами стран
- ✅ **Адаптивный дизайн** для desktop и mobile
- ✅ **Градиентные стили** в стиле ElevenLabs
- ✅ **Управление звонком**: Mute/Unmute, Hangup
- ✅ **Таймер звонка** с отображением длительности

## 📦 Установка

```bash
# В вашем React проекте
pnpm add @codex/web-widget @codex/core-sip

# или
npm install @codex/web-widget @codex/core-sip
```

## 🚀 Быстрый старт

### Вариант 1: Floating Widget (рекомендуется)

```tsx
import { FloatingVoiceWidget, createClient } from "@codex/web-widget";

function App() {
  // Создаем SIP клиент
  const client = createClient({
    JAMBONZ_SIP_DOMAIN: "jambonzlab.ru",
    JAMBONZ_WSS_ADDRESS: "ws://sip.jambonzlab.ru",
    JAMBONZ_SIP_USERNAME: "username",
    JAMBONZ_SIP_PASSWORD: "password",
    TARGET_SIP_URI: "sip:assistant@jambonzlab.ru",
    DEFAULT_LANG: "ru",
    FALLBACK_LANG: "en",
    STUN_URLS: "stun:fs-tun.okta-solutions.com:3478",
  });

  return (
    <div>
      {/* Ваше приложение */}

      <FloatingVoiceWidget
        client={client}
        theme="dark"
        position="bottom-right"
        locale="ru"
        autoRegister={true}
      />
    </div>
  );
}
```

### Вариант 2: Card-style Widget (классический)

```tsx
import { VoiceChatWidget, CodexSipClient } from "@codex/web-widget";
import type { CodexSipConfig } from "@codex/core-sip";

const sipConfig: CodexSipConfig = {
  domain: "jambonzlab.ru",
  wssServer: "ws://sip.jambonzlab.ru",
  username: "username",
  password: "password",
  targetUri: "sip:assistant@jambonzlab.ru",
  iceServers: [{ urls: "stun:fs-tun.okta-solutions.com:3478" }],
  defaultLanguage: "ru",
  fallbackLanguage: "en",
};

const client = new CodexSipClient(sipConfig);

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <VoiceChatWidget
        client={client}
        theme="dark"
        locale="ru"
      />
    </div>
  );
}
```

## ⚙️ Конфигурация

### FloatingVoiceWidget Props

```typescript
interface FloatingVoiceWidgetProps {
  /** Экземпляр SIP клиента */
  client: CodexSipClient;

  /** Список поддерживаемых языков с флагами */
  languages?: LanguageOption[];

  /** Язык интерфейса виджета */
  locale?: "en" | "ru";

  /** Цветовая тема */
  theme?: "light" | "dark";

  /** Позиция на странице */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";

  /** Автоматическая регистрация при монтировании */
  autoRegister?: boolean;
}

interface LanguageOption {
  code: string;    // Код языка (например, "en")
  label: string;   // Название (например, "English")
  flag: string;    // Эмодзи флага (например, "🇬🇧")
}
```

### Примеры конфигураций

#### Пользовательские языки

```tsx
const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

<FloatingVoiceWidget
  client={client}
  languages={languages}
  locale="en"
/>
```

#### Светлая тема

```tsx
<FloatingVoiceWidget
  client={client}
  theme="light"
  position="top-left"
/>
```

#### Переменные окружения

Создайте файл `.env`:

```env
VITE_JAMBONZ_SIP_DOMAIN=jambonzlab.ru
VITE_JAMBONZ_WSS_ADDRESS=ws://sip.jambonzlab.ru
VITE_JAMBONZ_SIP_USERNAME=username
VITE_JAMBONZ_SIP_PASSWORD=password
VITE_TARGET_SIP_URI=sip:assistant@jambonzlab.ru
VITE_DEFAULT_LANG=ru
VITE_FALLBACK_LANG=en
VITE_STUN_URLS=stun:fs-tun.okta-solutions.com:3478
```

Используйте в коде:

```tsx
import { createClient } from "@codex/web-widget";

const client = createClient({
  JAMBONZ_SIP_DOMAIN: import.meta.env.VITE_JAMBONZ_SIP_DOMAIN,
  JAMBONZ_WSS_ADDRESS: import.meta.env.VITE_JAMBONZ_WSS_ADDRESS,
  JAMBONZ_SIP_USERNAME: import.meta.env.VITE_JAMBONZ_SIP_USERNAME,
  JAMBONZ_SIP_PASSWORD: import.meta.env.VITE_JAMBONZ_SIP_PASSWORD,
  TARGET_SIP_URI: import.meta.env.VITE_TARGET_SIP_URI,
  DEFAULT_LANG: import.meta.env.VITE_DEFAULT_LANG,
  FALLBACK_LANG: import.meta.env.VITE_FALLBACK_LANG,
  STUN_URLS: import.meta.env.VITE_STUN_URLS,
});
```

## 🎨 Кастомизация стилей

Виджет использует CSS переменные, которые можно переопределить:

```css
:root {
  /* Градиенты */
  --codex-gradient-start: #667EEA;
  --codex-gradient-end: #764BA2;

  /* Цвета */
  --codex-primary: #0066FF;
  --codex-primary-light: #00A3FF;
  --codex-success: #10B981;
  --codex-danger: #EF4444;

  /* Шрифт */
  --codex-font-family: "Inter", system-ui, sans-serif;
}
```

## 🔊 События и Callbacks

```tsx
import { useEffect } from "react";

function App() {
  const client = createClient({...});

  useEffect(() => {
    // Событие изменения состояния звонка
    client.on("call", (event) => {
      console.log("Call state:", event.state);
      // idle | registering | connecting | ringing | connected | ended | error
    });

    // Метрики WebRTC
    client.on("metrics", (metrics) => {
      console.log("RTT:", metrics.rttMs);
      console.log("ICE State:", metrics.iceState);
    });

    // Логи для отладки
    client.on("log", (log) => {
      console.log(`[${log.level}] ${log.message}`, log.context);
    });

    return () => {
      client.off("call", handleCallEvent);
      client.off("metrics", handleMetrics);
      client.off("log", handleLog);
    };
  }, [client]);

  return <FloatingVoiceWidget client={client} />;
}
```

## 📱 Адаптивность

Виджет автоматически адаптируется для мобильных устройств:

- **Desktop (> 768px)**: Floating кнопка + раскрывающаяся панель
- **Mobile (≤ 768px)**: Кнопка на всю ширину + модальная панель

## 🌐 Поддерживаемые браузеры

| Браузер | Версия |
|---------|--------|
| Chrome  | 90+    |
| Firefox | 88+    |
| Safari  | 14+    |
| Edge    | 90+    |
| Opera   | 76+    |

## 🔒 Безопасность

⚠️ **Важно:** Никогда не храните credentials в frontend коде!

### Рекомендации:

1. Используйте переменные окружения (`.env`)
2. Создайте backend proxy для получения SIP credentials
3. Используйте HTTPS/WSS для всех соединений
4. Ограничьте CORS политики на Jambonz сервере

### Пример backend proxy (Node.js/Express):

```typescript
// server.ts
app.get('/api/sip-credentials', authenticate, (req, res) => {
  res.json({
    domain: process.env.SIP_DOMAIN,
    wssServer: process.env.SIP_WSS,
    username: generateTempUsername(req.user.id),
    password: generateTempPassword(),
    targetUri: process.env.TARGET_SIP_URI,
  });
});
```

```tsx
// client.tsx
const credentials = await fetch('/api/sip-credentials').then(r => r.json());
const client = new CodexSipClient(credentials);
```

## 🐛 Troubleshooting

### Звук не воспроизводится

Убедитесь, что пользователь взаимодействовал со страницей перед звонком (требование браузеров для autoplay).

```tsx
// Добавьте обработчик первого клика
useEffect(() => {
  const handleFirstClick = () => {
    audioRef.current?.play().catch(() => {});
    document.removeEventListener('click', handleFirstClick);
  };
  document.addEventListener('click', handleFirstClick);
}, []);
```

### WebRTC не подключается

1. Проверьте STUN/TURN сервера
2. Убедитесь в правильности WSS адреса
3. Проверьте firewall/CORS настройки

### Регистрация не проходит

1. Проверьте SIP credentials
2. Проверьте логи: `client.on("log", console.log)`
3. Убедитесь, что Jambonz сервер запущен и доступен

## 📚 API Reference

См. [packages/core-sip/README.md](../../packages/core-sip/README.md) для полной документации SIP клиента.

## 🤝 Поддержка

- [GitHub Issues](https://github.com/your-org/integrated-core/issues)
- [Jambonz Documentation](https://www.jambonz.org/)
- [WebRTC Troubleshooting](https://webrtc.org/getting-started/testing)

## 📄 Лицензия

MIT

---

**Версия:** 0.1.0
**Автор:** Codex Team
**Дата:** 02.11.2025
