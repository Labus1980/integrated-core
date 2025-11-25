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

// Service URLs
export const serviceUrls = {
  n8n: getEnvVar('VITE_N8N_URL', 'https://n8n.okta-solutions.com'),
  grafana: getEnvVar('VITE_GRAFANA_URL', 'https://grafana.okta-solutions.com'),
  supabase: getEnvVar('VITE_SUPABASE_URL', 'https://supabase.okta-solutions.com'),
  prometheus: getEnvVar('VITE_PROMETHEUS_URL', 'https://prometheus.okta-solutions.com'),
  flowise: getEnvVar('VITE_FLOWISE_URL', 'https://flowise.okta-solutions.com'),
  anythingLlm: getEnvVar('VITE_ANYTHING_LLM_URL', 'https://anything-llm.okta-solutions.com/'),
  webui: getEnvVar('VITE_WEBUI_URL', 'https://webui.okta-solutions.com'),
  nextcloud: getEnvVar('VITE_NEXTCLOUD_URL', 'https://nextcloud.okta-solutions.com'),
  waha: getEnvVar('VITE_WAHA_URL', 'https://wa.okta-solutions.com/dashboard'),
  zammad: getEnvVar('VITE_ZAMMAD_URL', 'https://zammad.okta-solutions.com/'),
  matrix: getEnvVar('VITE_MATRIX_URL', 'https://matrix.okta-solutions.com'),
  maubot: getEnvVar('VITE_MAUBOT_URL', 'https://maubot.okta-solutions.com/_matrix/maubot/#/'),
  keycloakAdmin: getEnvVar('VITE_KEYCLOAK_ADMIN_URL', 'https://keycloak.okta-solutions.com'),
  qdrant: getEnvVar('VITE_QDRANT_URL', 'https://qdrant.okta-solutions.com'),
  baserow: getEnvVar('VITE_BASEROW_URL', 'https://baserow.okta-solutions.com'),
  jambonz: getEnvVar('VITE_JAMBONZ_URL', 'https://jambonz-portal.okta-solutions.com/'),
  snipeIt: getEnvVar('VITE_SNIPEIT_URL', 'https://snipeit.okta-solutions.com/'),
  bolt: getEnvVar('VITE_BOLT_URL', 'https://bolt.okta-solutions.com'),
  odoo: getEnvVar('VITE_ODOO_URL', 'https://odoo.okta-solutions.com'),
} as const;

// Service Versions
export const serviceVersions = {
  n8n: getEnvVar('VITE_N8N_VERSION', '1.0.5'),
  grafana: getEnvVar('VITE_GRAFANA_VERSION', '10.2.0'),
  supabase: getEnvVar('VITE_SUPABASE_VERSION', '2.39.0'),
  prometheus: getEnvVar('VITE_PROMETHEUS_VERSION', '2.47.0'),
  flowise: getEnvVar('VITE_FLOWISE_VERSION', '1.4.3'),
  anythingLlm: getEnvVar('VITE_ANYTHING_LLM_VERSION', '1.0.0'),
  webui: getEnvVar('VITE_WEBUI_VERSION', ''),
  nextcloud: getEnvVar('VITE_NEXTCLOUD_VERSION', ''),
  waha: getEnvVar('VITE_WAHA_VERSION', '1.0.0'),
  zammad: getEnvVar('VITE_ZAMMAD_VERSION', '1.0.0'),
  matrix: getEnvVar('VITE_MATRIX_VERSION', ''),
  maubot: getEnvVar('VITE_MAUBOT_VERSION', '1.0.0'),
  keycloakAdmin: getEnvVar('VITE_KEYCLOAK_VERSION', '23.0.0'),
  qdrant: getEnvVar('VITE_QDRANT_VERSION', '1.7.0'),
  baserow: getEnvVar('VITE_BASEROW_VERSION', '1.0.0'),
  jambonz: getEnvVar('VITE_JAMBONZ_VERSION', '1.0.0'),
  snipeIt: getEnvVar('VITE_SNIPEIT_VERSION', '1.0.0'),
  bolt: getEnvVar('VITE_BOLT_VERSION', '1.0.0'),
  odoo: getEnvVar('VITE_ODOO_VERSION', '17.0'),
} as const;

// General Settings
export const appConfig = {
  title: getEnvVar('VITE_APP_TITLE', 'Корпоративные Сервисы'),
  defaultDevMode: getBooleanEnvVar('VITE_DEFAULT_DEV_MODE', true),
} as const;

// Export all configs
export const env = {
  services: serviceUrls,
  versions: serviceVersions,
  app: appConfig,
} as const;
