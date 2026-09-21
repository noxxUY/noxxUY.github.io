# portfolio

Portfolio of noxx: Astro 7, Tailwind CSS 4, no UI framework. Light and dark themes, both
languages in one page, and an ATS-friendly CV as a page (`/cv/`, `/es/cv/`) and as PDFs.

## Two languages, one page

The home carries every string twice (`src/components/T.astro`) and CSS shows the half that
matches `<html lang>`, so the switch is instant and the URL never changes. `/es/` still
exists, server-rendered in Spanish, for search engines and for anyone who lands there; the
switch just never navigates to it. Attributes CSS cannot swap — the CV links, image `alt`,
the `<title>` — are swapped in `src/lib/lang.ts`. The CV is the exception: one language per
document, because that is what an ATS expects, so there the switch really does navigate.

## The model viewer

The hero has a slot (`src/lib/hero.ts`) that renders a RenderWare DFF with three.js:

- three.js and the viewer (`src/lib/viewer.ts`) are imported only when the slot scrolls
  into view, so the first paint costs what it always did.
- One model out of `src/data/models.ts` is picked at random per page load and **only that
  one** is fetched, from `public/models/`.
- `src/lib/rw/` is a trimmed port of the parser from the IMG Editor, geometry only — no
  textures, materials or submesh grouping — checked against 17,724 models from GTA III,
  Vice City and San Andreas with no difference in triangles, vertices or bounds.
- The Vice City peds are stored in their bind pose, arms straight out. `src/lib/pose.ts`
  finds the upper-arm bones by shape — no bone names are trusted — and skins them down
  about 75 degrees once, on the CPU, before the model is ever drawn, so they stand like
  the GTA III ones. Anything it cannot read (no skeleton, no weights, no arm chain) is
  returned untouched.
- The models are drawn as hidden-line: a solid that only writes depth, creases in the text
  colour, and the edges it hides ghosted in the accent. No textures ship, so the form has
  to come from the lines.
- With `prefers-reduced-motion: reduce` the model does not spin and nothing renders until
  you interact with it.

`public/models/` holds meshes from GTA III and Vice City. They are game assets, published
here deliberately: if that ever needs to be undone, delete the folder and empty the array
in `src/data/models.ts` — the slot falls back to a wireframe figure that ships in the code.

## Scripts

```bash
npm run dev      # dev server on http://localhost:4321
npm run build    # static build into dist/
npm run preview  # serve dist/
npm run check    # astro check (types and templates)
npm run render   # build, then print /cv/ and /es/cv/ to public/cv/*.pdf and /og/ to public/og.png
```

`npm run render` uses the Chromium-based browser already installed on the machine (Edge or Chrome) through puppeteer-core, so nothing is downloaded. Set `BROWSER_PATH` to point at a specific `msedge.exe` or `chrome.exe` if it is not found. The PDFs and `og.png` are committed; CI only builds.

## Editing content

Everything the site says lives in `src/data/profile.ts`: identity, role, summary, links, projects, open source contributions and skills, each string as `{ en, es }`. UI labels are in `src/i18n/ui.ts`. Project screenshots go in `src/assets/projects/` and are referenced by file name from `profile.ts`.

The CV and the site follow the rules in `docs/ATS.md`. `fullName` is left empty on purpose — the site publishes under the alias — so an ATS has only the email to identify the person by; fill it in if that changes.

## Deploy

This repository holds the source. The site has no host yet, so `.github/workflows/deploy.yml` only runs when you start it by hand ("Run workflow" in the Actions tab).

To publish on GitHub Pages, set Pages to "GitHub Actions" as the source, add `push: { branches: [main] }` back to the workflow, and point `site` in `astro.config.mjs` at the real URL. Served from a subpath instead of a domain root, it also needs a matching `base`.
