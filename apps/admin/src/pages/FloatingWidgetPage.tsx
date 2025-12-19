import React from 'react';
import { JambonzWidget } from '@/components/JambonzWidget';

/**
 * Страница с плавающим голосовым виджетом для встраивания через iframe
 * URL: /floating-widget
 *
 * Использование в Odoo:
 * <iframe
 *   src="https://studio.okta-solutions.com/floating-widget"
 *   style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 500px; border: none; z-index: 9999;"
 *   allow="microphone; autoplay"
 * ></iframe>
 */
const FloatingWidgetPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      padding: 0,
      margin: 0,
    }}>
      <JambonzWidget embedded={false} />
    </div>
  );
};

export default FloatingWidgetPage;
