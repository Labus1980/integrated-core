import React from 'react';
import { MessageCircle } from 'lucide-react';
import '@/styles/floating-chat-widget.css';

declare global {
  interface Window {
    zammadChat?: any;
    openZammadChat?: () => void;
  }
}

/**
 * Плавающая кнопка для открытия Zammad чата
 */
export const FloatingZammadChat: React.FC = () => {
  const handleClick = () => {
    console.log('[FloatingZammadChat] Button clicked');

    // Используем глобальную функцию openZammadChat
    if (typeof window.openZammadChat === 'function') {
      console.log('[FloatingZammadChat] Opening via window.openZammadChat()');
      window.openZammadChat();
      return;
    }

    // Fallback: прямой вызов
    if (window.zammadChat && typeof window.zammadChat.open === 'function') {
      console.log('[FloatingZammadChat] Opening via zammadChat.open()');
      window.zammadChat.open();
      return;
    }

    console.error('[FloatingZammadChat] Chat not initialized yet');
  };

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
