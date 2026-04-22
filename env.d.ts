/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ALLOWED_EMAIL_DOMAINS?: string;
  readonly AUTH_SECRET?: string;
  readonly AUTH_TRUST_HOST?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
