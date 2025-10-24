import React, { useEffect, useRef, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import ServicesGrid from '@/components/ServicesGrid';

declare global {
  interface Window {
    ZammadChat?: new (config: Record<string, unknown>) => {
      destroy?: () => void;
    };
    jQuery?: unknown;
    $?: unknown;
  }
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const chatInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    let isUnmounted = false;
    const appendedScripts = new Set<HTMLScriptElement>();

    const loadScript = (
      id: string,
      src: string,
      dataset?: Record<string, string>
    ): HTMLScriptElement => {
      const existingScript = document.getElementById(id) as
        | HTMLScriptElement
        | null;

      if (existingScript) {
        return existingScript;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      if (dataset) {
        Object.entries(dataset).forEach(([key, value]) => {
          script.dataset[key] = value;
        });
      }
      document.body.appendChild(script);
      appendedScripts.add(script);
      return script;
    };

    const loadChat = () => {
      if (isUnmounted || chatInstanceRef.current || !window.ZammadChat) {
        return;
      }

      chatInstanceRef.current = new window.ZammadChat({
        fontSize: '12px',
        chatId: 1,
      });
    };

    const ensureChat = async () => {
      if (!window.jQuery && !window.$) {
        await new Promise<void>((resolve, reject) => {
          const jqueryScript = loadScript(
            'zammad-chat-jquery',
            'https://code.jquery.com/jquery-3.6.0.min.js'
          );

          if (window.jQuery || window.$) {
            resolve();
            return;
          }

          jqueryScript.addEventListener('load', () => resolve(), {
            once: true,
          });
          jqueryScript.addEventListener('error', () => reject(), {
            once: true,
          });
        }).catch(() => {
          // jQuery failed to load, chat cannot initialize.
        });

        if (!window.jQuery && !window.$) {
          return;
        }
      }

      if (isUnmounted) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        if (window.ZammadChat) {
          resolve();
          return;
        }

        const chatScript = loadScript(
          'zammad-chat-loader-script',
          'https://zammad.okta-solutions.com/assets/chat/chat.min.js',
          { zammadChat: 'initializer' }
        );

        if (window.ZammadChat) {
          resolve();
          return;
        }

        chatScript.addEventListener('load', () => resolve(), { once: true });
        chatScript.addEventListener('error', () => reject(), { once: true });
      }).catch(() => {
        // Chat script failed to load.
      });

      if (!isUnmounted && window.ZammadChat) {
        loadChat();
      }
    };

    ensureChat();

    return () => {
      isUnmounted = true;
      const chatInstance = chatInstanceRef.current as
        | { destroy?: () => void }
        | null;
      if (chatInstance?.destroy && typeof chatInstance.destroy === 'function') {
        chatInstance.destroy();
      }
      chatInstanceRef.current = null;

      document
        .querySelectorAll('.zammad-chat, #zammad-chat, [data-js="zammadChat"]')
        .forEach((node) => {
          node.parentNode?.removeChild(node);
        });
      document
        .querySelectorAll(
          'link[href*="zammad.okta-solutions.com/assets/chat"], script[data-zammad-chat="initializer"]'
        )
        .forEach((node) => {
          node.parentNode?.removeChild(node);
        });

      appendedScripts.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="container mx-auto px-6 py-8">
        <ServicesGrid searchQuery={searchQuery} />
      </main>
    </div>
  );
};

export default Index;
