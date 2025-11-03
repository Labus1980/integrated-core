import React, { useEffect, useRef } from 'react';

interface ZammadChatContainerProps {
  isActive: boolean;
}

export const ZammadChatContainer: React.FC<ZammadChatContainerProps> = ({ isActive }) => {
  const chatOpenedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      // Закрываем чат при деактивации вкладки
      if (chatOpenedRef.current && window.zammadChatInstance?.close) {
        console.log('Closing Zammad chat...');
        window.zammadChatInstance.close();
        chatOpenedRef.current = false;
      }
      return;
    }

    if (chatOpenedRef.current) return;

    // Пытаемся открыть чат после полной инициализации
    const tryOpenChat = () => {
      if (window.zammadChatInstance?.open) {
        try {
          console.log('Opening Zammad chat...');
          window.zammadChatInstance.open();
          chatOpenedRef.current = true;
          console.log('✓ Zammad chat opened successfully');
        } catch (error) {
          console.error('✗ Error opening Zammad chat:', error);
          console.error('Error details:', error);
          // Пытаемся снова через некоторое время
          setTimeout(tryOpenChat, 500);
        }
      } else {
        console.warn('Zammad chat instance not ready yet, retrying...');
        setTimeout(tryOpenChat, 300);
      }
    };

    // Даем время на полную инициализацию виджета (виджет инициализируется и закрывается через 1 сек)
    const timer = setTimeout(tryOpenChat, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [isActive]);

  return (
    <div
      id="zammad-chat-container"
      className="w-full h-full flex items-center justify-center"
    >
      <div className="text-center text-muted-foreground">
        <p>Инициализация чата поддержки...</p>
        <p className="text-sm mt-2">Пожалуйста, подождите</p>
      </div>
    </div>
  );
};

export default ZammadChatContainer;
