import { Search, Bell, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DashboardHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function DashboardHeader({ searchValue, onSearchChange }: DashboardHeaderProps) {
  return (
    <header className="bg-gradient-primary border-b border-border/10 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                <span className="text-primary font-bold text-lg">D</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-white/80 text-sm">Infrastructure Portal</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <Input
                placeholder="Поиск сервисов..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 transition-all"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Bell className="w-5 h-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback className="bg-white/20 text-white">АД</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Администратор</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@company.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Настройки</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}