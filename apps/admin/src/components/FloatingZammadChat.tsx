import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import '@/styles/floating-chat-widget.css';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChatInstance?: any;
  }
}

/**
 * Плавающая кнопка для открытия Zammad чата
 * Программно открывает чат при клике
 */
export const FloatingZammadChat: React.FC = () => {
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    // Проверяем готовность чата
    const checkChatReady = () => {
      if (typeof window !== 'undefined' && window.ZammadChat) {
        console.log('[FloatingZammadChat] ZammadChat is ready');
        setChatReady(true);
        return true;
      }
      return false;
    };

    // Пробуем сразу
    if (!checkChatReady()) {
      // Если не готов, проверяем периодически
      const interval = setInterval(() => {
        if (checkChatReady()) {
          clearInterval(interval);
        }
      }, 500);

      // Очистка через 10 секунд
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!chatReady) {
          console.error('[FloatingZammadChat] ZammadChat failed to load after 10 seconds');
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [chatReady]);

  const handleClick = () => {
    console.log('[FloatingZammadChat] Button clicked');

    if (typeof window === 'undefined') {
      console.error('[FloatingZammadChat] Window is not defined');
      return;
    }

    // Способ 1: Через глобальный экземпляр (основной метод)
    if (window.zammadChatInstance) {
      console.log('[FloatingZammadChat] Opening chat via zammadChatInstance.open()');
      try {
        if (typeof window.zammadChatInstance.open === 'function') {
          window.zammadChatInstance.open();
          return;
        }
      } catch (error) {
        console.error('[FloatingZammadChat] Error opening chat via instance:', error);
      }
    }

    // Способ 2: Через статический метод ZammadChat
    if (window.ZammadChat && typeof window.ZammadChat.open === 'function') {
      console.log('[FloatingZammadChat] Opening chat via ZammadChat.open()');
      try {
        window.ZammadChat.open();
        return;
      } catch (error) {
        console.error('[FloatingZammadChat] Error opening chat via ZammadChat.open():', error);
      }
    }

    console.error('[FloatingZammadChat] Unable to open Zammad chat - no methods available');
    console.log('[FloatingZammadChat] Debug info:', {
      ZammadChat: !!window.ZammadChat,
      zammadChatInstance: !!window.zammadChatInstance,
      zammadChatInstanceOpen: window.zammadChatInstance && typeof window.zammadChatInstance.open === 'function',
      chatReady: chatReady,
    });
  };

  return (
    <button
      type="button"
      className="open-zammad-chat floating-zammad-button"
      aria-label="Открыть чат поддержки"
      title="Чат поддержки"
      onClick={handleClick}
      style={{
        opacity: chatReady ? 1 : 0.5,
        cursor: chatReady ? 'pointer' : 'not-allowed',
      }}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default FloatingZammadChat;
