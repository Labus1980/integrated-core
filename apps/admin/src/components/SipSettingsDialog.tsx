import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface SipConfig {
  displayName: string;
  sipDomain: string;
  serverAddress: string;
  username: string;
  password: string;
  apiBaseUrl: string;
  accountSid: string;
  apiKey: string;
}

const DEFAULT_SIP_CONFIG: SipConfig = {
  displayName: 'Boris',
  sipDomain: 'avayalab.ru',
  serverAddress: 'wss://jambonz-sipws.okta-solutions.com',
  username: '170',
  password: 'QApassw3',
  apiBaseUrl: 'https://jambonz-api.okta-solutions.com/api/v1',
  accountSid: 'e32f2361-ad6f-4ee1-b516-06461d65c932',
  apiKey: 'f2484e6b-9683-413a-90a8-2749dd7656bd',
};

const STORAGE_KEY = 'sip-config';

export const getSipConfig = (): SipConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SIP_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load SIP config:', error);
  }
  return DEFAULT_SIP_CONFIG;
};

export const saveSipConfig = (config: SipConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save SIP config:', error);
  }
};

const SipSettingsDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<SipConfig>(getSipConfig());
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setConfig(getSipConfig());
    }
  }, [open]);

  const handleSave = () => {
    saveSipConfig(config);
    toast({
      title: 'Настройки сохранены',
      description: 'Конфигурация SIP успешно сохранена. Перезагрузите страницу для применения изменений.',
    });
    setOpen(false);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sip-config-updated', { detail: config }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_SIP_CONFIG);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground dark:text-white hover:bg-foreground/20 dark:hover:bg-white/20"
          aria-label="Настройки SIP"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки SIP/Jambonz</DialogTitle>
          <DialogDescription>
            Настройте параметры подключения к SIP серверу Jambonz
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">
              SIP Display Name <span className="text-muted-foreground">(опционально)</span>
            </Label>
            <Input
              id="displayName"
              value={config.displayName}
              onChange={(e) => setConfig({ ...config, displayName: e.target.value })}
              placeholder="Boris"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sipDomain">Jambonz SIP Domain *</Label>
            <Input
              id="sipDomain"
              value={config.sipDomain}
              onChange={(e) => setConfig({ ...config, sipDomain: e.target.value })}
              placeholder="avayalab.ru"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="serverAddress">Jambonz Server Address *</Label>
            <Input
              id="serverAddress"
              value={config.serverAddress}
              onChange={(e) => setConfig({ ...config, serverAddress: e.target.value })}
              placeholder="wss://jambonz-sipws.okta-solutions.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">SIP Username *</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="170"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">SIP Password *</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="QApassw3"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiBaseUrl">Jambonz API Server Base URL *</Label>
            <Input
              id="apiBaseUrl"
              value={config.apiBaseUrl}
              onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
              placeholder="https://jambonz-api.okta-solutions.com/api/v1"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountSid">Jambonz Account Sid *</Label>
            <Input
              id="accountSid"
              value={config.accountSid}
              onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
              placeholder="e32f2361-ad6f-4ee1-b516-06461d65c932"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="f2484e6b-9683-413a-90a8-2749dd7656bd"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              * Обязательные поля
            </p>
            <Button variant="outline" onClick={handleReset} type="button">
              Сбросить к значениям по умолчанию
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить настройки</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SipSettingsDialog;
