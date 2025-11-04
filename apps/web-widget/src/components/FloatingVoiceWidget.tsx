import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  CallState,
  CodexSipClient,
  MetricsEvent,
  LogEvent,
  IncomingCallEvent,
} from "@codex/core-sip";
import { FloatingButton } from "./FloatingButton";
import { AudioVisualizer } from "./AudioVisualizer";
import { LanguageSelector, LanguageOption } from "./LanguageSelector";

// Interfaces removed - no longer needed without operator selection

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
    status_incoming: "Incoming Call",
    status_connected: "Live",
    status_error: "Error",
    status_ended: "Ended",
    call: "Call",
    hangup: "End Call",
    mute: "Mute",
    unmute: "Unmute",
    callDuration: "Duration",
    accept: "Accept",
    reject: "Reject",
    incomingFrom: "Incoming call from",
  },
  ru: {
    title: "Голосовой чат",
    status_idle: "Готов",
    status_registering: "Регистрация",
    status_connecting: "Соединение",
    status_ringing: "Звонок",
    status_incoming: "Входящий звонок",
    status_connected: "На линии",
    status_error: "Ошибка",
    status_ended: "Завершено",
    call: "Позвонить",
    hangup: "Завершить",
    mute: "Откл. звук",
    unmute: "Вкл. звук",
    callDuration: "Длительность",
    accept: "Принять",
    reject: "Отклонить",
    incomingFrom: "Входящий звонок от",
  },
};

export interface FloatingVoiceWidgetProps {
  client: CodexSipClient;
  languages?: LanguageOption[];
  locale?: LocaleKey;
  theme?: "light" | "dark";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  autoRegister?: boolean;
  embedded?: boolean;
}

export const FloatingVoiceWidget = ({
  client,
  languages = defaultLanguages,
  locale = "en",
  theme = "dark",
  position = "bottom-right",
  autoRegister = true,
  embedded = false,
}: FloatingVoiceWidgetProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCallStateRef = useRef<CallState>("idle");
  const [isExpanded, setIsExpanded] = useState(embedded); // В embedded режиме всегда развернут
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [metrics, setMetrics] = useState<MetricsEvent | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallEvent | null>(null);

  const initialLang = languages[0]?.code ?? client.language;
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLang);
  const t = translations[locale];

  // Функция для воспроизведения звука завершения звонка
  const playHangupSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Настройка звука (короткий гудок 400 Hz)
      oscillator.frequency.value = 400;
      oscillator.type = 'sine';

      // Плавное затухание
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Очистка после завершения
      setTimeout(() => {
        audioContext.close();
      }, 500);
    } catch (error) {
      console.error('Failed to play hangup sound:', error);
    }
  };

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
      const previousState = previousCallStateRef.current;
      console.log(`[FloatingVoiceWidget] Call state changed: ${previousState} -> ${event.state}`);

      setCallState(event.state);
      previousCallStateRef.current = event.state;

      if (event.state === "connected") {
        setIsMuted(false);
        setCallDuration(0);
        setIncomingCall(null);
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }

      if (event.state === "ended" || event.state === "error") {
        console.log('[FloatingVoiceWidget] Call ended/error');
        // Воспроизводим звук завершения звонка только если мы были в активном звонке
        if (previousState === "connected" || previousState === "ringing" || previousState === "connecting") {
          playHangupSound();
        }

        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
        setIncomingCall(null);
      }

      if (event.state === "idle") {
        console.log('[FloatingVoiceWidget] Call idle');
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
        setIncomingCall(null);
      }
    };

    const onMetrics = (event: MetricsEvent) => {
      setMetrics(event);
    };

    const onIncomingCall = (event: IncomingCallEvent) => {
      setIncomingCall(event);
      setIsExpanded(true);
    };

    client.on("call", onCall);
    client.on("metrics", onMetrics);
    client.on("incomingCall", onIncomingCall);

    return () => {
      client.off("call", onCall);
      client.off("metrics", onMetrics);
      client.off("incomingCall", onIncomingCall);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [client]);

  const handleButtonClick = async () => {
    if (callState === "idle" || callState === "ended" || callState === "error") {
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCall = async () => {
    try {
      console.log(`Starting call with language: ${selectedLanguage}`);
      await client.startCall({ language: selectedLanguage });
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  const handleHangup = async () => {
    // Воспроизводим звук завершения звонка
    playHangupSound();

    await client.hangup();

    // В embedded режиме не сворачиваем виджет
    if (!embedded) {
      setIsExpanded(false);
    }
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

  const handleAcceptCall = async () => {
    try {
      await client.acceptIncomingCall({ language: selectedLanguage });
    } catch (error) {
      console.error("Failed to accept call:", error);
    }
  };

  const handleRejectCall = async () => {
    try {
      await client.rejectIncomingCall();
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to reject call:", error);
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
        !embedded && `codex-floating-voice-widget--${position}`,
        embedded && "codex-floating-voice-widget--embedded",
        isExpanded && "codex-floating-voice-widget--expanded"
      )}
    >
      {!embedded && (
        <FloatingButton
          onClick={handleButtonClick}
          isActive={isLive || isBusy}
          theme={theme}
          locale={locale}
        />
      )}

      {isExpanded && (
        <div
          className="codex-floating-voice-widget__panel"
          role="dialog"
          aria-label={t.title}
        >
          <div className="codex-floating-voice-widget__panel-header">
            <h2 className="codex-floating-voice-widget__title">{t.title}</h2>
            {!embedded && (
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
            )}
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

            {callState === "incoming" && incomingCall && (
              <div className="codex-floating-voice-widget__incoming-call">
                <p className="codex-floating-voice-widget__incoming-from">
                  {t.incomingFrom}: {incomingCall.from}
                </p>
              </div>
            )}

            <AudioVisualizer isActive={isLive} />

            <LanguageSelector
              languages={languages}
              selected={selectedLanguage}
              onChange={setSelectedLanguage}
              theme={theme}
            />

            <div className="codex-floating-voice-widget__controls">
              {(callState === "idle" || callState === "ended" || callState === "error") && (
                <button
                  type="button"
                  className="codex-floating-voice-widget__control-btn codex-floating-voice-widget__control-btn--success"
                  onClick={handleCall}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>{t.call}</span>
                </button>
              )}

              {callState === "incoming" && (
                <>
                  <button
                    type="button"
                    className="codex-floating-voice-widget__control-btn codex-floating-voice-widget__control-btn--success"
                    onClick={handleAcceptCall}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{t.accept}</span>
                  </button>
                  <button
                    type="button"
                    className="codex-floating-voice-widget__control-btn codex-floating-voice-widget__control-btn--danger"
                    onClick={handleRejectCall}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 9a2 2 0 0 1 2-2h3l2-4h4l2 4h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2V9z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{t.reject}</span>
                  </button>
                </>
              )}

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
