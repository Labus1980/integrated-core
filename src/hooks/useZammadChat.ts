import { useEffect, useRef } from 'react';

const ZAMMAD_DEFAULT_HOST = 'zammad.okta-solutions.com';
const ZAMMAD_WEBSOCKET_FALLBACK_URL = `wss://${ZAMMAD_DEFAULT_HOST}/ws`;
const REMOTE_ZAMMAD_HOSTS = new Set([
  'zammad.okta-solutions.com',
  'yzammad.okta-solutions.com',
]);
const ZAMMAD_CHAT_SCRIPT_SELECTOR = 'script[src*="chat-no-jquery.min.js"]';

const resolveWebsocketUrl = () => {
  if (typeof window === 'undefined') {
    return ZAMMAD_WEBSOCKET_FALLBACK_URL;
  }

  const script = document.querySelector<HTMLScriptElement>(ZAMMAD_CHAT_SCRIPT_SELECTOR);

  if (!script?.src) {
    return ZAMMAD_WEBSOCKET_FALLBACK_URL;
  }

  try {
    const { host } = new URL(script.src, window.location.origin);

    if (host && REMOTE_ZAMMAD_HOSTS.has(host)) {
      return `wss://${host}/ws`;
    }
  } catch (error) {
    console.warn('Failed to parse Zammad chat script URL, using fallback host.', error);
  }

  return ZAMMAD_WEBSOCKET_FALLBACK_URL;
};

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

      const host = resolveWebsocketUrl();

      try {
        new ChatConstructor({
          fontSize: '12px',
          chatId: 1,
          debug: false,
          show: true,
          host,
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
