import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { WelcomeSection } from "@/components/WelcomeSection";
import { ServicesGrid } from "@/components/ServicesGrid";
import { RecentEvents } from "@/components/RecentEvents";
import { Service } from "@/components/ServiceCard";

const services: Service[] = [
  {
    id: '1',
    name: 'n8n',
    description: 'Платформа для автоматизации бизнес-процессов с визуальным конструктором рабочих процессов',
    url: 'https://n8n.io',
    category: 'automation',
    status: 'online',
    icon: 'n8n'
  },
  {
    id: '2',
    name: 'Grafana',
    description: 'Мощная система мониторинга и визуализации метрик для анализа производительности',
    url: 'https://grafana.com',
    category: 'monitoring',
    status: 'online',
    icon: 'grafana'
  },
  {
    id: '3',
    name: 'Supabase Studio',
    description: 'Современная альтернатива Firebase для управления базами данных и аутентификацией',
    url: 'https://supabase.com',
    category: 'database',
    status: 'online',
    icon: 'supabase'
  },
  {
    id: '4',
    name: 'Prometheus',
    description: 'Система мониторинга и алертинга с мощными возможностями сбора временных рядов',
    url: 'https://prometheus.io',
    category: 'monitoring',
    status: 'warning',
    icon: 'prometheus'
  },
  {
    id: '5',
    name: 'Flowise',
    description: 'Конструктор AI-ботов и чат-ботов с использованием LangChain и визуального интерфейса',
    url: 'https://flowiseai.com',
    category: 'ai',
    status: 'online',
    icon: 'flowise'
  },
  {
    id: '6',
    name: 'WebUI',
    description: 'Веб-интерфейс для работы с языковыми моделями и генерации контента с помощью ИИ',
    url: 'https://github.com/oobabooga/text-generation-webui',
    category: 'ai',
    status: 'offline',
    icon: 'webui'
  }
];

const Index = () => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <DashboardHeader 
        searchValue={searchValue} 
        onSearchChange={setSearchValue} 
      />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <WelcomeSection />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Services Grid - Takes 3 columns */}
          <div className="lg:col-span-3">
            <ServicesGrid services={services} searchValue={searchValue} />
          </div>
          
          {/* Recent Events - Takes 1 column */}
          <div className="lg:col-span-1">
            <RecentEvents />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
