import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import auth from 'auth-astro';

export default defineConfig({
  output: 'server',
  adapter: node({
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
