import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Activity } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  logo?: string;
  category: string;
  status: 'online' | 'offline' | 'warning';
  version?: string;
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const getStatusColor = (status: Service['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Service['status']) => {
    switch (status) {
      case 'online':
        return 'Онлайн';
      case 'offline':
        return 'Офлайн';
      case 'warning':
        return 'Предупреждение';
      default:
        return 'Неизвестно';
    }
  };

  const handleOpenService = () => {
    window.open(service.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-secondary hover:bg-white dark:hover:bg-card relative overflow-hidden">
        <CardHeader className="pb-3">
          {/* Status indicator */}
          <div className="absolute top-4 right-4">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)} shadow-lg`} />
          </div>
          
          <div className="flex items-start space-x-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {service.logo ? (
                <img 
                  src={service.logo} 
                  alt={`${service.name} logo`}
                  className="w-12 h-12 object-contain rounded-lg bg-white p-2 shadow-md"
                />
              ) : (
                <div className="p-3 bg-gradient-primary rounded-lg text-white shadow-lg">
                  {service.icon}
                </div>
              )}
            </motion.div>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{service.name}</CardTitle>
              <div className="flex items-center space-x-2">
                {service.version && (
                  <Badge variant="outline" className="text-xs">
                    v{service.version}
                  </Badge>
                )}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${service.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                    service.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 
                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}
                >
                  {getStatusText(service.status)}
                </Badge>
              </div>
            </div>
          </div>
      </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-6 min-h-[2.5rem] text-sm">
            {service.description}
          </CardDescription>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-medium">
              {service.category}
            </Badge>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs hover:bg-primary/10"
              >
                <Activity className="mr-1 h-3 w-3" />
                Статус
              </Button>
              <Button 
                onClick={handleOpenService}
                size="sm"
                className="bg-gradient-primary hover:opacity-90 border-0 shadow-md text-white"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Открыть
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ServiceCard;