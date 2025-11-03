import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ZammadChatContainer } from './ZammadChatContainer';
import '@/styles/floating-chat-widget.css';

export const FloatingZammadChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Listen for custom event to open chat from header
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-zammad-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-zammad-chat', handleOpenChat);
    };
  }, []);

  return (
    <>
      {/* Floating Panel for Zammad Chat */}
      {isOpen && (
        <div className="floating-chat-panel">
          <div className="floating-chat-header">
            <h3 className="floating-chat-title">Чат поддержки</h3>
            <button
              type="button"
              onClick={toggleChat}
              className="floating-chat-close"
              aria-label="Закрыть чат"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="floating-chat-body">
            <ZammadChatContainer isActive={isOpen} />
          </div>
        </div>
      )}

      {/* Floating Button for Zammad Chat */}
      <button
        type="button"
        onClick={toggleChat}
        className={`floating-zammad-button ${isOpen ? 'floating-zammad-button--open' : ''}`}
        aria-label={isOpen ? 'Закрыть чат поддержки' : 'Открыть чат поддержки'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
};

export default FloatingZammadChat;
