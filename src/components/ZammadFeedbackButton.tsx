import type { JQueryStatic } from "jquery";
import { useEffect } from "react";

declare global {
  interface Window {
    $: JQueryStatic | undefined;
    jQuery: JQueryStatic | undefined;
  }
}

const ZammadFeedbackButton = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const initializeForm = () => {
      const $ = window.$ ?? window.jQuery;
      if (!$ || !$.fn || typeof $.fn.ZammadForm !== "function") {
        return false;
      }

      const existingInstance = $("#zammad-feedback-form").data("zammadFormInitialized");
      if (!existingInstance) {
        $("#zammad-feedback-form")
          .data("zammadFormInitialized", true)
          .ZammadForm({
            messageTitle: "Форма обратной связи",
            messageSubmit: "Отправить",
            messageThankYou:
              "Благодарим Вас за ваше обращение (#%s)! Мы свяжемся с Вами в ближайшее время.",
            modal: true,
          });
      }

      return true;
    };

    const tryInitialize = () => {
      if (initializeForm()) {
        window.clearInterval(intervalId);
      }
    };

    const intervalId = window.setInterval(tryInitialize, 200);
    tryInitialize();

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <button
      id="zammad-feedback-form"
      className="fixed bottom-4 left-4 z-50 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-transform duration-200 hover:translate-y-[-2px] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
      type="button"
    >
      Обратная связь
    </button>
  );
};

export default ZammadFeedbackButton;
