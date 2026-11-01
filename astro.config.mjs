import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://tommeras.no',
  // Hashes every inline script and style into a CSP <meta>. vercel.json sends the directives a <meta> can't carry
  security: {
    csp: { directives: ["default-src 'self'"] },
  },
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
