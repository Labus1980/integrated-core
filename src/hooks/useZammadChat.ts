import { useEffect, useRef } from 'react';

const ZAMMAD_WEBSOCKET_URL = 'wss://zammad.okta-solutions.com/ws';
const ZAMMAD_CHAT_SCRIPT_SELECTOR = [
  'script[src="/vendor/chat-no-jquery.min.js"]',
  'script[src="https://zammad.okta-solutions.com/assets/chat/chat-no-jquery.min.js"]',
].join(', ');

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const initializeChat = () => {
      if (initialized.current) {
        return;
      }

      const typedWindow = window as typeof window & {
        ZammadChat?: new (config: Record<string, unknown>) => void;
      };
      const ChatConstructor = typedWindow.ZammadChat;

      if (!ChatConstructor) {
        console.warn('ZammadChat not found. Make sure the script is loaded.');
        return;
      }

      try {
        new ChatConstructor({
          fontSize: '12px',
          chatId: 1,
          debug: false,
          show: true,
          host: ZAMMAD_WEBSOCKET_URL,
          cssUrl: '/vendor/zammad-chat.css',
          title: '<strong>Поддержка</strong> DarFlow',
          inactiveClass: 'is-inactive',
        });
        initialized.current = true;
        console.log('Zammad chat initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Zammad chat:', error);
      }
    };

    if ((window as typeof window & { ZammadChat?: unknown }).ZammadChat) {
      initializeChat();
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(ZAMMAD_CHAT_SCRIPT_SELECTOR);

    if (!script) {
      console.warn('ZammadChat script tag not found. Make sure the script is included.');
      return;
    }

    const handleLoad = () => {
      initializeChat();
    };

    script.addEventListener('load', handleLoad, { once: true });

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);
};

export default useZammadChat;
