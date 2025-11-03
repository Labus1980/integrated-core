import { useEffect, useRef } from "react";

interface ZammadChatConfig {
  fontSize?: string;
  chatId: number;
  host: string;
  debug?: boolean;
  show?: boolean;
  title?: string;
  background?: string;
  flat?: boolean;
}

interface ZammadChatInstance {
  open?: () => void;
  close?: () => void;
  state?: string;
}

type ZammadChatConstructor = new (config: ZammadChatConfig) => ZammadChatInstance;

declare global {
  interface Window {
    ZammadChat?: ZammadChatConstructor;
    zammadChatInstance?: ZammadChatInstance;
  }
}

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    if (typeof window === "undefined") {
      return;
    }

    // Ждем загрузки скрипта Zammad Chat
    const checkAndInit = () => {
      const ZammadChatConstructor = window.ZammadChat;

      if (ZammadChatConstructor && document.body) {
        try {
          console.log("Initializing Zammad Chat...");

          // ВАЖНО: host должен быть https://, а НЕ wss://
          // WebSocket URL определяется автоматически виджетом

          // Инициализируем с show: true, чтобы виджет создал все DOM элементы
          // Потом можем программно управлять через API
          const chatInstance = new ZammadChatConstructor({
            chatId: 1,
            host: "https://zammad.okta-solutions.com",
            show: true, // Показываем сразу, чтобы виджет создал DOM элементы
            debug: true,
            fontSize: "12px",
            title: "<strong>Поддержка OKTA Solutions</strong>",
            background: "#3e6f9e",
            flat: true,
          });

          window.zammadChatInstance = chatInstance;

          // Даём виджету время создать DOM элементы, потом скрываем
          setTimeout(() => {
            if (chatInstance.close) {
              chatInstance.close();
              console.log("✓ Zammad chat initialized and closed, ready for programmatic control");
            }
          }, 1000);

          initialized.current = true;
          console.log("✓ Zammad chat initialized successfully");
        } catch (error) {
          console.error("✗ Failed to initialize Zammad chat:", error);
        }
      } else {
        console.warn("ZammadChat constructor or document.body not ready, retrying...");
        setTimeout(checkAndInit, 100);
      }
    };

    // Начинаем проверку через небольшую задержку
    const timer = setTimeout(checkAndInit, 300);

    return () => clearTimeout(timer);
  }, []);
};
