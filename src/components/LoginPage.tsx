import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Server } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <Card className="w-full max-w-md">
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