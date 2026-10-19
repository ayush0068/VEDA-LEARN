/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_INTRO_VIDEO_URL?: string;
  readonly VITE_SHOW_API_STATUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
