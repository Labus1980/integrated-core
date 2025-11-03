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
          const chatInstance = new ZammadChatConstructor({
            chatId: 1,
            host: "https://zammad.okta-solutions.com",
            show: false, // Не показывать автоматически
            debug: true,
            fontSize: "12px",
            title: "<strong>Поддержка OKTA Solutions</strong>",
            background: "#3e6f9e",
            flat: true,
          });

          window.zammadChatInstance = chatInstance;
          initialized.current = true;

          console.log("✓ Zammad chat initialized successfully");
          console.log("Chat instance:", chatInstance);
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
