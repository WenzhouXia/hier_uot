# hier_uot

ICML 2027 manuscript for SHUTTLE.

## Layout

- `main.tex`: main manuscript and appendix.
- `references.bib`: shared bibliography.
- `theory/`: standalone refinement and PDUOT convergence notes and diagnostics.
- `RELATED_WORK_ALGORITHM_MAP.md`: related-work research notes.
- `SPARSE_SINKHORN_BASELINE_SURVEY.md`: standalone copy of the baseline survey.

## Template

The official ICML 2027 author kit was not available on 2026-10-16. This
directory therefore uses the latest official author kit, ICML 2026, downloaded
from:

<https://media.icml.cc/Conferences/ICML2026/Styles/icml2026.zip>

The bundled `icml2026.sty`, `icml2026.bst`, `algorithm.sty`,
`algorithmic.sty`, and `fancyhdr.sty` are unmodified official files. Do not
rename the style to `icml2027.sty`. Replace these files and update the package
name after ICML publishes its 2027 author kit.

The local TeX Live installation lacked the standard `forloop` dependency used
by `icml2026.sty`. The bundled `forloop.sty` was generated without modification
from the CTAN source at
<https://mirrors.ctan.org/macros/latex/contrib/forloop.zip>; its upstream README
is retained as `forloop.README`.

Compile the current draft with:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
```

## Synchronization

GitHub: <https://github.com/WenzhouXia/hier_uot>

Overleaf: [ICML2027: hier_uot](https://latex.sjtu.edu.cn/project/6ad4f09da226e7cf9ffff917)

The local folder is a standalone Git repository and is linked to Overleaf
through Leaflink. Use `main.tex` as the root document with pdfLaTeX.
Build products and local Leaflink metadata are excluded from synchronization.

From this directory:

```bash
micromamba run -n leaflink leaflink status
micromamba run -n leaflink leaflink pull
micromamba run -n leaflink leaflink push
```

For continuous local/Overleaf synchronization, run:

```bash
micromamba run -n leaflink leaflink sync
```

GitHub updates are explicit: commit the desired changes and run `git push`.
