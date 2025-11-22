/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
  readonly VITE_CLIENT_PLATFORM?: string;
  readonly VITE_CLIENT_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Runtime configuration injected by backend
interface Window {
  APP_CONFIG?: {
    API_KEY?: string;
  };
}
