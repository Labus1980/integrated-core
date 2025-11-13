import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  VoiceChatWidget,
  createClient,
  VoiceWidgetEnvConfig,
  CodexSipClient
} from "@codex/web-widget";

declare global {
  interface Window {
    __CODEX_CONFIG__?: Partial<VoiceWidgetEnvConfig>;
  }
}

interface ExtensionConfig extends Partial<VoiceWidgetEnvConfig> {
  widgetLocale?: "en" | "ru";
  theme?: "light" | "dark";
}

const defaultConfig: Partial<VoiceWidgetEnvConfig> = {
  DEFAULT_LANG: "en",
  FALLBACK_LANG: "ru",
  STUN_URLS: "stun:fs-tun.okta-solutions.com:3478",
};

const useExtensionConfig = () => {
  const [config, setConfig] = useState<ExtensionConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fallback = window.__CODEX_CONFIG__;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get("codexConfig", (value) => {
        const stored = value?.codexConfig as ExtensionConfig | undefined;
        if (stored) {
          setConfig(stored);
        } else if (fallback) {
          setConfig(fallback);
        } else {
          setError("No SIP credentials configured. Open the admin panel to set them up.");
        }
      });
      return;
    }

    if (fallback) {
      setConfig(fallback);
      return;
    }

    setError("No configuration source available");
  }, []);

  return { config, error };
};

const Popup = () => {
  const { config, error } = useExtensionConfig();

  const client = useMemo(() => {
    if (!config) {
      return null;
    }
    const merged: VoiceWidgetEnvConfig = {
      ...defaultConfig,
      ...config,
    } as VoiceWidgetEnvConfig;

    return createClient(merged);
  }, [config]);

  if (error) {
    return (
      <div style={{ color: "white", width: 320 }}>
        <h2>Codex Voice Agent</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ color: "white", width: 320 }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <VoiceChatWidget
      client={client as CodexSipClient}
      theme={config?.theme ?? "dark"}
      locale={config?.widgetLocale ?? "en"}
    />
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <Popup />
    </StrictMode>
  );
}
