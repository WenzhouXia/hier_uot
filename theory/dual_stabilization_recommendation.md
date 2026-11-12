# UOT refinement: localized dual stabilization

Research conclusion, 2026-10-20. Production code, manuscript, and bibliography are unchanged.

Current disposition: the author considers this branch too complex and has deferred adoption; see [the consolidated record](dual_stabilization_exploration_record.md).
The recommendation below is retained as the historical result of that investigation.

## Recommendation

Keep the ordinary hier_uot path and its sufficient-progress test.
Use a mathematical pricing-margin test to switch to a KL-aware stabilized phase only when the proposed new edges do not supply a reliable primal descent direction.
Allow full dual violation to fluctuate in both modes.
Do not introduce a stagnation window or roll back earlier primal iterates.

This is a conditional finite-refinement construction supported by experimental integration.
It is more involved than smoothing potentials, and it is not a theorem for the current unchanged production solver.
The detailed derivations and literature audit are in [dual_stabilization_uot_refinement.md](dual_stabilization_uot_refinement.md), especially Sections 12, 14, and 17.

## Ordinary mode

Let $r=\pi\mathbf1$ and $q=\pi^T\mathbf1$ be current transported marginals.
On the new pricing candidates, evaluate the primal-consistent score

$$\widehat\sigma_{ij}=-\rho_a\log(r_i/a_i)-\rho_b\log(q_j/b_j)-c_{ij}.$$

Zero incident mass is interpreted by its one-sided infinite KL slope.
This check reuses the marginals and candidate costs already needed for coordinate gains; it adds no full scan.
The native scan's relative $\ell_2$ violation above tolerance $\tau$ implies a positive maximum-score floor $\eta_k=\tau(1+\sqrt{\mathrm{den\_sq}})/\sqrt{mn}$.
Keep ordinary mode when at least one new candidate has $\widehat\sigma_{ij}\ge\eta_k/2$ and the coordinate gain is numerically available.
Otherwise switch once for the current level; also switch if there are no new candidates despite failure to terminate.

Ordinary restricted solves retain the existing lower-bound check $L_k\ge G_k/2$ in addition to native KKT stopping.
A fixed positive primal-score margin and bounded primal level imply a uniform positive available coordinate gain, so accepted ordinary rounds cannot continue forever.
Attainability of the inner stopping contract remains an assumption on the restricted method, not a consequence of native KKT tolerance alone.

## Exceptional stabilized mode

Write $z=(f,g)$, let $D$ be the original KL-UOT dual objective, and set $\Psi=-D$.
At a globally feasible center $\bar z$, solve restricted versions of

$$\max_z\ h_B(z)=D(z)-\mu B_\Psi(z,\bar z),\qquad f_i+g_j\le c_{ij},\quad \mu=\text{restricted tolerance}.$$

The original pairwise constraints, candidate scan, and incidence operator remain unchanged.
Only the node response changes to $(1+\mu)\nabla D(z)-\mu\nabla D(\bar z)$.
Initialize the center from the most recent raw potentials using full-feasibility repair; retain the current primal/support/warm start.

Each model solve meets model KKT at half the original tolerance and, when imposed, a feasible absolute model-gap budget $\delta$.
After the separate full scan, repair the trial potentials to full feasibility.
Return only when the original KKT tests pass; the experimental numerical implementation verifies the returned potentials with one additional terminal native scan.
Otherwise update the center when the trial's model KKT is within three quarters of tolerance and its actual original dual gain satisfies

$$D(z)-D(\bar z)\ge\tfrac12\big[(1+\mu)B_\Psi(\bar z,z)+\mu B_\Psi(z,\bar z)\big].$$

If this test fails, retain the center, keep the newly enriched support, and quarter the gap budget.
Reset center/gap control at the next hierarchy level.
These are model-refinement iterations, with no residual-history rollback.

## Compact presentation for the paper

The following is a presentation skeleton; the appendix must specify the stabilized stopping, repair, center acceptance, and error-budget rules above.

```text
for each hierarchy level:
    mode <- ordinary
    repeat:
        solve the restricted problem under the contract for mode
        scan the full space and obtain a candidate batch
        if original KKT stopping holds: finish this level
        if mode is ordinary and the candidate margin fails:
            initialize stabilized mode
        update the active support and mode state
```

This keeps restricted solving and pricing separate.
The exceptional model cannot be hidden completely from the algorithm definition if its theorem is claimed for the implemented algorithm.

## Conditional theorem scope

For a fixed finite problem, assume positive reference masses, finite costs, and positive original tolerances.
Assume ordinary solves attain the native-KKT plus sufficient-progress contract, and stabilized solves attain their model-KKT and every positive model-gap budget.
Retain a maximally violated edge in the pricing batch and preserve its insertion through pruning.
Use cost-and-marginal-preserving sparsification to retain a primal model bound and the stated linear support budget.

Under exact arithmetic, the specified hybrid scheme terminates after finitely many restricted solves and scans at the original KKT tolerance.
The argument combines finite ordinary-mode progress, finite rejected phases from summable model errors, and finite accepted-center progress from Bregman energy.
It requires neither exact restricted solutions nor monotone full dual violation.

The proof does not give a useful uniform iteration bound, a lower bound on the FP64 gap budget, or convergence of every practical PDUOT restart/controller combination.
Positive anchor-response underflow and an unattainably small error budget are explicit numerical failure conditions.
The research implementation reports these failures rather than silently treating them as convergence.

## Evidence

Artifacts are in `experiments/refinement_forcing_uot/results/`.

| Check | Outcome | Scope |
|---|---|---|
| Unconditional stabilization, sparse captured master, small $\rho$ | 3,240 to 7,060 iterations | Reason to avoid unconditional activation |
| Integrated normal path, TOME $n=4096$ | 30/30 pass; 0 triggers / 63 checks | One penalty has +3.08% inner iterations; timing varies |
| Integrated normal path, TOME $n=16384$ | 20/20 pass; 0 triggers / 54 checks | Identical inner/outer counts; timing within ordinary variability |
| Integrated forced switch, $n=128$, five penalties | 5/5 original KKT pass | Branch validation, not natural trigger frequency |
| Constructed admissible inexact output | Natural margin switch; final KKT $3.92\times10^{-5}$ | Not an actual PDUOT trajectory |

The ordinary-path measurements support modest overhead on these configurations.
They do not establish the runtime of a large naturally activated exceptional phase, whose experimental implementation currently uses a PyTorch reference solver.

## Integration assessment

The experimental controller is `experiments/refinement_forcing_uot/hybrid_stabilization.py`.
It temporarily adapts five hierarchy functions and restores them on exit.
A production port would require localized hierarchy integration and node-prox/certificate changes; modifying the scan alone is insufficient.
The next decision is whether this exceptional-phase complexity is acceptable in exchange for the conditional theorem.
Production integration is not part of this investigation.
