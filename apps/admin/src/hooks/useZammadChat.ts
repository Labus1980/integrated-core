import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChat?: any;
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
          title: 'Поддержка',        // Заголовок окна чата
          fontSize: '12px',
          flat: true,
          chatId: 1,                  // ID чата из админки Zammad
          show: false,                // Не показывать автоматически
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: false                // Поставьте true для отладки
        });

        window.zammadChat = chat;

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
