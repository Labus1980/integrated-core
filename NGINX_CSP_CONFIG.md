# Конфигурация Content Security Policy (CSP) для nginx

## Проблема

При загрузке Zammad чата возникают CSP ошибки:
```
Refused to load the stylesheet 'data:text/css,@import%20url%28%27https%3A//zammad.okta-solutions.com/assets/chat/chat.css%27%29%3B'
```

Это происходит потому что Zammad chat загружает CSS через `data:` URI.

## Решение

Добавьте следующий CSP заголовок в конфигурацию nginx для вашего приложения.

### Конфигурация nginx

Добавьте в секцию `location /` вашего сервера:

```nginx
server {
    listen 443 ssl http2;
    server_name your-app.okta-solutions.com;  # Ваш домен

    # ... SSL настройки ...

    location / {
        # Добавьте этот CSP заголовок
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://mc.yandex.ru https://vk.com https://*.vk.com https://api-maps.yandex.ru https://yastatic.net https://mc.yandex.com https://*.yandex.com https://*.yandex.ru https://unpkg.com https://widget.yourgood.app https://zammad.okta-solutions.com; script-src-elem 'self' 'unsafe-inline' https://telegram.org https://mc.yandex.ru https://vk.com https://*.vk.com https://api-maps.yandex.ru https://yastatic.net https://mc.yandex.com https://*.yandex.com https://*.yandex.ru https://unpkg.com https://widget.yourgood.app https://zammad.okta-solutions.com; connect-src 'self' https://keycloak.okta-solutions.com https://*.okta-solutions.com https://zammad.okta-solutions.com ws://jambonz-sipws.okta-solutions.com wss://jambonz-sipws.okta-solutions.com wss://*.okta-solutions.com wss://zammad.okta-solutions.com ws://*.okta-solutions.com ws://zammad.okta-solutions.com https://api.telegram.org https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com https://api.vk.com https://*.vk.com https://unpkg.com https://widget.yourgood.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://zammad.okta-solutions.com data:; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://zammad.okta-solutions.com data:; font-src 'self' https://fonts.gstatic.com https://zammad.okta-solutions.com data:; img-src 'self' data: https: https://zammad.okta-solutions.com; frame-src 'self' https://zammad.okta-solutions.com; media-src 'self' https://zammad.okta-solutions.com blob:;" always;

        # Остальные настройки прокси
        proxy_pass http://your_app_backend;
        proxy_set_header Host $host;
        # ...
    }
}
```

### Альтернатива: Более читаемая версия с разделением на строки

Для лучшей читаемости можно использовать переменную:

```nginx
server {
    listen 443 ssl http2;
    server_name your-app.okta-solutions.com;

    # CSP политика
    set $csp_policy "default-src 'self'; ";
    set $csp_policy "${csp_policy}script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://mc.yandex.ru https://vk.com https://*.vk.com https://api-maps.yandex.ru https://yastatic.net https://mc.yandex.com https://*.yandex.com https://*.yandex.ru https://unpkg.com https://widget.yourgood.app https://zammad.okta-solutions.com; ";
    set $csp_policy "${csp_policy}script-src-elem 'self' 'unsafe-inline' https://telegram.org https://mc.yandex.ru https://vk.com https://*.vk.com https://api-maps.yandex.ru https://yastatic.net https://mc.yandex.com https://*.yandex.com https://*.yandex.ru https://unpkg.com https://widget.yourgood.app https://zammad.okta-solutions.com; ";
    set $csp_policy "${csp_policy}connect-src 'self' https://keycloak.okta-solutions.com https://*.okta-solutions.com https://zammad.okta-solutions.com ws://jambonz-sipws.okta-solutions.com wss://jambonz-sipws.okta-solutions.com wss://*.okta-solutions.com wss://zammad.okta-solutions.com ws://*.okta-solutions.com ws://zammad.okta-solutions.com https://api.telegram.org https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com https://api.vk.com https://*.vk.com https://unpkg.com https://widget.yourgood.app; ";
    set $csp_policy "${csp_policy}style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://zammad.okta-solutions.com data:; ";
    set $csp_policy "${csp_policy}style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://zammad.okta-solutions.com data:; ";
    set $csp_policy "${csp_policy}font-src 'self' https://fonts.gstatic.com https://zammad.okta-solutions.com data:; ";
    set $csp_policy "${csp_policy}img-src 'self' data: https: https://zammad.okta-solutions.com; ";
    set $csp_policy "${csp_policy}frame-src 'self' https://zammad.okta-solutions.com; ";
    set $csp_policy "${csp_policy}media-src 'self' https://zammad.okta-solutions.com blob:;";

    location / {
        add_header Content-Security-Policy $csp_policy always;

        # Остальные настройки...
        proxy_pass http://your_app_backend;
    }
}
```

## Ключевые изменения для Zammad

Для работы Zammad чата критически важны следующие директивы:

1. **`style-src ... data:`** - разрешает загрузку CSS через data: URI
2. **`style-src-elem ... data:`** - разрешает элементы стилей через data: URI
3. **`script-src-elem ... https://zammad.okta-solutions.com`** - разрешает загрузку скриптов Zammad
4. **`connect-src ... wss://zammad.okta-solutions.com`** - разрешает WebSocket соединения
5. **`frame-src ... https://zammad.okta-solutions.com`** - разрешает iframe чата

## Проверка

После применения конфигурации:

```bash
# Проверка синтаксиса
sudo nginx -t

# Перезагрузка nginx
sudo systemctl reload nginx

# Проверка заголовков
curl -I https://your-app.okta-solutions.com | grep Content-Security-Policy
```

## Важно

- Убедитесь, что CSP заголовок не дублируется в HTML (`apps/admin/index.html`)
- Если CSP устанавливается в nginx, можно удалить `<meta http-equiv="Content-Security-Policy">` из HTML
- Nginx CSP имеет приоритет над HTML CSP
