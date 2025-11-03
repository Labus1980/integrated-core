import type { JQueryStatic } from "jquery";
import { useEffect } from "react";

declare global {
  interface Window {
    $: JQueryStatic | undefined;
    jQuery: JQueryStatic | undefined;
  }
}

/**
 * Компонент для инициализации формы обратной связи Zammad.
 * Создает скрытую кнопку, которая используется для программного открытия формы.
 */
const ZammadFormInit = () => {
  useEffect(() => {
    console.log('[ZammadFormInit] 🚀 Component mounted');

    if (typeof window === "undefined") {
      console.error('[ZammadFormInit] ❌ window is undefined');
      return;
    }

    const initializeForm = () => {
      const $ = window.$ ?? window.jQuery;
      if (!$ || !$.fn || typeof $.fn.ZammadForm !== "function") {
        console.log('[ZammadFormInit] ⏳ jQuery or ZammadForm not ready yet');
        return false;
      }

      console.log('[ZammadFormInit] ✅ jQuery and ZammadForm available');

      const existingInstance = $("#zammad-feedback-form").data("zammadFormInitialized");
      if (!existingInstance) {
        console.log('[ZammadFormInit] 🔄 Initializing feedback form...');
        $("#zammad-feedback-form")
          .data("zammadFormInitialized", true)
          .ZammadForm({
            zammadURL: 'https://zammad.okta-solutions.com',
            noCSS: true,
            agreementMessage: 'Я принимаю <a href="https://www.okta-solutions.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">Политику конфиденциальности</a>',
            messageTitle: "Форма обратной связи",
            messageSubmit: "Отправить",
            messageThankYou:
              "Благодарим Вас за ваше обращение (#%s)! Мы свяжемся с Вами в ближайшее время.",
            debug: true,
            showTitle: true,
            modal: true,
            attachmentSupport: true,
          });
        console.log('[ZammadFormInit] ✅ Feedback form initialized');
      } else {
        console.log('[ZammadFormInit] ⚠️ Form already initialized');
      }

      return true;
    };

    const tryInitialize = () => {
      if (initializeForm()) {
        console.log('[ZammadFormInit] ✅✅✅ FORM INITIALIZATION COMPLETE ✅✅✅');
        window.clearInterval(intervalId);
      }
    };

    const intervalId = window.setInterval(tryInitialize, 200);
    tryInitialize();

    return () => {
      console.log('[ZammadFormInit] 🧹 Cleanup');
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <button
      id="zammad-feedback-form"
      className="hidden"
      type="button"
      aria-hidden="true"
    />
  );
};

export default ZammadFormInit;
