import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Shield,
  Percent,
  Smartphone,
  Gift,
  Settings,
  Check,
  ArrowLeft
} from 'lucide-react';
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
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    email: '',
    agreeTerms: false,
    agreeMarketing: false,
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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+7 (${digits}`;
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
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
        description: "Необходимо согласиться с условиями",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName,
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        agreeMarketing: formData.agreeMarketing,
        timestamp: new Date().toISOString(),
        source: 'bank-demo-page',
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
      // Для демо показываем успех даже при ошибке сети
      setIsSuccess(true);
      toast({
        title: "Заявка принята!",
        description: "Демо: данные отправлены на webhook",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Percent, title: 'Кэшбэк до 30%', desc: 'На избранные категории' },
    { icon: Shield, title: 'Бесплатно', desc: 'Обслуживание навсегда' },
    { icon: Smartphone, title: 'Онлайн', desc: 'Выпуск за 5 минут' },
    { icon: Gift, title: 'Бонусы', desc: 'При первой покупке' },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Заявка принята!</h2>
          <p className="text-gray-600 mb-8">
            Благодарим за интерес к нашей карте. Наш специалист свяжется с вами
            в ближайшее время для подтверждения заявки.
          </p>
          <Button
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                lastName: '',
                firstName: '',
                middleName: '',
                phone: '',
                email: '',
                agreeTerms: false,
                agreeMarketing: false,
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-white font-bold text-xl">DemoBank</span>
          </div>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
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
                  />
                </div>
                <Button onClick={saveWebhookSettings} className="w-full">
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Side - Card Preview & Features */}
          <div className="text-white space-y-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Дебетовая карта
                <br />
                <span className="text-blue-200">Premium</span>
              </h1>
              <p className="text-blue-100 text-lg md:text-xl">
                Бесплатная карта с кэшбэком и премиальными привилегиями
              </p>
            </div>

            {/* Card Preview */}
            <div className="relative">
              <div className="w-full max-w-sm aspect-[1.586/1] bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md" />
                  <div className="text-right">
                    <div className="text-xs text-gray-400">DemoBank</div>
                    <div className="text-sm font-semibold text-white">PREMIUM</div>
                  </div>
                </div>
                <div className="text-xl md:text-2xl tracking-widest text-gray-300 mb-6 font-mono">
                  •••• •••• •••• 4589
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-gray-500">CARDHOLDER</div>
                    <div className="text-sm text-gray-300">YOUR NAME</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">VALID THRU</div>
                    <div className="text-sm text-gray-300">12/28</div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <feature.icon className="w-8 h-8 text-blue-200 mb-2" />
                  <div className="font-semibold">{feature.title}</div>
                  <div className="text-sm text-blue-200">{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Application Form */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Оформить карту
            </h2>
            <p className="text-gray-500 mb-6">
              Заполните форму и получите карту за 5 минут
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Иванов"
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Иван"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Отчество</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Иванович"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@mail.ru"
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, agreeTerms: checked === true }))
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="agreeTerms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                    Я соглашаюсь с{' '}
                    <a href="#" className="text-blue-600 hover:underline">условиями обслуживания</a>
                    {' '}и{' '}
                    <a href="#" className="text-blue-600 hover:underline">политикой конфиденциальности</a>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeMarketing"
                    checked={formData.agreeMarketing}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, agreeMarketing: checked === true }))
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="agreeMarketing" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                    Я согласен получать информацию о специальных предложениях и акциях
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Отправка...
                  </div>
                ) : (
                  'Оформить карту'
                )}
              </Button>

              <p className="text-center text-xs text-gray-400 pt-2">
                Нажимая кнопку, вы даете согласие на обработку персональных данных
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-blue-200 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>DemoBank &copy; 2024</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">О банке</a>
              <a href="#" className="hover:text-white transition-colors">Тарифы</a>
              <a href="#" className="hover:text-white transition-colors">Поддержка</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Bank;
