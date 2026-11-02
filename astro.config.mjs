import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
const site = process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || 'https://fatimatourandtravels.com';
if (new URL(site).origin !== 'https://fatimatourandtravels.com') {
  throw new Error('PUBLIC_SITE_URL must use the confirmed https://fatimatourandtravels.com origin.');
}

export default defineConfig({
  site: 'https://fatimatourandtravels.com',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
