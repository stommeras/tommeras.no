import { createHash } from 'node:crypto';
import { globSync, readFileSync } from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';

// Astro hashes its own scripts for the CSP but not is:inline ones, which stay inline so they run before first paint.
// Astro writes LF, so a CRLF checkout (git's autocrlf on Windows) is normalized first, or every local build blocks them
const inlineScriptHashes = globSync('src/**/*.astro').flatMap((file) =>
  [...readFileSync(file, 'utf8').replaceAll('\r\n', '\n').matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map(
    ([, code]) => `sha256-${createHash('sha256').update(code).digest('base64')}`,
  ),
);

export default defineConfig({
  site: 'https://tommeras.no',
  // Hashes every inline script and style into a CSP <meta>. vercel.json sends the directives a <meta> can't carry
  security: {
    csp: {
      directives: ["default-src 'self'"],
      scriptDirective: { hashes: inlineScriptHashes },
    },
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
