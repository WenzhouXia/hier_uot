# Salut figure source

Requires Node.js 22.12 or newer. From this directory, install the pinned dependencies and render the figure.

```sh
npm ci
npx playwright install chromium
npm run render
```

With Chrome already installed, use `SALUT_CHROME_CHANNEL=chrome npm run render` to render with it.
For an existing Chromium executable, use
`SALUT_CHROME_EXECUTABLE=/absolute/path/to/chromium npm run render`.

The manuscript includes `../salut_overview_whiteboard.pdf` at column width in
`main_body.tex`, under `fig:shuttle-overview`. The renderer also exports
`../salut_overview_whiteboard.png` for preview. The paper PDF is exported directly
from Chromium, retaining the styled diagram and formula typography without the
preview wrapper. The original `../salut_overview.tex` and its PDF are preserved.

The default `npm run render` now builds the selected paper version: the
`color-filled` palette, `compact-support` layout and muted-teal A accent,
including a matching green title underline. Explicit preview arguments still
write separate outputs and never overwrite this paper PDF. The default also
updates `salut-layout.excalidraw` to match the selected geometry and colors.
The selected paper version also uses the A muted-teal theory highlights
(`theory=teal`) for convergence and finite-termination annotations.
It includes the four green component labels inside the enlarged PDUOT card,
the repositioned support/state glyphs, aligned flow arrows, larger lowered Salut
wordmark, and irregular handwritten title/section underlines described below.
The paper output box has a white background, and PDUOT is centered in its title
band using the final rendered font's glyph bounds.
Salut has an additional matching outline for a heavier wordmark; the `Dual`
label uses a darker gold (`#AD8527`) for readability; dual vectors remain pale yellow.
In the compact layout, Pricing gives 30 source pixels of width to Prune. Both
Prune formulas use size 38, matching Pricing. The first line uses the containment
relation `N ⊇ supp(X) ∪ B ∪ V` instead of `keep`; the second is the budget bound.
The Prune body still has two lines.
Support notation follows the manuscript's `N` throughout; the standalone `N_0`
and `N_+` labels on the initialization and return connectors are removed.
Initialization's content rows, brace, button and formula are centered separately
within the panel. The selected paper version uses an Init header-band card,
with the same bottom margin as Pricing/Prune. For a separate preview, use
`npm run render -- --palette=color-filled --layout=compact-support --green=teal --init-card`.
This combines Init and its formula into a white-body card matching Pricing/Prune.
Explicit preview arguments export with the `-init-card` suffix and do not replace
the paper figure; the default render includes the card in the paper export.

For independent theory-highlight color previews, append `--theory=apricot`,
`--theory=cream`, or `--theory=slate` to
`npm run render -- --palette=color-filled --layout=compact-support --green=teal --init-card`.
These replace only the global/local convergence and finite-termination marker,
text and annotation-arrow colors. Paper exports remain unchanged. Generate the
three-way board with `node compare-palettes.mjs --theories` after rendering all three.
Green theory variants use `--theory=teal`, `--theory=mint`, or `--theory=sage` with
the same preview arguments. Compare those three with
`node compare-palettes.mjs --theory-greens`. They keep the paper's core-component
teal unchanged and use green shades for theoretical contributions as well.

For the separate PDUOT component-note preview, append `--solver-note` to
`npm run render -- --palette=color-filled --layout=compact-support --green=teal --init-card --theory=teal`.
Four handwritten bullets sit in two rows in a white note below PDUOT, with a
curved annotation arrow pointing back to the solver. Downstream
nodes and paths move down 100 source pixels, expanding the outer frame by that
amount. This option never changes the default paper export.

The selected paper uses the `solver-components` design. Append
`--solver-components` (without `--solver-note`) to explicitly preview
the four components inside PDUOT, in two rows of green text. The solver card is
taller, adjacent support/state glyphs move down 40 source pixels, and downstream
nodes move down 65 pixels with their connectors. Explicit preview arguments
write separate outputs; a default render includes this design in the paper export.
The two component rows use size 29 (versus size 35 guarantee labels) and sit
lower in the card to balance the spacing above and below them.
Bullets are retained with the columns spread toward the sides; the solver card
is 40 pixels wider and its bottom edge and guarantee labels are 16 pixels lower.
The support glyph moves 20 pixels left and the state glyph 20 pixels right;
the solver's right edge expands toward the state, with updated connectors.
The selected paper uses B medium blue (`#9FC3E3`) for support hatch lines and
A light blue (`#BFD8EF`) for the five primal cells (`support-blue=mixed`).
Pricing/Prune headers retain their pale blue; hatch backgrounds are white and
dual vectors use the selected B pale yellow (`#FFF0D0`, `dual-yellow=lighter`).
Spar and the KKT diamond shift right to share the state glyph's vertical axis.
The return/update connectors use longer final straight segments and fixed-size
open arrowheads matching the other flow arrows rather than shrinking at tight bends.
The component preview also enlarges the Salut wordmark by 18%, lowers the title
by 8 source pixels, and replaces the three title/section underlines with uneven
filled handwritten strokes of comparable length and thickness.

To compare three deeper blues for support hatching and primal cells, append
`--support-blue=light`, `--support-blue=medium`, or `--support-blue=deep` to the
explicit component-preview command. All other colors remain unchanged. After
rendering all three, run `node compare-support-blues.mjs` for the side-by-side board.
These options do not replace the paper figure until a depth is selected.

For three paler dual-vector yellows, append `--dual-yellow=light`,
`--dual-yellow=lighter`, or `--dual-yellow=lightest` to the explicit component
preview, also using `--support-blue=mixed` to retain the selected blue depths.
Both the state vectors and initialization vectors change together; the `Dual`
word remains dark gold. The paper default selects B (`lighter`). Compare with
`node compare-support-blues.mjs --dual-yellows`. These exports are preview-only.

After rendering, build the paper from `papers/hier_uot`:

```sh
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
```

The base layout is generated from `draw.mjs`; `draw-palettes.mjs`,
`draw-layouts.mjs` and `green-accents.mjs` apply the selected paper adjustments.
Make persistent edits in these source modules; editing `salut-layout.excalidraw`
alone does not update the export.

For the separate color-emphasis preview, run `npm run render -- --variant=emphasis`
(with the same browser environment variable if needed). It reads
`draw-emphasis.mjs` and writes `../salut_overview_emphasis_preview.pdf`,
`../salut_overview_emphasis_preview.png`, and `salut-layout-emphasis.excalidraw`.
This command does not overwrite the manuscript figure or its editable layout.

Four additional palette/shadow previews are available with
`npm run render -- --palette=NAME`, where NAME is `blue-depth`,
`lavender-depth`, `sage-depth`, or `original-depth`. Their PDF/PNG exports use
`../salut_overview_NAME_preview.*`; each has a separate Excalidraw layout.
The palette definitions live in `palettes.mjs`, and `draw-palettes.mjs` applies
them without changing the underlying layout. Only the PDUOT box receives a
small soft offset shadow. `original-depth` preserves the original palette.

Two flat semantic-color previews use `--palette=blue-semantic` or
`--palette=color-semantic`. Both retain the original layout without any shadow.
Blue denotes primal solving/support, hatching denotes allowed support and solid
blue denotes positive flow. All dual vectors share grey (blue-only version) or
yellow (color version). Guarantees and complexity use blue or purple respectively.
Auxiliary operators, decisions and output boxes have white backgrounds; section
underlines are grey. Compare the pair with `node compare-palettes.mjs --semantic`.

`--palette=color-filled` exports the B2 refinement with the same semantic colors:
light-blue section underlines, pale-blue auxiliary operations/card headers and a
white output box. PDUOT keeps the stronger blue fill; dual vectors remain
yellow and guarantees remain purple. This variant has no shadows.

Add `--layout=enclosed` to `--palette=color-filled` to preview a single overall
frame containing initialization, updates, the shared dual-score rule and the
return path. Only the overall frame changes; all modules and connectors retain
their original positions. The frame sits 24 pixels outside the return path on
the left and 26 pixels below it. Exports use
`../salut_overview_color-filled-enclosed_preview.*`.

Use `--palette=color-filled --layout=solver-card` for the next layout preview:
remove the memory badge, shift the support glyph left, widen PDUOT, replace its
full fill with a blue header, combine the objective and support constraint into
one formula, and place global-convergence/local-linear-rate badges inside it.
Other modules and the current paper export are preserved. Output centering is
retained; exports use `../salut_overview_color-filled-solver-card_preview.*`.

`--layout=solver-marker` keeps that layout but replaces the two guarantee boxes
with larger `Global conv.` / `Local linear rate` labels over pale-purple marker
strokes. Exports use `../salut_overview_color-filled-solver-marker_preview.*`.

`--layout=solver-handwritten` enlarges the main formula with the nonnegative
constraint under min and a smaller, tightly spaced s.t.; the larger short labels
read `Global conv.` and `Local linear`. Their highlights use irregular filled
shapes matching the operation headers. Finite termination moves below-left of
the KKT diamond, with its own purple highlight and curved annotation arrow.
Exports use `../salut_overview_color-filled-solver-handwritten_preview.*`.

`--layout=compact-support` reduces the objective to script size while enlarging
the support constraint. Finite termination sits above-left of the diamond; the
curved arrow approaches its upper-left edge approximately along the edge normal.
The lower modules and all attached paths move up by 80 source pixels, reducing
the overall height by the same amount. No modules or fonts are scaled.
Exports use `../salut_overview_color-filled-compact-support_preview.*`.
The current compact preview uses a smoother three-point annotation curve and
five primal cells with exactly one per row/column. Its 8-cell active support
contains all five primal positions, with additional allowed positions in selected
rows and columns. This is an illustrative pattern, not a UOT structural claim.
The word `Dual` in the shared dual-score rule uses a darker gold than the dual
vector fills for readability in the selected paper version.

Add `--green=teal`, `--green=sage`, `--green=forest`, or `--green=mint` to
`--palette=color-filled --layout=compact-support` for four green accents on
the Salut wordmark, PDUOT header/outline and Spar. Other colors, layout and the
paper export are unchanged. Exports append the green name to the preview path.
Use `node compare-palettes.mjs --greens` to produce the four-way comparison.

For alternative full palettes coordinated with the paper plots' scientific
`proposed` coral red (`#EE6A5F`), use
`npm run render -- --palette=color-filled --layout=compact-support --red=NAME`,
where NAME is `classic`, `slate`, or `teal`. These alternatives use a pale coral
core header, retain yellow/gold dual information and purple theory, and vary
the inherited components between blue, slate blue and muted teal. They are
preview-only. Use `node compare-palettes.mjs --reds` for the comparison.

`--red=coral-sage` previews a full recoloring inspired by Color Hunt palette A
(`#FF7878`, `#CEE5D0`, `#F3F0D7`, `#E0C097`), with the coral anchored to the
paper's `#EE6A5F`. Salut/PDUOT/Spar use coral; support/primal cells and inherited
operation headers use sage; dual vectors use cream; guarantees and their
annotation use camel. Outer frames use warm grey, and the output uses ivory.
The default paper export, layout and typography remain unchanged. Render with
`npm run render -- --palette=color-filled --layout=compact-support --red=coral-sage`.
The inspiration palette is https://colorhunt.co/palette/cee5d0f3f0d7e0c097ff7878.

`--red=coral-sand` replaces the sage with cream operation headers and warm-sand
support/primal cells. Theory markers use pale sand with brown lettering, dual
vectors use muted cream-gold, and frames use warm grey. The paper coral remains
`#EE6A5F`; this preview changes colors only and does not replace the paper export.

`--red=coral-apricot` previews a brighter warm palette using the paper's coral
`#EE6A5F`, apricot `#F4A261` for support/primal cells, and yellow `#F2C75E` for
dual vectors. Operation headers use pale apricot, while theory uses golden-orange
marker fills with dark lettering. Geometry, fonts and the paper export remain
unchanged. Render with
`npm run render -- --palette=color-filled --layout=compact-support --red=coral-apricot`.
The `Dual` label matches the vectors' exact yellow; the output box has a white
background. PDUOT is centered within its title band using final font glyph bounds.

- `draw.mjs` defines the Excalidraw shapes, text anchors, and layout.
- `render.mjs` defines the LaTeX formulas, typography, and final export. The `formulas` map associates the Excalidraw labels with their LaTeX source.
- `salut-layout.excalidraw` is the editable layout. The PNG uses additional Kalam and Nimbus Mono typography and KaTeX formula typesetting applied during export.
- `public/` contains the bundled fonts. See `licenses/` for font notices.
