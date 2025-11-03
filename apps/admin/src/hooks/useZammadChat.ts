import { useEffect, useRef } from 'react';

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    const initChat = () => {
      if (typeof window === 'undefined' || !(window as any).ZammadChat) {
        console.error('ZammadChat not found!');
        return false;
      }

      try {
        const chat = new (window as any).ZammadChat({
          title: 'Поддержка',        // Заголовок окна чата
          fontSize: '12px',
          flat: true,
          chatId: 1,                  // ID чата из админки Zammad
          show: false,                // Не показывать автоматически
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: false                // Отключаем debug в продакшене
        });

        (window as any).zammadChat = chat;

        // Глобальная функция для открытия чата программно
        (window as any).openZammadChat = () => {
          try {
            if (chat && typeof (chat as any).open === 'function') {
              (chat as any).open();
              return;
            }
          } catch {}

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
