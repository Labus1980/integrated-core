import React, { useEffect } from 'react';
import { JambonzWidget } from '@/components/JambonzWidget';

/**
 * Страница с плавающим голосовым виджетом для встраивания через iframe
 * URL: /floating-widget
 *
 * Использование в Odoo:
 * <iframe
 *   src="https://studio.okta-solutions.com/floating-widget"
 *   style="position: fixed; bottom: 0; right: 0; width: 400px; height: 600px; border: none; z-index: 9999; pointer-events: none;"
 *   allow="microphone; autoplay"
 * ></iframe>
 *
 * Важно: pointer-events: none на iframe позволяет кликать сквозь прозрачные области
 * Сам виджет имеет pointer-events: auto и будет реагировать на клики
 */
const FloatingWidgetPage: React.FC = () => {
  // Делаем html и body полностью прозрачными с !important для переопределения Tailwind
  useEffect(() => {
    const styleId = 'floating-widget-transparent-bg';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // CSS с !important для переопределения глобальных стилей Tailwind
    styleEl.textContent = `
      html, body, #root {
        background: transparent !important;
        background-color: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        min-height: 100vh !important;
      }
    `;

    // Cleanup при размонтировании
    return () => {
      const el = document.getElementById(styleId);
      if (el) {
        el.remove();
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'transparent',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      padding: '20px',
      margin: 0,
      pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto' }}>
        <JambonzWidget embedded={false} />
      </div>
    </div>
  );
};

export default FloatingWidgetPage;
