import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Moon, Sun, Mail, MessageCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import SipSettingsDialog from '@/components/SipSettingsDialog';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { theme, setTheme } = useTheme();

  const handleFeedbackClick = () => {
    // Программно открыть форму обратной связи
    const feedbackButton = document.querySelector('#zammad-feedback-form') as HTMLElement;
    if (feedbackButton) {
      feedbackButton.click();
    }
  };

  const handleSupportClick = async () => {
    console.log('[DashboardHeader] Support button clicked');

    // Просто кликаем по кнопке FloatingZammadChat, которая уже имеет всю логику
    const zammadButton = document.querySelector('.open-zammad-chat') as HTMLElement;
    if (zammadButton) {
      console.log('[DashboardHeader] Clicking FloatingZammadChat button');
      zammadButton.click();
      return;
    }

    console.error('[DashboardHeader] FloatingZammadChat button not found');
  };

  return (
    <header className="bg-gradient-secondary shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/uploads/logo.png"
              alt="OKTA Solutions"
              className="h-16 w-auto dark:brightness-100 brightness-[0.3]"
            />
            <h1 className="text-xl font-semibold text-foreground dark:text-white">Портал Сервисов</h1>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Поиск сервисов..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-card text-card-foreground placeholder:text-muted-foreground border-white/30 focus:bg-card"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleSupportClick}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 dark:text-white/80 transition-colors hover:text-foreground dark:hover:text-white"
              aria-label="Открыть чат поддержки"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Поддержка</span>
            </button>
            <button
              type="button"
              onClick={handleFeedbackClick}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 dark:text-white/80 transition-colors hover:text-foreground dark:hover:text-white"
              aria-label="Открыть форму обратной связи"
            >
              <Mail className="h-5 w-5" />
              <span className="hidden sm:inline">Обратная связь</span>
            </button>
            <SipSettingsDialog />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-foreground dark:text-white hover:bg-foreground/20 dark:hover:bg-white/20"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
