# tommeras.no

```console
$ ./hei.sh
TØMMERÅS
En av ✦ nettsidene ✦ gjennom tidene.
```

Personlig nettside for Steffen Tømmerås. Siden etterligner et terminalvindu, og kommandoene skrives ut én etter én når du scroller. Trykk en tast eller klikk for å hoppe rett til slutten.

Laget med [Astro](https://astro.build) og vanlig CSS. Vercel bygger og publiserer `main`.

## Kom i gang

```console
$ bun install
$ bun dev        # http://localhost:4321
$ bun run build  # astro check og statisk bygg til dist/
$ bun run format # Prettier
```

Skjermbildene i `public/prosjekter/` tas fra de åpne demoene. Kjør skriptet når en demo har endret seg, og se over bildene før du committer dem:

```console
$ bunx playwright install chromium # første gang
$ bun run screenshots
```

## Filer

```console
$ ls -l src/
drwxr-xr-x  components/   Hero (tittel og undertittel), Prompt, Window
drwxr-xr-x  layouts/      Layout med fargene som light-dark()-tokens
drwxr-xr-x  pages/        forsiden, 404 og prosjekter/ med en side per prosjekt
```

## Kontakt

<img src=".github/readme/mail.svg" width="16" height="16" alt=""> [hei@tommeras.no](mailto:hei@tommeras.no) · <img src=".github/readme/github.svg" width="16" height="16" alt=""> [GitHub](https://github.com/stommeras) · <img src=".github/readme/linkedin.svg" width="16" height="16" alt=""> [LinkedIn](https://www.linkedin.com/in/steffen-tommeras/)
