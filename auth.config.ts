import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';

const authDebugEnabled =
  (import.meta.env.AUTH_DEBUG_LOGS || process.env.AUTH_DEBUG_LOGS || '').toLowerCase() === 'true';

function authDebugLog(message: string, meta?: Record<string, unknown>): void {
  if (!authDebugEnabled) return;
  if (meta) {
    console.log(`[auth-debug] ${message}`, meta);
    return;
  }
  console.log(`[auth-debug] ${message}`);
}

const inferredAuthUrl =
  import.meta.env.AUTH_URL ||
  import.meta.env.NEXTAUTH_URL ||
  (import.meta.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${import.meta.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (import.meta.env.VERCEL_URL ? `https://${import.meta.env.VERCEL_URL}` : undefined);

// auth-astro/@auth/core puede resolver localhost en algunos runtimes serverless
// si no tiene una URL canonica explicita.
if (inferredAuthUrl) {
  process.env.AUTH_URL ??= inferredAuthUrl;
  process.env.NEXTAUTH_URL ??= inferredAuthUrl;
}

authDebugLog('Resolved auth runtime URLs', {
  inferredAuthUrl: inferredAuthUrl || null,
  authUrl: process.env.AUTH_URL || null,
  nextAuthUrl: process.env.NEXTAUTH_URL || null,
  hasAuthSecret: Boolean(import.meta.env.AUTH_SECRET),
  trustHost: true
});

const allowedDomains = (import.meta.env.ALLOWED_EMAIL_DOMAINS || 'example.dominio.pe,dominio.pe')
  .split(',')
  .map((domain: string) => domain.trim().toLowerCase().replace(/^@/, ''))
  .filter(Boolean);

function isAllowedDomain(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

export default defineConfig({
  secret: import.meta.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID || '',
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET || ''
    })
  ],
  callbacks: {
    async signIn({ user, profile }) {
      const emailFromUser = user?.email;
      const emailFromProfile = (profile as { email?: string | null } | undefined)?.email;
      const email = emailFromUser || emailFromProfile || null;
      const userDomain = email?.split('@')[1]?.toLowerCase() || null;
      const allowed = isAllowedDomain(email);

      authDebugLog('signIn callback evaluated domain', {
        email: email || null,
        domain: userDomain,
        allowed,
        allowedDomains
      });

      if (isAllowedDomain(email)) {
        return true;
      }

      // Evita la pantalla generica de /api/auth/error y vuelve al login propio.
      return '/login/?error=AccessDenied';
    }
  },
  pages: {
    signIn: '/login/',
    error: '/login/'
  }
});
