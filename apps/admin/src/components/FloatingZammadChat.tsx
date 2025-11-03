import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import '@/styles/floating-chat-widget.css';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChatInstance?: any;
  }
}

/**
 * Плавающая кнопка для открытия Zammad чата
 * Программно открывает чат при клике
 */
export const FloatingZammadChat: React.FC = () => {
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    // Проверяем готовность чата
    const checkChatReady = () => {
      if (typeof window !== 'undefined' && window.ZammadChat) {
        console.log('[FloatingZammadChat] ZammadChat is ready');
        setChatReady(true);
        return true;
      }
      return false;
    };

    // Пробуем сразу
    if (!checkChatReady()) {
      // Если не готов, проверяем периодически
      const interval = setInterval(() => {
        if (checkChatReady()) {
          clearInterval(interval);
        }
      }, 500);

      // Очистка через 10 секунд
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!chatReady) {
          console.error('[FloatingZammadChat] ZammadChat failed to load after 10 seconds');
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [chatReady]);

  const waitForZammadDOM = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Проверяем, существует ли уже DOM
      if (document.querySelector('.zammad-chat')) {
        console.log('[FloatingZammadChat] Zammad DOM already exists');
        resolve(true);
        return;
      }

      console.log('[FloatingZammadChat] Waiting for Zammad DOM to be created...');

      let attempts = 0;
      const maxAttempts = 20; // 2 секунды максимум

      const checkInterval = setInterval(() => {
        attempts++;

        if (document.querySelector('.zammad-chat')) {
          console.log('[FloatingZammadChat] Zammad DOM created after', attempts * 100, 'ms');
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.error('[FloatingZammadChat] Zammad DOM not created after', attempts * 100, 'ms');
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  };

  const handleClick = async () => {
    console.log('[FloatingZammadChat] Button clicked');

    if (typeof window === 'undefined') {
      console.error('[FloatingZammadChat] Window is not defined');
      return;
    }

    // Ждем создания DOM элементов Zammad
    const domReady = await waitForZammadDOM();

    if (!domReady) {
      console.error('[FloatingZammadChat] Zammad DOM not ready');
      return;
    }

    // Проверяем, не застрял ли чат в состоянии "открыт"
    const chatWidget = document.querySelector('.zammad-chat');
    if (chatWidget) {
      const isOpen = chatWidget.classList.contains('zammad-chat--open');
      const isVisible = chatWidget.classList.contains('is-visible');

      console.log('[FloatingZammadChat] Chat state:', { isOpen, isVisible });

      // Если чат считается открытым, но не виден - сбрасываем состояние
      if (isOpen && !isVisible) {
        console.log('[FloatingZammadChat] Chat stuck in open state, resetting...');
        chatWidget.classList.remove('zammad-chat--open');
        if (window.zammadChatInstance && window.zammadChatInstance.state) {
          window.zammadChatInstance.state = 'closed';
        }
      }
    }

    // Способ 1: Через глобальный экземпляр
    if (window.zammadChatInstance) {
      console.log('[FloatingZammadChat] Opening chat via zammadChatInstance');
      try {
        if (typeof window.zammadChatInstance.open === 'function') {
          window.zammadChatInstance.open();
          return;
        }
      } catch (error) {
        console.error('[FloatingZammadChat] Error opening chat via instance:', error);
      }
    }

    // Способ 2: Через ZammadChat.open()
    if (window.ZammadChat && typeof window.ZammadChat.open === 'function') {
      console.log('[FloatingZammadChat] Opening chat via ZammadChat.open()');
      try {
        window.ZammadChat.open();
        return;
      } catch (error) {
        console.error('[FloatingZammadChat] Error opening chat via ZammadChat.open():', error);
      }
    }

    // Способ 3: Ищем кнопку чата в DOM
    const zammadButton = document.querySelector('.zammad-chat-button, .js-zammad-open');
    if (zammadButton instanceof HTMLElement) {
      console.log('[FloatingZammadChat] Opening chat via DOM button click');
      zammadButton.click();
      return;
    }

    // Способ 4: Ищем элемент чата и показываем его
    if (chatWidget instanceof HTMLElement) {
      console.log('[FloatingZammadChat] Showing chat widget directly');
      chatWidget.classList.remove('zammad-chat--hide');
      chatWidget.classList.add('zammad-chat--open');
      chatWidget.classList.add('is-visible');
      return;
    }

    console.error('[FloatingZammadChat] Unable to open Zammad chat - no methods available');
    console.log('[FloatingZammadChat] Available:', {
      ZammadChat: !!window.ZammadChat,
      zammadChatInstance: !!window.zammadChatInstance,
      chatButton: !!document.querySelector('.zammad-chat-button'),
      chatWidget: !!document.querySelector('.zammad-chat'),
    });
  };

  return (
    <button
      type="button"
      className="open-zammad-chat floating-zammad-button"
      aria-label="Открыть чат поддержки"
      title="Чат поддержки"
      onClick={handleClick}
      style={{
        opacity: chatReady ? 1 : 0.5,
        cursor: chatReady ? 'pointer' : 'not-allowed',
      }}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default FloatingZammadChat;
