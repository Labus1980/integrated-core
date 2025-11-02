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
  }
}

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    if (typeof window === "undefined") {
      return;
    }

    const ZammadChatConstructor = window.ZammadChat;

    if (ZammadChatConstructor) {
      try {
        new ZammadChatConstructor({
          fontSize: "12px",
          chatId: 1,
          host: "https://zammad.okta-solutions.com",
          debug: true,
          show: false,
          title: "<strong>Поддержка</strong>",
          inactiveClass: "is-inactive",
          buttonClass: "open-zammad-chat",
        });
        initialized.current = true;
        console.log("Zammad chat initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Zammad chat:", error);
      }
    } else {
      console.warn("ZammadChat not found. Make sure the script is loaded.");
    }
  }, []);
};
