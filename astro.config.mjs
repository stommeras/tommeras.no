import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://tommeras.no',
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Cascadia Code',
      cssVariable: '--font-mono',
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
});
