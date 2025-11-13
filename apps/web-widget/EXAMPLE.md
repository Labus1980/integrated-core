# Примеры использования

## Полный пример с React

```tsx
import React, { useEffect, useState } from "react";
import { FloatingVoiceWidget, createClient } from "@codex/web-widget";
import type { LanguageOption } from "@codex/web-widget";

// Конфигурация языков
const languages: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export function App() {
  const [client] = useState(() =>
    createClient({
      JAMBONZ_SIP_DOMAIN: "jambonzlab.ru",
      JAMBONZ_WSS_ADDRESS: "ws://jambonz-sipws.okta-solutions.com/ws",
      JAMBONZ_SIP_USERNAME: "3500",
      JAMBONZ_SIP_PASSWORD: "your-password",
      TARGET_SIP_URI: "sip:voicebot@jambonzlab.ru",
      DEFAULT_LANG: "ru",
      FALLBACK_LANG: "en",
      STUN_URLS: "stun:fs-tun.okta-solutions.com:3478",
    })
  );

  useEffect(() => {
    // Подписка на события
    const handleCallState = (event: any) => {
      console.log("Call state changed:", event.state);

      // Отправка метрик в аналитику
      if (event.state === "connected") {
        analytics.track("voice_call_started");
      } else if (event.state === "ended") {
        analytics.track("voice_call_ended");
      }
    };

    const handleMetrics = (metrics: any) => {
      // Мониторинг качества связи
      if (metrics.rttMs > 200) {
        console.warn("High RTT detected:", metrics.rttMs);
      }
    };

    client.on("call", handleCallState);
    client.on("metrics", handleMetrics);

    return () => {
      client.off("call", handleCallState);
      client.off("metrics", handleMetrics);
    };
  }, [client]);

  return (
    <div className="app">
      <header>
        <h1>Моё приложение</h1>
      </header>

      <main>
        {/* Ваш контент */}
      </main>

      {/* Floating виджет */}
      <FloatingVoiceWidget
        client={client}
        languages={languages}
        theme="dark"
        position="bottom-right"
        locale="ru"
        autoRegister={true}
      />
    </div>
  );
}
```

## Интеграция с Next.js

```tsx
// app/components/VoiceWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { FloatingVoiceWidget, createClient } from "@codex/web-widget";

export function VoiceWidget() {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Создаем клиент только на клиенте
    const sipClient = createClient({
      JAMBONZ_SIP_DOMAIN: "jambonzlab.ru",
      JAMBONZ_WSS_ADDRESS: "ws://jambonz-sipws.okta-solutions.com/ws",
      JAMBONZ_SIP_USERNAME: "3500",
      JAMBONZ_SIP_PASSWORD: "your-password",
      TARGET_SIP_URI: "sip:voicebot@jambonzlab.ru",
      DEFAULT_LANG: "ru",
      FALLBACK_LANG: "en",
      STUN_URLS: "stun:fs-tun.okta-solutions.com:3478",
    });

    setClient(sipClient);

    return () => {
      sipClient.destroy();
    };
  }, []);

  if (!client) return null;

  return <FloatingVoiceWidget client={client} />;
}
```

```tsx
// app/layout.tsx
import { VoiceWidget } from "./components/VoiceWidget";

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <VoiceWidget />
      </body>
    </html>
  );
}
```

## Использование с TypeScript

```tsx
import type {
  CodexSipClient,
  CallState,
  MetricsEvent,
  LogEvent,
} from "@codex/core-sip";
import type {
  FloatingVoiceWidgetProps,
  LanguageOption,
} from "@codex/web-widget";

interface AppConfig {
  sipDomain: string;
  sipWss: string;
  sipUsername: string;
  sipPassword: string;
  targetUri: string;
}

function createVoiceClient(config: AppConfig): CodexSipClient {
  return createClient({
    JAMBONZ_SIP_DOMAIN: "jambonzlab.ru",
    JAMBONZ_WSS_ADDRESS: "ws://jambonz-sipws.okta-solutions.com/ws",
    JAMBONZ_SIP_USERNAME: "3500",
    JAMBONZ_SIP_PASSWORD: "your-password",
    TARGET_SIP_URI: "sip:voicebot@jambonzlab.ru",
    DEFAULT_LANG: "ru",
    FALLBACK_LANG: "en",
    STUN_URLS: "stun:fs-tun.okta-solutions.com:3478",
  });
}
```

## Backend Proxy для безопасности

```typescript
// server/api/sip-credentials.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Генерируем временные credentials для пользователя
  const tempUsername = `user_${session.user.id}_${Date.now()}`;
  const tempPassword = generateSecurePassword();

  // Сохраняем во временное хранилище (Redis, Memory)
  await redis.setex(
    `sip:${tempUsername}`,
    3600, // 1 час
    JSON.stringify({
      password: tempPassword,
      userId: session.user.id,
    })
  );

  res.json({
    domain: process.env.SIP_DOMAIN,
    wssServer: process.env.SIP_WSS_SERVER,
    username: tempUsername,
    password: tempPassword,
    targetUri: process.env.TARGET_SIP_URI,
  });
}
```

```tsx
// client/App.tsx
import { useEffect, useState } from "react";
import { FloatingVoiceWidget } from "@codex/web-widget";
import { CodexSipClient } from "@codex/core-sip";

export function App() {
  const [client, setClient] = useState<CodexSipClient | null>(null);

  useEffect(() => {
    async function initClient() {
      // Получаем credentials с backend
      const credentials = await fetch("/api/sip-credentials").then((r) =>
        r.json()
      );

      const sipClient = new CodexSipClient({
        domain: "jambonzlab.ru",
        wssServer: "ws://jambonz-sipws.okta-solutions.com/ws",
        username: "3500",
        password: "your-password",
        targetUri: "sip:voicebot@jambonzlab.ru",
        iceServers: [{ urls: "stun:fs-tun.okta-solutions.com:3478" }],
        defaultLanguage: "ru",
        fallbackLanguage: "en",
      });

      setClient(sipClient);
    }

    initClient();

    return () => {
      client?.destroy();
    };
  }, []);

  if (!client) return <div>Loading...</div>;

  return <FloatingVoiceWidget client={client} />;
}
```

## Мультиязычность с i18next

```tsx
import { useTranslation } from "react-i18next";
import { FloatingVoiceWidget } from "@codex/web-widget";

function App() {
  const { i18n } = useTranslation();
  const [client] = useState(() => createClient({...}));

  return (
    <FloatingVoiceWidget
      client={client}
      locale={i18n.language as "en" | "ru"}
      languages={[
        { code: "en", label: i18n.t("languages.english"), flag: "🇬🇧" },
        { code: "ru", label: i18n.t("languages.russian"), flag: "🇷🇺" },
      ]}
    />
  );
}
```

## Интеграция с аналитикой

```tsx
import { useEffect } from "react";
import { FloatingVoiceWidget, createClient } from "@codex/web-widget";
import { analytics } from "./analytics";

function App() {
  const [client] = useState(() => createClient({...}));

  useEffect(() => {
    let callStartTime: number;

    client.on("call", (event) => {
      switch (event.state) {
        case "connecting":
          analytics.track("voice_call_initiated");
          break;

        case "connected":
          callStartTime = Date.now();
          analytics.track("voice_call_connected", {
            callId: event.callId,
          });
          break;

        case "ended":
          const duration = callStartTime
            ? (Date.now() - callStartTime) / 1000
            : 0;
          analytics.track("voice_call_ended", {
            callId: event.callId,
            duration,
          });
          break;

        case "error":
          analytics.track("voice_call_error", {
            reason: event.reason,
          });
          break;
      }
    });

    client.on("metrics", (metrics) => {
      // Отправка метрик качества каждые 30 секунд
      if (metrics.rttMs) {
        analytics.track("voice_call_quality", {
          rtt: metrics.rttMs,
          iceState: metrics.iceState,
        });
      }
    });
  }, [client]);

  return <FloatingVoiceWidget client={client} />;
}
```

## Кастомная тема

```tsx
import { FloatingVoiceWidget } from "@codex/web-widget";
import "./custom-voice-widget-theme.css";

// custom-voice-widget-theme.css
/*
:root {
  --codex-gradient-start: #FF6B6B;
  --codex-gradient-end: #4ECDC4;
  --codex-primary: #FF6B6B;
  --codex-success: #4ECDC4;
  --codex-font-family: "Poppins", sans-serif;
}
*/

function App() {
  return <FloatingVoiceWidget client={client} theme="dark" />;
}
```

## Условный рендеринг

```tsx
function App() {
  const [showWidget, setShowWidget] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Показываем виджет только авторизованным пользователям
    if (user && user.hasVoiceSupport) {
      setShowWidget(true);
    }
  }, [user]);

  return (
    <div>
      {/* App content */}

      {showWidget && (
        <FloatingVoiceWidget
          client={client}
          position="bottom-right"
        />
      )}
    </div>
  );
}
```

## A/B тестирование позиций

```tsx
import { useMemo } from "react";

function App() {
  const position = useMemo(() => {
    // Рандомизация позиции для A/B теста
    const variant = Math.random() > 0.5 ? "bottom-right" : "bottom-left";
    analytics.track("voice_widget_variant", { variant });
    return variant;
  }, []);

  return (
    <FloatingVoiceWidget
      client={client}
      position={position}
    />
  );
}
```
