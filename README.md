# hier_uot

ICML 2027 manuscript for hier_uot.

## Naming

The paper title is **A Sparse Primal–Dual Method for Large-Scale Unbalanced Optimal Transport**.
The algorithm display name is **Salut**, controlled by `\ours` in `main.tex`.
Derived algorithm names reuse that macro.
Comments and Markdown prose use the stable project name `hier_uot`.
Existing `shuttle` strings in paths, configuration keys, commands, and historical
results are literal technical identifiers and must remain valid.

## Layout

- `main.tex`: document setup, shared macros, title, bibliography, and body/appendix entry points.
- `main_body.tex`: abstract and complete main text.
- `main_appendix.tex`: method details, stopping rules, extensions, implementations, protocols, and supplementary experiments.
- `references.bib`: shared bibliography.
- `theory/`: three manuscript theory files: PDUOT convergence, finite refinement, and inter-level response stability.
- `theory/notes/`: standalone historical theory drafts, outside the manuscript build.
- `notes/`: historical experiment text, outside the manuscript build.
- `RELATED_WORK_ALGORITHM_MAP.md`: related-work research notes.
- `STORYLINE_INTRO.md`: introduction storyline and revision outline.
- `STORYLINE_METHOD.md`: method storyline and Chinese paragraph outline.
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

Run manuscript builds from this directory; all input and figure paths are relative to it.
The former `appendix_*.tex` files and `experiments_extensions.tex` are merged into the body and appendix.
Squared-L2 definitions and theory are in `main_appendix.tex`, under `app:l2-penalty`.
The historical `experiments_hello_uot.tex` file is preserved as `notes/experiments_hello_uot.tex`.

## Synchronization

GitHub: <https://github.com/WenzhouXia/hier_uot>

Overleaf: [ICML2027: hier_uot](https://latex.sjtu.edu.cn/project/6ad4f09da226e7cf9ffff917)

The local folder is a standalone Git repository and is linked to Overleaf
through Leaflink. Use `main.tex` as the root document with pdfLaTeX.
Build products and local Leaflink metadata are excluded from synchronization.

The inter-level stability appendix figure is regenerated from the pinned
2026-10-19 measurements, without solving new problems:

```bash
micromamba run -n hier_ot python scripts/plot_hierarchy_stability.py
```

The script defaults to the enclosing code project's
`results/uot_hierarchy_paper_candidate_20261019/`; use `--project-root` and
`--results-dir` when working from a separate checkout. It checks the original
input checksum and includes all 1,080 transitions. The resulting PDF/PNG and
recomputed statistics are saved as `figures/hierarchy_stability_validation.*`.

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
