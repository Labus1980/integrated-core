import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ServiceCard, { Service } from './ServiceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Database, Activity, Zap, BarChart3, Globe, Shield, Cpu } from 'lucide-react';
import { env } from '@/lib/env';
import n8nLogo from '/lovable-uploads/764d21da-4ba9-4a54-b3ee-f6879fcc4869.png';
import grafanaLogo from '@/assets/service-icons/grafana-original.svg';
import supabaseLogo from '@/assets/service-icons/supabase-original.png';
import prometheusLogo from '@/assets/service-icons/prometheus-original.png';
import flowiseLogo from '/lovable-uploads/8a2a2a28-f334-48ae-b15e-9846838ddbf7.png';
import webuiLogo from '/lovable-uploads/d199923e-e237-479e-9fcd-1237f683b7af.png';
import qdrantLogo from '/lovable-uploads/1caac955-7ab4-4956-83cf-3154d1ec3101.png';
import keycloakLogo from '/lovable-uploads/fc46b386-43ad-46c7-b69d-0cd039c81f1c.png';

const SERVICES: Service[] = [
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Автоматизация рабочих процессов и интеграция между сервисами',
    url: env.services.n8n,
    logo: n8nLogo,
    icon: <Zap className="h-5 w-5" />,
    category: 'Автоматизация',
    status: 'online',
    version: '1.0.5'
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Визуализация метрик и создание дашбордов для мониторинга',
    url: env.services.grafana,
    logo: grafanaLogo,
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Мониторинг',
    status: 'online',
    version: '10.2.0'
  },
  {
    id: 'supabase',
    name: 'Supabase Studio',
    description: 'Управление базами данных, аутентификация и API',
    url: env.services.supabase,
    logo: supabaseLogo,
    icon: <Database className="h-5 w-5" />,
    category: 'Данные',
    status: 'online',
    version: '2.39.0'
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Сбор и хранение метрик системы мониторинга',
    url: env.services.prometheus,
    logo: prometheusLogo,
    icon: <Activity className="h-5 w-5" />,
    category: 'Мониторинг',
    status: 'warning',
    version: '2.47.0'
  },
  {
    id: 'flowise',
    name: 'Flowise',
    description: 'Конструктор AI-ботов с низким кодом',
    url: env.services.flowise,
    logo: flowiseLogo,
    icon: <Bot className="h-5 w-5" />,
    category: 'AI',
    status: 'online',
    version: '1.4.3'
  },
  {
    id: 'webui',
    name: 'WebUI',
    description: 'Веб-интерфейс для работы с языковыми моделями ИИ',
    url: env.services.webui,
    logo: webuiLogo,
    icon: <Globe className="h-5 w-5" />,
    category: 'AI',
    status: 'offline'
  },
  {
    id: 'keycloak-admin',
    name: 'Keycloak Admin',
    description: 'Панель администрирования для управления пользователями и ролями',
    url: env.services.keycloakAdmin,
    logo: keycloakLogo,
    icon: <Shield className="h-5 w-5" />,
    category: 'Безопасность',
    status: 'online',
    version: '23.0.0'
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    description: 'Векторная база данных для поиска по сходству и AI приложений',
    url: env.services.qdrant,
    logo: qdrantLogo,
    icon: <Cpu className="h-5 w-5" />,
    category: 'Данные',
    status: 'online',
    version: '1.7.0'
  }
];

interface ServicesGridProps {
  searchQuery: string;
}

const ServicesGrid: React.FC<ServicesGridProps> = ({ searchQuery }) => {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(SERVICES.map(service => service.category)));
    return ['Все', ...cats];
  }, []);

  const filteredServices = useMemo(() => {
    return SERVICES.filter(service =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getServicesByCategory = (category: string) => {
    if (category === 'Все') return filteredServices;
    return filteredServices.filter(service => service.category === category);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {env.app.title}
        </h1>
        <p className="text-muted-foreground text-lg">
          Доступ к инфраструктурным сервисам и инструментам
        </p>
      </div>

      <Tabs defaultValue="Все" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex-1 font-medium">
              {category}
              {category !== 'Все' && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {getServicesByCategory(category).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-8">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, staggerChildren: 0.05 }}
            >
              {getServicesByCategory(category).map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
            {getServicesByCategory(category).length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  {searchQuery ? 'Сервисы не найдены' : 'Нет доступных сервисов в этой категории'}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ServicesGrid;