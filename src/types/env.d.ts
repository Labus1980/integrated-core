/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Keycloak/OAuth Configuration
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_KEYCLOAK_CLIENT_SECRET: string;
  
  // Service URLs
  readonly VITE_N8N_URL: string;
  readonly VITE_GRAFANA_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_PROMETHEUS_URL: string;
  readonly VITE_FLOWISE_URL: string;
  readonly VITE_WEBUI_URL: string;
  readonly VITE_WAHA_URL: string;
  
  // General Settings
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEFAULT_DEV_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}