import React from 'react';
import { JambonzWidget } from './JambonzWidget';

/**
 * Плавающий виджет голосового чата
 * Отображает только голосовой виджет Jambonz без вкладок
 */
export const FloatingChatWidget: React.FC = () => {
  return <JambonzWidget embedded={false} />;
};

export default FloatingChatWidget;
