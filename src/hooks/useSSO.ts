import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { env } from '@/lib/env';

export interface SSOConfig {
  id: string;
  method: 'oauth2' | 'token_url' | 'header' | 'post';
  tokenParam?: string;
  authEndpoint?: string;
  requiresProxy?: boolean;
}

const SSO_CONFIGS: Record<string, SSOConfig> = {
  'n8n': {
    id: 'n8n',
    method: 'oauth2',
    requiresProxy: false, // Direct OAuth2 with Keycloak
    authEndpoint: '/oauth/login/keycloak'
  },
  'grafana': {
    id: 'grafana',
    method: 'oauth2',
    requiresProxy: false, // Direct OAuth2 with Keycloak
    authEndpoint: '/login/generic_oauth'
  },
  'supabase': {
    id: 'supabase',
    method: 'token_url',
    tokenParam: 'access_token',
    requiresProxy: false
  },
  'prometheus': {
    id: 'prometheus',
    method: 'token_url',
    tokenParam: 'access_token', // Try token in URL first
    requiresProxy: false
  },
  'flowise': {
    id: 'flowise',
    method: 'oauth2',
    requiresProxy: false, // Direct OAuth2 with Keycloak
    authEndpoint: '/api/v1/oauth/keycloak'
  },
  'webui': {
    id: 'webui',
    method: 'token_url',
    tokenParam: 'token',
    requiresProxy: false
  },
  'keycloak-admin': {
    id: 'keycloak-admin',
    method: 'oauth2',
    requiresProxy: false // Same Keycloak instance - shared session
  },
  'qdrant': {
    id: 'qdrant',
    method: 'token_url',
    tokenParam: 'api-key', // Try API key approach
    requiresProxy: false
  }
};

export const useSSO = () => {
  const { isAuthenticated, devMode } = useAuth();

  const getAccessToken = (): string | null => {
    if (devMode) {
      return 'dev-mock-token';
    }
    return localStorage.getItem('access_token');
  };

  const refreshToken = async (): Promise<string | null> => {
    if (devMode) {
      return 'dev-mock-token';
    }

    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
      return null;
    }

    try {
      const response = await fetch(`${env.keycloak.url}/realms/${env.keycloak.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: env.keycloak.clientId,
          refresh_token: refreshTokenValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenData = await response.json();
      
      // Update stored tokens
      localStorage.setItem('access_token', tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem('refresh_token', tokenData.refresh_token);
      }

      return tokenData.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  };

  const openServiceWithSSO = async (serviceId: string, serviceUrl: string): Promise<void> => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Пожалуйста, войдите в систему для доступа к сервисам',
        variant: 'destructive'
      });
      return;
    }

    const ssoConfig = SSO_CONFIGS[serviceId];
    if (!ssoConfig) {
      // Fallback: open service without SSO
      window.open(serviceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    let token = getAccessToken();
    if (!token) {
      token = await refreshToken();
      if (!token) {
        toast({
          title: 'Ошибка авторизации',
          description: 'Не удалось получить токен доступа',
          variant: 'destructive'
        });
        return;
      }
    }

    try {
      let finalUrl = serviceUrl;

      switch (ssoConfig.method) {
        case 'token_url':
          const separator = serviceUrl.includes('?') ? '&' : '?';
          finalUrl = `${serviceUrl}${separator}${ssoConfig.tokenParam}=${token}`;
          break;

        case 'oauth2':
          if (serviceId === 'keycloak-admin') {
            // Same Keycloak instance - shared session should work
            finalUrl = serviceUrl;
          } else if (ssoConfig.authEndpoint) {
            // Redirect to service's OAuth endpoint configured for Keycloak
            const separator = serviceUrl.includes('?') ? '&' : '?';
            finalUrl = `${serviceUrl}${ssoConfig.authEndpoint}${separator}token=${token}`;
          } else {
            // Direct service access
            finalUrl = serviceUrl;
          }
          break;

        default:
          finalUrl = serviceUrl;
      }

      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: 'Сервис открыт',
        description: `${serviceId} открыт с автоматической авторизацией`,
      });

    } catch (error) {
      console.error('SSO failed:', error);
      toast({
        title: 'Ошибка SSO',
        description: 'Не удалось открыть сервис с автоматической авторизацией. Попробуйте ручной вход.',
        variant: 'destructive'
      });
      
      // Fallback: open service without SSO
      window.open(serviceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return {
    openServiceWithSSO,
    getAccessToken,
    isAuthenticated,
    ssoConfigs: SSO_CONFIGS
  };
};