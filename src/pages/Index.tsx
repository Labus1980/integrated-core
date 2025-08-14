import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import DashboardHeader from '@/components/DashboardHeader';
import ServicesGrid from '@/components/ServicesGrid';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Exchange authorization code for access token
      exchangeCodeForToken(code);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const tokenResponse = await fetch('https://keycloak.okta-solutions.com/realms/okta/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: 'okta-entrypoint',
          client_secret: 'ONNndDTi8fFsltBy8ILElFSr6axaxW9N',
          code: code,
          redirect_uri: window.location.origin,
        }),
      });

      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json();
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        window.location.reload(); // Reload to trigger auth check
      }
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Подключение...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <DashboardHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="container mx-auto px-6 py-8">
        <ServicesGrid searchQuery={searchQuery} />
      </main>
    </div>
  );
};

export default Index;
