import { useEffect } from "react";
import { FloatingVoiceWidget as FloatingVoiceWidgetComponent, FloatingVoiceWidgetProps } from "./components/FloatingVoiceWidget";
import { floatingWidgetStyles } from "./styles";

const STYLE_TAG_ID = "codex-floating-voice-widget-styles";

function injectStyles() {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(STYLE_TAG_ID)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = floatingWidgetStyles;
  document.head.appendChild(style);
}

export const FloatingVoiceWidget = (props: FloatingVoiceWidgetProps) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return <FloatingVoiceWidgetComponent {...props} />;
};

export type { FloatingVoiceWidgetProps };
export type { LanguageOption } from "./components/LanguageSelector";
