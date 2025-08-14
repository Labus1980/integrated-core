import { TrendingUp, Server, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export function WelcomeSection() {
  const stats = [
    {
      label: 'Активных сервисов',
      value: '6',
      icon: Server,
      color: 'text-success'
    },
    {
      label: 'Время работы',
      value: '99.9%',
      icon: TrendingUp,
      color: 'text-primary'
    },
    {
      label: 'Безопасность',
      value: 'SSO',
      icon: Shield,
      color: 'text-warning'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Добро пожаловать в Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Единый портал для управления всей вашей IT-инфраструктурой. 
          Быстрый и безопасный доступ ко всем сервисам в одном месте.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-secondary border-border/50 hover:shadow-card transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-white/50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}