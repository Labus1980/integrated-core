import React, { useEffect } from 'react';
import { JambonzWidget } from '@/components/JambonzWidget';

/**
 * Страница с плавающим голосовым виджетом для встраивания через iframe
 * URL: /floating-widget
 * Рендерится БЕЗ ThemeProvider для прозрачного фона
 */
const FloatingWidgetPage: React.FC = () => {
  useEffect(() => {
    // Устанавливаем прозрачный фон
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    if (root) {
      root.style.background = 'transparent';
    }
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
