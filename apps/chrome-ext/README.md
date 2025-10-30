# Chrome Extension – Codex Voice Agent

Минимальная обёртка вокруг `@codex/web-widget` для Chrome (manifest v3).

## Сборка

```sh
pnpm --filter @codex/chrome-ext build
```

Артефакты появятся в `apps/chrome-ext/dist`. Архивируйте содержимое каталога для загрузки в Chrome Web Store / корпоративный магазин.

## Конфигурация

Расширение ожидает, что SIP-параметры будут сохранены в `chrome.storage.sync` под ключом `codexConfig` либо переданы глобально через `window.__CODEX_CONFIG__` (режим разработки). Схема совместима с интерфейсом `VoiceWidgetEnvConfig`.
