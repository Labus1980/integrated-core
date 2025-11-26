import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@codex/web-widget';
import type { CodexSipClient, CallState, IncomingCallEvent, CustomerData } from '@codex/core-sip';

// ===== Types =====
interface OdooUrlParams {
  phone: string | null;
  name: string | null;
  partner_id: string | null;
  lead_id: string | null;
  user_id: string | null;
  callback_url: string | null;
  model: string | null;
  source: string | null;
  embedded: boolean;
  autostart: boolean;
  lang: 'ru' | 'en';
}

interface OdooCallEvent {
  type: 'call_started' | 'call_ended' | 'incoming_call';
  phone: string;
  partner_id?: number | null;
  lead_id?: number | null;
  user_id?: number | null;
  timestamp: string;
  duration?: number;
  status?: 'completed' | 'missed' | 'failed' | 'busy';
  recording_url?: string;
}

interface SipConfig {
  displayName: string;
  sipDomain: string;
  serverAddress: string;
  username: string;
  password: string;
}

// ===== Default SIP Config =====
const DEFAULT_SIP_CONFIG: SipConfig = {
  displayName: 'Odoo Operator',
  sipDomain: 'jambonzlab.ru',
  serverAddress: 'ws://jambonz-sipws.okta-solutions.com',
  username: '170',
  password: 'QApassw3',
};

const STORAGE_KEY = 'odoo-sip-config';

const getSipConfig = (): SipConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SIP_CONFIG, ...JSON.parse(stored) };
    }
    // Fallback to main sip-config if available
    const mainConfig = localStorage.getItem('sip-config');
    if (mainConfig) {
      return { ...DEFAULT_SIP_CONFIG, ...JSON.parse(mainConfig) };
    }
  } catch (error) {
    console.error('[OdooPhoneWidget] Failed to load SIP config:', error);
  }
  return DEFAULT_SIP_CONFIG;
};

const saveSipConfig = (config: SipConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('[OdooPhoneWidget] Failed to save SIP config:', error);
  }
};

// ===== Translations =====
const translations = {
  ru: {
    title: 'Телефония',
    ready: 'Готов',
    registering: 'Регистрация...',
    connecting: 'Соединение...',
    ringing: 'Вызов...',
    connected: 'На линии',
    ended: 'Звонок завершён',
    error: 'Ошибка',
    incoming: 'Входящий звонок',
    call: 'Позвонить',
    hangup: 'Завершить',
    mute: 'Откл. звук',
    unmute: 'Вкл. звук',
    keypad: 'Клавиатура',
    accept: 'Принять',
    reject: 'Отклонить',
    enterPhone: 'Введите номер',
    unknownContact: 'Неизвестный контакт',
    settings: 'Настройки',
    settingsTitle: 'Настройки Jambonz',
    displayName: 'Имя оператора',
    sipDomain: 'SIP Домен',
    serverAddress: 'Адрес сервера (WebSocket)',
    username: 'Логин',
    password: 'Пароль',
    save: 'Сохранить',
    cancel: 'Отмена',
    reset: 'Сбросить',
    configSaved: 'Настройки сохранены',
    reconnect: 'Переподключиться',
    notConfigured: 'Настройте подключение к Jambonz',
  },
  en: {
    title: 'Telephony',
    ready: 'Ready',
    registering: 'Registering...',
    connecting: 'Connecting...',
    ringing: 'Ringing...',
    connected: 'On Call',
    ended: 'Call Ended',
    error: 'Error',
    incoming: 'Incoming Call',
    call: 'Call',
    hangup: 'End Call',
    mute: 'Mute',
    unmute: 'Unmute',
    keypad: 'Keypad',
    accept: 'Accept',
    reject: 'Reject',
    enterPhone: 'Enter phone number',
    unknownContact: 'Unknown Contact',
    settings: 'Settings',
    settingsTitle: 'Jambonz Settings',
    displayName: 'Display Name',
    sipDomain: 'SIP Domain',
    serverAddress: 'Server Address (WebSocket)',
    username: 'Username',
    password: 'Password',
    save: 'Save',
    cancel: 'Cancel',
    reset: 'Reset',
    configSaved: 'Settings saved',
    reconnect: 'Reconnect',
    notConfigured: 'Configure Jambonz connection',
  },
};

// ===== DTMF Keypad Layout =====
const dtmfKeys = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

// ===== DTMF Tone Frequencies =====
const dtmfFrequencies: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

// Audio context for DTMF tones
let audioContext: AudioContext | null = null;

const playDtmfTone = (digit: string, duration = 150) => {
  const freqs = dtmfFrequencies[digit];
  if (!freqs) return;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const [freq1, freq2] = freqs;
    const now = audioContext.currentTime;
    const endTime = now + duration / 1000;

    // Create oscillators for the two frequencies
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc1.frequency.value = freq1;
    osc2.frequency.value = freq2;
    osc1.type = 'sine';
    osc2.type = 'sine';

    // Set volume
    gainNode.gain.value = 0.2;

    // Connect
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc1.stop(endTime);
    osc2.stop(endTime);

    // Cleanup
    setTimeout(() => {
      osc1.disconnect();
      osc2.disconnect();
      gainNode.disconnect();
    }, duration + 50);
  } catch (e) {
    console.warn('[OdooPhoneWidget] Failed to play DTMF tone:', e);
  }
};

// ===== Phone Number Formatting =====
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Russian number format: +7 XXX XXX-XX-XX
  if (cleaned.startsWith('+7') && cleaned.length === 12) {
    const digits = cleaned.slice(2);
    return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // 8 format: 8 XXX XXX-XX-XX
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    const digits = cleaned.slice(1);
    return `8 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // International format: +X XXX XXX XXXX
  if (cleaned.startsWith('+') && cleaned.length >= 11) {
    const countryCode = cleaned.slice(0, cleaned.length - 10);
    const digits = cleaned.slice(-10);
    return `${countryCode} ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // Default: just add spaces every 3 digits
  if (cleaned.length > 6) {
    return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
  }

  return phone;
};

// ===== Styles =====
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --odoo-primary: #714B67;
    --odoo-primary-light: #8B6B81;
    --odoo-secondary: #017E84;
    --odoo-success: #28A745;
    --odoo-danger: #DC3545;
    --odoo-warning: #FFC107;
    --odoo-surface: #1E1E2E;
    --odoo-surface-elevated: #2A2A3E;
    --odoo-text: #FFFFFF;
    --odoo-text-muted: #A0A0B8;
    --odoo-border: rgba(255, 255, 255, 0.1);
    --odoo-gradient: linear-gradient(135deg, #714B67, #017E84);
  }

  body.odoo-widget-embedded {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: transparent;
  }

  .odoo-phone-widget {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    width: 100%;
    min-width: 300px;
    max-width: 400px;
    min-height: 400px;
    background: var(--odoo-surface);
    color: var(--odoo-text);
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .odoo-phone-widget--embedded {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 100%;
    min-height: 100%;
    border-radius: 0;
  }

  .odoo-phone-widget--standalone {
    margin: 20px auto;
  }

  /* Header */
  .odoo-phone-widget__header {
    background: var(--odoo-gradient);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  .odoo-phone-widget__header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .odoo-phone-widget__contact-name {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .odoo-phone-widget__contact-name svg {
    width: 20px;
    height: 20px;
  }

  .odoo-phone-widget__settings-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .odoo-phone-widget__settings-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .odoo-phone-widget__settings-btn svg {
    width: 20px;
    height: 20px;
  }

  .odoo-phone-widget__phone-number {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.9;
    letter-spacing: 0.5px;
  }

  /* Status Bar */
  .odoo-phone-widget__status-bar {
    background: var(--odoo-surface-elevated);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--odoo-border);
  }

  .odoo-phone-widget__timer {
    font-size: 32px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--odoo-success);
  }

  .odoo-phone-widget__status {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--odoo-text-muted);
  }

  .odoo-phone-widget__status--connecting {
    color: var(--odoo-warning);
  }

  .odoo-phone-widget__status--connected {
    color: var(--odoo-success);
  }

  .odoo-phone-widget__status--error {
    color: var(--odoo-danger);
  }

  /* Audio Visualizer */
  .odoo-phone-widget__visualizer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 40px;
    padding: 8px 0;
  }

  .odoo-phone-widget__visualizer-bar {
    width: 4px;
    background: var(--odoo-gradient);
    border-radius: 2px;
    transition: height 0.1s ease-out;
  }

  @keyframes visualize {
    0%, 100% { height: 8px; }
    50% { height: 32px; }
  }

  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar {
    animation: visualize 0.5s ease-in-out infinite;
  }

  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(1) { animation-delay: 0s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(2) { animation-delay: 0.1s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(3) { animation-delay: 0.2s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(4) { animation-delay: 0.15s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(5) { animation-delay: 0.25s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(6) { animation-delay: 0.05s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(7) { animation-delay: 0.2s; }
  .odoo-phone-widget__visualizer--active .odoo-phone-widget__visualizer-bar:nth-child(8) { animation-delay: 0.1s; }

  /* Body */
  .odoo-phone-widget__body {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Phone Input */
  .odoo-phone-widget__input-container {
    display: flex;
    gap: 8px;
  }

  .odoo-phone-widget__input {
    flex: 1;
    background: var(--odoo-surface-elevated);
    border: 1px solid var(--odoo-border);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 16px;
    font-weight: 500;
    color: var(--odoo-text);
    outline: none;
    transition: border-color 0.2s;
  }

  .odoo-phone-widget__input:focus {
    border-color: var(--odoo-primary);
  }

  .odoo-phone-widget__input::placeholder {
    color: var(--odoo-text-muted);
  }

  /* DTMF Keypad */
  .odoo-phone-widget__keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 8px;
    background: var(--odoo-surface-elevated);
    border-radius: 12px;
  }

  .odoo-phone-widget__key {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    aspect-ratio: 1;
    max-height: 60px;
    background: transparent;
    border: 1px solid var(--odoo-border);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--odoo-text);
  }

  .odoo-phone-widget__key:hover {
    background: var(--odoo-primary);
    border-color: var(--odoo-primary);
  }

  .odoo-phone-widget__key:active {
    transform: scale(0.95);
  }

  .odoo-phone-widget__key-digit {
    font-size: 20px;
    font-weight: 600;
  }

  .odoo-phone-widget__key-letters {
    font-size: 8px;
    font-weight: 500;
    color: var(--odoo-text-muted);
    letter-spacing: 0.1em;
  }

  /* Control Buttons */
  .odoo-phone-widget__controls {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .odoo-phone-widget__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    min-width: 100px;
  }

  .odoo-phone-widget__btn svg {
    width: 18px;
    height: 18px;
  }

  .odoo-phone-widget__btn--mute {
    background: var(--odoo-surface-elevated);
    color: var(--odoo-text);
    border: 1px solid var(--odoo-border);
  }

  .odoo-phone-widget__btn--mute:hover {
    background: var(--odoo-primary-light);
  }

  .odoo-phone-widget__btn--mute.active {
    background: var(--odoo-danger);
    border-color: var(--odoo-danger);
  }

  .odoo-phone-widget__btn--keypad {
    background: var(--odoo-surface-elevated);
    color: var(--odoo-text);
    border: 1px solid var(--odoo-border);
  }

  .odoo-phone-widget__btn--keypad:hover {
    background: var(--odoo-primary-light);
  }

  .odoo-phone-widget__btn--keypad.active {
    background: var(--odoo-primary);
    border-color: var(--odoo-primary);
  }

  /* Main Action Button */
  .odoo-phone-widget__main-action {
    margin-top: auto;
    padding: 0 20px 20px;
  }

  .odoo-phone-widget__btn--call {
    width: 100%;
    padding: 16px;
    background: var(--odoo-success);
    color: white;
    font-size: 16px;
    border-radius: 14px;
  }

  .odoo-phone-widget__btn--call:hover {
    background: #218838;
  }

  .odoo-phone-widget__btn--call:disabled {
    background: var(--odoo-text-muted);
    cursor: not-allowed;
  }

  .odoo-phone-widget__btn--hangup {
    width: 100%;
    padding: 16px;
    background: var(--odoo-danger);
    color: white;
    font-size: 16px;
    border-radius: 14px;
  }

  .odoo-phone-widget__btn--hangup:hover {
    background: #C82333;
  }

  /* Incoming Call Buttons */
  .odoo-phone-widget__incoming-controls {
    display: flex;
    gap: 16px;
  }

  .odoo-phone-widget__btn--accept {
    flex: 1;
    padding: 16px;
    background: var(--odoo-success);
    color: white;
    font-size: 16px;
    border-radius: 14px;
  }

  .odoo-phone-widget__btn--accept:hover {
    background: #218838;
  }

  .odoo-phone-widget__btn--reject {
    flex: 1;
    padding: 16px;
    background: var(--odoo-danger);
    color: white;
    font-size: 16px;
    border-radius: 14px;
  }

  .odoo-phone-widget__btn--reject:hover {
    background: #C82333;
  }

  /* Incoming call animation */
  @keyframes incoming-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
    50% { box-shadow: 0 0 0 20px rgba(40, 167, 69, 0); }
  }

  .odoo-phone-widget--incoming .odoo-phone-widget__header {
    animation: incoming-pulse 1.5s ease-in-out infinite;
    background: linear-gradient(135deg, #28A745, #017E84);
  }

  /* Loading state */
  .odoo-phone-widget__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    height: 100%;
    min-height: 400px;
  }

  .odoo-phone-widget__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--odoo-border);
    border-top-color: var(--odoo-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error state */
  .odoo-phone-widget__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 20px;
    text-align: center;
    color: var(--odoo-danger);
  }

  .odoo-phone-widget__error-icon {
    width: 48px;
    height: 48px;
  }

  /* Settings Panel */
  .odoo-phone-widget__settings-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--odoo-surface);
    z-index: 100;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .odoo-phone-widget__settings-header {
    background: var(--odoo-gradient);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .odoo-phone-widget__settings-title {
    font-size: 18px;
    font-weight: 700;
  }

  .odoo-phone-widget__settings-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .odoo-phone-widget__settings-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .odoo-phone-widget__settings-body {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }

  .odoo-phone-widget__form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .odoo-phone-widget__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--odoo-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .odoo-phone-widget__settings-footer {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid var(--odoo-border);
  }

  .odoo-phone-widget__btn--secondary {
    background: var(--odoo-surface-elevated);
    color: var(--odoo-text);
    border: 1px solid var(--odoo-border);
  }

  .odoo-phone-widget__btn--secondary:hover {
    background: var(--odoo-primary-light);
  }

  .odoo-phone-widget__btn--primary {
    background: var(--odoo-primary);
    color: white;
  }

  .odoo-phone-widget__btn--primary:hover {
    background: var(--odoo-primary-light);
  }

  .odoo-phone-widget__toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--odoo-success);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    animation: toastIn 0.3s ease-out;
    z-index: 1000;
  }

  @keyframes toastIn {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  /* Not configured state */
  .odoo-phone-widget__not-configured {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 40px 20px;
    text-align: center;
    flex: 1;
  }

  .odoo-phone-widget__not-configured-icon {
    width: 64px;
    height: 64px;
    color: var(--odoo-text-muted);
  }

  .odoo-phone-widget__not-configured-text {
    color: var(--odoo-text-muted);
    font-size: 14px;
  }
`;

// ===== Component =====
const OdooPhoneWidget: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sipClient, setSipClient] = useState<CodexSipClient | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallEvent | null>(null);
  const [sipConfig, setSipConfig] = useState<SipConfig>(getSipConfig());
  const [editingConfig, setEditingConfig] = useState<SipConfig>(getSipConfig());
  const [toast, setToast] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [clientKey, setClientKey] = useState(0); // For forcing re-initialization

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const autostartedRef = useRef(false);
  const prevCallStateRef = useRef<CallState>('idle');

  // Parse URL parameters
  const params: OdooUrlParams = {
    phone: searchParams.get('phone'),
    name: searchParams.get('name'),
    partner_id: searchParams.get('partner_id'),
    lead_id: searchParams.get('lead_id'),
    user_id: searchParams.get('user_id'),
    callback_url: searchParams.get('callback_url'),
    model: searchParams.get('model'),
    source: searchParams.get('source'),
    embedded: searchParams.get('embedded') === 'true',
    autostart: searchParams.get('autostart') === 'true',
    lang: (searchParams.get('lang') as 'ru' | 'en') || 'ru',
  };

  const t = translations[params.lang];

  // Show toast message
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Initialize phone number from URL
  useEffect(() => {
    if (params.phone) {
      setPhoneNumber(params.phone);
    }
  }, [params.phone]);

  // Add embedded class to body
  useEffect(() => {
    if (params.embedded) {
      document.body.classList.add('odoo-widget-embedded');
    }
    return () => {
      document.body.classList.remove('odoo-widget-embedded');
    };
  }, [params.embedded]);

  // Inject styles
  useEffect(() => {
    const styleId = 'odoo-phone-widget-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = styles;
      document.head.appendChild(style);
    }
  }, []);

  // Send postMessage to parent window (Odoo)
  const postMessageToOdoo = useCallback((event: OdooCallEvent) => {
    if (window.parent !== window) {
      window.parent.postMessage(event, '*');
    }
    window.dispatchEvent(new CustomEvent('odoo-phone-event', { detail: event }));
    console.log('[OdooPhoneWidget] Event sent:', event);
  }, []);

  // Send webhook to callback URL
  const sendWebhook = useCallback(async (event: OdooCallEvent) => {
    if (!params.callback_url) return;

    try {
      await fetch(params.callback_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event.type,
          phone: event.phone,
          partner_id: params.partner_id ? parseInt(params.partner_id) : null,
          lead_id: params.lead_id ? parseInt(params.lead_id) : null,
          user_id: params.user_id ? parseInt(params.user_id) : null,
          duration: event.duration,
          status: event.status,
          recording_url: event.recording_url,
          timestamp: event.timestamp,
        }),
      });
      console.log('[OdooPhoneWidget] Webhook sent successfully');
    } catch (err) {
      console.error('[OdooPhoneWidget] Failed to send webhook:', err);
    }
  }, [params.callback_url, params.partner_id, params.lead_id, params.user_id]);

  // Initialize SIP client
  useEffect(() => {
    const config = sipConfig;

    if (!config.sipDomain || !config.serverAddress || !config.username || !config.password) {
      setError(null);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const client = createClient({
        JAMBONZ_SIP_DOMAIN: config.sipDomain,
        JAMBONZ_WSS_ADDRESS: config.serverAddress,
        JAMBONZ_SIP_USERNAME: config.username,
        JAMBONZ_SIP_PASSWORD: config.password,
        TARGET_SIP_URI: `sip:0397dc5f-2f8f-4778-8499-0af934dd1196@${config.sipDomain}`,
        TARGET_APPLICATION_NAME: 'voicebot',
        DEFAULT_LANG: params.lang,
        FALLBACK_LANG: params.lang === 'ru' ? 'en' : 'ru',
        STUN_URLS: 'stun:fs-tun.okta-solutions.com:3478',
        MAX_REGISTER_RETRIES: '3',
        INFINITE_RECONNECT: 'false',
      });

      setSipClient(client);
      setIsInitializing(false);
    } catch (err) {
      console.error('[OdooPhoneWidget] Init error:', err);
      setError('Failed to initialize phone widget');
      setIsInitializing(false);
    }

    // Cleanup on unmount or config change
    return () => {
      if (sipClient) {
        try {
          sipClient.destroy();
        } catch (e) {
          console.warn('[OdooPhoneWidget] Error destroying client:', e);
        }
      }
    };
  }, [sipConfig, clientKey, params.lang]);

  // Set up audio element and event listeners
  useEffect(() => {
    if (!sipClient) return;

    if (audioRef.current) {
      sipClient.setRemoteAudioElement(audioRef.current);
    }

    // Register SIP
    sipClient.register().catch((err) => {
      console.error('[OdooPhoneWidget] Registration failed:', err);
      // Don't set error for registration failures - allow retry
    });

    // Event handlers
    const onCallStateChange = (event: { state: CallState }) => {
      const prevState = prevCallStateRef.current;
      setCallState(event.state);
      prevCallStateRef.current = event.state;

      if (event.state === 'connected') {
        callStartTimeRef.current = new Date();
        setIsMuted(false);
        setCallDuration(0);
        setIncomingCall(null);

        // Ensure audio playback starts (handle autoplay policy)
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.warn('[OdooPhoneWidget] Audio autoplay blocked:', err);
          });
        }

        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

        const startEvent: OdooCallEvent = {
          type: 'call_started',
          phone: phoneNumber,
          partner_id: params.partner_id ? parseInt(params.partner_id) : null,
          lead_id: params.lead_id ? parseInt(params.lead_id) : null,
          user_id: params.user_id ? parseInt(params.user_id) : null,
          timestamp: new Date().toISOString(),
        };
        postMessageToOdoo(startEvent);
        sendWebhook(startEvent);
      }

      if (event.state === 'ended' || event.state === 'error') {
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }

        const duration = callStartTimeRef.current
          ? Math.round((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000)
          : callDuration;

        let status: 'completed' | 'missed' | 'failed' | 'busy' = 'completed';
        if (event.state === 'error') {
          status = 'failed';
        } else if (prevState === 'ringing' || prevState === 'incoming') {
          status = 'missed';
        }

        const endEvent: OdooCallEvent = {
          type: 'call_ended',
          phone: phoneNumber,
          partner_id: params.partner_id ? parseInt(params.partner_id) : null,
          lead_id: params.lead_id ? parseInt(params.lead_id) : null,
          user_id: params.user_id ? parseInt(params.user_id) : null,
          duration,
          status,
          timestamp: new Date().toISOString(),
        };
        postMessageToOdoo(endEvent);
        sendWebhook(endEvent);

        callStartTimeRef.current = null;
        setIncomingCall(null);
      }
    };

    const onIncomingCall = (event: IncomingCallEvent) => {
      setIncomingCall(event);
      setCallState('incoming');

      const incomingEvent: OdooCallEvent = {
        type: 'incoming_call',
        phone: event.from || '',
        timestamp: new Date().toISOString(),
      };
      postMessageToOdoo(incomingEvent);
    };

    sipClient.on('call', onCallStateChange);
    sipClient.on('incomingCall', onIncomingCall);

    return () => {
      sipClient.off('call', onCallStateChange);
      sipClient.off('incomingCall', onIncomingCall);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [sipClient, phoneNumber, params.partner_id, params.lead_id, params.user_id, postMessageToOdoo, sendWebhook, callDuration]);

  // Autostart call
  useEffect(() => {
    if (
      sipClient &&
      params.autostart &&
      params.phone &&
      !autostartedRef.current &&
      (callState === 'idle' || callState === 'ended')
    ) {
      autostartedRef.current = true;
      const timer = setTimeout(() => {
        handleCall();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sipClient, params.autostart, params.phone, callState]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get status label
  const getStatusLabel = (): string => {
    switch (callState) {
      case 'idle': return t.ready;
      case 'registering': return t.registering;
      case 'connecting': return t.connecting;
      case 'ringing': return t.ringing;
      case 'connected': return t.connected;
      case 'ended': return t.ended;
      case 'error': return t.error;
      case 'incoming': return t.incoming;
      default: return t.ready;
    }
  };

  // Get status class
  const getStatusClass = (): string => {
    if (callState === 'connecting' || callState === 'ringing' || callState === 'registering') {
      return 'odoo-phone-widget__status--connecting';
    }
    if (callState === 'connected') {
      return 'odoo-phone-widget__status--connected';
    }
    if (callState === 'error') {
      return 'odoo-phone-widget__status--error';
    }
    return '';
  };

  // Build customerData with Odoo parameters for Jambonz
  const buildCustomerData = useCallback((): CustomerData => {
    const odooFields: Record<string, unknown> = {};

    // Add all Odoo parameters as custom fields
    if (params.partner_id) odooFields.partner_id = parseInt(params.partner_id, 10);
    if (params.lead_id) odooFields.lead_id = parseInt(params.lead_id, 10);
    if (params.user_id) odooFields.user_id = parseInt(params.user_id, 10);
    if (params.model) odooFields.model = params.model;
    if (params.source) odooFields.source = params.source;
    if (params.name) odooFields.contact_name = params.name;
    if (phoneNumber) odooFields.phone = phoneNumber;

    return {
      callType: 'odoo-widget',
      clientName: params.name || undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      customFields: odooFields,
    };
  }, [params.partner_id, params.lead_id, params.user_id, params.model, params.source, params.name, phoneNumber]);

  // Handlers
  const handleCall = async () => {
    if (!sipClient || !phoneNumber) return;

    // Pre-warm audio element with user gesture to enable autoplay (non-blocking)
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.muted = true;
      audio.play()
        .then(() => {
          audio.pause();
          audio.muted = false;
          audio.currentTime = 0;
          console.log('[OdooPhoneWidget] Audio pre-warmed for autoplay');
        })
        .catch((e) => {
          console.warn('[OdooPhoneWidget] Audio pre-warm failed:', e);
          audio.muted = false;
        });
    }

    try {
      const customerData = buildCustomerData();
      console.log('[OdooPhoneWidget] Starting call with customerData:', customerData);
      await sipClient.startCall({ language: params.lang, customerData });
    } catch (err) {
      console.error('[OdooPhoneWidget] Call failed:', err);
    }
  };

  const handleHangup = async () => {
    if (!sipClient) return;
    await sipClient.hangup();
  };

  const handleMuteToggle = async () => {
    if (!sipClient) return;
    if (isMuted) {
      await sipClient.unmute();
    } else {
      await sipClient.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleKeyPress = async (digit: string) => {
    // Play DTMF tone sound
    playDtmfTone(digit);

    if (callState === 'connected') {
      // During call - send DTMF to remote
      if (sipClient) {
        await sipClient.sendDtmf(digit);
      }
    } else {
      // Not in call - add digit to phone number
      setPhoneNumber((prev) => prev + digit);
    }
  };

  const handleAcceptCall = async () => {
    if (!sipClient) return;
    try {
      await sipClient.acceptIncomingCall({ language: params.lang });
    } catch (err) {
      console.error('[OdooPhoneWidget] Accept call failed:', err);
    }
  };

  const handleRejectCall = async () => {
    if (!sipClient) return;
    try {
      await sipClient.rejectIncomingCall();
    } catch (err) {
      console.error('[OdooPhoneWidget] Reject call failed:', err);
    }
  };

  const handleSaveSettings = () => {
    saveSipConfig(editingConfig);
    setSipConfig(editingConfig);
    setShowSettings(false);
    showToast(t.configSaved);
    // Force re-initialization of client
    setClientKey((k) => k + 1);
  };

  const handleResetSettings = () => {
    setEditingConfig(DEFAULT_SIP_CONFIG);
  };

  const handleReconnect = () => {
    setClientKey((k) => k + 1);
  };

  const handleOpenSettings = () => {
    setEditingConfig(sipConfig);
    setShowSettings(true);
  };

  // Check states
  const isLive = callState === 'connected';
  const isBusy = callState === 'connecting' || callState === 'ringing';
  const isIncoming = callState === 'incoming';
  const canCall = callState === 'idle' || callState === 'ended' || callState === 'error';
  const isConfigured = sipConfig.sipDomain && sipConfig.serverAddress && sipConfig.username && sipConfig.password;

  // Loading state
  if (isInitializing) {
    return (
      <div className={`odoo-phone-widget ${params.embedded ? 'odoo-phone-widget--embedded' : 'odoo-phone-widget--standalone'}`}>
        <div className="odoo-phone-widget__loading">
          <div className="odoo-phone-widget__spinner" />
        </div>
        <audio ref={audioRef} hidden autoPlay playsInline />
      </div>
    );
  }

  return (
    <div
      className={`odoo-phone-widget ${params.embedded ? 'odoo-phone-widget--embedded' : 'odoo-phone-widget--standalone'} ${isIncoming ? 'odoo-phone-widget--incoming' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Settings Panel */}
      {showSettings && (
        <div className="odoo-phone-widget__settings-panel">
          <div className="odoo-phone-widget__settings-header">
            <span className="odoo-phone-widget__settings-title">{t.settingsTitle}</span>
            <button
              className="odoo-phone-widget__settings-close"
              onClick={() => setShowSettings(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="odoo-phone-widget__settings-body">
            <div className="odoo-phone-widget__form-group">
              <label className="odoo-phone-widget__label">{t.displayName}</label>
              <input
                type="text"
                className="odoo-phone-widget__input"
                value={editingConfig.displayName}
                onChange={(e) => setEditingConfig({ ...editingConfig, displayName: e.target.value })}
                placeholder="Odoo Operator"
              />
            </div>
            <div className="odoo-phone-widget__form-group">
              <label className="odoo-phone-widget__label">{t.sipDomain} *</label>
              <input
                type="text"
                className="odoo-phone-widget__input"
                value={editingConfig.sipDomain}
                onChange={(e) => setEditingConfig({ ...editingConfig, sipDomain: e.target.value })}
                placeholder="jambonzlab.ru"
              />
            </div>
            <div className="odoo-phone-widget__form-group">
              <label className="odoo-phone-widget__label">{t.serverAddress} *</label>
              <input
                type="text"
                className="odoo-phone-widget__input"
                value={editingConfig.serverAddress}
                onChange={(e) => setEditingConfig({ ...editingConfig, serverAddress: e.target.value })}
                placeholder="ws://jambonz-sipws.okta-solutions.com"
              />
            </div>
            <div className="odoo-phone-widget__form-group">
              <label className="odoo-phone-widget__label">{t.username} *</label>
              <input
                type="text"
                className="odoo-phone-widget__input"
                value={editingConfig.username}
                onChange={(e) => setEditingConfig({ ...editingConfig, username: e.target.value })}
                placeholder="170"
              />
            </div>
            <div className="odoo-phone-widget__form-group">
              <label className="odoo-phone-widget__label">{t.password} *</label>
              <input
                type="password"
                className="odoo-phone-widget__input"
                value={editingConfig.password}
                onChange={(e) => setEditingConfig({ ...editingConfig, password: e.target.value })}
                placeholder="********"
              />
            </div>
          </div>
          <div className="odoo-phone-widget__settings-footer">
            <button
              className="odoo-phone-widget__btn odoo-phone-widget__btn--secondary"
              onClick={handleResetSettings}
            >
              {t.reset}
            </button>
            <button
              className="odoo-phone-widget__btn odoo-phone-widget__btn--primary"
              onClick={handleSaveSettings}
            >
              {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="odoo-phone-widget__header">
        <div className="odoo-phone-widget__header-top">
          <div className="odoo-phone-widget__contact-name">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
            {params.name || (incomingCall?.from ? incomingCall.displayFrom : t.unknownContact)}
          </div>
          <button
            className="odoo-phone-widget__settings-btn"
            onClick={handleOpenSettings}
            title={t.settings}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
        <div className="odoo-phone-widget__phone-number">
          {phoneNumber ? formatPhoneNumber(phoneNumber) : (incomingCall?.from ? formatPhoneNumber(incomingCall.from) : t.enterPhone)}
        </div>
      </div>

      {/* Not configured state */}
      {!isConfigured && !showSettings && (
        <div className="odoo-phone-widget__not-configured">
          <svg className="odoo-phone-widget__not-configured-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <p className="odoo-phone-widget__not-configured-text">{t.notConfigured}</p>
          <button
            className="odoo-phone-widget__btn odoo-phone-widget__btn--primary"
            onClick={handleOpenSettings}
          >
            {t.settings}
          </button>
        </div>
      )}

      {/* Main content when configured */}
      {isConfigured && (
        <>
          {/* Status Bar */}
          <div className="odoo-phone-widget__status-bar">
            {isLive && (
              <div className="odoo-phone-widget__timer">
                {formatDuration(callDuration)}
              </div>
            )}

            {/* Audio Visualizer */}
            <div className={`odoo-phone-widget__visualizer ${isLive ? 'odoo-phone-widget__visualizer--active' : ''}`}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="odoo-phone-widget__visualizer-bar"
                  style={{ height: isLive ? undefined : '8px' }}
                />
              ))}
            </div>

            <div className={`odoo-phone-widget__status ${getStatusClass()}`}>
              {getStatusLabel()}
            </div>
          </div>

          {/* Body */}
          <div className="odoo-phone-widget__body">
            {/* Phone Input (only when not in call) */}
            {canCall && !isIncoming && (
              <div className="odoo-phone-widget__input-container">
                <input
                  type="tel"
                  className="odoo-phone-widget__input"
                  placeholder={t.enterPhone}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            )}

            {/* DTMF Keypad */}
            {(showKeypad || (canCall && !isIncoming)) && (
              <div className="odoo-phone-widget__keypad">
                {dtmfKeys.map(({ digit, letters }) => (
                  <button
                    key={digit}
                    className="odoo-phone-widget__key"
                    onClick={() => handleKeyPress(digit)}
                  >
                    <span className="odoo-phone-widget__key-digit">{digit}</span>
                    {letters && <span className="odoo-phone-widget__key-letters">{letters}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Control Buttons (during call) */}
            {(isLive || isBusy) && (
              <div className="odoo-phone-widget__controls">
                <button
                  className={`odoo-phone-widget__btn odoo-phone-widget__btn--mute ${isMuted ? 'active' : ''}`}
                  onClick={handleMuteToggle}
                  disabled={!isLive}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {isMuted ? (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    ) : (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    )}
                  </svg>
                  {isMuted ? t.unmute : t.mute}
                </button>

                <button
                  className={`odoo-phone-widget__btn odoo-phone-widget__btn--keypad ${showKeypad ? 'active' : ''}`}
                  onClick={() => setShowKeypad(!showKeypad)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 19c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12-8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                  {t.keypad}
                </button>
              </div>
            )}

            {/* Error with reconnect button */}
            {error && (
              <div className="odoo-phone-widget__error">
                <svg className="odoo-phone-widget__error-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <p>{error}</p>
                <button
                  className="odoo-phone-widget__btn odoo-phone-widget__btn--secondary"
                  onClick={handleReconnect}
                >
                  {t.reconnect}
                </button>
              </div>
            )}
          </div>

          {/* Main Action */}
          <div className="odoo-phone-widget__main-action">
            {/* Incoming call controls */}
            {isIncoming && (
              <div className="odoo-phone-widget__incoming-controls">
                <button
                  className="odoo-phone-widget__btn odoo-phone-widget__btn--accept"
                  onClick={handleAcceptCall}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                  </svg>
                  {t.accept}
                </button>
                <button
                  className="odoo-phone-widget__btn odoo-phone-widget__btn--reject"
                  onClick={handleRejectCall}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                  {t.reject}
                </button>
              </div>
            )}

            {/* Call button */}
            {canCall && !isIncoming && !error && (
              <button
                className="odoo-phone-widget__btn odoo-phone-widget__btn--call"
                onClick={handleCall}
                disabled={!phoneNumber || !sipClient}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
                {t.call}
              </button>
            )}

            {/* Hangup button */}
            {(isLive || isBusy) && (
              <button
                className="odoo-phone-widget__btn odoo-phone-widget__btn--hangup"
                onClick={handleHangup}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
                {t.hangup}
              </button>
            )}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="odoo-phone-widget__toast">
          {toast}
        </div>
      )}

      <audio ref={audioRef} hidden autoPlay playsInline />
    </div>
  );
};

export default OdooPhoneWidget;
