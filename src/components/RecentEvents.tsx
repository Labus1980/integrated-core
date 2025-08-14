import { Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface Event {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  service: string;
  message: string;
  timestamp: string;
}

const eventIcons = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
};

const eventColors = {
  error: 'destructive',
  success: 'success',
  warning: 'warning',
  info: 'default',
} as const;

const mockEvents: Event[] = [
  {
    id: '1',
    type: 'success',
    service: 'Grafana',
    message: 'Система мониторинга успешно обновлена до версии 10.2.1',
    timestamp: '5 минут назад',
  },
  {
    id: '2',
    type: 'warning',
    service: 'Prometheus',
    message: 'Высокая нагрузка на сервер метрик - 85% CPU',
    timestamp: '15 минут назад',
  },
  {
    id: '3',
    type: 'info',
    service: 'n8n',
    message: 'Запущено 12 новых автоматизированных процессов',
    timestamp: '1 час назад',
  },
  {
    id: '4',
    type: 'error',
    service: 'WebUI',
    message: 'Ошибка подключения к API модели GPT-4',
    timestamp: '2 часа назад',
  },
  {
    id: '5',
    type: 'success',
    service: 'Supabase Studio',
    message: 'Успешное резервное копирование базы данных',
    timestamp: '3 часа назад',
  },
];

export function RecentEvents() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary" />
          <CardTitle>Последние события</CardTitle>
        </div>
        <CardDescription>
          Важные изменения и уведомления в вашей инфраструктуре
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockEvents.map((event) => {
            const EventIcon = eventIcons[event.type];
            return (
              <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className={`p-1 rounded-full ${
                  event.type === 'error' ? 'bg-destructive/10' :
                  event.type === 'success' ? 'bg-success/10' :
                  event.type === 'warning' ? 'bg-warning/10' :
                  'bg-primary/10'
                }`}>
                  <EventIcon className={`w-4 h-4 ${
                    event.type === 'error' ? 'text-destructive' :
                    event.type === 'success' ? 'text-success' :
                    event.type === 'warning' ? 'text-warning' :
                    'text-primary'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={eventColors[event.type] as any} className="text-xs">
                      {event.service}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{event.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}