import React from 'react';
import { JambonzWidget } from './JambonzWidget';

export const FloatingChatWidget: React.FC = () => {
  return (
    <>
      {/* Voice Widget with floating button */}
      <JambonzWidget embedded={false} />
    </>
  );
};

export default FloatingChatWidget;
