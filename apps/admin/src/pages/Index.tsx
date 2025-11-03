import React, { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import ServicesGrid from '@/components/ServicesGrid';
import FloatingChatWidget from '@/components/FloatingChatWidget';
import FloatingZammadChat from '@/components/FloatingZammadChat';
import ZammadDebugButton from '@/components/ZammadDebugButton';

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

      {/* Voice Widget in bottom-left corner */}
      <FloatingChatWidget />

      {/* Zammad Chat Widget in bottom-right corner */}
      <FloatingZammadChat />

      {/* Debug panel for Zammad */}
      <ZammadDebugButton />
    </div>
  );
};

export default Index;
