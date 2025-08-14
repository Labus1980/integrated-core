import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
    requiresProxy: true,
    authEndpoint: '/oauth/callback'
  },
  'grafana': {
    id: 'grafana',
    method: 'oauth2',
    requiresProxy: true,
    authEndpoint: '/login/oauth/keycloak'
  },
  'supabase': {
    id: 'supabase',
    method: 'token_url',
    tokenParam: 'access_token',
    requiresProxy: false
  },
  'prometheus': {
    id: 'prometheus',
    method: 'header',
    requiresProxy: true
  },
  'flowise': {
    id: 'flowise',
    method: 'oauth2',
    requiresProxy: true,
    authEndpoint: '/api/v1/oauth/callback'
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
    requiresProxy: false
  },
  'qdrant': {
    id: 'qdrant',
    method: 'header',
    requiresProxy: true
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
      // Implement token refresh logic here
      // This would typically call Keycloak's token endpoint
      return refreshTokenValue;
    } catch (error) {
      console.error('Token refresh failed:', error);
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
          if (ssoConfig.requiresProxy) {
            // Use our proxy service to handle OAuth2 flow
            finalUrl = `/api/sso-proxy/${serviceId}?token=${token}&redirect=${encodeURIComponent(serviceUrl)}`;
          } else {
            // Direct OAuth2 - let service handle the flow
            finalUrl = serviceUrl;
          }
          break;

        case 'post':
          // For POST method, we'll need to use a form or proxy
          finalUrl = `/api/sso-proxy/${serviceId}?method=post&token=${token}&redirect=${encodeURIComponent(serviceUrl)}`;
          break;

        case 'header':
          // For header method, we'll use proxy to inject auth header
          finalUrl = `/api/sso-proxy/${serviceId}?method=header&token=${token}&redirect=${encodeURIComponent(serviceUrl)}`;
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