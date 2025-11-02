import { useEffect, useState } from "react";

export interface FloatingButtonProps {
  onClick: () => void;
  isActive: boolean;
  theme?: "light" | "dark";
  locale?: "en" | "ru";
}

const translations = {
  en: { voiceChat: "VOICE CHAT" },
  ru: { voiceChat: "ГОЛОСОВОЙ ЧАТ" },
};

export const FloatingButton = ({
  onClick,
  isActive,
  theme = "dark",
  locale = "en",
}: FloatingButtonProps) => {
  const [isPulsing, setIsPulsing] = useState(true);
  const t = translations[locale];

  useEffect(() => {
    setIsPulsing(!isActive);
  }, [isActive]);

  return (
    <button
      type="button"
      className={`codex-floating-button codex-floating-button--${theme}`}
      onClick={onClick}
      data-pulsing={isPulsing}
      aria-label={t.voiceChat}
    >
      <div className="codex-floating-button__content">
        <svg
          className="codex-floating-button__icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            fill="currentColor"
          />
          <path
            d="M19 10v2a7 7 0 1 1-14 0v-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 19v4m-4 0h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="codex-floating-button__text">{t.voiceChat}</span>
      </div>
      {isPulsing && <div className="codex-floating-button__pulse" aria-hidden="true" />}
    </button>
  );
};
