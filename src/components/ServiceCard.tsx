import { ExternalLink, Zap, Activity, Database, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  category: 'automation' | 'monitoring' | 'database' | 'ai';
  status: 'online' | 'offline' | 'warning';
  icon: string;
}

interface ServiceCardProps {
  service: Service;
}

const categoryIcons = {
  automation: Zap,
  monitoring: Activity,
  database: Database,
  ai: Brain,
};

const statusColors = {
  online: 'success',
  offline: 'destructive',
  warning: 'warning',
} as const;

const statusLabels = {
  online: 'Онлайн',
  offline: 'Офлайн',
  warning: 'Предупреждение',
};

export function ServiceCard({ service }: ServiceCardProps) {
  const CategoryIcon = categoryIcons[service.category];
  
  const handleOpenService = () => {
    window.open(service.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="group hover:shadow-card-hover transition-all duration-300 cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-secondary">
              <CategoryIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {service.name}
              </CardTitle>
              <Badge 
                variant={statusColors[service.status] as any}
                className="mt-1"
              >
                {statusLabels[service.status]}
              </Badge>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {service.description}
        </CardDescription>
        <Button 
          onClick={handleOpenService}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="sm"
        >
          Открыть сервис
        </Button>
      </CardContent>
    </Card>
  );
}