# portfolio

My portfolio, built with Astro and Tailwind CSS. English and Spanish on one page, light and
dark themes, and an ATS-friendly CV at `/cv/` and `/es/cv/` that is also printed to PDF.

The hero renders a random GTA model (RenderWare DFF) with three.js, parsed in the browser.

## Scripts

```bash
npm run dev      # dev server on http://localhost:4321
npm run build    # static build into dist/
npm run preview  # serve dist/
npm run check    # types and templates
npm run render   # rebuild the CV PDFs and og.png
```

`npm run render` drives the Edge or Chrome already installed on the machine, so nothing is
downloaded. Set `BROWSER_PATH` if it is not found.

## Content

Everything the site says lives in `src/data/profile.ts`, each string as `{ en, es }`. UI
labels are in `src/i18n/ui.ts`, screenshots in `src/assets/projects/`. The CV follows the
rules in `docs/ATS.md`.

`public/models/` holds meshes from GTA III and Vice City. To drop them, delete the folder
and empty the array in `src/data/models.ts`; the hero falls back to a wireframe figure.

## Deploy

This repository is the source. The site has no host yet, so the Pages workflow only runs
when started by hand. To publish it, point `site` in `astro.config.mjs` at the real URL
(plus a `base` if it is served from a subpath) and put `push: { branches: [main] }` back in
`.github/workflows/deploy.yml`.
