# The model viewer

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
