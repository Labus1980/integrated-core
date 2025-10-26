/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Service URLs
  readonly VITE_N8N_URL: string;
  readonly VITE_GRAFANA_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_PROMETHEUS_URL: string;
  readonly VITE_FLOWISE_URL: string;
  readonly VITE_ANYTHING_LLM_URL: string;
  readonly VITE_WEBUI_URL: string;
  readonly VITE_NEXTCLOUD_URL: string;
  readonly VITE_WAHA_URL: string;
  readonly VITE_ZAMMAD_URL: string;
  readonly VITE_MATRIX_URL: string;
  readonly VITE_MAUBOT_URL: string;
  readonly VITE_BASEROW_URL: string;
  readonly VITE_KEYCLOAK_ADMIN_URL: string;
  readonly VITE_QDRANT_URL: string;
  readonly VITE_JAMBONZ_URL: string;
  readonly VITE_BOLT_URL: string;

  // General Settings
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEFAULT_DEV_MODE: string;

  // Service Versions
  readonly VITE_N8N_VERSION: string;
  readonly VITE_GRAFANA_VERSION: string;
  readonly VITE_SUPABASE_VERSION: string;
  readonly VITE_PROMETHEUS_VERSION: string;
  readonly VITE_FLOWISE_VERSION: string;
  readonly VITE_ANYTHING_LLM_VERSION: string;
  readonly VITE_WEBUI_VERSION: string;
  readonly VITE_NEXTCLOUD_VERSION: string;
  readonly VITE_WAHA_VERSION: string;
  readonly VITE_ZAMMAD_VERSION: string;
  readonly VITE_MATRIX_VERSION: string;
  readonly VITE_MAUBOT_VERSION: string;
  readonly VITE_BASEROW_VERSION: string;
  readonly VITE_KEYCLOAK_VERSION: string;
  readonly VITE_QDRANT_VERSION: string;
  readonly VITE_JAMBONZ_VERSION: string;
  readonly VITE_BOLT_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
