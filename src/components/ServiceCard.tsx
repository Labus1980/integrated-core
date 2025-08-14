import React from 'react';
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
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {service.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {service.version && (
                <Badge variant="outline" className="mt-1">
                  v{service.version}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
            <span className="text-sm text-muted-foreground">{getStatusText(service.status)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="mb-4 min-h-[2.5rem]">
          {service.description}
        </CardDescription>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {service.category}
          </Badge>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-xs">
              <Activity className="mr-1 h-3 w-3" />
              Статус
            </Button>
            <Button 
              onClick={handleOpenService}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Открыть
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;