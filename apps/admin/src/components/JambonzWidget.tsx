import { useEffect, useMemo, useState } from 'react';
import { FloatingVoiceWidget } from '@codex/web-widget';
import { createClient } from '@codex/web-widget';
import type { CodexSipClient } from '@codex/core-sip';
import { getSipConfig } from './SipSettingsDialog';

interface JambonzWidgetProps {
  embedded?: boolean;
}

export const JambonzWidget: React.FC<JambonzWidgetProps> = ({ embedded = false }) => {
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
        TARGET_SIP_URI: `sip:0397dc5f-2f8f-4778-8499-0af934dd1196@${config.sipDomain}`,
        TARGET_APPLICATION_NAME: 'voicebot',
        DEFAULT_LANG: 'ru',
        FALLBACK_LANG: 'en',
        STUN_URLS: 'stun:fs-tun.okta-solutions.com:3478',
        MAX_REGISTER_RETRIES: '5',
      });

      setSipClient(client);
      setError(null);
    } catch (err) {
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

  // Handle visibility change - reconnect when tab becomes visible
  useEffect(() => {
    if (!sipClient) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[JambonzWidget] Tab became visible, checking connection...');
        // Check and reconnect if needed after tab becomes visible
        sipClient.checkConnection().catch((error) => {
          console.error('[JambonzWidget] Failed to check connection:', error);
        });
      } else {
        console.log('[JambonzWidget] Tab became hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sipClient]);

  // Don't render if there's an error or no client
  if (error) {
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
      position={embedded ? undefined : "bottom-left"}
      autoRegister={true}
      embedded={embedded}
      languages={[
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
      ]}
    />
  );
};
