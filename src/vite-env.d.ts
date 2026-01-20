/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ALLOW_PURCHASE: string
  readonly VITE_ADMIN_IDS: string
  readonly VITE_SOL_NETWORK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
