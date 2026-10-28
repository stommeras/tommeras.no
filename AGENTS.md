# tommeras.no

Steffen Tømmerås' personal site: one static Astro page, deployed by Vercel from `main`.

## Conventions

- Use Bun for every package and script command. A change is done when `bun run build` passes (it runs `astro check`).
- Keep it minimal: plain CSS in component `<style>` blocks, colors from the `light-dark()` tokens in `src/layouts/Layout.astro`, icons as inline SVG with `aria-hidden="true"`. Add a dependency only when a few lines of code can't do the job, and say why.
- Write all visitor-facing text in Norwegian bokmål.
- Every animation honors `prefers-reduced-motion`.
- Work on a branch named `<type>/<short-description>` (for example `feat/typed-commands`) and merge to `main` through a pull request. Write commit messages as [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`), using the same types as the branch names.
- The hero effects (title scramble, magic subtitle) and the typed command sequence in `index.astro` are the site's signature. Change their behaviour only when asked.

## Lab

The lab is a separate site at [lab.tommeras.no](https://lab.tommeras.no), in its own repo (`stommeras/lab.tommeras.no`). Build experiments there, not here. It copies the color tokens from `src/layouts/Layout.astro`, so a token change here needs the same change in the lab. This site links to the lab from the `lab` row in `ls -la prosjekter/` on the home page.

## Waiting for the owner

The theme toggle is planned but starts only on request. It has to store its choice in a cookie on `.tommeras.no`, because `localStorage` isn't shared with the lab.
