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

    // Функция для попытки открыть чат
    const tryOpenChat = (attempt: number = 0) => {
      const maxAttempts = 10;

      console.log(`Attempting to open Zammad chat (attempt ${attempt + 1}/${maxAttempts})...`, {
        instance: !!window.zammadChatInstance,
        hasOpen: typeof window.zammadChatInstance?.open === 'function',
        openFunction: !!window.openZammadChat
      });

      // Используем глобальную функцию openZammadChat, если доступна
      if (window.openZammadChat) {
        try {
          window.openZammadChat();
          chatOpenedRef.current = true;
          console.log('Zammad chat opened via openZammadChat()');
          return true;
        } catch (error) {
          console.error('Error calling openZammadChat():', error);
        }
      }

      // Программно открываем Zammad Chat через API
      if (window.zammadChatInstance?.open) {
        try {
          window.zammadChatInstance.open();
          chatOpenedRef.current = true;
          console.log('Zammad chat opened programmatically via API');
          return true;
        } catch (error) {
          console.error('Error opening Zammad chat:', error);
        }
      }

      // Fallback: пытаемся найти и кликнуть по кнопке
      const chatButton = document.querySelector('.open-zammad-chat') as HTMLElement;
      if (chatButton) {
        try {
          chatButton.click();
          chatOpenedRef.current = true;
          console.log('Zammad chat opened via button click');
          return true;
        } catch (error) {
          console.error('Error clicking chat button:', error);
        }
      }

      // Если не удалось открыть, повторяем попытку
      if (attempt < maxAttempts - 1) {
        const nextDelay = 500 + (attempt * 200); // Увеличиваем задержку с каждой попыткой
        console.log(`Retrying in ${nextDelay}ms...`);
        setTimeout(() => tryOpenChat(attempt + 1), nextDelay);
      } else {
        console.error('Could not open Zammad chat after', maxAttempts, 'attempts');
        console.log('Debug info:', {
          body: !!document.body,
          chatInstance: !!window.zammadChatInstance,
          chatButton: !!document.querySelector('.open-zammad-chat'),
          ZammadChat: !!window.ZammadChat,
          openFunction: !!window.openZammadChat
        });
      }

      return false;
    };

    // Начинаем попытки через 1 секунду после активации
    const timer = setTimeout(() => tryOpenChat(), 1000);

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
