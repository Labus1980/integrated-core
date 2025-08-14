import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Server } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full animate-float"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 dark:bg-card/95 shadow-2xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Server className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Infrastructure Dashboard</CardTitle>
          <CardDescription>
            Авторизуйтесь для доступа к сервисам инфраструктуры
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
            {isLoading ? 'Подключение...' : 'Войти через Keycloak'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Используется единая система входа (SSO) для безопасного доступа ко всем сервисам
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;