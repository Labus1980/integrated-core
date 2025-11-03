import { useEffect, useRef } from "react";

interface ZammadChatConfig {
  fontSize?: string;
  chatId: number;
  host: string;
  debug?: boolean;
  show?: boolean;
  title?: string;
  inactiveClass?: string;
  buttonClass?: string;
}

interface ZammadChatInstance {
  open?: () => void;
  close?: () => void;
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

    // Даем время на полную загрузку DOM и скриптов
    const initTimer = setTimeout(() => {
      const ZammadChatConstructor = window.ZammadChat;

      if (ZammadChatConstructor) {
        try {
          // Убеждаемся, что body готов
          if (!document.body) {
            console.warn("Document body not ready, retrying...");
            initialized.current = false;
            return;
          }

          // Создаем и сохраняем экземпляр чата в window для программного доступа
          const chatInstance = new ZammadChatConstructor({
            fontSize: "12px",
            chatId: 1,
            host: "https://zammad.okta-solutions.com",
            debug: true,
            show: false,
            title: "<strong>Поддержка</strong>",
            inactiveClass: "is-inactive",
            buttonClass: "open-zammad-chat",
            background: "#3e6f9e",
            // Убираем автоматическое создание кнопки чата
            cssAutoload: true,
            cssUrl: "",
          });

          window.zammadChatInstance = chatInstance;
          initialized.current = true;
          console.log("Zammad chat initialized successfully", chatInstance);
        } catch (error) {
          console.error("Failed to initialize Zammad chat:", error);
        }
      } else {
        console.warn("ZammadChat not found. Make sure the script is loaded.");
      }
    }, 500); // Увеличиваем задержку для загрузки скриптов

    return () => clearTimeout(initTimer);
  }, []);
};
