import React from 'react';
import { MessageCircle } from 'lucide-react';
import '@/styles/floating-chat-widget.css';

/**
 * Плавающая кнопка для открытия Zammad чата
 * Согласно документации Zammad, достаточно добавить класс 'open-zammad-chat' к кнопке
 * и виджет чата откроется автоматически при клике
 */
export const FloatingZammadChat: React.FC = () => {
  return (
    <button
      type="button"
      className="open-zammad-chat floating-zammad-button"
      aria-label="Открыть чат поддержки"
      title="Чат поддержки"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default FloatingZammadChat;
