# tommeras.no

Steffen Tømmerås' personal site: one static Astro page, deployed by Vercel from `main`.

## Conventions

- Use Bun for every package and script command. A change is done when `bun run build` passes (it runs `astro check`).
- Keep it minimal: plain CSS in component `<style>` blocks, colors from the `light-dark()` tokens in `src/layouts/Layout.astro`, icons as inline SVG with `aria-hidden="true"`. Add a dependency only when a few lines of code can't do the job, and say why.
- Write all visitor-facing text in Norwegian bokmål.
- Every animation honors `prefers-reduced-motion`.
- The hero effects (title scramble, magic subtitle) are the site's signature. Change their behaviour only when asked.

## Waiting for the owner

These are planned but start only on request: projects section, `lab.tommeras.no` (its own repo), theme toggle.
