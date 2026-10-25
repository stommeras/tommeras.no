// Retakes the project screenshots in public/prosjekter/ from the public demos. Run it by hand with
// `bun run screenshots` after a demo's UI changes, and look over the new images before committing them.
import { chromium, type Page } from 'playwright';

// The sizes the project pages expect: phone shots are 780×1688 and desktop shots 1920×1200
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };
const desktop = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 };

// Each demo is shot in the color scheme its images on the site already use
const proof = { url: 'https://demo.proof.tommeras.no', colorScheme: 'dark' } as const;
const rabra = { url: 'https://demo.rabra.tommeras.no', colorScheme: 'light' } as const;

interface Shot {
  file: string;
  demo: typeof proof | typeof rabra;
  path: string;
  device: typeof phone;
  // Clicks and scrolling that bring the page to the state the image shows
  setup?: (page: Page) => Promise<void>;
}

// The recipe and tree shots start at the back link, below the demo banner and navigation. Instant, so a
// smooth-scroll setting in the demo can't leave the shot halfway down.
const scrollToMain = (page: Page) =>
  page.locator('main').evaluate((main) => main.scrollIntoView({ behavior: 'instant' }));

const espressoMartini = '/cocktails/df8e8718-ea6b-48bb-8910-9aaeb0df8689';

const shots: Shot[] = [
  {
    file: 'proof-liste.jpg',
    demo: proof,
    path: '/cocktails',
    device: phone,
    // The "Try this" box isn't in the image. Skipped when the demo no longer shows it, so the run goes on.
    setup: async (page) => {
      const dismiss = page.getByRole('button', { name: 'Dismiss' });
      if (await dismiss.isVisible()) await dismiss.click();
    },
  },
  { file: 'proof-oppskrift.jpg', demo: proof, path: espressoMartini, device: phone, setup: scrollToMain },
  {
    file: 'proof-tre.jpg',
    demo: proof,
    path: `${espressoMartini}/tree`,
    device: phone,
    setup: async (page) => {
      await page.locator('button[aria-pressed]', { hasText: '3a' }).click();
      await scrollToMain(page);
    },
  },
  { file: 'rabra-feed.jpg', demo: rabra, path: '/', device: phone },
  { file: 'rabra-send-inn.jpg', demo: rabra, path: '/send-inn', device: phone },
  { file: 'rabra-admin.jpg', demo: rabra, path: '/admin', device: phone },
  { file: 'rabra-feed-desktop.jpg', demo: rabra, path: '/', device: desktop },
  { file: 'rabra-admin-desktop.jpg', demo: rabra, path: '/admin', device: desktop },
];

const browser = await chromium.launch();
for (const shot of shots) {
  // A fresh context per shot, so state one demo keeps in the tab doesn't leak into the next shot
  const context = await browser.newContext({ ...shot.device, colorScheme: shot.demo.colorScheme });
  const page = await context.newPage();
  await page.goto(shot.demo.url + shot.path, { waitUntil: 'networkidle' });
  await shot.setup?.(page);
  // Waits out transitions so a shot doesn't catch one halfway, like the tree's version boxes fading. Endless
  // and paused animations are skipped because they never finish.
  await page.evaluate(() =>
    Promise.all([
      document.fonts.ready,
      ...document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === 'running' && animation.effect?.getComputedTiming().endTime !== Infinity,
        )
        .map((animation) => animation.finished),
    ]),
  );
  await page.screenshot({ path: `public/prosjekter/${shot.file}`, type: 'jpeg', quality: 85 });
  await context.close();
  console.log(shot.file);
}
await browser.close();
