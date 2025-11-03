import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import '@/styles/floating-chat-widget.css';

declare global {
  interface Window {
    zammadChatInstance?: any;
    zammadChatReady?: boolean;
  }
}

/**
 * Плавающая кнопка для открытия Zammad чата
 */
export const FloatingZammadChat: React.FC = () => {
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    // Слушаем событие готовности чата
    const handleReady = () => {
      console.log('[FloatingZammadChat] Chat ready event received');
      setChatReady(true);
    };

    // Проверяем, может чат уже готов
    if (window.zammadChatReady) {
      handleReady();
    }

    // Подписываемся на событие
    window.addEventListener('zammad:ready', handleReady);

    return () => {
      window.removeEventListener('zammad:ready', handleReady);
    };
  }, []);

  const handleClick = () => {
    if (!chatReady || !window.zammadChatInstance) {
      console.warn('[FloatingZammadChat] Chat not ready yet');
      return;
    }

    console.log('[FloatingZammadChat] Opening chat');
    window.zammadChatInstance.open();
  };

  return (
    <button
      type="button"
      className="floating-zammad-button"
      aria-label="Открыть чат поддержки"
      title="Чат поддержки"
      onClick={handleClick}
      disabled={!chatReady}
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
