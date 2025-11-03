import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChatInstance?: any;
  }
}

/**
 * Хук для инициализации Zammad чата строго по документации
 * https://zammad.okta-solutions.com
 *
 * Важно: НЕ указываем target - чат сам добавится в body
 * Управление открытием - через кнопку с классом 'open-zammad-chat'
 */
export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    const initChat = () => {
      if (typeof window === 'undefined' || !window.ZammadChat) {
        console.error('ZammadChat not found! Make sure chat-no-jquery.min.js is loaded');
        return false;
      }

      try {
        // Инициализация строго по документации Zammad
        const chat = new window.ZammadChat({
          chatId: 1,
          title: '<strong>Поддержка</strong>',
          fontSize: '12px',
          show: false,  // Не показывать автоматически
          buttonClass: 'open-zammad-chat',  // Класс для кнопок открытия
          inactiveClass: 'is-inactive',
          debug: true,
          flat: true
          // НЕ указываем target - пусть чат сам добавляется в body!
          // НЕ указываем host - автоопределение из script src
        });

        window.zammadChatInstance = chat;

        initialized.current = true;
        console.log('Zammad chat initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize Zammad chat:', error);
        return false;
      }
    };

    // Ждем загрузки скрипта, если еще не загружен
    if (!initChat()) {
      const timer = setTimeout(() => {
        if (!initialized.current) {
          initChat();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);
};
