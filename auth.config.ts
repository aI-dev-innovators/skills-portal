import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';

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
