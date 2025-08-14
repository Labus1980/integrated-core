import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, ExternalLink, AlertCircle } from 'lucide-react';
import { useSSO } from '@/hooks/useSSO';
import { toast } from '@/hooks/use-toast';

interface ServiceAuthProxyProps {
  serviceId: string;
  serviceName: string;
  serviceUrl: string;
  onCancel: () => void;
}

const ServiceAuthProxy: React.FC<ServiceAuthProxyProps> = ({
  serviceId,
  serviceName,
  serviceUrl,
  onCancel
}) => {
  const [status, setStatus] = useState<'connecting' | 'success' | 'error'>('connecting');
  const [countdown, setCountdown] = useState(3);
  const { openServiceWithSSO } = useSSO();

  useEffect(() => {
    const initiateSSO = async () => {
      try {
        setStatus('connecting');
        
        // Simulate connection delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await openServiceWithSSO(serviceId, serviceUrl);
        setStatus('success');
        
        // Start countdown before closing
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              onCancel();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } catch (error) {
        console.error('SSO failed:', error);
        setStatus('error');
        toast({
          title: 'Ошибка подключения',
          description: `Не удалось подключиться к ${serviceName}`,
          variant: 'destructive'
        });
      }
    };

    initiateSSO();
  }, [serviceId, serviceName, serviceUrl, openServiceWithSSO, onCancel]);

  const handleManualOpen = () => {
    window.open(serviceUrl, '_blank', 'noopener,noreferrer');
    onCancel();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {status === 'connecting' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
                >
                  <Shield className="h-8 w-8 text-primary" />
                </motion.div>
              )}
              
              {status === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4"
                >
                  <ExternalLink className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>
              )}
              
              {status === 'error' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4"
                >
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </motion.div>
              )}
            </div>

            <h3 className="text-xl font-semibold mb-2">
              {status === 'connecting' && `Подключение к ${serviceName}`}
              {status === 'success' && `Успешное подключение!`}
              {status === 'error' && `Ошибка подключения`}
            </h3>

            <p className="text-muted-foreground mb-6">
              {status === 'connecting' && 'Выполняется автоматическая авторизация...'}
              {status === 'success' && `Сервис ${serviceName} откроется через ${countdown} сек.`}
              {status === 'error' && 'Автоматическая авторизация не удалась. Попробуйте ручной вход.'}
            </p>

            <div className="flex gap-3 justify-center">
              {status === 'connecting' && (
                <Button variant="outline" onClick={onCancel}>
                  Отмена
                </Button>
              )}
              
              {status === 'success' && (
                <Button variant="outline" onClick={onCancel}>
                  Закрыть ({countdown})
                </Button>
              )}
              
              {status === 'error' && (
                <>
                  <Button variant="outline" onClick={onCancel}>
                    Закрыть
                  </Button>
                  <Button onClick={handleManualOpen}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Открыть вручную
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ServiceAuthProxy;