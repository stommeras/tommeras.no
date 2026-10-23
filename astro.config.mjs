import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://tommeras.no',
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      weights: [400, 700, 800],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
});
