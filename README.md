# Codex Voice Agent Monorepo

Монорепозиторий для «Агента Codex» – набора приложений и библиотек, построенных поверх инфраструктуры jambonz.

## Структура

```
apps/
  admin/        – мини-админка (Vite + React)
  web-widget/   – React-компонент «Voice Chat» (npm-пакет)
  chrome-ext/   – заготовка для Chrome-расширения
packages/
  core-sip/     – общий SIP/WebRTC-слой поверх sip.js
```

## Предварительные требования

- Node.js 20+
- [pnpm](https://pnpm.io/) (версия указана в `package.json`)
- Настроенный `.env` (см. `.env.example`)

## Установка зависимостей

```sh
pnpm install
```

## Сборка пакетов

```sh
# Собрать все пакеты и приложения
pnpm build

# Собрать только SIP-ядро
pnpm --filter @codex/core-sip build

# Собрать виджет
pnpm --filter @codex/web-widget build

# Собрать Chrome-расширение
pnpm --filter @codex/chrome-ext build
```

## Запуск админки

```sh
pnpm dev:admin
```

> Каталог `apps/admin/public/uploads` предназначен для загружаемых в рантайме файлов (скриншоты, вложения). Репозиторий не содержит тестовых изображений, а сам каталог хранится пустым с `.gitkeep`, чтобы избежать попадания бинарников в историю.

## Использование виджета

```ts
import { VoiceChatWidget, createClient } from "@codex/web-widget";

const client = createClient({
  JAMBONZ_SIP_DOMAIN: process.env.JAMBONZ_SIP_DOMAIN!,
  JAMBONZ_WSS_ADDRESS: process.env.JAMBONZ_WSS_ADDRESS!,
  JAMBONZ_SIP_USERNAME: process.env.JAMBONZ_SIP_USERNAME!,
  JAMBONZ_SIP_PASSWORD: process.env.JAMBONZ_SIP_PASSWORD!,
  TARGET_SIP_URI: process.env.TARGET_SIP_URI!,
  DEFAULT_LANG: process.env.DEFAULT_LANG ?? "en",
  FALLBACK_LANG: process.env.FALLBACK_LANG ?? "ru",
  STUN_URLS: process.env.STUN_URLS ?? "stun:stun.l.google.com:19302",
});
```

## Переменные окружения

В `.env.example` приведён шаблон с основными переменными, необходимыми для регистрации в SIP и интеграции с jambonz API. Настоящие значения выдаются командой эксплуатации и загружаются через переменные окружения или секреты CI/CD.

## Лицензия

MIT
