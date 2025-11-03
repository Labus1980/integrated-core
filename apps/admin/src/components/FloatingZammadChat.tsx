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
 * Класс open-zammad-chat автоматически обрабатывается Zammad
 */
export const FloatingZammadChat: React.FC = () => {
  return (
    <button
      type="button"
      className="floating-zammad-button open-zammad-chat"
      aria-label="Открыть чат поддержки"
      title="Чат поддержки"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default FloatingZammadChat;
