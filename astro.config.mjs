import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

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
  site: 'https://aI-dev-innovators.github.io',
  markdown: {
    syntaxHighlight: 'shiki'
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
});
