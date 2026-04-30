import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thomast1906.github.io',
  base: '/github-copilot-agent-skills',
  output: 'static',
  integrations: [sitemap()],
});
