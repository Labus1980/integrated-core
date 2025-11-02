import React, { useEffect, useRef } from 'react';

interface ZammadChatContainerProps {
  isActive: boolean;
}

export const ZammadChatContainer: React.FC<ZammadChatContainerProps> = ({ isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatOpenedRef = useRef(false);

  useEffect(() => {
    if (!isActive || chatOpenedRef.current) return;

    // Небольшая задержка для корректной инициализации
    const timer = setTimeout(() => {
      // Программно открываем Zammad Chat
      const chatButton = document.querySelector('.open-zammad-chat') as HTMLElement;
      if (chatButton) {
        chatButton.click();
        chatOpenedRef.current = true;
        console.log('Zammad chat opened programmatically');
      }
    }, 300);

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
        <p className="text-sm mt-2">Если чат не появился, обновите страницу</p>
      </div>
    </div>
  );
};

export default ZammadChatContainer;
