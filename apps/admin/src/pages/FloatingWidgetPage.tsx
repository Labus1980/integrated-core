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
  // Делаем html и body прозрачными
  useEffect(() => {
    // Сохраняем оригинальные стили
    const originalHtmlBg = document.documentElement.style.background;
    const originalBodyBg = document.body.style.background;
    const originalBodyMargin = document.body.style.margin;
    const originalBodyPadding = document.body.style.padding;
    const originalBodyOverflow = document.body.style.overflow;

    // Применяем прозрачность
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';

    // Восстанавливаем при размонтировании
    return () => {
      document.documentElement.style.background = originalHtmlBg;
      document.body.style.background = originalBodyBg;
      document.body.style.margin = originalBodyMargin;
      document.body.style.padding = originalBodyPadding;
      document.body.style.overflow = originalBodyOverflow;
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
      pointerEvents: 'none', // Позволяет кликать сквозь контейнер
    }}>
      <div style={{ pointerEvents: 'auto' }}> {/* Виджет реагирует на клики */}
        <JambonzWidget embedded={false} />
      </div>
    </div>
  );
};

export default FloatingWidgetPage;
