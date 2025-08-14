import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <motion.h2 
          className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Добро пожаловать, {user?.username}!
        </motion.h2>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Управляйте корпоративной инфраструктурой через интеллектуальную платформу автоматизации OKTA Solutions
        </motion.p>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, staggerChildren: 0.1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
          >
            <Card className="border-0 bg-gradient-secondary hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <motion.div 
                    className={`p-3 rounded-full bg-gradient-primary ${stat.color}`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-white">
                      {stat.icon}
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default WelcomeSection;