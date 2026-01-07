interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    API_KEY?: string;
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;
    [key: string]: string | undefined;
  }
}
