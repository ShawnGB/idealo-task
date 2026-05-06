/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Declare VITE_* variables here as the app grows:
  // readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
