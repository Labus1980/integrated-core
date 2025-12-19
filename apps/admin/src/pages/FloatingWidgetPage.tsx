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
 */
const FloatingWidgetPage: React.FC = () => {
  useEffect(() => {
    // Добавляем класс для прозрачного фона (стили в index.css)
    document.body.classList.add('floating-widget-transparent');
    document.documentElement.style.background = 'transparent';

    return () => {
      document.body.classList.remove('floating-widget-transparent');
      document.documentElement.style.background = '';
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
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        pointerEvents: 'auto'
      }}>
        <JambonzWidget embedded={false} />
      </div>
    </div>
  );
};

export default FloatingWidgetPage;
