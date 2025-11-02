import React, { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import ServicesGrid from '@/components/ServicesGrid';
import FloatingChatWidget from '@/components/FloatingChatWidget';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container mx-auto px-6 py-8">
        <ServicesGrid searchQuery={searchQuery} />
      </main>

      {/* Floating Chat Widget in bottom-right corner */}
      <FloatingChatWidget />
    </div>
  );
};

export default Index;
