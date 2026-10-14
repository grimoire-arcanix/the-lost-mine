# The Lost Mine — enhancement report

Implemented locally on October 13, 2026 (America/New_York). The checkout was authoritative, began clean, and remained on its existing branch. No files were staged, committed, pushed or deployed; no remote, Pages setting or publishing configuration was changed.

## Direction and content preservation

The site is now an illuminated campaign codex: warm paper, deep green ink, antique-gold rules, a quiet atlas background, an original compass/mountain emblem, restrained chapter ornaments and framed existing artwork. The cover offers four useful routes into the archive. The High Wizard's writing remains the primary experience; real photographs form a separate, affectionate record of the table.

All 39 entries remain in their original DOM order: 23 prologue events, four campaign chapters, six epilogues and six unfinished threads. Every original substantive passage, biography, character fact and photograph remains. The text-preservation fixture verifies the complete introduction and event text, all six biography bodies, metadata and hooks after whitespace normalization and exclusion of added interface links. No campaign prose was rewritten or canon silently reconciled. Original image files and `assets/prompt-heroes.txt` are unchanged.

The public homepage was read in Chromium: HTTP 200, the same chronicle title, 39 entries, and the same opening passage as the original checkout. The initial web tool and sandbox browser were unable to access it; a read-only browser run with network access completed the comparison. The original public composition matches the broad map-backed local baseline. The entire remote repository was not substituted for, or merged into, local work.

## Confirmed fixes and substantial improvements

| Area / files | Before | Result |
| --- | --- | --- |
| Image delivery — all HTML, `style.css`, `tools/build-assets.cjs` | 96.5 MB shared map; eager art without dimensions | Sub-1 MB map derivatives, responsive JPEG/WebP artwork, reserved dimensions and below-fold lazy loading; cover art stays eager with high fetch priority |
| Chronicle — `index.html`, `style.css` | Left cards auto-placed below dates; long passages squeezed into alternating columns | Explicit grid rows, dated editorial margins, wide reading panels, larger chapter artwork and comfortable paragraph rhythm |
| Navigation — `index.html`, `script.js` | No chapter index or convenient long-page navigation | Four stable chapter fragments, all 39 event IDs, an accessible contents index, native prologue disclosure, compact sticky chapter links, current-location indication and back-to-top link |
| Heroes — `heroes.html`, six profiles, `style.css` | Circular crops, compressed names, repeated inline CSS and duplicate h1s | Six curated cards with individual accents and inspected focal positions, hooks drawn verbatim from biographies, uncropped dossier portraits, shared metadata/prose layout, breadcrumbs and previous/next traversal |
| Gallery — `gallery.html`, `gallery.js`, generator | JavaScript-only grid; original photos as thumbnails; overlay did not manage focus | Eight static photo links with descriptive alt text and captions, small thumbnails, on-demand viewer images, named native modal, bounded Tab/Shift+Tab, Escape, restored focus/scroll, wrapping previous/next, count and loading/error recovery |
| Resilience — `script.js`, `gallery.js`, CSS | Hidden content before observer construction; tall entries could fail reveal threshold | Content always visible. No observer dependency. Missing dialog support or failed/disabled JS leaves ordinary photo links usable. Reduced motion disables transitions and smooth scrolling |
| Shared polish — every page, SVGs, local fonts, `404.html` | Inconsistent hierarchy, no skip link/current-page semantics, incomplete metadata, `c` footer | Shared header/footer, visible focus and usable touch targets, one h1 per page, page descriptions, favicon, verified canonical/social artwork URLs, correct © and a project-aware static 404 |
| Maintenance — README, Node tools, Python wrapper | README listed absent pages; gallery empty state exposed a misspelled command | Accurate page inventory and exact PowerShell commands; deterministic generators with separate source/output directories; no maintenance instructions in visitor UI |

QA-driven corrections included 200% text header/contents reflow, a nested profile landmark, the back-to-top landmark placement, duplicate homepage description metadata, double-counted anchor offsets, portrait focal positions, and a mobile thumbnail tap highlight that briefly painted over the modal. The final viewer keeps its close and navigation controls reachable on short screens.

## Measured image delivery and lab observations

Fresh contexts, Chromium 147.0.7727.15, desktop 1440 × 1000, device scale 1, local HTTP at the real project prefix, no CPU/network throttling. Resource Timing `encodedBodySize` measures image response payloads in the opening view before scrolling. Each row is one run, not a statistical benchmark. Original HTML/CSS/JS was read from HEAD and served through read-only browser response overrides; unchanged source images came from the local HTTP server.

| Opening view | Before image bytes | After image bytes | Reduction | Before observed LCP | After observed LCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Chronicle | 108,186,524 | 990,906 | 99.1% | 436 ms | 240 ms |
| Heroes | 97,378,970 | 1,147,450 | 98.8% | 704 ms | 160 ms |
| Iris profile | 119,392 | 925,280 | Increased | 204 ms | 52 ms |
| Gallery | 140,697,347 | 1,316,186 | 99.1% | 2,788 ms | 120 ms |

The profile now shares the atlas background instead of its old small emblem background, so its cold image transfer increased. The emblem remains in the dossier, and the atlas can be reused from browser cache when navigating from another page. The map is still the largest initial asset; this is a remaining optimization opportunity if cold profile loads matter more than shared visual continuity.

| Asset group | Source bytes | Served derivative bytes |
| --- | ---: | ---: |
| Sword Coast map, 4950 × 6750 source | 96,516,398 | 895,220 WebP / 846,567 JPEG, width 1600 |
| Eight gallery originals | 44,180,949 | 420,966 for all eight WebP thumbnails |
| Eight viewer JPEGs, requested individually | Same originals | 1,999,184 total; largest individual viewer 322,340 |

The artwork/gallery derivatives occupy approximately 15.95 MB total, including fallbacks and manifests; originals are retained separately. Three local font files total 69,064 bytes, with their OFL licenses. No final page requires Google Fonts or another external runtime request.

Working budgets for these measured desktop openings: map below 1 MB, chronicle/profile below 1.1 MB, roster below 1.3 MB, gallery below 1.5 MB, and each viewer below 350 KB. The observed final pages satisfy those budgets. Below-fold art increases traffic as the reader proceeds; it is not hidden or excluded from the archive.

Raw measurements and baseline screenshots: `artifacts/before/`, `artifacts/before-connected/`, and `artifacts/after-connected/`. The first baseline run had restricted external font requests and approximately 18–20 second LCP observations; those timings are **not** used in the comparison table. The connected before/after runs allowed the original font requests. No Lighthouse score, field Core Web Vitals, production latency or universal performance improvement is claimed.

## Research used in implementation

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): retain static files and explicit project-site paths; preview and crawl under `/the-lost-mine/` rather than assuming host-root routing.
- [web.dev responsive images](https://web.dev/learn/images/responsive-images): use descriptive `srcset`/`sizes`, format selection through `picture`, and derivatives appropriate to displayed dimensions.
- [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): focus enters the viewer, background content is inert, Tab stays inside, Escape closes, and focus returns to the invoker.
- [MDN dialog reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog): use native `showModal()` with feature detection, retaining linked images as the fallback.
- [web.dev reduced motion](https://web.dev/articles/prefers-reduced-motion): remove motion under the user's preference and never depend on reveals for access to prose.
- [MDN feature queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Using_feature_queries): retain a JPEG map background and enhance to typed `image-set` inside `@supports`; ordinary layout and typography remain the fallback.

## Actual verification

The final `npm.cmd test` run **passed 556 checks across all ten discovered HTML pages** in Chromium 147.0.7727.15. It ran generation twice, compared outputs byte-for-byte, confirmed originals unchanged, then checked:

- HTTP responses, exact path case, internal links/fragments, responsive image candidates, CSS/font resources and canonical/social assets under `/the-lost-mine/`.
- Console/page errors, failed requests and decoding of all static images after scrolling each page.
- No horizontal overflow on every page at 320 × 780, 390 × 844, 768 × 1024, 1024 × 800, 1440 × 1000, 1920 × 1080 and 844 × 390.
- 200% root text sizing at a 640 px viewport on every page. This was enlarged-text reflow, **not** an actual browser zoom-menu test.
- Main navigation, skip-link focus, cover action, native contents disclosure, chapter links, deep-link reloads, correct sticky offsets, Back/Forward, every hero card, profile traversal and return to the epilogue, and back-to-top.
- Modal opening by Enter and mouse/touch emulation; initial focus; repeated Tab/Shift+Tab; previous/next wrapping; arrow keys; Escape and close button; focus/scroll restoration; reopening; and a deliberately missing viewer image with an original-photo recovery link.
- Touch-emulated viewer controls at 320/390 widths and 844 × 390 landscape. No swipe gesture was added.
- Disabled JavaScript, aborted scripts, unavailable IntersectionObserver and unavailable `showModal()`. All narrative remains readable; all eight ordinary gallery links remain available.
- Reduced-motion transition behavior and the complete normalized content fixture.
- Axe 4.11 on all ten pages at 1440 and 390 widths, plus the open viewer: **zero reported violations in all 21 scans**. Intermediate findings were corrected and checks repeated. This is not a WCAG-conformance claim.

Results: `artifacts/qa/results.json`. Individual axe findings: `artifacts/qa/*-axe.json`. Screenshots include `index-1440.png`, `index-390.png`, `campaign-long-1440.png`, `campaign-long-390.png`, `heroes-full-1440.png`, `heroes-full-390.png`, `iris-1440.png`, `dossier-full-390.png`, `gallery-full-1440.png`, `gallery-full-390.png`, `viewer-1440.png` and `viewer-390.png`. These artifacts are ignored by Git and remain available locally.

Screenshots were visually reviewed for the cover, long campaign prose, all six roster portraits, dossier, gallery and viewer on desktop/mobile. Body text sits on opaque paper panels; the map stays outside sustained-reading panels. Manual review of DOM order and the text fixture confirmed chronology and retained prose. Keyboard focus/modal behavior was exercised through actual browser input. Contrast and focus were also reviewed in the screenshots and automated scans.

## Exact commands

```powershell
Set-Location C:\Projects\the-lost-mine
npm.cmd ci --cache .npm-cache
# Needed only if a usable local Chromium is absent:
npx.cmd playwright install chromium
npm.cmd run assets
npm.cmd run gallery
npm.cmd run preview
# Browse http://127.0.0.1:4173/the-lost-mine/ ; Ctrl+C stops preview.
npm.cmd test
git diff --check
```

For faster UI-only regression after successful generation: `node tools/regression.cjs --skip-generation`. For repeatable local measurements: `node tools/baseline.cjs after`. See README for original-HEAD comparison commands. The implementation actually used `npm.cmd install` to establish the lockfile, ran asset/gallery generation and repeated the regression suite after resolving failures. A fresh `npm ci` installation was not independently re-tested.

## Limitations and author decisions

- Browser checks used Chromium, including emulated touch; Firefox, Safari/WebKit, physical mobile devices, screen readers and actual browser-menu zoom remain unverified. Before publishing, spot-check Safari/Firefox, use a real phone to open/navigate/close the gallery, try 200% browser zoom, and listen to chapter navigation and modal announcements with a screen reader.
- The local Python launcher points to an unavailable WindowsApps Python 3.10 executable. The optional Python compatibility wrapper was not executed. All generation and testing were completed with Node; no Python setup changes are required.
- Canon questions remain unchanged: **And-vang / Andvang**; Aldith's sword given to **Flint in Chapter III / Iris in her biography and epilogue**; **Qelline / Quelline**; **Graywind / Greywind**; **Glass Staff / Glasstaff**; the relationship of **Dawnbringer / Lightbringer**; and the ambiguous “He later partners…” in the 1485 entry. The historical character-sheet context also differs about Iris's family's destination. Details are in `docs/working-notes.md`.
- The first cold profile visit carries the shared map cost. Original high-resolution assets remain in the repository for preservation. Unused old derivatives are left alone if a source is later removed; regeneration excludes them from the gallery.
- The 404 was tested as a static page with a project base, and path case was checked locally. GitHub's live missing-route delivery and actual post-publication social previews remain unverified because no deployment was made.

## Changed-file summary and Git state

Updated the nine existing HTML pages, shared `style.css`/`script.js`, `build-gallery.py` compatibility entry point, and README. Added `gallery.js`, `404.html`, two original SVGs, gallery metadata, local fonts/licenses, generated derivatives/manifests, minimal development-only package/lock files, preview/generation/QA tools, a campaign-preservation fixture, `.gitignore`, and the two documentation reports. No source photograph/artwork, historical prompt or license was changed. There was no pre-existing staged work to preserve. Final `git diff --check` passed; the staged diff is empty and the branch remains `main`. Implementation files remain unstaged and uncommitted.
