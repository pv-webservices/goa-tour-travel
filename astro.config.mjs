import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || undefined,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
