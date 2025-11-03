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
    console.log('[useZammadChat] 🚀 Hook called');

    if (initialized.current) {
      console.log('[useZammadChat] ⚠️ Already initialized, skipping');
      return;
    }

    const initChat = () => {
      console.log('[useZammadChat] 🔄 Trying to initialize...');

      // Проверка что ZammadChat загружен
      if (typeof window === 'undefined') {
        console.error('[useZammadChat] ❌ window is undefined!');
        return false;
      }

      if (!window.ZammadChat) {
        console.error('[useZammadChat] ❌ ZammadChat not found in window!');
        console.log('[useZammadChat] ℹ️ Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('zammad')));
        return false;
      }

      console.log('[useZammadChat] ✅ ZammadChat found, creating instance...');

      try {
        // Создание экземпляра чата СТРОГО ПО ДОКУМЕНТАЦИИ
        const chat = new window.ZammadChat({
          title: 'Чат поддержки',
          fontSize: '12px',
          chatId: 1,
          show: false
        });

        console.log('[useZammadChat] ✅ Chat instance created:', chat);

        // Сохранение в window для глобального доступа
        window.zammadChat = chat;
        console.log('[useZammadChat] ✅ Saved to window.zammadChat');

        // Функция для программного открытия чата
        window.openZammadChat = () => {
          console.log('[openZammadChat] 📞 Called');
          try {
            // Пробуем открыть через API
            if (chat && typeof chat.open === 'function') {
              console.log('[openZammadChat] ✅ Opening via chat.open()');
              chat.open();
              return;
            }
          } catch (err) {
            console.error('[openZammadChat] ❌ Error:', err);
          }

          // Fallback: клик по кнопке виджета
          const btn = document.querySelector('.open-zammad-chat') as HTMLElement | null;
          if (btn) {
            console.log('[openZammadChat] ✅ Clicking .open-zammad-chat button');
            btn.click();
            return;
          }

          const handle = document.querySelector('[class*="zammad"][class*="handle"]') as HTMLElement | null;
          if (handle) {
            console.log('[openZammadChat] ✅ Clicking zammad handle');
            handle.click();
          }
        };

        console.log('[useZammadChat] ✅ window.openZammadChat function created');

        initialized.current = true;
        console.log('[useZammadChat] ✅✅✅ INITIALIZATION COMPLETE ✅✅✅');
        return true;
      } catch (error) {
        console.error('[useZammadChat] ❌ Failed to initialize:', error);
        return false;
      }
    };

    // Первая попытка инициализации
    console.log('[useZammadChat] 🎯 First attempt...');
    if (!initChat()) {
      console.log('[useZammadChat] ⏰ First attempt failed, will retry in 1 second...');
      // Повторная попытка через 1 секунду, если скрипт ещё не загрузился
      const timer = setTimeout(() => {
        if (!initialized.current) {
          console.log('[useZammadChat] 🔄 Retry attempt...');
          initChat();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);
};
