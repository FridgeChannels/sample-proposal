/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string
  readonly VITE_POSTHOG_HOST?: string
  readonly VITE_POSTHOG_SESSION_REPLAY?: string
  readonly VITE_LEGAL_DOCS_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __FC_LEGAL_DOCS_BASE_URL__?: string
}
