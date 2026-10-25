// Retakes the project screenshots in public/prosjekter/ from the public demos. Run it by hand with
// `bun run screenshots` after a demo's UI changes, and look over the new images before committing them.
import { chromium, type Page } from 'playwright';

// The sizes the project pages expect: phone shots are 780×1688 and desktop shots 1920×1200
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };
const desktop = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 };

interface Shot {
  file: string;
  url: string;
  size: typeof phone;
  colorScheme: 'light' | 'dark';
  // Clicks and scrolling that bring the page to the state the image shows
  setup?: (page: Page) => Promise<void>;
}

// The recipe and tree shots start at the back link, below the demo banner and navigation
const scrollToMain = (page: Page) => page.locator('main').evaluate((main) => main.scrollIntoView());

const proof = 'https://demo.proof.tommeras.no';
const espressoMartini = `${proof}/cocktails/df8e8718-ea6b-48bb-8910-9aaeb0df8689`;
const rabra = 'https://demo.rabra.tommeras.no';

const shots: Shot[] = [
  {
    file: 'proof-liste.jpg',
    url: `${proof}/cocktails`,
    size: phone,
    colorScheme: 'dark',
    setup: (page) => page.getByRole('button', { name: 'Dismiss' }).click(),
  },
  { file: 'proof-oppskrift.jpg', url: espressoMartini, size: phone, colorScheme: 'dark', setup: scrollToMain },
  {
    file: 'proof-tre.jpg',
    url: `${espressoMartini}/tree`,
    size: phone,
    colorScheme: 'dark',
    setup: async (page) => {
      await page.locator('button[aria-pressed]', { hasText: '3a' }).click();
      await scrollToMain(page);
    },
  },
  { file: 'rabra-feed.jpg', url: rabra, size: phone, colorScheme: 'light' },
  { file: 'rabra-send-inn.jpg', url: `${rabra}/send-inn`, size: phone, colorScheme: 'light' },
  { file: 'rabra-admin.jpg', url: `${rabra}/admin`, size: phone, colorScheme: 'light' },
  { file: 'rabra-feed-desktop.jpg', url: rabra, size: desktop, colorScheme: 'light' },
  { file: 'rabra-admin-desktop.jpg', url: `${rabra}/admin`, size: desktop, colorScheme: 'light' },
];

const browser = await chromium.launch();
for (const shot of shots) {
  // A fresh context per shot, so state one demo keeps in the tab doesn't leak into the next shot
  const context = await browser.newContext({ ...shot.size, colorScheme: shot.colorScheme });
  const page = await context.newPage();
  await page.goto(shot.url, { waitUntil: 'networkidle' });
  await shot.setup?.(page);
  // Waits out transitions so a shot doesn't catch one halfway, like the tree's version boxes fading. Endless
  // animations, like a spinner, are skipped because they never finish.
  await page.evaluate(() =>
    Promise.all([
      document.fonts.ready,
      ...document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished),
    ]),
  );
  await page.screenshot({ path: `public/prosjekter/${shot.file}`, type: 'jpeg', quality: 85 });
  await context.close();
  console.log(shot.file);
}
await browser.close();
