import React, { useEffect, useLayoutEffect } from 'react';
import { JambonzWidget } from '@/components/JambonzWidget';

/**
 * Страница с плавающим голосовым виджетом для встраивания через iframe
 * URL: /floating-widget
 */
const FloatingWidgetPage: React.FC = () => {
  // useLayoutEffect выполняется синхронно перед отрисовкой
  useLayoutEffect(() => {
    // Сохраняем оригинальные значения
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const originalHtmlClass = html.className;
    const originalHtmlStyle = html.getAttribute('style') || '';
    const originalBodyStyle = body.getAttribute('style') || '';
    const originalRootStyle = root?.getAttribute('style') || '';

    // Убираем класс dark/light который добавляет ThemeProvider
    html.classList.remove('dark', 'light');

    // Принудительно устанавливаем прозрачный фон
    html.style.cssText = 'background: transparent !important; background-color: transparent !important;';
    body.style.cssText = 'background: transparent !important; background-color: transparent !important; margin: 0; padding: 0; overflow: hidden;';
    if (root) {
      root.style.cssText = 'background: transparent !important; background-color: transparent !important;';
    }

    return () => {
      html.className = originalHtmlClass;
      html.setAttribute('style', originalHtmlStyle);
      body.setAttribute('style', originalBodyStyle);
      if (root) {
        root.setAttribute('style', originalRootStyle);
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
