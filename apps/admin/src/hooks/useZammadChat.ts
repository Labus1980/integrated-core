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
      // Проверка что ZammadChat загружен
      if (typeof window === 'undefined' || !window.ZammadChat) {
        console.error('ZammadChat not found!');
        return false;
      }

      try {
        // Создание экземпляра чата
        const chat = new window.ZammadChat({
          title: 'Поддержка OKTA Solutions',
          fontSize: '12px',
          flat: true,
          chatId: 1,
          host: 'https://zammad.okta-solutions.com',
          show: false,
          buttonClass: 'open-zammad-chat',
          inactiveClass: 'is-inactive',
          debug: true,
        });

        // Сохранение в window для глобального доступа
        window.zammadChat = chat;

        // Функция для программного открытия чата
        window.openZammadChat = () => {
          try {
            // Пробуем открыть через API
            if (chat && typeof chat.open === 'function') {
              chat.open();
              return;
            }
          } catch (err) {
            console.error('[openZammadChat] Error:', err);
          }

          // Fallback: клик по кнопке виджета
          const btn = document.querySelector('.open-zammad-chat') as HTMLElement | null;
          if (btn) {
            btn.click();
            return;
          }

          const handle = document.querySelector('[class*="zammad"][class*="handle"]') as HTMLElement | null;
          if (handle) {
            handle.click();
          }
        };

        initialized.current = true;
        console.log('Zammad chat initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize Zammad chat:', error);
        return false;
      }
    };

    // Первая попытка инициализации
    if (!initChat()) {
      // Повторная попытка через 1 секунду, если скрипт ещё не загрузился
      const timer = setTimeout(() => {
        if (!initialized.current) {
          initChat();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);
};
