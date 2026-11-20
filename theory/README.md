# hier_uot theory

## Manuscript files

- `pduot_convergence.tex`: two formal results aligned with the main-text informal theorem: global convergence under mapped-point restarts and summable metric changes, and local linear convergence under bounded-gap residual-reduction checks. The local KKT error bound is part of the second proof.
- `refinement_convergence.tex`: finite termination with inexact solves (formal theorem and uniform-gain lemma), followed by a proposition establishing finite attainability of the complete stopping rule and preservation under sparsification. Exact-oracle termination is a short supporting argument.
- `inter_level_response_stability.tex`: shared-side response stability, its proof, and the weighted potential-stability corollary used to explain dual propagation.

The `Stop` definition and call context are in `../main_appendix.tex`, under `app:refinement-local-stopping`.
Finite attainability and preservation under sparsification are proved in `refinement_convergence.tex`, under `app:refinement-stop-attainability`; numerical scope is stated with the implementation details.
Compile the manuscript from the paper root with `latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex`.

## Research notes

- `notes/finite_refinement_original.md`: original four-part B.2, including the full exact-oracle theorem and proof, before the 2026-11-15 reorganization.
- `../notes/component_mechanism_analysis_record.md`: the original F source and inter-level theory before the 2026-11-15 compression. Preserves auxiliary inheritance bounds, response prediction and certification, the sampling counterexample, and synthetic diagnostics with their data sources; these are excluded from the compiled manuscript.
- `notes/support_induced_iteration_lower_bound.md`: fixed-map weighted Hall-deficit lower bound, archived verbatim from the manuscript on 2026-11-15. Its TeX fragment uses manuscript equation references and is not a standalone article or part of the compiled convergence proof.
- `internal_progress_fidelity_refinement.md`: current same-call PDUOT progress-or-fidelity scheme, exact/inexact finite-refinement statements, default-off production integration (`bbb6d0c`), complete 135-run comparison, and finite-precision limitations.
- `objective_forced_accuracy_refinement.md`: new simpler candidate: insufficient nonterminal objective progress tightens only the next restricted tolerance; no altered objective, pricing, rollback, retry, or stabilization mode. Conditional finite-termination argument, 30 ordinary and 5 thin-support solves, and one constructed triggered-path integration test.
- `dual_stabilization_exploration_record.md`: consolidated historical record and current decision: the author considers the stabilization branch too complex; it remains experimental and is not adopted for production.
- `dual_stabilization_recommendation.md`: concise recommended hybrid scheme, paper-presentation skeleton, conditional finite-refinement statement, integrated experimental evidence, and numerical limitations.
- `dual_stabilization_uot_refinement.md`: literature review, detailed fixed/moving-center arguments with inexact model solves and sparsification, negative unconditional-stabilization results, and integrated hierarchy/normal-path tests. Large exceptional-phase performance and FP64 budget attainability remain open.
- `fixed_accuracy_original_objective_refinement.md`: working candidate with fixed inner tolerance, original-objective coordinate descent, terminal rounding, and a conditional finite-termination proof; production is unchanged.
  Its opening section gives the complete proposal; Sections 17--18 record the localized-controller validation and assessment against the author's four criteria.
- `fixed_accuracy_coordinate_resolution.md`: relative coordinate-step bounds independent of the absolute flow floor, with explicit floating-point limitations.
- `residual_accuracy_halving_bound.md`: earlier residual-triggered tolerance-halving route and its conditional bound on the number of halvings.
- `notes/pduot_convergence_theory.tex`: fixed-metric PDUOT convergence and local sharpness.
- `notes/hieruot_inexact_refinement_theory.tex`: original one-edge descent and objective-safeguarded outer refinement analysis.
- `notes/refinement_without_objective_safeguard.tex`: follow-up analysis dated 2026-10-19, removing trial-objective acceptance through restricted-value descent and computable inner errors.
- `notes/weight_budget_convergence.tex` and `notes/mapped_restart_convergence.tex`: standalone adaptive-metric and mapped-restart derivations.
- `curvature_aware_pricing_notes.md`: earlier discussion of curvature-aware edge scores.

## Follow-up result

The new note tracks restricted optimal values rather than requiring computed
objectives to decrease. It derives:

1. A restricted objective-error bound from marginal-response defects,
   complementary stationarity residuals, and a dual-feasibility repair.
2. A KL continuity bound for deleting positive flow, expressed through deleted
   source and target marginal masses.
3. Finite outer termination under summable inner errors and pruning losses,
   without a per-round trial-objective acceptance condition.
4. Asymptotic full-space stationarity when inner stationarity residuals vanish.

The key inequality is

$$v(\mathcal A_{k+1})\leq v(\mathcal A_k)+\delta_k+L_k-G_k.$$

Here $v$ is the restricted optimum, $\delta_k$ bounds inner suboptimality,
$L_k$ bounds pruning damage, and $G_k$ is a guaranteed one-edge gain.
Summing the inequality controls the total gains even when individual computed
objectives increase.

This is a working derivation, not a verified novelty claim or a theorem for
the unchanged production implementation. In particular, default fixed inner
tolerances and edge-flow pruning thresholds do not automatically give the
summable budgets. Linear-memory compatibility and finite-precision accounting
also remain separate questions.

## Numerical algebra checks

The experiment `experiments/restricted_kl_uot/check_refinement_bounds.py` in
the parent code project checks the derived identities and inequalities.
The seed-20261019 run used 2,000 random problems, including asymmetric penalty
coefficients spanning approximately 0.01 to 100. All checks passed, including
1,276 positive missing-edge trial and pruning checks. The maximum normalized
Fenchel identity error was 6.17e-16.

These checks validate the algebra numerically, not production convergence or
the sharpness of the error estimates on real hierarchy snapshots.

Build standalone TeX notes from `theory/notes/` with:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error refinement_without_objective_safeguard.tex
```
