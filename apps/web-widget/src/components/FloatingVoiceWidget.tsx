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

interface JambonzApplication {
  application_sid: string;
  name: string;
}

interface JambonzPhoneNumber {
  phone_number_sid: string;
  account_sid: string;
  application_sid?: string;
  number: string;
  voip_carrier_sid?: string;
}

interface ApplicationWithNumber extends JambonzApplication {
  phoneNumber?: string;
}

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
    selectApplication: "Select Application",
    noApplications: "No applications available",
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
    selectApplication: "Выбрать приложение",
    noApplications: "Нет доступных приложений",
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
  apiBaseUrl?: string;
  apiKey?: string;
  accountSid?: string;
  sipDomain?: string;
}

export const FloatingVoiceWidget = ({
  client,
  languages = defaultLanguages,
  locale = "en",
  theme = "dark",
  position = "bottom-right",
  autoRegister = true,
  embedded = false,
  apiBaseUrl,
  apiKey,
  accountSid,
  sipDomain,
}: FloatingVoiceWidgetProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(embedded); // В embedded режиме всегда развернут
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [metrics, setMetrics] = useState<MetricsEvent | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallEvent | null>(null);
  const [applications, setApplications] = useState<ApplicationWithNumber[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>("");
  const [showApplicationSelector, setShowApplicationSelector] = useState(false);
  const [currentCallTarget, setCurrentCallTarget] = useState<string>("");

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

  // Load applications and phone numbers from Jambonz API
  useEffect(() => {
    if (apiBaseUrl && apiKey && accountSid) {
      const loadApplicationsAndNumbers = async () => {
        try {
          // Load applications
          const appsUrl = `${apiBaseUrl}/Accounts/${accountSid}/Applications`;
          const appsResponse = await fetch(appsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!appsResponse.ok) {
            throw new Error('Failed to load applications');
          }

          const appsData: JambonzApplication[] = await appsResponse.json();

          // Load phone numbers
          const numbersUrl = `${apiBaseUrl}/Accounts/${accountSid}/PhoneNumbers`;
          const numbersResponse = await fetch(numbersUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          let phoneNumbers: JambonzPhoneNumber[] = [];
          if (numbersResponse.ok) {
            phoneNumbers = await numbersResponse.json();
          }

          // Merge applications with their phone numbers
          const appsWithNumbers: ApplicationWithNumber[] = appsData.map(app => {
            const phoneNumber = phoneNumbers.find(num => num.application_sid === app.application_sid);
            return {
              ...app,
              phoneNumber: phoneNumber?.number,
            };
          });

          setApplications(appsWithNumbers);

          // Select first application by default
          if (appsWithNumbers.length > 0) {
            setSelectedApplication(appsWithNumbers[0].application_sid);
          }
        } catch (error) {
          console.error('Failed to load applications and phone numbers:', error);
        }
      };

      loadApplicationsAndNumbers();
    }
  }, [apiBaseUrl, apiKey, accountSid]);

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
        setIncomingCall(null);
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }

      if (event.state === "ended" || event.state === "error" || event.state === "idle") {
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
        setIncomingCall(null);
        setCurrentCallTarget("");
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

      // Find selected application and its phone number or name
      const app = applications.find(a => a.application_sid === selectedApplication);
      if (!app) {
        console.error("No application selected");
        return;
      }

      try {
        // Determine target URI: use phone number if available, otherwise use app name
        let targetUri: string;
        if (app.phoneNumber) {
          // Call using phone number
          targetUri = sipDomain ? `sip:${app.phoneNumber}@${sipDomain}` : `sip:${app.phoneNumber}`;
          setCurrentCallTarget(`${app.name} (${app.phoneNumber})`);
        } else {
          // Fallback to calling by application name
          targetUri = sipDomain ? `sip:${app.name}@${sipDomain}` : `sip:${app.name}`;
          setCurrentCallTarget(app.name);
        }

        console.log(`Calling application: ${app.name}, target URI: ${targetUri}`);
        await client.startCall({ language: selectedLanguage, targetUri });
      } catch (error) {
        console.error("Failed to start call:", error);
        setCurrentCallTarget("");
      }
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCall = async () => {
    // Find selected application and its phone number or name
    const app = applications.find(a => a.application_sid === selectedApplication);
    if (!app) {
      console.error("No application selected");
      return;
    }

    try {
      // Determine target URI: use phone number if available, otherwise use app name
      let targetUri: string;
      if (app.phoneNumber) {
        // Call using phone number
        targetUri = sipDomain ? `sip:${app.phoneNumber}@${sipDomain}` : `sip:${app.phoneNumber}`;
        setCurrentCallTarget(`${app.name} (${app.phoneNumber})`);
      } else {
        // Fallback to calling by application name
        targetUri = sipDomain ? `sip:${app.name}@${sipDomain}` : `sip:${app.name}`;
        setCurrentCallTarget(app.name);
      }

      console.log(`Calling application: ${app.name}, target URI: ${targetUri}`);
      await client.startCall({ language: selectedLanguage, targetUri });
    } catch (error) {
      console.error("Failed to start call:", error);
      setCurrentCallTarget("");
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

            {callState === "idle" && applications.length > 0 && (
              <div className="codex-floating-voice-widget__application-selector">
                <label htmlFor="app-select" className="codex-floating-voice-widget__label">
                  {t.selectApplication}
                </label>
                <select
                  id="app-select"
                  value={selectedApplication}
                  onChange={(e) => setSelectedApplication(e.target.value)}
                  className="codex-floating-voice-widget__select"
                >
                  {applications.map((app) => (
                    <option key={app.application_sid} value={app.application_sid}>
                      {app.name}{app.phoneNumber ? ` (${app.phoneNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(isLive || isBusy) && currentCallTarget && (
              <div className="codex-floating-voice-widget__call-target">
                <span className="codex-floating-voice-widget__call-target-label">
                  {locale === "ru" ? "Звоним:" : "Calling:"}
                </span>
                <span className="codex-floating-voice-widget__call-target-name">
                  {currentCallTarget}
                </span>
              </div>
            )}

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
                  disabled={!selectedApplication}
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
