# The Lost Mine

A personal keepsake of the Lost Mine of Phandelver campaign run in January 2026: an illuminated chronicle, six character biographies, and photographs from around the table.

The deployed site is https://grimoire-arcanix.github.io/the-lost-mine/. It is plain HTML, CSS and JavaScript. Checked-in images, fonts and generated gallery markup make deployment self-contained; Node is needed only for maintenance and tests. Keep the `.html` routes and project prefix.

## Local setup and preview (PowerShell)

Use Node 22 or newer. This workspace was verified with Node 24.21.0. The `.cmd` suffix avoids PowerShell's restriction on npm's `.ps1` launcher.

```powershell
Set-Location C:\Projects\the-lost-mine
npm.cmd ci --cache .npm-cache
# Only if no local Playwright Chromium is already installed:
npx.cmd playwright install chromium
npm.cmd run preview
```

Open **http://127.0.0.1:4173/the-lost-mine/**. Stop the server with Ctrl+C. This preview deliberately enforces exact path case, like the published project. On other shells, use `npm`/`npx` instead of `npm.cmd`/`npx.cmd`. The test browser reuses installed Playwright Chromium on Windows, or accepts an explicit `$env:CHROMIUM_PATH` pointing to a Chromium executable.

## Structure

- `index.html`: full chronicle, contents, 39 dated/event entries and chapter anchors.
- `heroes.html`: six company cards with visible character hooks.
- `iris.html`, `flint.html`, `seraphina.html`, `quarion.html`, `robin.html`, `hammer.html`: biographies and metadata, with previous/next traversal in that order.
- `gallery.html`: generated static photograph links, enhanced by `gallery.js` with a modal viewer.
- `404.html`: project-aware missing-page navigation.
- `style.css`: shared tokens, typography, layouts and responsive components.
- `script.js`: optional chapter-location indication; no content is hidden by scripts.
- `assets/img/`: preserved source artwork and photographs. `assets/prompt-heroes.txt` is historical campaign context.
- `assets/optimized/`: generated responsive artwork, map, thumbnails, viewer images and size manifests.
- `assets/fonts/`: locally hosted typefaces and their SIL OFL licenses.
- `assets/gallery-metadata.json`: descriptive alt text, captions and thumbnail focal positions.
- `tools/`: generation, prefix-aware preview, browser regression and measurement tools.
- `tests/campaign-content.json`: pre-enhancement content preservation fixture. Change it deliberately when the author changes campaign writing; do not replace it merely to make a failing preservation check pass.
- `docs/enhancement-report.md`: implementation, measurements, evidence and remaining limitations.

## Add photographs or regenerate assets

1. Put original photographs directly in `assets/img/gallery/`. Supported extensions: JPG, JPEG, PNG, WebP, GIF and AVIF. Keep exact filename case. The archive uses a deterministic filename sort; no generated directory is scanned.
2. Add a metadata entry keyed by that filename in `assets/gallery-metadata.json`: `alt` describes what can be seen, `caption` labels the memory, and `position` sets a CSS object-position. Avoid assigning names or events without evidence. Without metadata, a neutral caption and alt are generated.
3. Run:

```powershell
npm.cmd run assets
npm.cmd run gallery
```

`assets` derives 480/960-width JPEG and WebP artwork, a 1600-width map, and local fonts. `gallery` creates 640-width thumbnails and viewer images fitting 1600 × 1600, and replaces only the `GALLERY:START/END` markup in `gallery.html`. Originals are never recompressed or edited. `build-gallery.py` remains a compatibility wrapper for the Node generator if Python is available; the preferred workflow does not require Python. Removed sources are excluded from markup on the next generation; old unused derivatives are not deleted automatically.

## Verification

```powershell
npm.cmd test
git diff --check
```

The full test regenerates images twice (allow a few minutes), verifies identical output and unchanged source files, compares campaign text, crawls all HTML under the real project prefix, checks responsive reflow and accessibility, and exercises navigation and the viewer. It writes machine-readable results, axe findings, and screenshots to ignored `artifacts/qa/`.

For a CSS/HTML-only iteration after generation has already passed:

```powershell
node tools/regression.cjs --skip-generation
```

To measure the current opening views with fresh browser contexts at 1440 × 1000:

```powershell
node tools/baseline.cjs after
```

This writes screenshots and raw Resource Timing/LCP observations to `artifacts/after/`. These are unthrottled local lab observations, not field Core Web Vitals. The optional `--original` flag reads HTML/CSS/JS from **HEAD** without changing files, useful before committing this redesign:

```powershell
node tools/baseline.cjs before-connected --original
node tools/baseline.cjs after-connected
```

Baseline measurements need external font access because the original site requests Google Fonts. Final pages require no external requests. Nothing in these commands stages, commits, pushes or deploys the site.

