import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Settings, LogOut, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import oktaLogo from '@/assets/okta-logo-clean.png';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const getUserInitials = (username: string) => {
    return username.split(' ').map(name => name[0]).join('').toUpperCase();
  };

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-white hover:bg-white/20"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/20 text-white">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={user?.avatar} alt={user?.username} />
                     <AvatarFallback>{getUserInitials(user?.username || '')}</AvatarFallback>
                   </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white dark:text-white light:text-foreground drop-shadow-sm">{user?.username}</p>
                      <p className="text-xs text-white/90 dark:text-white/90 light:text-muted-foreground drop-shadow-sm">{user?.email}</p>
                    </div>
                 </Button>
              </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-56">
                 <DropdownMenuItem>
                   <User className="mr-2 h-4 w-4" />
                   Профиль
                 </DropdownMenuItem>
                 <DropdownMenuItem>
                   <Settings className="mr-2 h-4 w-4" />
                   Настройки
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                   <LogOut className="mr-2 h-4 w-4" />
                   Выйти
                 </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;