import React, { useEffect, useRef, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import ServicesGrid from '@/components/ServicesGrid';

declare global {
  interface Window {
    ZammadChat?: new (config: Record<string, unknown>) => unknown;
  }
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const chatInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    let isUnmounted = false;
    const loaderId = 'zammad-chat-loader-script';
    const existingLoader = document.getElementById(loaderId) as
      | HTMLScriptElement
      | null;
    let appendedLoader = false;

    const loadChat = () => {
      if (isUnmounted || chatInstanceRef.current || !window.ZammadChat) {
        return;
      }

      chatInstanceRef.current = new window.ZammadChat({
        fontSize: '12px',
        chatId: 1,
      });
    };

    const loaderScript = existingLoader ?? document.createElement('script');
    if (!existingLoader) {
      loaderScript.id = loaderId;
      loaderScript.src =
        'https://zammad.okta-solutions.com/assets/chat/chat-no-jquery.min.js';
      loaderScript.async = true;
      loaderScript.dataset.zammadChat = 'loader';
      document.body.appendChild(loaderScript);
      appendedLoader = true;
    }

    const handleScriptLoad = () => {
      loadChat();
    };

    loaderScript.addEventListener('load', handleScriptLoad);

    if (window.ZammadChat) {
      loadChat();
    }

    return () => {
      isUnmounted = true;
      loaderScript.removeEventListener('load', handleScriptLoad);

      if (appendedLoader && loaderScript.parentNode) {
        loaderScript.parentNode.removeChild(loaderScript);
      }

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
