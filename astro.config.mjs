import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
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
