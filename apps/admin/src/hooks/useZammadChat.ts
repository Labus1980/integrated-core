import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChatInstance?: any;
    openZammadChat?: () => void;
  }
}

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    const initChat = () => {
      if (typeof window === 'undefined' || !window.ZammadChat) {
        console.error('ZammadChat not found!');
        return false;
      }

      try {
        const chat = new window.ZammadChat({
          host: 'https://zammad.okta-solutions.com',  // Base URL для подключения (без wss://)
          title: 'Поддержка',        // Заголовок окна чата
          fontSize: '12px',
          flat: true,
          chatId: 1,                  // ID чата из админки Zammad
          show: false,                // Не показывать автоматически
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: true,                 // Включаем отладку для диагностики
          target: document.querySelector('#zammad-chat-container') || document.body  // Указываем контейнер для виджета
        });

        window.zammadChatInstance = chat;

        // Глобальная функция для открытия чата программно
        window.openZammadChat = () => {
          try {
            if (chat && typeof chat.open === 'function') {
              chat.open();
              return;
            }
          } catch (err) {
            console.error('Error opening chat:', err);
          }

          // Fallback: клик по кнопке
          const btn = document.querySelector('.open-zammad-chat') as HTMLElement | null;
          if (btn) btn.click();
        };

        initialized.current = true;
        console.log('Zammad chat initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize Zammad chat:', error);
        return false;
      }
    };

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
