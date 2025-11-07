import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChat?: any;
    openZammadChat?: () => void;
  }
}

export type ZammadConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export const useZammadChat = () => {
  const initialized = useRef(false);
  const monitorInterval = useRef<NodeJS.Timeout>();
  const [connectionState, setConnectionState] = useState<ZammadConnectionState>('connecting');

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

  // WebSocket connection monitoring
  useEffect(() => {
    if (!initialized.current) {
      return;
    }

    const checkConnection = () => {
      try {
        const chat = window.zammadChat;
        if (!chat) {
          setConnectionState('disconnected');
          return;
        }

        // Check WebSocket state
        const ws = chat.io?.ws;
        if (!ws) {
          setConnectionState('disconnected');
          console.warn('[Zammad] WebSocket not initialized');
          return;
        }

        // Check readyState
        // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
        if (ws.readyState === WebSocket.OPEN) {
          setConnectionState('connected');
        } else if (ws.readyState === WebSocket.CONNECTING) {
          setConnectionState('connecting');
        } else {
          setConnectionState('disconnected');
          console.warn('[Zammad] WebSocket disconnected, attempting to reconnect...', {
            readyState: ws.readyState,
          });

          // Attempt to reconnect
          if (chat.io && typeof chat.io.reconnect === 'function') {
            setConnectionState('reconnecting');
            chat.io.reconnect();
          }
        }
      } catch (error) {
        console.error('[Zammad] Error checking connection:', error);
        setConnectionState('disconnected');
      }
    };

    // Initial check
    checkConnection();

    // Monitor connection every 10 seconds
    monitorInterval.current = setInterval(checkConnection, 10000);

    return () => {
      if (monitorInterval.current) {
        clearInterval(monitorInterval.current);
      }
    };
  }, [initialized.current]);

  // Handle visibility change - check and reconnect when tab becomes visible
  useEffect(() => {
    if (!initialized.current) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Zammad] Tab became visible, checking connection...');

        const chat = window.zammadChat;
        if (!chat) {
          console.warn('[Zammad] Chat not initialized');
          return;
        }

        const ws = chat.io?.ws;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          console.log('[Zammad] Connection lost while hidden, reconnecting...');
          setConnectionState('reconnecting');

          if (chat.io && typeof chat.io.reconnect === 'function') {
            chat.io.reconnect();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initialized.current]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
  };
};
