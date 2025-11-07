import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  CallState,
  CodexSipClient,
  CodexSipConfig,
  MetricsEvent,
  RegistrationEvent,
  LogEvent,
  ReconnectEvent
} from "@codex/core-sip";

const STYLE_TAG_ID = "codex-voice-widget-styles";

const widgetStyles = `
  :root {
    --codex-font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .codex-voice-widget {
    font-family: var(--codex-font-family);
    width: 320px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    overflow: hidden;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
    transition: box-shadow 0.3s ease;
    background: var(--codex-surface);
    color: var(--codex-text);
  }

  .codex-voice-widget:hover {
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.18);
  }

  .codex-voice-widget--dark {
    --codex-surface: #0f172a;
    --codex-text: #f8fafc;
    --codex-muted: #1e293b;
    --codex-muted-foreground: #94a3b8;
    --codex-primary: #38bdf8;
    --codex-danger: #f87171;
    --codex-border-strong: rgba(148, 163, 184, 0.35);
  }

  .codex-voice-widget--light {
    --codex-surface: #ffffff;
    --codex-text: #0f172a;
    --codex-muted: #f1f5f9;
    --codex-muted-foreground: #475569;
    --codex-primary: #0ea5e9;
    --codex-danger: #dc2626;
    --codex-border-strong: rgba(51, 65, 85, 0.25);
  }

  .codex-voice-widget__header {
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--codex-border-strong);
  }

  .codex-voice-widget__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .codex-voice-widget__status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--codex-muted-foreground);
  }

  .codex-voice-widget__status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--codex-muted-foreground);
  }

  .codex-voice-widget__body {
    padding: 18px 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .codex-voice-widget__controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .codex-voice-widget__button {
    border: none;
    border-radius: 12px;
    padding: 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--codex-muted);
    color: var(--codex-text);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .codex-voice-widget__button:focus-visible {
    outline: 2px solid var(--codex-primary);
    outline-offset: 2px;
  }

  .codex-voice-widget__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .codex-voice-widget__button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 14px 20px rgba(15, 23, 42, 0.1);
  }

  .codex-voice-widget__button--primary {
    background: var(--codex-primary);
    color: white;
  }

  .codex-voice-widget__button--danger {
    background: var(--codex-danger);
    color: white;
  }

  .codex-voice-widget__select {
    width: 100%;
    background: var(--codex-muted);
    color: var(--codex-text);
    border: none;
    border-radius: 12px;
    padding: 12px;
    font-size: 14px;
  }

  .codex-voice-widget__select:focus-visible {
    outline: 2px solid var(--codex-primary);
    outline-offset: 2px;
  }

  .codex-voice-widget__metrics {
    background: var(--codex-muted);
    border-radius: 12px;
    padding: 12px 14px;
    display: grid;
    gap: 6px;
    font-size: 12px;
    color: var(--codex-muted-foreground);
  }

  .codex-voice-widget__logs {
    background: var(--codex-muted);
    border-radius: 12px;
    padding: 12px 14px;
    max-height: 180px;
    overflow-y: auto;
    font-size: 12px;
  }

  .codex-voice-widget__log-entry {
    display: grid;
    gap: 2px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .codex-voice-widget__log-entry:last-of-type {
    border-bottom: none;
  }

  .codex-voice-widget__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: var(--codex-muted-foreground);
    padding: 0 20px 16px;
  }

  .codex-voice-widget__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .codex-voice-widget__badge svg {
    width: 14px;
    height: 14px;
  }

  .codex-voice-widget__keypad {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding-top: 4px;
  }

  .codex-voice-widget__key {
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.18);
    border: none;
    height: 44px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .codex-voice-widget__key:hover {
    transform: translateY(-1px);
    background: rgba(148, 163, 184, 0.3);
  }
`;

type LocaleKey = "en" | "ru";

type LocaleDictionary = Record<LocaleKey, Record<string, string>>;

const translations: LocaleDictionary = {
  en: {
    title: "Voice Chat",
    status_idle: "Ready",
    status_registering: "Registering",
    status_connecting: "Connecting",
    status_ringing: "Ringing",
    status_connected: "Live",
    status_error: "Error",
    status_ended: "Ended",
    call: "Call",
    hangup: "Hang up",
    mute: "Mute",
    unmute: "Unmute",
    speakerOn: "Speaker on",
    speakerOff: "Speaker off",
    keypad: "Keypad",
    showLogs: "Logs",
    hideLogs: "Hide logs",
    metrics: "Session stats",
    language: "Language",
    powered: "Powered by",
    jambonz: "jambonz",
    network: "Network",
    reconnecting: "Reconnect in",
    seconds: "s",
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
    call: "Позвонить",
    hangup: "Завершить",
    mute: "Микрофон",
    unmute: "Вкл. микрофон",
    speakerOn: "Громк. выкл",
    speakerOff: "Громк. вкл",
    keypad: "DTMF",
    showLogs: "Показать логи",
    hideLogs: "Скрыть логи",
    metrics: "Статистика",
    language: "Язык",
    powered: "На базе",
    jambonz: "jambonz",
    network: "Сеть",
    reconnecting: "Повтор через",
    seconds: "с",
  },
};

const statusColorMap: Record<CallState, string> = {
  idle: "#0ea5e9",
  registering: "#f59e0b",
  connecting: "#f59e0b",
  ringing: "#f59e0b",
  incoming: "#22c55e",
  connected: "#22c55e",
  ended: "#94a3b8",
  error: "#ef4444",
};

const keypadLayout = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

interface LanguageOption {
  code: string;
  label: string;
}

export interface VoiceChatWidgetProps {
  client: CodexSipClient;
  languages?: LanguageOption[];
  locale?: LocaleKey;
  theme?: "light" | "dark";
  autoRegister?: boolean;
  collapsed?: boolean;
  showPoweredBy?: boolean;
  logLimit?: number;
}

interface LogEntry extends LogEvent {
  ts: number;
}

function injectStyles() {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(STYLE_TAG_ID)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = widgetStyles;
  document.head.appendChild(style);
}

const defaultLanguages: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
];

export const VoiceChatWidget = ({
  client,
  languages = defaultLanguages,
  locale = "en",
  theme = "dark",
  autoRegister = true,
  collapsed = false,
  showPoweredBy = true,
  logLimit = 50,
}: VoiceChatWidgetProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [registration, setRegistration] = useState<RegistrationEvent | null>(null);
  const [reconnectIn, setReconnectIn] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<MetricsEvent | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const languageOptions = languages.length > 0 ? languages : defaultLanguages;
  const initialLang = languageOptions[0]?.code ?? client.language;
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLang);

  const dictionary = translations[locale];

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      client.setRemoteAudioElement(audioRef.current);
    }
  }, [client]);

  useEffect(() => {
    client.setLanguage(selectedLanguage);
  }, [client, selectedLanguage]);

  useEffect(() => {
    if (!autoRegister) {
      return;
    }
    client
      .register()
      .catch((error) => {
        appendLog({
          level: "error",
          message: "Registration failed",
          context: { error: error instanceof Error ? error.message : String(error) },
        });
      });

    return () => {
      void client.unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, autoRegister]);

  useEffect(() => {
    const onCall = (event: { state: CallState }) => {
      setCallState(event.state);
      if (event.state === "connected") {
        setIsMuted(false);
      }
      if (event.state === "ended" || event.state === "error" || event.state === "idle") {
        setShowKeypad(false);
      }
    };
    const onMetrics = (event: MetricsEvent) => {
      setMetrics(event);
    };
    const onRegistration = (event: RegistrationEvent) => {
      setRegistration(event);
    };
    const onReconnect = (event: ReconnectEvent) => {
      setReconnectIn(Math.round(event.delayMs / 1000));
    };
    const onLog = (entry: LogEvent) => {
      appendLog(entry);
    };

    client.on("call", onCall);
    client.on("metrics", onMetrics);
    client.on("registration", onRegistration);
    client.on("reconnecting", onReconnect);
    client.on("log", onLog);

    return () => {
      client.off("call", onCall);
      client.off("metrics", onMetrics);
      client.off("registration", onRegistration);
      client.off("reconnecting", onReconnect);
      client.off("log", onLog);
    };
  }, [client]);

  useEffect(() => {
    if (reconnectIn === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setReconnectIn((current) => {
        if (current === null) {
          return null;
        }
        if (current <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return null;
        }
        return current - 1;
      });
    }, 1_000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [reconnectIn]);

  const statusLabel = useMemo(() => {
    const key = `status_${callState}` as const;
    return dictionary[key] ?? callState;
  }, [dictionary, callState]);

  const statusColor = statusColorMap[callState] || statusColorMap.idle;

  const canCall = callState === "idle" || callState === "ended" || callState === "error";
  const isBusy = callState === "connecting" || callState === "ringing";
  const isLive = callState === "connected";

  const callButtonLabel = canCall ? dictionary.call : dictionary.hangup;
  const disableCallButton = callState === "registering";

  function appendLog(entry: LogEvent) {
    setLogs((previous) => {
      const next: LogEntry[] = [...previous, { ...entry, ts: Date.now() }];
      const limit = Math.max(logLimit, 10);
      if (next.length > limit) {
        return next.slice(next.length - limit);
      }
      return next;
    });
  }

  async function handleCallClick() {
    if (isLive || isBusy) {
      await client.hangup();
      return;
    }
    try {
      await client.startCall({ language: selectedLanguage });
    } catch (error) {
      appendLog({
        level: "error",
        message: "Failed to place call",
        context: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async function handleMuteClick() {
    if (isMuted) {
      await client.unmute();
      setIsMuted(false);
      return;
    }
    await client.mute();
    setIsMuted(true);
  }

  function toggleSpeaker() {
    const muted = !speakerMuted;
    client.setSpeakerMuted(muted);
    setSpeakerMuted(muted);
  }

  async function handleDtmf(tone: string) {
    try {
      await client.sendDtmf(tone);
      appendLog({ level: "info", message: `Sent DTMF ${tone}` });
    } catch (error) {
      appendLog({
        level: "warn",
        message: "Failed to send DTMF",
        context: { tone, error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  return (
    <div
      className={clsx(
        "codex-voice-widget",
        theme === "dark" ? "codex-voice-widget--dark" : "codex-voice-widget--light"
      )}
      data-state={callState}
    >
      <header className="codex-voice-widget__header">
        <h2 className="codex-voice-widget__title">{dictionary.title}</h2>
        <div className="codex-voice-widget__status" role="status" aria-live="polite">
          <span
            className="codex-voice-widget__status-indicator"
            style={{ background: statusColor }}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </div>
      </header>

      <section className="codex-voice-widget__body">
        <select
          className="codex-voice-widget__select"
          aria-label={dictionary.language}
          value={selectedLanguage}
          onChange={(event) => setSelectedLanguage(event.target.value)}
        >
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>

        <div className="codex-voice-widget__controls">
          <button
            type="button"
            className={clsx(
              "codex-voice-widget__button",
              (canCall || isBusy) && !isLive ? "codex-voice-widget__button--primary" : undefined,
              isLive ? "codex-voice-widget__button--danger" : undefined
            )}
            onClick={handleCallClick}
            disabled={disableCallButton}
            aria-pressed={isLive}
          >
            {callButtonLabel}
          </button>

          <button
            type="button"
            className="codex-voice-widget__button"
            onClick={handleMuteClick}
            disabled={!isLive}
            aria-pressed={isMuted}
          >
            {isMuted ? dictionary.unmute : dictionary.mute}
          </button>

          <button
            type="button"
            className="codex-voice-widget__button"
            onClick={toggleSpeaker}
            disabled={!isLive}
            aria-pressed={speakerMuted}
          >
            {speakerMuted ? dictionary.speakerOff : dictionary.speakerOn}
          </button>

          <button
            type="button"
            className="codex-voice-widget__button"
            onClick={() => setShowKeypad((value) => !value)}
            disabled={!isLive}
            aria-pressed={showKeypad}
          >
            {dictionary.keypad}
          </button>
        </div>

        {showKeypad && (
          <div className="codex-voice-widget__keypad" role="group" aria-label="DTMF keypad">
            {keypadLayout.map((tone) => (
              <button
                key={tone}
                type="button"
                className="codex-voice-widget__key"
                onClick={() => handleDtmf(tone)}
              >
                {tone}
              </button>
            ))}
          </div>
        )}

        <div className="codex-voice-widget__metrics" aria-live="polite">
          <strong>{dictionary.metrics}</strong>
          <span>
            RTT: {metrics?.rttMs ? `${metrics.rttMs} ms` : "-"}
          </span>
          <span>
            {dictionary.network}: {metrics?.iceState ?? "-"}
          </span>
          {reconnectIn && reconnectIn > 0 ? (
            <span>
              {dictionary.reconnecting}: {reconnectIn}
              {dictionary.seconds}
            </span>
          ) : null}
        </div>

        {!collapsed && (
          <button
            type="button"
            className="codex-voice-widget__button"
            onClick={() => setShowLogs((value) => !value)}
            aria-expanded={showLogs}
          >
            {showLogs ? dictionary.hideLogs : dictionary.showLogs}
          </button>
        )}

        {showLogs && (
          <div className="codex-voice-widget__logs" role="log">
            {logs.length === 0 && <div>{dictionary.showLogs}</div>}
            {logs.map((entry, index) => (
              <div key={`${entry.ts}-${index}`} className="codex-voice-widget__log-entry">
                <strong>{new Date(entry.ts).toLocaleTimeString()}</strong>
                <span>{entry.message}</span>
                {entry.context ? (
                  <code>{JSON.stringify(entry.context)}</code>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {showPoweredBy && (
        <footer className="codex-voice-widget__footer">
          <span className="codex-voice-widget__badge">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            {dictionary.powered} {dictionary.jambonz}
          </span>
        </footer>
      )}
      <audio ref={audioRef} hidden autoPlay playsInline />
    </div>
  );
};

export interface VoiceWidgetEnvConfig {
  JAMBONZ_SIP_DOMAIN: string;
  JAMBONZ_WSS_ADDRESS: string;
  JAMBONZ_SIP_USERNAME: string;
  JAMBONZ_SIP_PASSWORD: string;
  TARGET_SIP_URI: string;
  DEFAULT_LANG: string;
  FALLBACK_LANG: string;
  STUN_URLS: string;
  TURN_URLS?: string;
  MAX_REGISTER_RETRIES?: string;
  /**
   * Enable infinite reconnection attempts (default: true)
   * When true, the client will keep trying to reconnect indefinitely
   */
  INFINITE_RECONNECT?: string;
  /**
   * Keep-alive interval in milliseconds (default: 30000)
   * Set to '0' to disable keep-alive
   */
  KEEP_ALIVE_INTERVAL?: string;
}

export function parseIceServers(stunUrls: string, turnUrls?: string): RTCIceServer[] {
  const servers: RTCIceServer[] = [];
  const stunList = stunUrls
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  stunList.forEach((url) => {
    servers.push({ urls: url });
  });

  if (turnUrls) {
    turnUrls
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((entry) => {
        servers.push({ urls: entry });
      });
  }

  return servers;
}

export function createClient(config: VoiceWidgetEnvConfig & { JAMBONZ_WSS_ADDRESS: string; JAMBONZ_API_BASE_URL?: string }) {
  const iceServers = parseIceServers(config.STUN_URLS, config.TURN_URLS);

  const sipConfig: CodexSipConfig = {
    domain: config.JAMBONZ_SIP_DOMAIN,
    wssServer: config.JAMBONZ_WSS_ADDRESS,
    username: config.JAMBONZ_SIP_USERNAME,
    password: config.JAMBONZ_SIP_PASSWORD,
    targetUri: config.TARGET_SIP_URI,
    iceServers,
    defaultLanguage: config.DEFAULT_LANG,
    fallbackLanguage: config.FALLBACK_LANG,
    maxRegisterRetries: config.MAX_REGISTER_RETRIES ? Number(config.MAX_REGISTER_RETRIES) : undefined,
    // Enable infinite reconnect by default for better reliability
    infiniteReconnect: config.INFINITE_RECONNECT !== undefined ? config.INFINITE_RECONNECT === 'true' : true,
    // Keep-alive interval (default: 30 seconds)
    keepAliveInterval: config.KEEP_ALIVE_INTERVAL ? Number(config.KEEP_ALIVE_INTERVAL) : 30000,
  };

  return new CodexSipClient(sipConfig);
}

// Export new floating widget
export { FloatingVoiceWidget } from "./FloatingVoiceWidget";
export type { FloatingVoiceWidgetProps } from "./FloatingVoiceWidget";
export type { LanguageOption } from "./components/LanguageSelector";

// Export original card-style widget for backwards compatibility
export type { CodexSipClient };
