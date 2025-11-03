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
      if (typeof window === 'undefined') {
        return false;
      }

      if (!window.ZammadChat) {
        return false;
      }

      try {
        // Создание экземпляра чата СТРОГО ПО ДОКУМЕНТАЦИИ
        const chat = new window.ZammadChat({
          title: 'Чат поддержки',
          fontSize: '12px',
          chatId: 1,
          show: false
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
            // Ignore error
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
        return true;
      } catch (error) {
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
