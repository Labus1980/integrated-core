import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  CallState,
  CodexSipClient,
  MetricsEvent,
  LogEvent,
} from "@codex/core-sip";
import { FloatingButton } from "./FloatingButton";
import { AudioVisualizer } from "./AudioVisualizer";
import { LanguageSelector, LanguageOption } from "./LanguageSelector";

const defaultLanguages: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

type LocaleKey = "en" | "ru";

const translations = {
  en: {
    title: "Voice Chat",
    status_idle: "Ready",
    status_registering: "Registering",
    status_connecting: "Connecting",
    status_ringing: "Ringing",
    status_connected: "Live",
    status_error: "Error",
    status_ended: "Ended",
    hangup: "End Call",
    mute: "Mute",
    unmute: "Unmute",
    callDuration: "Duration",
  },
  ru: {
    title: "Голосовой чат",
    status_idle: "Готов",
    status_registering: "Регистрация",
    status_connecting: "Соединение",
    status_ringing: "Звонок",
    status_connected: "На линии",
    status_error: "Ошибка",
    status_ended: "Завершено",
    hangup: "Завершить",
    mute: "Откл. звук",
    unmute: "Вкл. звук",
    callDuration: "Длительность",
  },
};

export interface FloatingVoiceWidgetProps {
  client: CodexSipClient;
  languages?: LanguageOption[];
  locale?: LocaleKey;
  theme?: "light" | "dark";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  autoRegister?: boolean;
}

export const FloatingVoiceWidget = ({
  client,
  languages = defaultLanguages,
  locale = "en",
  theme = "dark",
  position = "bottom-right",
  autoRegister = true,
}: FloatingVoiceWidgetProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [metrics, setMetrics] = useState<MetricsEvent | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialLang = languages[0]?.code ?? client.language;
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLang);
  const t = translations[locale];

  useEffect(() => {
    if (audioRef.current) {
      client.setRemoteAudioElement(audioRef.current);
    }
  }, [client]);

  useEffect(() => {
    client.setLanguage(selectedLanguage);
  }, [client, selectedLanguage]);

  useEffect(() => {
    if (!autoRegister) return;

    client.register().catch((error) => {
      console.error("Registration failed:", error);
    });

    return () => {
      void client.unregister();
    };
  }, [client, autoRegister]);

  useEffect(() => {
    const onCall = (event: { state: CallState }) => {
      setCallState(event.state);

      if (event.state === "connected") {
        setIsMuted(false);
        setCallDuration(0);
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }

      if (event.state === "ended" || event.state === "error" || event.state === "idle") {
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
      }
    };

    const onMetrics = (event: MetricsEvent) => {
      setMetrics(event);
    };

    client.on("call", onCall);
    client.on("metrics", onMetrics);

    return () => {
      client.off("call", onCall);
      client.off("metrics", onMetrics);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [client]);

  const handleButtonClick = async () => {
    if (callState === "idle" || callState === "ended" || callState === "error") {
      setIsExpanded(true);
      try {
        await client.startCall({ language: selectedLanguage });
      } catch (error) {
        console.error("Failed to start call:", error);
      }
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleHangup = async () => {
    await client.hangup();
    setIsExpanded(false);
  };

  const handleMuteToggle = async () => {
    if (isMuted) {
      await client.unmute();
      setIsMuted(false);
    } else {
      await client.mute();
      setIsMuted(true);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const statusLabel = t[`status_${callState}` as keyof typeof t] || callState;
  const isLive = callState === "connected";
  const isBusy = callState === "connecting" || callState === "ringing";

  return (
    <div
      className={clsx(
        "codex-floating-voice-widget",
        `codex-floating-voice-widget--${theme}`,
        `codex-floating-voice-widget--${position}`,
        isExpanded && "codex-floating-voice-widget--expanded"
      )}
    >
      <FloatingButton
        onClick={handleButtonClick}
        isActive={isLive || isBusy}
        theme={theme}
        locale={locale}
      />

      {isExpanded && (
        <div
          className="codex-floating-voice-widget__panel"
          role="dialog"
          aria-label={t.title}
        >
          <div className="codex-floating-voice-widget__panel-header">
            <h2 className="codex-floating-voice-widget__title">{t.title}</h2>
            <button
              type="button"
              className="codex-floating-voice-widget__close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="codex-floating-voice-widget__panel-body">
            <div className="codex-floating-voice-widget__status">
              <span className="codex-floating-voice-widget__status-text">
                {statusLabel}
              </span>
              {isLive && (
                <span className="codex-floating-voice-widget__duration">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>

            <AudioVisualizer isActive={isLive} />

            <LanguageSelector
              languages={languages}
              selected={selectedLanguage}
              onChange={setSelectedLanguage}
              theme={theme}
            />

            <div className="codex-floating-voice-widget__controls">
              {isLive && (
                <button
                  type="button"
                  className={clsx(
                    "codex-floating-voice-widget__control-btn",
                    isMuted && "codex-floating-voice-widget__control-btn--active"
                  )}
                  onClick={handleMuteToggle}
                  aria-pressed={isMuted}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    {isMuted ? (
                      <>
                        <path
                          d="M3 3l18 18M17 10v2a5 5 0 0 1-7 4.6M5 10v2a7 7 0 0 0 10.9 5.8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 1a3 3 0 0 0-3 3v8l3-3V4a3 3 0 0 0-3-3z"
                          fill="currentColor"
                        />
                      </>
                    ) : (
                      <path
                        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                        fill="currentColor"
                      />
                    )}
                  </svg>
                  <span>{isMuted ? t.unmute : t.mute}</span>
                </button>
              )}

              {(isLive || isBusy) && (
                <button
                  type="button"
                  className="codex-floating-voice-widget__control-btn codex-floating-voice-widget__control-btn--danger"
                  onClick={handleHangup}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9a2 2 0 0 1 2-2h3l2-4h4l2 4h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2V9z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>{t.hangup}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} hidden autoPlay playsInline />
    </div>
  );
};
