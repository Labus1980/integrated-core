import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Shield } from 'lucide-react';
import ServiceAuthProxy from './ServiceAuthProxy';
import { useSSO } from '@/hooks/useSSO';

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: React.ReactNode;
  logo?: string;
  category: string;
  status: 'online' | 'offline' | 'warning';
  version?: string;
  ssoEnabled?: boolean;
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [showAuthProxy, setShowAuthProxy] = useState(false);
  const { isAuthenticated, openServiceWithSSO } = useSSO();

  const handleOpenService = () => {
    // Check if service supports SSO and user is authenticated
    if (service.ssoEnabled !== false && isAuthenticated) {
      setShowAuthProxy(true);
    } else {
      // Fallback to direct opening
      window.open(service.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border border-border/50 bg-card hover:bg-card/90 relative overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {service.logo ? (
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <img src={service.logo} alt={`${service.name} logo`} className="h-8 w-8 object-contain" />
                </div>
              ) : (
                <div className="p-3 bg-primary rounded-lg text-white shadow-lg">
                  {service.icon}
                </div>
              )}
            </motion.div>
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{service.name}</CardTitle>
              {service.version && (
                <Badge variant="outline" className="text-xs">
                  v{service.version}
                </Badge>
              )}
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
            <Button 
              onClick={handleOpenService}
              size="sm"
              className="bg-primary hover:bg-primary/90 border-0 shadow-md text-primary-foreground relative"
            >
              {service.ssoEnabled !== false && isAuthenticated ? (
                <Shield className="mr-2 h-4 w-4" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Открыть
              {service.ssoEnabled !== false && isAuthenticated && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showAuthProxy && (
        <ServiceAuthProxy
          serviceId={service.id}
          serviceName={service.name}
          serviceUrl={service.url}
          onCancel={() => setShowAuthProxy(false)}
        />
      )}
    </motion.div>
  );
};

export default ServiceCard;