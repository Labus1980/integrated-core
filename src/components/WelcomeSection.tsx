import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Server, Users, Activity, Shield } from 'lucide-react';

const WelcomeSection: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Всего сервисов',
      value: '6',
      icon: <Server className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Онлайн',
      value: '4',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Активных пользователей',
      value: '12',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Безопасность',
      value: '100%',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">
          Добро пожаловать, {user?.username}!
        </h2>
        <p className="text-muted-foreground">
          Управляйте вашей инфраструктурой из единого центра
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full bg-primary/10 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WelcomeSection;