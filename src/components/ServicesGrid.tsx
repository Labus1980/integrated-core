import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ServiceCard, { Service } from './ServiceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Database, Activity, Zap, BarChart3, Globe, Shield, Cpu, Code, MessageSquare, Cloud, Table } from 'lucide-react';
import { env } from '@/lib/env';
import grafanaLogo from '@/assets/service-icons/grafana-original.svg';
import supabaseLogo from '@/assets/service-icons/supabase-original.png';
import prometheusLogo from '@/assets/service-icons/prometheus-original.png';

const SERVICES: Service[] = [
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Автоматизация рабочих процессов и интеграция между сервисами',
    url: env.services.n8n,
    logo: '/uploads/764d21da-4ba9-4a54-b3ee-f6879fcc4869.png',
    icon: <Zap className="h-5 w-5" />,
    category: 'Автоматизация',
    status: 'online',
    version: env.versions.n8n
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
    version: env.versions.grafana
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
    version: env.versions.supabase
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
    version: env.versions.prometheus
  },
  {
    id: 'flowise',
    name: 'Flowise',
    description: 'Конструктор для визуальной сборки чат-ботов и AI-агентов • Создание чат-ботов для сайтов • Разработка внутренних ассистентов для компании',
    url: env.services.flowise,
    logo: '/uploads/8a2a2a28-f334-48ae-b15e-9846838ddbf7.png',
    icon: <Bot className="h-5 w-5" />,
    category: 'AI',
    status: 'online',
    version: env.versions.flowise
  },
  {
    id: 'webui',
    name: 'WebUI',
    description: 'Веб-интерфейс для работы с языковыми моделями ИИ',
    url: env.services.webui,
    logo: '/uploads/d199923e-e237-479e-9fcd-1237f683b7af.png',
    icon: <Globe className="h-5 w-5" />,
    category: 'AI',
    status: 'offline',
    version: env.versions.webui
  },
  {
    id: 'keycloak-admin',
    name: 'Keycloak Admin',
    description: 'Панель администрирования для управления пользователями и ролями',
    url: env.services.keycloakAdmin,
    logo: '/uploads/fc46b386-43ad-46c7-b69d-0cd039c81f1c.png',
    icon: <Shield className="h-5 w-5" />,
    category: 'Безопасность',
    status: 'online',
    version: env.versions.keycloakAdmin
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    description: 'Векторная база данных для поиска по сходству и AI приложений',
    url: env.services.qdrant,
    logo: '/uploads/1caac955-7ab4-4956-83cf-3154d1ec3101.png',
    icon: <Cpu className="h-5 w-5" />,
    category: 'Данные',
    status: 'online',
    version: env.versions.qdrant
  },
  {
    id: 'baserow',
    name: 'Baserow',
    description: 'Профессиональная платформа для управления данными и организации совместных процессов в формате онлайн-таблиц',
    url: env.services.baserow,
    logo: '/uploads/a3f7c9e2.png',
    icon: <Table className="h-5 w-5" />,
    category: 'Данные',
    status: 'online',
    version: env.versions.baserow
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Облачное хранилище файлов и совместная работа',
    url: env.services.nextcloud,
    logo: '/uploads/9c78f3f8-87a0-4cf7-9c35-8a402a90f20b.png',
    icon: <Cloud className="h-5 w-5" />,
    category: 'Файлы',
    status: 'online',
    version: env.versions.nextcloud
  },
  {
    id: 'waha',
    name: 'Waha',
    description: 'Сервис для работы с WhatsApp',
    url: 'https://wa.okta-solutions.com/dashboard',
    logo: '/uploads/f50412de-cc3b-4164-934c-2819d2436f85.png',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Омниканальность',
    status: 'online',
    version: env.versions.waha
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Открытая сеть для защищённой децентрализованной коммуникации',
    url: env.services.matrix,
    logo: '/uploads/9c78f3f8-87a0-4cf7-9c35-8a402a90f20с.png',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Омниканальность',
    status: 'online',
    version: env.versions.matrix
  },
  {
    id: 'maubot',
    name: 'Maubot',
    description: 'Сервис для объединения разных мессенджеров и каналов связи в единую платформу с удобным управлением и расширяемыми возможностями',
    url: env.services.maubot,
    logo: '/uploads/b0cd15b3-f2a6-4ba5-92e4-9e6d492fe7dc.png',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Омниканальность',
    status: 'online',
    version: env.versions.maubot
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
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Bot className="h-12 w-12 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            OKTA Solutions Platform
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Интеллектуальная платформа автоматизации бизнес-процессов и управления корпоративной инфраструктурой
        </p>
      </div>

      <Tabs defaultValue="Все" className="w-full">
        <TabsList className="w-full overflow-x-auto justify-start">
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="font-medium flex-shrink-0"
            >
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