import React, { useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZammadChatContainer } from './ZammadChatContainer';
import { JambonzWidget } from './JambonzWidget';
import '@/styles/unified-chat.css';

export const UnifiedChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('online');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 dark:text-white/80 transition-colors hover:text-foreground dark:hover:text-white"
          aria-label="Открыть центр коммуникации"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Чаты</span>
        </button>
      </DialogTrigger>
      <DialogContent className="unified-chat-dialog max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Центр коммуникации</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="online" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Онлайн чат
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Голосовой чат
            </TabsTrigger>
          </TabsList>
          <TabsContent value="online" className="flex-1 overflow-hidden">
            <ZammadChatContainer isActive={activeTab === 'online' && open} />
          </TabsContent>
          <TabsContent value="voice" className="flex-1 overflow-hidden">
            <div className="voice-widget-container h-full">
              <JambonzWidget embedded={true} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedChatWidget;
