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
      }
      return;
    }

    if (chatOpenedRef.current) return;

    // Даем время на инициализацию Zammad Chat
    const timer = setTimeout(() => {
      // Программно открываем Zammad Chat через API
      if (window.zammadChatInstance?.open) {
        try {
          window.zammadChatInstance.open();
          chatOpenedRef.current = true;
        } catch (error) {
          // Ignore error
        }
      } else {
        // Fallback: пытаемся найти и кликнуть по кнопке
        const chatButton = document.querySelector('.open-zammad-chat') as HTMLElement;
        if (chatButton) {
          try {
            chatButton.click();
            chatOpenedRef.current = true;
          } catch (error) {
            // Ignore error
          }
        }
      }
    }, 1000);

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
