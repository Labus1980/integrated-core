/**
 * Environment variables utility for safe access to configuration
 */

// Helper function to get environment variable with validation
function getEnvVar(key: keyof ImportMetaEnv, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value;
}

// Helper function to get boolean environment variable
function getBooleanEnvVar(key: keyof ImportMetaEnv, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Keycloak/OAuth Configuration
export const keycloakConfig = {
  url: getEnvVar('VITE_KEYCLOAK_URL'),
  realm: getEnvVar('VITE_KEYCLOAK_REALM'),
  clientId: getEnvVar('VITE_KEYCLOAK_CLIENT_ID'),
  clientSecret: getEnvVar('VITE_KEYCLOAK_CLIENT_SECRET'),
} as const;

// Service URLs
export const serviceUrls = {
  n8n: getEnvVar('VITE_N8N_URL'),
  grafana: getEnvVar('VITE_GRAFANA_URL'),
  supabase: getEnvVar('VITE_SUPABASE_URL'),
  prometheus: getEnvVar('VITE_PROMETHEUS_URL'),
  flowise: getEnvVar('VITE_FLOWISE_URL'),
  webui: getEnvVar('VITE_WEBUI_URL'),
  nextcloud: getEnvVar('VITE_NEXTCLOUD_URL'),
  waha: getEnvVar('VITE_WAHA_URL', 'https://wa.okta-solutions.com/dashboard'),
  matrix: getEnvVar('VITE_MATRIX_URL'),
  keycloakAdmin: getEnvVar('VITE_KEYCLOAK_ADMIN_URL'),
  qdrant: getEnvVar('VITE_QDRANT_URL'),
  bolt: getEnvVar('VITE_BOLT_URL'),
} as const;

// Service Versions
export const serviceVersions = {
  n8n: getEnvVar('VITE_N8N_VERSION', '1.0.5'),
  grafana: getEnvVar('VITE_GRAFANA_VERSION', '10.2.0'),
  supabase: getEnvVar('VITE_SUPABASE_VERSION', '2.39.0'),
  prometheus: getEnvVar('VITE_PROMETHEUS_VERSION', '2.47.0'),
  flowise: getEnvVar('VITE_FLOWISE_VERSION', '1.4.3'),
  webui: getEnvVar('VITE_WEBUI_VERSION', ''),
  nextcloud: getEnvVar('VITE_NEXTCLOUD_VERSION', ''),
  waha: getEnvVar('VITE_WAHA_VERSION', '1.0.0'),
  matrix: getEnvVar('VITE_MATRIX_VERSION', ''),
  keycloakAdmin: getEnvVar('VITE_KEYCLOAK_VERSION', '23.0.0'),
  qdrant: getEnvVar('VITE_QDRANT_VERSION', '1.7.0'),
  bolt: getEnvVar('VITE_BOLT_VERSION', '1.0.0'),
} as const;

// General Settings
export const appConfig = {
  title: getEnvVar('VITE_APP_TITLE', 'Корпоративные Сервисы'),
  defaultDevMode: getBooleanEnvVar('VITE_DEFAULT_DEV_MODE', true),
} as const;

// Export all configs
export const env = {
  keycloak: keycloakConfig,
  services: serviceUrls,
  versions: serviceVersions,
  app: appConfig,
} as const;
