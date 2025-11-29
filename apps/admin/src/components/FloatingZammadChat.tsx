import React, { useEffect, useRef, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import '@/styles/floating-chat-widget.css';

declare global {
  interface Window {
    zammadChat?: any;
    ZammadChat?: any;
    openZammadChat?: () => void;
  }
}

const KEEPALIVE_INTERVAL = 15000; // 15 секунд
const RECONNECT_CHECK_INTERVAL = 5000; // 5 секунд

/**
 * Плавающая кнопка для открытия Zammad чата с keepalive механизмом
 * Поддерживает WebSocket соединение активным пока страница открыта
 */
export const FloatingZammadChat: React.FC = () => {
  const initialized = useRef(false);
  const keepaliveInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastPingTime = useRef<number>(Date.now());

  // Функция для отправки keepalive ping
  const sendKeepalive = useCallback(() => {
    try {
      const chat = window.zammadChat;
      if (!chat) return;

      const ws = chat.io?.ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Отправляем ping через WebSocket если он открыт
        // Zammad использует формат сообщений типа ping/pong
        try {
          // Попробуем отправить через API чата если есть метод
          if (chat.io && typeof chat.io.send === 'function') {
            chat.io.send('ping', {});
          } else if (typeof ws.send === 'function') {
            // Fallback: отправить raw ping
            ws.send(JSON.stringify({ event: 'ping', data: {} }));
          }
          lastPingTime.current = Date.now();
          console.debug('[Zammad Keepalive] Ping sent');
        } catch (sendError) {
          console.debug('[Zammad Keepalive] Ping send failed:', sendError);
        }
      }
    } catch (error) {
      console.debug('[Zammad Keepalive] Error:', error);
    }
  }, []);

  // Функция для проверки и восстановления соединения
  const checkAndReconnect = useCallback(() => {
    try {
      const chat = window.zammadChat;
      if (!chat) {
        // Чат не инициализирован, попробуем инициализировать
        if (window.ZammadChat && !initialized.current) {
          initializeChat();
        }
        return;
      }

      const ws = chat.io?.ws;
      const isConnected = ws && ws.readyState === WebSocket.OPEN;

      if (!isConnected) {
        console.log('[Zammad Keepalive] Connection lost, attempting reconnect...');

        // Попытка переподключения
        if (chat.io && typeof chat.io.reconnect === 'function') {
          chat.io.reconnect();
        } else if (typeof chat.connect === 'function') {
          chat.connect();
        } else {
          // Полная реинициализация как последний вариант
          console.log('[Zammad Keepalive] Reinitializing chat...');
          initialized.current = false;
          initializeChat();
        }
      }
    } catch (error) {
      console.error('[Zammad Keepalive] Reconnect error:', error);
    }
  }, []);

  // Инициализация чата
  const initializeChat = useCallback(() => {
    if (initialized.current) return;
    if (!window.ZammadChat) {
      console.debug('[Zammad] ZammadChat not loaded yet');
      return;
    }

    try {
      const chat = new window.ZammadChat({
        title: 'Чат поддержки',
        fontSize: '12px',
        chatId: 1,
        show: false,
        // Добавляем настройки для более стабильного соединения
        debug: false,
        background: '#0066FF',
        flat: true,
      });

      window.zammadChat = chat;

      window.openZammadChat = () => {
        try {
          if (chat && typeof chat.open === 'function') {
            chat.open();
            return;
          }
        } catch (err) {
          // Ignore
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
      console.log('[Zammad] Chat initialized with keepalive');
    } catch (error) {
      console.error('[Zammad] Init error:', error);
    }
  }, []);

  // Основной эффект инициализации и keepalive
  useEffect(() => {
    // Инициализация с задержкой для загрузки скрипта
    const initTimer = setTimeout(() => {
      initializeChat();
    }, 500);

    // Повторная попытка если первая не удалась
    const retryTimer = setTimeout(() => {
      if (!initialized.current) {
        initializeChat();
      }
    }, 2000);

    // Запуск keepalive интервала
    keepaliveInterval.current = setInterval(sendKeepalive, KEEPALIVE_INTERVAL);

    // Запуск проверки соединения
    reconnectCheckInterval.current = setInterval(checkAndReconnect, RECONNECT_CHECK_INTERVAL);

    // Очистка при размонтировании
    return () => {
      clearTimeout(initTimer);
      clearTimeout(retryTimer);
      if (keepaliveInterval.current) {
        clearInterval(keepaliveInterval.current);
      }
      if (reconnectCheckInterval.current) {
        clearInterval(reconnectCheckInterval.current);
      }
    };
  }, [initializeChat, sendKeepalive, checkAndReconnect]);

  // Обработка visibility change - активный keepalive при возврате на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Zammad Keepalive] Tab became visible, checking connection...');
        // Немедленная проверка соединения
        checkAndReconnect();
        // И отправка ping
        sendKeepalive();
      }
    };

    const handleFocus = () => {
      console.log('[Zammad Keepalive] Window focused');
      checkAndReconnect();
      sendKeepalive();
    };

    // Также реагируем на mouse move для восстановления после idle
    let idleTimer: NodeJS.Timeout;
    const handleUserActivity = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // После 30 секунд бездействия проверяем соединение при следующей активности
      }, 30000);

      // Если давно не было ping, отправим
      if (Date.now() - lastPingTime.current > KEEPALIVE_INTERVAL) {
        sendKeepalive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('mousemove', handleUserActivity, { passive: true });
    document.addEventListener('keydown', handleUserActivity, { passive: true });
    document.addEventListener('click', handleUserActivity, { passive: true });
    document.addEventListener('scroll', handleUserActivity, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      clearTimeout(idleTimer);
    };
  }, [checkAndReconnect, sendKeepalive]);

  // Клик обработчик с проверкой соединения
  const handleClick = useCallback(() => {
    // Проверяем соединение перед открытием
    checkAndReconnect();

    // Небольшая задержка для восстановления соединения если нужно
    setTimeout(() => {
      if (window.openZammadChat) {
        window.openZammadChat();
      }
    }, 100);
  }, [checkAndReconnect]);

  return (
    <button
      type="button"
      className="floating-zammad-button open-zammad-chat"
      aria-label="Открыть чат поддержки"
      title="Чат поддержки"
      onClick={handleClick}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default FloatingZammadChat;
