import { useEffect, useRef } from 'react';

interface ZammadChatInstance {
  open?: () => void;
  close?: () => void;
}

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChat?: ZammadChatInstance;
    zammadChatInstance?: ZammadChatInstance;
    openZammadChat?: () => void;
  }
}

export const useZammadChat = () => {
  const initialized = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 10;

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    const initChat = () => {
      // Проверяем наличие конструктора ZammadChat
      if (typeof window === 'undefined' || !window.ZammadChat) {
        console.warn('ZammadChat constructor not found, attempt', retryCount.current + 1);
        return false;
      }

      try {
        console.log('Initializing Zammad Chat...');

        const chat = new window.ZammadChat({
          title: 'Поддержка',
          fontSize: '12px',
          flat: true,
          chatId: 1,
          show: false,
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: true  // Включаем debug для диагностики
        });

        // Сохраняем экземпляр в обе переменные для совместимости
        window.zammadChat = chat;
        window.zammadChatInstance = chat;

        // Глобальная функция для открытия чата программно
        window.openZammadChat = () => {
          console.log('openZammadChat called, instance:', window.zammadChatInstance);

          try {
            if (window.zammadChatInstance && typeof window.zammadChatInstance.open === 'function') {
              window.zammadChatInstance.open();
              console.log('Chat opened via instance.open()');
              return;
            }
          } catch (err) {
            console.error('Error opening chat via instance:', err);
          }

          // Fallback: клик по кнопке
          const btn = document.querySelector('.open-zammad-chat') as HTMLElement | null;
          if (btn) {
            btn.click();
            console.log('Chat opened via button click');
          } else {
            console.error('Neither chat instance nor button found');
          }
        };

        initialized.current = true;
        console.log('Zammad chat initialized successfully:', {
          instance: !!window.zammadChatInstance,
          hasOpen: typeof window.zammadChatInstance?.open === 'function'
        });
        return true;
      } catch (error) {
        console.error('Failed to initialize Zammad chat:', error);
        return false;
      }
    };

    const attemptInit = () => {
      if (initChat()) {
        return;
      }

      // Повторяем попытки с увеличивающейся задержкой
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        const delay = 300 * retryCount.current; // 300ms, 600ms, 900ms, etc.
        console.log(`Retrying Zammad chat initialization in ${delay}ms... (attempt ${retryCount.current}/${maxRetries})`);

        const timer = setTimeout(() => {
          if (!initialized.current) {
            attemptInit();
          }
        }, delay);

        return () => clearTimeout(timer);
      } else {
        console.error('Failed to initialize Zammad chat after', maxRetries, 'attempts');
        console.error('Please check if the chat-no-jquery.min.js script is loaded correctly');
      }
    };

    // Ждем полной загрузки документа и всех скриптов
    if (document.readyState === 'complete') {
      // Документ уже загружен, начинаем инициализацию
      console.log('Document already loaded, starting Zammad chat initialization...');
      attemptInit();
    } else {
      // Ждем события load
      const handleLoad = () => {
        console.log('Window loaded, starting Zammad chat initialization...');
        // Даем небольшую задержку после load для выполнения скриптов
        setTimeout(() => attemptInit(), 500);
      };

      window.addEventListener('load', handleLoad);

      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);
};
