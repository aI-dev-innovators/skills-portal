import 'dotenv/config';
import { betterAuth } from 'better-auth';

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
  .filter(Boolean);

const runtimeFallbackUrl =
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  'http://localhost:4321';

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  runtimeFallbackUrl;

export function isAllowedEmailDomain(email?: string | null): boolean {
  if (!email) return false;
  if (allowedDomains.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

export const auth = betterAuth({
  appName: 'Skills Portal',
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  baseURL,
  trustedOrigins: [
    'http://localhost:*',
    'https://localhost:*',
    'http://127.0.0.1:*',
    'https://127.0.0.1:*',
    'https://*.vercel.app'
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
      refreshCache: {
        updateAge: 60 * 60 * 24
      }
    }
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || ''
    }
  },
  telemetry: {
    enabled: false
  }
});
