import React, { useEffect, useRef } from 'react';
import { useZammadChat } from '../hooks/useZammadChat';

interface ZammadChatContainerProps {
  isActive: boolean;
}

export const ZammadChatContainer: React.FC<ZammadChatContainerProps> = ({ isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatOpenedRef = useRef(false);
  const { connectionState, isConnected } = useZammadChat();

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

  // Determine status message and color based on connection state
  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return { message: 'Чат готов', color: 'text-green-600' };
      case 'connecting':
        return { message: 'Подключение...', color: 'text-yellow-600' };
      case 'reconnecting':
        return { message: 'Переподключение...', color: 'text-orange-600' };
      case 'disconnected':
        return { message: 'Соединение потеряно, попытка восстановления...', color: 'text-red-600' };
      default:
        return { message: 'Загрузка чата...', color: 'text-muted-foreground' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      ref={containerRef}
      id="zammad-chat-container"
      className="w-full h-full flex items-center justify-center"
    >
      <div className="text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionState === 'reconnecting' ? 'bg-orange-500 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`}
          />
          <p className={statusInfo.color}>{statusInfo.message}</p>
        </div>
        {!isConnected && (
          <p className="text-sm mt-2">
            {connectionState === 'disconnected'
              ? 'Автоматическое восстановление соединения...'
              : 'Если чат не появился, попробуйте переключить вкладки'
            }
          </p>
        )}
      </div>
    </div>
  );
};

export default ZammadChatContainer;
