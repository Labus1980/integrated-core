import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Moon, Sun, MessageCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import oktaLogo from '@/assets/okta-logo-clean.png';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-gradient-secondary shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={oktaLogo} 
              alt="OKTA Solutions" 
              className="h-16 w-16 rounded-full shadow-lg"
            />
            <h1 className="text-xl font-semibold text-white">Портал Сервисов</h1>
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
              className="open-zammad-chat flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              aria-label="Открыть чат поддержки"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Поддержка</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-white hover:bg-white/20"
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