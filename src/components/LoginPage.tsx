import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';
import oktaLogo from '@/assets/okta-logo-final.png';

const LoginPage: React.FC = () => {
  const { login, isLoading, devMode, toggleDevMode } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full animate-float"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 dark:bg-card/95 shadow-2xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={oktaLogo} 
              alt="OKTA Solutions" 
              className="h-24 w-24 rounded-full shadow-xl"
            />
          </div>
          <CardTitle className="text-2xl">Портал Сервисов</CardTitle>
          <CardDescription>
            Единый вход для доступа ко всем внутренним сервисам компании
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={login}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            {isLoading ? 'Подключение...' : 'Войти через Центр Авторизации'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Безопасная авторизация через корпоративную систему единого входа
          </p>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Режим:</span>
              <button
                onClick={toggleDevMode}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  devMode 
                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {devMode ? 'Разработка' : 'Продакшн'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;