import React, { useEffect, useRef } from 'react';

interface ZammadChatContainerProps {
  isActive: boolean;
}

export const ZammadChatContainer: React.FC<ZammadChatContainerProps> = ({ isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatOpenedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      // Закрываем чат при деактивации вкладки
      if (chatOpenedRef.current && window.zammadChatInstance?.close) {
        window.zammadChatInstance.close();
        chatOpenedRef.current = false;
        console.log('Zammad chat closed');
      }
      return;
    }

    if (chatOpenedRef.current) return;

    // Даем время на инициализацию Zammad Chat (увеличено до 1 секунды)
    const timer = setTimeout(() => {
      console.log('Attempting to open Zammad chat...', window.zammadChatInstance);

      // Программно открываем Zammad Chat через API
      if (window.zammadChatInstance?.open) {
        try {
          window.zammadChatInstance.open();
          chatOpenedRef.current = true;
          console.log('Zammad chat opened programmatically via API');
        } catch (error) {
          console.error('Error opening Zammad chat:', error);
        }
      } else {
        console.warn('Zammad chat instance not found. Trying to find chat button...');
        // Fallback: пытаемся найти и кликнуть по кнопке
        const chatButton = document.querySelector('.open-zammad-chat') as HTMLElement;
        if (chatButton) {
          try {
            chatButton.click();
            chatOpenedRef.current = true;
            console.log('Zammad chat opened via button click');
          } catch (error) {
            console.error('Error clicking chat button:', error);
          }
        } else {
          console.error('Could not open Zammad chat: instance and button not found');
          console.log('Available elements:', {
            body: !!document.body,
            chatInstance: !!window.zammadChatInstance,
            chatButton: !!document.querySelector('.open-zammad-chat')
          });
        }
      }
    }, 1000); // Увеличена задержка с 300ms до 1000ms

    return () => {
      clearTimeout(timer);
    };
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      id="zammad-chat-container"
      className="w-full h-full flex items-center justify-center"
    >
      <div className="text-center text-muted-foreground">
        <p>Загрузка чата...</p>
        <p className="text-sm mt-2">Если чат не появился, попробуйте переключить вкладки</p>
      </div>
    </div>
  );
};

export default ZammadChatContainer;
