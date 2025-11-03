import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChatInstance?: any;
    zammadChatReady?: boolean;
    openZammadChat?: () => void;
  }
}

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      console.log('[useZammadChat] Already initialized, skipping');
      return;
    }

    console.log('[useZammadChat] Starting initialization');

    const initChat = () => {
      console.log('[useZammadChat] Checking for ZammadChat...');

      if (typeof window === 'undefined') {
        console.error('[useZammadChat] Window is undefined');
        return false;
      }

      if (!window.ZammadChat) {
        console.error('[useZammadChat] ZammadChat script not loaded yet');
        return false;
      }

      console.log('[useZammadChat] ZammadChat found, initializing...');

      try {
        // Используем официальный метод инициализации из документации Zammad
        window.ZammadChat.init({
          chatId: 1,
          host: 'https://zammad.okta-solutions.com',
          title: 'Поддержка OKTA Solutions',
          fontSize: '12px',
          flat: true,
          show: false,
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: true, // Включаем debug для диагностики
        });

        console.log('[useZammadChat] ZammadChat.init() called');

        // Сохраняем экземпляр в window
        window.zammadChatInstance = window.ZammadChat;
        window.zammadChatReady = true;

        // Dispatch событие готовности
        window.dispatchEvent(new Event('zammad:ready'));
        console.log('[useZammadChat] Dispatched zammad:ready event');

        // Глобальная функция для открытия чата
        window.openZammadChat = () => {
          console.log('[useZammadChat] openZammadChat() called');

          try {
            if (window.ZammadChat && typeof window.ZammadChat.open === 'function') {
              console.log('[useZammadChat] Calling ZammadChat.open()');
              window.ZammadChat.open();
              return;
            }
            console.warn('[useZammadChat] ZammadChat.open() not available');
          } catch (err) {
            console.error('[useZammadChat] Error calling ZammadChat.open():', err);
          }

          // Fallback: поиск и клик по кнопке
          console.log('[useZammadChat] Trying fallback button click');
          const btn = document.querySelector('.open-zammad-chat, .zammad-chat-button') as HTMLElement | null;
          if (btn) {
            console.log('[useZammadChat] Found button, clicking');
            btn.click();
          } else {
            console.error('[useZammadChat] Button not found');
          }
        };

        initialized.current = true;
        console.log('[useZammadChat] ✅ Initialization successful');
        return true;
      } catch (error) {
        console.error('[useZammadChat] ❌ Failed to initialize:', error);
        return false;
      }
    };

    // Попытка инициализации
    if (!initChat()) {
      console.log('[useZammadChat] First attempt failed, retrying in 1000ms');
      const timer = setTimeout(() => {
        if (!initialized.current) {
          console.log('[useZammadChat] Retry attempt...');
          initChat();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);
};
