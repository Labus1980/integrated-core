import React, { useMemo } from 'react';
import ServiceCard, { Service } from './ServiceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Database,
  Activity,
  Zap,
  BarChart3,
  Globe,
  Shield,
  Cpu,
  MessageSquare,
  Cloud,
  Table,
  PhoneCall,
  BookOpen,
  LifeBuoy,
  Package,
} from 'lucide-react';
import { env } from '@/lib/env';
import { GrafanaGlyph, SupabaseGlyph, PrometheusGlyph } from '@/components/icons';

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
    version: env.versions.n8n,
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Визуализация метрик и создание дашбордов для мониторинга',
    url: env.services.grafana,
    logo: <GrafanaGlyph className="h-8 w-8" />,
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Мониторинг',
    status: 'online',
    version: env.versions.grafana,
  },
  {
    id: 'supabase',
    name: 'Supabase Studio',
    description: 'Управление базами данных, аутентификация и API',
    url: env.services.supabase,
    logo: <SupabaseGlyph className="h-8 w-8" />,
    icon: <Database className="h-5 w-5" />,
    category: 'Данные',
    status: 'online',
    version: env.versions.supabase,
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Сбор и хранение метрик системы мониторинга',
    url: env.services.prometheus,
    logo: <PrometheusGlyph className="h-8 w-8" />,
    icon: <Activity className="h-5 w-5" />,
    category: 'Мониторинг',
    status: 'warning',
    version: env.versions.prometheus,
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
    version: env.versions.flowise,
  },
  {
    id: 'anything-llm',
    name: 'AnythingLLM',
    description:
      'AnythingLLM — платформа для работы с базой знаний: загружайте документы и подключайте внешние источники (сайты, YouTube и др.)',
    url: env.services.anythingLlm,
    logo: '/uploads/3456455777.png',
    icon: <BookOpen className="h-5 w-5" />,
    category: 'AI',
    status: 'online',
    version: env.versions.anythingLlm,
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
    version: env.versions.webui,
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
    version: env.versions.keycloakAdmin,
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
    version: env.versions.qdrant,
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
    version: env.versions.baserow,
  },
  {
    id: 'jambonz',
    name: 'jambonz',
    description:
      'SIP-платформа с API для звонков и коннектором к AI (TTS/STT). Превращает звонки в HTTP/WS-события для автоматизации через n8n и ваши сервисы.',
    url: env.services.jambonz,
    logo: '/uploads/52975289.png',
    icon: <PhoneCall className="h-5 w-5" />,
    category: 'Телефония',
    status: 'online',
    version: env.versions.jambonz,
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
    version: env.versions.nextcloud,
  },
  {
    id: 'snipe-it',
    name: 'Snipe-IT',
    description: 'Система управления ИТ-активами и инвентаризацией оборудования',
    url: env.services.snipeIt,
    logo: '/uploads/snap-it.png',
    icon: <Package className="h-5 w-5" />,
    category: 'Управление активами',
    status: 'online',
    version: env.versions.snipeIt,
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
    version: env.versions.waha,
  },
  {
    id: 'zammad',
    name: 'Zammad',
    description: 'Платформа сервис-деска и поддержки клиентов',
    url: env.services.zammad,
    logo: '/uploads/zammad.png',
    icon: <LifeBuoy className="h-5 w-5" />,
    category: 'Поддержка',
    status: 'online',
    version: env.versions.zammad,
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
    version: env.versions.matrix,
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
    version: env.versions.maubot,
  },
];

const CATEGORIES = Array.from(new Set(SERVICES.map((service) => service.category)));

const ServicesGrid: React.FC = () => {
  const [activeCategory, tabs] = useMemo(() => {
    const defaultCategory = CATEGORIES[0];
    const tabItems = CATEGORIES.map((category) => ({
      value: category,
      label: category,
    }));

    return [defaultCategory, tabItems] as const;
  }, []);

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <Tabs defaultValue={activeCategory} className="space-y-6">
          <TabsList className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {SERVICES.filter((service) => service.category === tab.value).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default ServicesGrid;
