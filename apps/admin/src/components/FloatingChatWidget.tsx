import React, { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZammadChatContainer } from './ZammadChatContainer';
import { JambonzWidget } from './JambonzWidget';
import '@/styles/floating-chat-widget.css';

export const FloatingChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('online');

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Panel */}
      {isOpen && (
        <div className="floating-chat-panel">
          <div className="floating-chat-header">
            <h3 className="floating-chat-title">Центр коммуникации</h3>
            <button
              type="button"
              onClick={toggleWidget}
              className="floating-chat-close"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="floating-chat-tabs">
            <TabsList className="floating-chat-tabs-list">
              <TabsTrigger value="online" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Онлайн чат
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Голосовой чат
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online" className="floating-chat-tab-content">
              <ZammadChatContainer isActive={activeTab === 'online' && isOpen} />
            </TabsContent>

            <TabsContent value="voice" className="floating-chat-tab-content">
              <div className="voice-widget-container h-full">
                <JambonzWidget embedded={true} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Floating Button */}
      <button
        type="button"
        onClick={toggleWidget}
        className={`floating-chat-button ${isOpen ? 'floating-chat-button--open' : ''}`}
        aria-label={isOpen ? 'Закрыть центр коммуникации' : 'Открыть центр коммуникации'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
};

export default FloatingChatWidget;
