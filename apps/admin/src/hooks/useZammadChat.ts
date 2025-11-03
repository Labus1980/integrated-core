import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChatInstance?: any;
    zammadChatReady?: boolean;
    openZammadChat?: () => void;
  }
}

const ZAMMAD_SCRIPT_URL = 'https://zammad.okta-solutions.com/assets/chat/chat-no-jquery.min.js';

/**
 * Динамическая загрузка скрипта Zammad с обработкой ошибок
 */
const loadZammadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('[loadZammadScript] Начало загрузки скрипта:', ZAMMAD_SCRIPT_URL);

    // Проверяем, не загружен ли уже
    if (window.ZammadChat) {
      console.log('[loadZammadScript] ✅ Скрипт уже загружен');
      resolve();
      return;
    }

    // Проверяем, нет ли уже скрипта в DOM
    const existingScript = document.querySelector(`script[src="${ZAMMAD_SCRIPT_URL}"]`);
    if (existingScript) {
      console.log('[loadZammadScript] ⚠️ Скрипт уже в DOM, ждём загрузки...');

      // Ждём загрузки существующего скрипта
      const checkLoaded = setInterval(() => {
        if (window.ZammadChat) {
          clearInterval(checkLoaded);
          console.log('[loadZammadScript] ✅ Существующий скрипт загрузился');
          resolve();
        }
      }, 100);

      // Таймаут 10 секунд
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.ZammadChat) {
          console.error('[loadZammadScript] ❌ Таймаут загрузки существующего скрипта');
          reject(new Error('Timeout loading existing Zammad script'));
        }
      }, 10000);
      return;
    }

    // Создаём новый script элемент
    console.log('[loadZammadScript] Создание нового <script> элемента');
    const script = document.createElement('script');
    script.src = ZAMMAD_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      console.log('[loadZammadScript] ✅ Скрипт загружен (onload)');

      if (window.ZammadChat) {
        console.log('[loadZammadScript] ✅ window.ZammadChat доступен');
        resolve();
      } else {
        console.error('[loadZammadScript] ❌ Скрипт загружен, но window.ZammadChat не найден!');
        reject(new Error('ZammadChat not found after script load'));
      }
    };

    script.onerror = (error) => {
      console.error('[loadZammadScript] ❌ Ошибка загрузки скрипта:', error);
      console.error('[loadZammadScript] URL:', ZAMMAD_SCRIPT_URL);
      reject(new Error(`Failed to load Zammad script from ${ZAMMAD_SCRIPT_URL}`));
    };

    console.log('[loadZammadScript] Добавление скрипта в <head>');
    document.head.appendChild(script);
  });
};

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      console.log('[useZammadChat] Already initialized, skipping');
      return;
    }

    console.log('[useZammadChat] Starting initialization');

    const initChat = async () => {
      try {
        // Шаг 1: Загрузка скрипта
        console.log('[useZammadChat] Шаг 1: Загрузка скрипта...');
        await loadZammadScript();
        console.log('[useZammadChat] ✅ Шаг 1 завершен');

        // Шаг 2: Проверка доступности ZammadChat
        console.log('[useZammadChat] Шаг 2: Проверка window.ZammadChat...');
        if (!window.ZammadChat) {
          throw new Error('window.ZammadChat not available after script load');
        }
        console.log('[useZammadChat] ✅ Шаг 2 завершен');

        // Шаг 3: Инициализация чата
        console.log('[useZammadChat] Шаг 3: Инициализация чата...');
        window.ZammadChat.init({
          chatId: 1,
          host: 'https://zammad.okta-solutions.com',
          title: 'Поддержка OKTA Solutions',
          fontSize: '12px',
          flat: true,
          show: false,
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: true,
        });
        console.log('[useZammadChat] ✅ Шаг 3 завершен - ZammadChat.init() вызван');

        // Шаг 4: Сохранение экземпляра
        window.zammadChatInstance = window.ZammadChat;
        window.zammadChatReady = true;

        // Dispatch событие готовности
        window.dispatchEvent(new Event('zammad:ready'));
        console.log('[useZammadChat] ✅ Событие zammad:ready отправлено');

        // Глобальная функция для открытия чата
        window.openZammadChat = () => {
          console.log('[openZammadChat] Вызвана функция открытия чата');

          try {
            if (window.ZammadChat && typeof window.ZammadChat.open === 'function') {
              console.log('[openZammadChat] Вызов ZammadChat.open()');
              window.ZammadChat.open();
              return;
            }
            console.warn('[openZammadChat] ZammadChat.open() не доступен');
          } catch (err) {
            console.error('[openZammadChat] Ошибка:', err);
          }

          // Fallback: клик по кнопке
          console.log('[openZammadChat] Fallback: поиск кнопки');
          const btn = document.querySelector('.open-zammad-chat, .zammad-chat-button') as HTMLElement | null;
          if (btn) {
            console.log('[openZammadChat] Кнопка найдена, клик');
            btn.click();
          } else {
            console.error('[openZammadChat] Кнопка не найдена');
          }
        };

        initialized.current = true;
        console.log('[useZammadChat] ✅✅✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО ✅✅✅');

      } catch (error) {
        console.error('[useZammadChat] ❌ ОШИБКА ИНИЦИАЛИЗАЦИИ:', error);

        // Повторная попытка через 2 секунды
        if (!initialized.current) {
          console.log('[useZammadChat] Повторная попытка через 2000ms...');
          setTimeout(() => {
            if (!initialized.current) {
              initChat();
            }
          }, 2000);
        }
      }
    };

    initChat();
  }, []);
};
