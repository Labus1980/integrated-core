import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface Event {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  service: string;
  message: string;
  timestamp: Date;
}

const RECENT_EVENTS: Event[] = [
  {
    id: '1',
    type: 'success',
    service: 'n8n',
    message: 'Workflow "Data Sync" выполнен успешно',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    type: 'warning',
    service: 'Prometheus',
    message: 'Высокое использование CPU на сервере app-01',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: '3',
    type: 'error',
    service: 'WebUI',
    message: 'Сервис недоступен - проверьте подключение',
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '4',
    type: 'info',
    service: 'Grafana',
    message: 'Обновлен дашборд системного мониторинга',
    timestamp: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: '5',
    type: 'success',
    service: 'Supabase',
    message: 'Резервное копирование БД завершено',
    timestamp: new Date(Date.now() - 60 * 60 * 1000)
  }
];

const RecentEvents: React.FC = () => {
  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getEventBadgeVariant = (type: Event['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'success':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return timestamp.toLocaleDateString('ru-RU');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Последние события</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {RECENT_EVENTS.map(event => (
            <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                    {event.service}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm">{event.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentEvents;