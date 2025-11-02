import { useEffect, useMemo, useState } from 'react';
import { FloatingVoiceWidget } from '@codex/web-widget';
import { createClient } from '@codex/web-widget';
import type { CodexSipClient } from '@codex/core-sip';
import { getSipConfig } from './SipSettingsDialog';

export const JambonzWidget = () => {
  const [sipClient, setSipClient] = useState<CodexSipClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize SIP client
  useEffect(() => {
    try {
      const config = getSipConfig();

      // Validate required fields
      if (!config.sipDomain || !config.serverAddress || !config.username || !config.password) {
        setError('SIP configuration is incomplete. Please configure in settings.');
        return;
      }

      const client = createClient({
        JAMBONZ_SIP_DOMAIN: config.sipDomain,
        JAMBONZ_WSS_ADDRESS: config.serverAddress,
        JAMBONZ_SIP_USERNAME: config.username,
        JAMBONZ_SIP_PASSWORD: config.password,
        TARGET_SIP_URI: `sip:voicebot@${config.sipDomain}`,
        DEFAULT_LANG: 'ru',
        FALLBACK_LANG: 'en',
        STUN_URLS: 'stun:stun.l.google.com:19302',
        MAX_REGISTER_RETRIES: '5',
      });

      setSipClient(client);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize SIP client:', err);
      setError('Failed to initialize voice widget');
    }
  }, []);

  // Listen for config updates
  useEffect(() => {
    const handleConfigUpdate = () => {
      // Reload page to reinitialize client with new config
      window.location.reload();
    };

    window.addEventListener('sip-config-updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('sip-config-updated', handleConfigUpdate);
    };
  }, []);

  // Don't render if there's an error or no client
  if (error) {
    console.warn('Jambonz widget:', error);
    return null;
  }

  if (!sipClient) {
    return null;
  }

  return (
    <FloatingVoiceWidget
      client={sipClient}
      theme="dark"
      locale="ru"
      position="bottom-right"
      autoRegister={true}
      languages={[
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
      ]}
    />
  );
};
