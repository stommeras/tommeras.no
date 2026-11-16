// Retakes public/social-card.png, the preview image that og:image points to, from the live home page. Run it by
// hand with `bun run social-card` after the home page's look changes, and look over the image before committing it.
// The script runs under Node, because Playwright hangs launching Chromium under Bun on Windows.
import { chromium } from 'playwright';

const browser = await chromium.launch();
// 1200×630 is the size LinkedIn, Slack and X crop link previews to. Reduced motion shows the commands already typed.
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  // The site's CSP would block the style below
  bypassCSP: true,
});
await page.goto('https://tommeras.no', { waitUntil: 'networkidle' });
// Keeps only ./hei.sh and the hero, and centers the window, so it ends inside the image instead of at the fold.
// !important beats Astro's scoped styles, which are more specific.
await page.addStyleTag({
  content: `
    main > section, .prompt-end, vercel-analytics { display: none !important; }
    main { padding-bottom: 0 !important; }
    body { display: grid; place-items: center; min-height: 100vh; }
    .window { margin: 0 !important; }
  `,
});
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/social-card.png' });
await browser.close();
