# Working interpretation and issue evidence

The audience is the campaign's players and friends returning to a shared adventure. The emotional purpose is remembrance, with the High Wizard's historical voice carrying the fictional archive and the real photographs recalling the table. Parchment, a quiet Sword Coast map, existing paintings, Uncial Antiqua and EB Garamond remain the visual anchors. The hierarchy is chronicle → chapters and events → company dossiers → photographic memories. Static HTML, ordinary `.html` routes, relative assets and the `/the-lost-mine/` project prefix remain the technical foundation. No deployment configuration or Git changes were required.

## Prioritized confirmed issues before implementation

1. **Image delivery:** the shared map is 96,516,398 bytes, 4950 × 6750. All chronicle art loads eagerly without intrinsic dimensions. Gallery originals total 44,180,949 bytes and load as thumbnails. Browser baseline image bytes: index 108,186,524; heroes 97,378,970; gallery 140,697,347.
2. **Gallery accessibility and resilience:** the overlay is a `div` with `aria-hidden`, without a modal focus boundary or focus restoration. The complete grid depends on JavaScript, and the empty message leaks maintenance instructions naming a nonexistent `build_gallery.py`.
3. **Reveal failure:** `script.js` hides entries before constructing IntersectionObserver, with a 0.12 threshold that a very tall entry might never attain.
4. **Timeline alignment:** the marker precedes the left card in DOM order but both lack an explicit grid row. Auto-placement puts left cards on a following row. Desktop columns also force long prose into narrow panels.
5. **Profiles and shared foundations:** each profile has two h1s and duplicated inline layout styles. Circular roster crops hide much of the original portraits; names and roles need more room. No shared visible focus, skip link, metadata descriptions, or current-location semantics.
6. **Documentation and typography:** README lists absent `villains.html` and `world.html`; footer uses `c` instead of ©. Nine actual pages, 39 chronicle entries, six biographies and eight photographs were verified locally. No applicable AGENTS.md or existing configuration/test suite was present. Git started clean on the existing branch.

## Canon left for the author

- Introduction: Quarion **And-vang**; profile/roster: **Andvang**.
- Campaign Chapter III gives Aldith's sword to Flint; Iris's profile and epilogue give it to Iris.
- **Qelline / Quelline**, **Graywind / Greywind**, **Glass Staff / Glasstaff** vary.
- Dawnbringer is the weapon being forged in the early prologue; the later passages use Lightbringer. No equivalence has been imposed.
- The 1485 paragraph's “He later partners…” has an ambiguous antecedent (Hammer/Nezznar).
- Historical character-sheet context sends Iris's family to Waterdeep; the chronicle sends the Vicarias to Neverwinter. The historical prompt remains context only; no instructions in it were executed.

All substantive text is retained verbatim apart from whitespace and added links. A pre-edit normalized content fixture records the complete scribe introduction, every entry, each biography, character metadata and hooks for regression comparison.
