import { defineConfig } from 'astro/config';

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (deploymentHost ? `https://${deploymentHost}` : undefined);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  server: { port: 4321 },
  vite: { build: { chunkSizeWarningLimit: 1600 } },
});
