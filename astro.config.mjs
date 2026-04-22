import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const site =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  'http://localhost:4321';

export default defineConfig({
  output: 'server',
  adapter: isVercel
    ? vercel()
    : node({
      mode: 'standalone'
    }),
  integrations: [auth()],
  trailingSlash: 'ignore',
  srcDir: 'src',
  site,
  markdown: {
    syntaxHighlight: 'shiki'
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
});
