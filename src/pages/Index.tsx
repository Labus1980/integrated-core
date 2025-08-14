import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import DashboardHeader from '@/components/DashboardHeader';
import WelcomeSection from '@/components/WelcomeSection';
import ServicesGrid from '@/components/ServicesGrid';
import RecentEvents from '@/components/RecentEvents';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Handle OAuth callback - exchange code for token
      // This would typically be done in the AuthContext
      console.log('OAuth code received:', code);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        <WelcomeSection />
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <ServicesGrid searchQuery={searchQuery} />
          </div>
          <div className="xl:col-span-1">
            <RecentEvents />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
