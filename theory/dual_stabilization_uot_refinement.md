# Dual stabilization for UOT refinement

Research status: 2026-10-20. Production code and the manuscript are unchanged.

## 1. Question and current answer

The author's four requirements are concise paper presentation, localized code changes, no material degradation on normal solves, and finite refinement to the original KKT tolerance with inexact restricted solves.
Ordinary fluctuations of full dual violation are allowed.
An arbitrary moving-window contraction test does not distinguish healthy oscillation from genuine failure.

Column-generation stabilization provides a useful alternative framework: keep a stability center and control a proximal model, rather than require the full dual violation to decrease every few iterations.
Its convergence results require attention to which object is approximate: pricing, restricted-master solution, or both.
They cannot be applied directly to PDUOT's native KKT stopping rule.

Section 12 now gives a conditional finite-refinement construction with moving centers, approximate restricted solves, summable gap budgets inside rejected phases, and cost-preserving sparsification.
Sections 15--17 record the standalone phase, production normal-path timing, and integrated experimental hierarchy controller.
Unconditional stabilization is discouraged by its observed sparse-instance slowdown.
The current candidate is a mathematical pricing-margin trigger followed by stabilized refinement only when needed; both branches are now wired into one experimental hierarchy controller, without editing production files.
The concise recommendation and its limitations are in `dual_stabilization_recommendation.md`.
No convergence theorem or runtime benefit is claimed for unchanged production.

## 2. Relevant literature and its scope

1. [du Merle et al., Stabilized column generation (1999)](https://www.sciencedirect.com/science/article/pii/S0012365X98002131): introduces an LP stabilization framework through perturbations and penalties. Publisher abstract and metadata checked; full proof not reviewed here.
2. [Pessoa et al., Automation and Combination of Linear-Programming Based Stabilization Techniques in Column Generation (2018)](https://pubsonline.informs.org/doi/10.1287/ijoc.2017.0784): combines price smoothing and penalty-based stabilization with self-adjusting mechanisms. The author links a [HAL preprint](https://hal.inria.fr/hal-01077984v2), but the institutional PDF was access-blocked during this investigation. Consequently this note does not rely on an unverified detailed mispricing or termination rule from that paper.
3. [Ben Amor and Desrosiers, A proximal trust-region algorithm for column generation stabilization (2006)](https://doi.org/10.1016/j.cor.2004.08.003): proximal penalties and trust regions organize the dual search. The publisher introduction describes stabilized subproblems solved to optimality; this is a different assumption from fixed native PDUOT error.
4. [Gondzio, Gonzalez-Brevis and Munari, Large-scale optimization with the primal-dual column generation method](https://webhomes.maths.ed.ac.uk/~gondzio/reports/pdcgmDemo.pdf): Section 3 uses feasible, well-centered, inexact primal-dual master solutions and tightens their objective-gap tolerance with a global bound gap. This supports inexact masters, but not arbitrary fixed KKT errors.
5. [Kiwiel and Lemarechal, An inexact bundle variant suited to column generation](https://rcin.org.pl/Content/139759/PDF/RB-2007-72.pdf): accepts an inexact function/subgradient oracle and uses a known Slater point, serious/null steps, and cut aggregation. Its model master is a separate proximal problem. Algorithm 4.1 includes noise attenuation; Theorem 5.8 assumes its inner loop terminates. Fixed oracle noise enters the final feasibility bound.

The important conceptual distinction is that a bundle null step retains the center while enriching the model.
It need not discard useful progress merely because a recent raw residual increased.
This is more directly connected to optimization geometry than a heuristic residual window.

## 3. Why KL-UOT can still benefit from stabilization

For positive reference masses and finite potentials, define

$$D(f,g)=\rho_a\sum_i a_i(1-e^{-f_i/\rho_a})+\rho_b\sum_j b_j(1-e^{-g_j/\rho_b}).$$

The dual constraints are $f_i+g_j\le c_{ij}$.
Write $z=(f,g)$ and let $\mathbf A$ map edge flows to the concatenated source and target marginals, following `TERMINOLOGY.md`.
The dual gradient is the concatenated response vector.
Its negative Hessian is diagonal, with entries $a_i e^{-f_i/\rho_a}/\rho_a$ and $b_j e^{-g_j/\rho_b}/\rho_b$.

Thus the KL dual is strictly concave wherever its potentials are finite, unlike an LP dual with a flat optimal face.
Its curvature can nevertheless be extremely small at tiny responses.
A small absolute marginal-response defect can coexist with a large error in a potential.
Stabilization therefore has a plausible role, although the mechanism differs from simplex degeneracy.
Strict concavity on its own supplies neither an iteration-independent useful curvature constant nor a theorem for arbitrary inexact outputs and pruning.

### Price smoothing alone

For a center $\bar z$, smoothing would price with $\widetilde z=(1-\theta)\bar z+\theta z$.
This costs only $O(m+n)$ outside the scan and uses linear memory.
It can alter candidate selection without changing the restricted solver.

However, smoothing can hide a raw violation: with one edge of cost 1, center $(0,0)$, raw potentials $(1,1)$, and raw weight $\theta=1/4$, the smoothed score is $-1/2$ while the raw score is 1.
This is an algebraic example, not an actual PDUOT execution or a performance experiment.
A scan of the smoothed potentials does not verify the original PDUOT output.
The corresponding primal marginal consistency must also be checked if the smoothed potentials themselves are returned.

Consequently smoothing is a candidate heuristic, not a resolution of the fixed-inexact-master issue.

## 4. Fixed-center proximal model

Fix a center $\bar z$ and a strength $\mu>0$ throughout the phase under consideration.
Define

$$h(z)=D(z)-\frac{\mu}{2}\|z-\bar z\|_2^2,\qquad H(\mathcal A)=\max_{\mathbf A_{\mathcal A}^{\mathsf T}z\le c_{\mathcal A}}h(z).$$

The function $h$ is globally $\mu$-strongly concave.
Its quadratic term makes every restricted maximum finite and attained, including supports with isolated nodes.

For a marginal coordinate with reference $a$, coefficient $\rho$, and center $\bar f$, the stabilized primal marginal term is

$$F_{\mu,\bar f}(r)=\sup_f\left\{\rho a(1-e^{-f/\rho})-rf-\frac{\mu}{2}(f-\bar f)^2\right\}.$$

Its unique maximizer solves

$$r=a e^{-f/\rho}-\mu(f-\bar f).$$

The stabilized primal upper bound is

$$Q_{\mathcal A}(x)=c_{\mathcal A}^{\mathsf T}x+\sum_iF_{\mu,\bar f_i}((\mathbf A x)_i)+\sum_jF_{\mu,\bar g_j}((\mathbf A x)_{m+j}),\qquad x\ge0.$$

This differs from the original restricted UOT objective.
The node equations remain separable and monotone, which makes GPU implementation plausible, but neither its implementation cost nor performance has been established.

## 5. Fixed-center finite-separation lemma

This is a derivation for this investigation, not a novelty claim.

Suppose at iteration $k$ the master returns a feasible dual $z_k$ and a nonnegative primal multiplier $x_k$ with

$$0\le Q_{\mathcal A_k}(x_k)-h(z_k)\le\delta.$$

The accuracy is a stabilized-model primal-dual gap, not the native normalized KKT residual.
Let $\eta>0$ be a fixed absolute edge-violation threshold and require

$$\delta\le\frac{\mu\eta^2}{64}.$$

If pricing finds an edge with $v_k=(\mathbf A^{\mathsf T}z_k-c)_{e_k}>\eta$, retain the support of a nonnegative sparsification of $x_k$ preserving $\mathbf A x_k$ and $c^{\mathsf T}x_k$, and add $e_k$.
Other retained or inserted edges are allowed.
Then

$$H(\mathcal A_k)-H(\mathcal A_{k+1})\ge\frac{\mu\eta^2}{8}.$$

### Proof

Let $\mathcal R_k\subseteq\mathcal A_k$ be the retained old edges.
Cost-and-marginal preservation leaves $Q(x_k)$ unchanged, while $z_k$ stays feasible on $\mathcal R_k$.
Weak duality gives

$$h(z_k)\le H(\mathcal A_k)\le H(\mathcal R_k)\le Q(x_k),\qquad H(\mathcal R_k)-H(\mathcal A_k)\le\delta.$$

Let $z_k^*$ maximize $h$ over $\mathcal R_k$.
Strong concavity and the first-order optimality inequality imply

$$\|z_k-z_k^*\|_2\le\sqrt{2\delta/\mu}.$$

An edge normal has Euclidean norm $\sqrt2$.
Its violation at $z_k^*$ is at least $v_k-2\sqrt{\delta/\mu}$.
Every point feasible on $\mathcal A_{k+1}$ must therefore be at distance at least $(v_k-2\sqrt{\delta/\mu})/\sqrt2$ from $z_k^*$.
Applying strong concavity on the retained feasible set yields

$$H(\mathcal R_k)-H(\mathcal A_{k+1})\ge\frac{\mu}{4}(v_k-2\sqrt{\delta/\mu})^2\ge\frac{9\mu\eta^2}{64}.$$

Subtracting the possible increase from deleting old constraints proves the claim.
This argument does not require the successive raw violations to decrease.

Choose any globally feasible finite $z^{\mathrm{feas}}$.
It is feasible on every active support, so $H(\mathcal A_k)\ge h(z^{\mathrm{feas}})$.
Consequently the number of nonterminal expansions at this fixed center is at most

$$N\le\left\lfloor\frac{8[H(\mathcal A_0)-h(z^{\mathrm{feas}})]}{\mu\eta^2}\right\rfloor.$$

Replacing $H(\mathcal A_0)$ by the available initial $Q(x_0)$ gives a computable, possibly loose upper bound.
For a uniform full-scan relative L2 tolerance $\tau$, a conservative absolute threshold is $\eta=\tau(1+\|C\|_F)/\sqrt{mn}$.
Failure of that full test implies that the maximum positive edge score exceeds $\eta$.
The implementation must actually retain a globally sufficiently violated edge; arbitrary candidate truncation is an additional condition.

### Memory and sparsification

The existing two-pass UOT sparsification preserves both marginals and transport cost.
It therefore preserves $Q(x)$ at a fixed center and $\mu$, as well as its gap with a fixed feasible $z$.
Its positive-support bound is $2(m+n-1)$.
Retaining that support plus the bounded batch of new pricing edges uses linear memory, with the usual allowance for structural edges.
The lemma explicitly accounts for the increase in the dual model optimum caused by deleting zero-multiplier constraints.
It does not assume that pruning leaves the entire feasible set unchanged.

## 6. Original KKT and the proximal bias

At an exact stabilized master solution, the original marginal defects are

$$r_i-a_i e^{-f_i/\rho_a}=-\mu(f_i-\bar f_i),\qquad q_j-b_j e^{-g_j/\rho_b}=-\mu(g_j-\bar g_j).$$

Even complete dual feasibility at one fixed center does not remove these defects.
Returning that point as an original-UOT KKT solution would be incorrect.

A complete method needs a moving-center mechanism, such as a proximal-point or serious/null-step construction, plus explicit control of its original-problem residual.
Its theorem must also account for inexact master solves and any full-feasibility repair at center updates.
The fixed-center descent proof cannot simply be summed after changing the center, because $h$ then changes.
Likewise, choosing an arbitrarily small $\mu$ weakens both curvature and the allowed model-gap threshold.

### A complete but conservative single-center route

There is a simple way to bound the bias without updating the center.
Choose a globally feasible finite center $\bar z$ and let

$$D_{\max}=\rho_a\sum_i a_i+\rho_b\sum_j b_j,\qquad M=D_{\max}-D(\bar z)>0.$$

Every exact restricted maximizer $z^*$ has $h(z^*)\ge h(\bar z)=D(\bar z)$.
Since $D(z)\le D_{\max}$ for every finite $z$,

$$\mu\|z^*-\bar z\|_2\le\sqrt{2\mu M}.$$

For a desired absolute marginal-defect budget $\kappa>0$, choose

$$\mu\le\frac{\kappa^2}{8M}.$$

Then the exact stabilized master optimum has original marginal-defect norm at most $\kappa/2$, zero restricted dual infeasibility, and exact complementary slackness.
This controls the marginal component, but the current native KKT test also includes a split gap and needs an additional bound.
At the exact stabilized optimum that split-gap numerator is $|z^{\mathsf T}(\mathbf A x-\nabla D(z))|$, not zero automatically.

Assume every restricted support covers all vertices and all costs are bounded above by $c_{\max}$.
Writing reference entries and coefficients as $a_\ell,\rho_\ell$ in concatenated coordinates, the common superlevel condition $D(z^*)\ge D(\bar z)$ implies

$$z_\ell^*\ge L_\ell=-\rho_\ell\log\frac{M}{\rho_\ell a_\ell}.$$

Restricted feasibility and vertex coverage give upper bounds $U_i=c_{\max}-\min_j L_{m+j}$ for source vertices and $U_{m+j}=c_{\max}-\min_i L_i$ for target vertices.
Let $R^2=\sum_\ell\max\{L_\ell^2,U_\ell^2\}$, so $\|z^*\|_2\le R$ independently of the support and $\mu$.
The sufficient strengthened choice

$$\mu\le\frac{\kappa^2}{8M\max\{1,R\}^2}$$

controls both the absolute marginal-defect norm and split-gap numerator by $\kappa/2$.
The native normalization denominators are at least one, and stationarity is exact at the stabilized optimum.
Thus this strengthened choice supplies a strict margin for all three native tests.
This coverage condition and split-gap factor were missing from the first draft of the conservative closure; bounding the marginal defect alone did not justify the earlier all-KKT claim.
These are sufficient conservative choices, not production defaults.

Assume the restricted method converges to its stabilized primal-dual optimum, and return only when both its stabilized gap is at most $\delta\le\mu\eta^2/64$ and its original restricted KKT test passes.
These requirements are attainable with nonzero numerical error because the exact optimum has a strict marginal-error margin and the other residuals vanish.
The fixed-center lemma then proves finite expansion until the original full scan passes.
The final point satisfies the original restricted KKT and full-scan tests by construction.
No restricted problem is assumed solved exactly; convergence and attainability of the stated stopping tests are assumptions on the inner method.

The difficulty is quantitative: with normalized masses of total one on each side, $\rho_a=\rho_b=1$, nonnegative costs, and $\bar z=0$, we have $M=2$.
Even the preliminary marginal-only choice at $\kappa=\eta=10^{-6}$ gives $\mu=6.25\times10^{-14}$ and $\delta\le9.77\times10^{-28}$.
Accounting for the split-gap factor can further tighten this sufficient accuracy bound.
The descent condition is mathematically positive but the requested absolute model gap is far below the ordinary FP64 objective-subtraction resolution in this setting.
This does not prove all stabilized formulations need such accuracy; it shows that this sufficient bound fails the practical-efficiency criterion.
No experiment below attempts to attain this extreme tolerance.

### Remaining practical issues

- Replace the conservative small-$\mu$ route by a moving-center or relative-error construction with useful constants.

- Translate the model-gap accuracy into a condition PDUOT can meet cheaply, or implement a controlled stabilized PDUOT variant.
- Give a center-update rule and finite original-KKT theorem without a heuristic stagnation window.
- Ensure feasibility repair, original complementary stationarity, and original marginal consistency, rather than checking pricing alone.
- Test whether the stabilized solves and center updates increase ordinary iterations or scans materially.

The previous fixed-objective coordinate safeguard and its finite-termination result remain a separate alternative.
No conclusion here invalidates its proof; the user's objection concerns its detector and performance behavior.

## 7. Numerical algebra probe

Script: `experiments/refinement_forcing_uot/dual_stabilization_probe.py`.
Results: `experiments/refinement_forcing_uot/results/dual_stabilization_probe.json`.

Run from the project root:

```bash
micromamba run -n cuda118_all python experiments/refinement_forcing_uot/dual_stabilization_probe.py --output experiments/refinement_forcing_uot/results/dual_stabilization_probe.json
```

This is a CPU algebra experiment using SciPy SLSQP for small stabilized masters, explicit dual-feasibility repair, nonnegative multiplier recovery, and independently evaluated primal upper bounds.
It does not benchmark PDUOT or implement the complete original-UOT solver.

The 72 cases use $m=n=8$, three seeds, symmetric $\rho\in\{0.01,0.1,1,10\}$, $\mu\in\{0.1,1,10\}$, $\eta=0.05$, and two accuracy regimes.
One regime uses the numerical master solution directly; the other deliberately lowers its feasible potentials until the model gap consumes 80% of the allowed fixed error budget.
All master gaps met $\delta=\mu\eta^2/64$.
There were 36 nonterminal expansions in total, with at most three per case, and all checked certified model decreases exceeded the derived lower bound.
These tiny cases did not exhibit increasing successive maximum violations, so they do not empirically demonstrate stabilization of oscillatory production trajectories.

Using production sparsification on a separate dense $12\times12$ coupling reduced 144 positive entries to 44 and changed the stabilized primal objective by $2.84\times10^{-14}$.
The fixed-center terminal original marginal-defect norm ranged from about 0.0143 to 0.569, confirming the need to handle proximal bias before claiming original KKT convergence at a practical stabilization strength.

## 8. Recommendation

Keep the ordinary solver as the default path.
The proximal/bundle derivation gives a principled exceptional phase that permits nonmonotone raw violations, inexact subproblems, and linear active-support storage.
Its ordinary-path activation should be based on the mathematical pricing margin, not a residual-window stagnation detector.
The hybrid framework still needs integration and exceptional-path testing in the real hierarchy.
Do not replace production refinement based on the isolated master benchmarks.

## 9. A KL-aware moving-center model

The following derivation and prototype were added after the fixed-center study.
Let $\Psi(z)=-D(z)$ and use its Bregman divergence with the explicit orientation

$$B_\Psi(z,\bar z)=\Psi(z)-\Psi(\bar z)-\langle\nabla\Psi(\bar z),z-\bar z\rangle.$$

The alternative stabilized dual is

$$h_B(z)=D(z)-\mu B_\Psi(z,\bar z)=(1+\mu)D(z)-\mu D(\bar z)-\mu\langle s(\bar z),z-\bar z\rangle,$$

where $s(z)=\nabla D(z)$ denotes the original concatenated marginal response.
Its marginal relation is

$$\mathbf A x=(1+\mu)s(z)-\mu s(\bar z).$$

This supplies a KL-aware alternative to the Euclidean relation $\mathbf A x=s(z)-\mu(z-\bar z)$.
The scalar $\mu$ here is dimensionless and is not numerically comparable to a Euclidean penalty strength.

### Local implementation structure

Define $t=\mathbf A x+\mu s(\bar z)$ and $a'=(1+\mu)a$ coordinatewise.
Up to the center-dependent constant, the corresponding primal marginal penalty is

$$\sum_\ell\rho_\ell\operatorname{KL}(t_\ell\mid a'_\ell),\qquad K_{\bar z}=\mu\langle s(\bar z),\bar z\rangle-\mu D(\bar z).$$

Its dual prox uses the same exponential/Lambert-W structure as PDUOT.
In the native sign convention $y=-z$, the modified node update would use $q=y+\sigma(\mathbf A x+\mu s(\bar z))$ and reference $(1+\mu)a$.
Thus this variant needs an anchored response vector and a nodewise offset; it does not require an entirely new scalar nonlinear solver.
The native source was inspected at `src/hier_uot/_native/pdhg/kl_uot/solver.cu`, specifically the `dual_prox_halpern_kernel` family.
No native kernel was modified.
The stopping diagnostics, controllers, and translations would still need a model-aware audit; changing the prox alone would be insufficient.

As before, any nonnegative coupling sparsification preserving $\mathbf A x$ and $c^{\mathsf T}x$ preserves the fixed-center model primal objective and gap.
This does not imply that the model objective is unchanged after changing the center.

### Exact complete-proximal-step contraction

Let $K$ be the full dual feasible set and let $z^*$ minimize $\Psi$ on $K$.
Consider complete proximal steps

$$z^{k+1}=\arg\min_{z\in K}\{\Psi(z)+\mu B_\Psi(z,z^k)\}.$$

At an exact step, the first-order normal-cone inequality and the Bregman three-point identity give

$$\Psi(z^{k+1})-\Psi(z^*)+(1+\mu)B_\Psi(z^*,z^{k+1})+\mu B_\Psi(z^{k+1},z^k)\le\mu B_\Psi(z^*,z^k).$$

Since complete-step feasibility makes the objective difference nonnegative,

$$B_\Psi(z^*,z^{k+1})\le\frac{\mu}{1+\mu}B_\Psi(z^*,z^k).$$

This exact-step contraction has no Euclidean strong-concavity constant depending on the smallest marginal response.
It is an application of standard Bregman proximal geometry, not a verified novelty claim.
It helps explain the prototype's different behavior across penalty strengths.

This is not yet the requested inexact refinement theorem.
It assumes a complete, globally feasible proximal step, whereas intermediate restricted solutions can be globally infeasible.
Moreover, $h_B$ has no global Euclidean strong-concavity constant, so Section 5's Euclidean lemma cannot simply be reused with the same $\mu$.
The production use case requires a finite sparse separation argument for this geometry and a nonzero inexactness condition that does not lose the contraction or force impractical accuracy.

For comparison, [Chen et al., An inexact Bregman proximal point method and its acceleration version for unbalanced optimal transport](https://arxiv.org/html/2402.16978v1) applies a primal coupling-entropy proximal construction and solves its subproblems using scaling.
Its Section 3 gives an explicit epsilon-subdifferential error condition and a summability assumption for asymptotic convergence.
That is a different proximal variable and does not establish our sparse dual-stabilized refinement theorem.

### Moving-center prototype and metric checks

Files:

- `experiments/refinement_forcing_uot/moving_center_probe.py`
- `experiments/refinement_forcing_uot/test_moving_center_probe.py`
- `experiments/refinement_forcing_uot/results/moving_center_probe_three_seeds.json`

The prototype performs small CPU restricted master solves, bidirectional candidate insertion, and deletion of zero-multiplier edges.
It updates the center only after the maximum full violation is at most $10^{-8}$, with a tiny feasibility shift.
The original UOT stopping tolerance is $10^{-4}$.
It checks marginal residual, complementary stationarity, and the same split-gap formula used in production.
Nine tests passed, including direct comparison against `evaluate_certificate`, model stationarity, and the direction of the exact-step contraction identity.

Three seeds, four symmetric penalty pairs and $(0.045,99.995)$ give fifteen cases per geometry/strength.
The observed results were:

| Geometry | Strength | Original KKT reached | Master solves per case |
|---|---:|---:|---:|
| KL-Bregman | 0.1 | 15/15 | 4--10 |
| KL-Bregman | 1 | 15/15 | 11--16 |
| Euclidean | 0.1 | 14/15 | 7--102 |
| Euclidean | 1 | 5/15 | 29--106 |

The cap was 100 center updates; some cases use more than 100 master calls because separation can require multiple solves at one center.
The unsuccessful cases are cap hits, not proven nonconvergence.
The master solver was high-accuracy SLSQP; observed model gaps were at most about $1.1\times10^{-9}$ across these runs.
Therefore these results validate the algebra and basic moving-center behavior, not robustness to native-tolerance inexact PDUOT outputs or production GPU efficiency.
An unstabilized comparison is recorded separately in `moving_center_with_baseline.json`.

### Unstabilized control and performance implication

The matched control sets $\mu=0$ in the same CPU master and keeps all other data and support-update rules fixed.
All fifteen controls reached original KKT tolerance.
Median master-call counts were 3 without stabilization, 6 for KL-Bregman strength 0.1, and 12 for KL-Bregman strength 1.
Median total SLSQP iterations were respectively 94, 109, and 182.
These are not PDUOT iteration counts or GPU runtimes.
They show that the moving-center construction adds work on these already easy, accurately solved cases.
The evidence currently favors this geometry over Euclidean stabilization, but does not support enabling it unconditionally in hier_uot.

The next practical gate is an inexact-master test with errors at the intended native tolerance, followed by a localized experimental PDUOT implementation if that gate is informative.
The original four criteria remain unmet as a whole: the exact-step theory and local prox structure are promising, while native-error finite refinement and normal-path performance remain unresolved.

## 10. Response-L1 contraction with node errors

This is a separate conditional result, stronger than merely assuming exact master solutions, but it still requires exact edge normality.
Set $w=(f,-g)$, and write $K=\{w:w_i-w_{m+j}\le c_{ij}\}$.
For $\widetilde\Psi(w)=-D(f,g)$, let $p=\nabla\widetilde\Psi(w)=(-s_a,s_b)$.
Each coordinate of this gradient is strictly increasing in the corresponding coordinate of $w$.

The normal cone of this difference-constraint set satisfies

$$\langle\operatorname{sign}(w-w'),n-n'\rangle\ge0\quad\text{for }n\in N_K(w),\ n'\in N_K(w').$$

To verify this, represent the normals by nonnegative edge multipliers.
If the sign at an edge's source is larger than at its target, then $w_i-w_i'>w_j-w_j'$.
The constraint cannot be tight at $w'$ unless it is violated at $w$, so its multiplier at $w'$ is zero.
Its contribution to the displayed pairing is therefore nonnegative.
The opposite ordering gives the analogous result with the multiplier at $w$ equal to zero; equal signs contribute zero.

Suppose complete feasible steps satisfy, with nonzero node error allowed,

$$(1+\mu)p_{k+1}-\mu p_k+n_{k+1}=e_{k+1},\qquad n_{k+1}\in N_K(w_{k+1}).$$

Comparing to an original optimum $p^*$ and using coordinatewise monotonicity gives

$$\|p_{k+1}-p^*\|_1\le\frac{\mu}{1+\mu}\|p_k-p^*\|_1+\frac{\|e_{k+1}\|_1}{1+\mu}.$$

Consequently fixed $\|e_k\|_1\le\varepsilon$ gives a response-distance floor at most $\varepsilon$, without a reciprocal minimum-response curvature constant.
The original marginal defect is bounded by the node error plus $\mu\|p_{k+1}-p_k\|_1$.
This result alone does not prove native-tolerance refinement: native stopping controls L2-type quantities, and approximate complementary stationarity does not supply an exact normal $n_{k+1}\in N_K(w_{k+1})$.
Fifteen additional parameterized tests check this inequality with explicitly nonzero node forcing and high-accuracy edge normality.
Those checks are not actual PDUOT trajectories.

## 11. Computable center acceptance without exact edge normality

The following alternative avoids the exact-normal assumption for accepted centers.
Keep a full-feasible center $\bar z$ and obtain a full-feasible trial $z$ with coupling $x\ge0$.
A raw scanned trial can be made feasible by subtracting half its maximum full violation from every potential; the subsequent diagnostics must be recomputed at the repaired trial.
Define

$$s=s(z),\quad\bar s=s(\bar z),\quad e=\mathbf A x-[(1+\mu)s-\mu\bar s],\quad C=c^{\mathsf T}x-z^{\mathsf T}\mathbf A x\ge0.$$

Let

$$R=(1+\mu)B_\Psi(\bar z,z)+\mu B_\Psi(z,\bar z),\qquad E=C+\langle e,z-\bar z\rangle.$$

The Bregman identity and feasibility of the center give $D(z)-D(\bar z)\ge R-E$.
Thus $E\le R/2$ is a sufficient error test allowing nonzero node and edge errors.
It can be conservative, since the proof drops the old-center slack weighted by the new coupling.

The simpler and weaker direct test is

$$D(z)-D(\bar z)\ge\tfrac12R.$$

It costs $O(m+n)$ and does not need a primal objective, an exact master optimum, or an estimate of the smallest response.
Evaluate its left side stably as $-\sum_\ell\rho_\ell\bar s_\ell\operatorname{expm1}(-(z_\ell-\bar z_\ell)/\rho_\ell)$.
This avoids subtracting two nearly equal objective values.
The constant $1/2$ can be fixed in the algorithm; the test introduces no stagnation window or residual contraction threshold.

### Conditional finite accepted-center result

Assume each accepted trial is full feasible and meets the model's three KKT tests at half the desired original tolerance, using the same normalization convention as the prototype.
Accept center updates only with the direct gain test above, and test original KKT first.
Then the number of accepted center updates before original KKT termination is finite, provided every nonterminal phase actually supplies such an accepted trial in finitely many operations.

Proof: accepted center objectives increase by at least $R/2$ and are bounded above by $D_{\max}$, so the sum of their $R$ values is finite.
The full-feasible superlevel set $D(z)\ge D(z^0)$ is compact for positive reference masses and finite complete costs: lower potential bounds follow from the exponential terms, and upper bounds follow from full pairwise feasibility.
On this compact set, strict convexity of $\Psi$ implies that $R\to0$ forces successive potentials, and hence successive responses, to approach one another.
The difference between original and model marginal residuals is $\mu(s-\bar s)$, which vanishes.
The stationarity residual is unchanged.
The difference between original and model split-gap pairings is $\mu z^{\mathsf T}(s-\bar s)$, which also vanishes because potentials are bounded.
The strict half-tolerance margin therefore makes all original tests pass after finitely many accepted updates, a contradiction to an infinite nonterminal sequence.

This is a theorem about accepted centers, not yet a proof that the complete sparse algorithm produces each next center in finite time.
The remaining phase argument must handle candidate insertion, budgeted pruning, feasibility repair, and any accuracy tightening after a rejected trial.
In particular, taking a normal from an approximately complementary PDUOT output as exact would bypass a real gap.

### Controlled inexactness experiment

`moving_center_relative_half_tol.json` records 45 small cases at original tolerance $10^{-4}$, including the unstabilized control and Bregman strengths 0.1 and 1.
After each high-accuracy master solve, the diagnostic deliberately lowers its feasible dual potentials until the model KKT reaches $5\times10^{-5}$, retaining the primal coupling.
This is an admissible-error experiment, not a simulation of PDUOT's own iteration errors and not a proof for every admissible output.
All 45 cases reached original KKT tolerance.

There were 174 nonterminal center updates.
The conservative $E\le R/2$ test passed 144/174, whereas the direct gain test passed 174/174; the minimum actual-gain-to-$R$ ratio was approximately 0.647.
The script initially only audited these checks; it did not change a rejected trial's accuracy, so the conservative-test failures were not counted as algorithmic successes of that stronger guarded method.

### Tolerance-scale strength

The matched `moving_center_tolerance_scale.json` experiment compares $\mu=0$, $\mu=10^{-4}$, and $\mu=10^{-3}$ at original tolerance $10^{-4}$ with the same half-tolerance error injection.
All fifteen cases per setting reached original KKT tolerance.
For no stabilization and tolerance-scale stabilization, median master counts were both 3, total counts were 55 and 52, and median SLSQP iterations were 87 and 88.
No center update was needed in either of those two settings, so this experiment establishes neither the behavior nor the frequency of rare guarded center updates in production.
Strength $10^{-3}$ used 64 total masters and twelve center updates.

This suggests testing $\mu$ tied to the existing tolerance, rather than adding a freely tuned stabilization parameter.
At small responses, even a small coefficient can matter through the offset $\mu s(\bar z)$; at ordinary responses the modification is small.
This is a candidate setting, not a theoretical proof of unchanged runtime.

A separate 100-times-cost stress attempt is saved in `moving_center_tolerance_scale_largecost.json`.
The CPU SLSQP/NNLS prototype encountered exponential overflow or model-gap rejection on some of those cases, including the asymmetric penalties.
Those failures are retained as numerical failures, not hidden or counted as convergence, and cannot be attributed to PDUOT or to the mathematical model without a different numerical implementation.

The current next implementation target is an experimental PDUOT node-offset variant, with direct center-gain auditing and original KKT checking.
The finite rejected-phase argument and GPU/real-hierarchy performance are still required before recommending production integration.

## 12. Proposed finite rejected-phase construction

The following completes a conditional exact-arithmetic argument for a concrete stabilized algorithm.
It is not a theorem for the unchanged production implementation, and floating-point attainability of arbitrarily tightened gap budgets is a separate practical issue.

### Contract and algorithm

Fix the level, positive reference masses, finite costs, target original tolerance $\kappa>0$, and $\mu>0$.
Initialize a globally feasible center; zero is sufficient for the nonnegative ground costs used here.
The propagated hierarchy potentials may still be used as the inner warm start independently of that center.

For each center phase, use a positive finite gap budget $\delta_0$.
At each rejected phase iteration, replace $\delta$ by $\delta/4$ and keep the center fixed.
The initial budget can be obtained from the first finite model-gap evaluation; it need not be a new user-tuned parameter.
On acceptance of a new center, reset the gap budget for the new phase.

Require the restricted oracle to return $x\ge0$ and an active-support-feasible $z$, satisfying the model native tests at $\kappa/2$ and

$$Q_{\mathcal N}(x)-h_B(z)\le\delta.$$

Active-support feasibility may be obtained by a restricted dual repair, with all diagnostics recomputed at the repaired point.
Assume the restricted solver converges sufficiently to attain these two stopping requirements for every positive gap budget.
This is an assumption on the stabilized restricted solver; it does not assume exact restricted solutions.

FullScan returns the maximum raw violation $v$ and a bounded candidate batch containing a maximally violated edge when $v>0$.
Form a full-feasible trial $y=z-v\mathbf1/2$.
Return if $(x,y)$ passes the original KKT test.
Otherwise accept $y$ as the new center only if its model native tests are at most $3\kappa/4$ and

$$D(y)-D(\bar z)\ge\tfrac12[(1+\mu)B_\Psi(\bar z,y)+\mu B_\Psi(y,\bar z)].$$

On rejection keep the center and tighten the gap budget.
After either outcome, retain the positive support of a cost-and-marginal-preserving sparsification of $x$ and the pricing batch, together with any reserved structural edges.
There is one restricted solve and one full scan per nonterminal refinement iteration.
The integrated numerical controller performs an additional native full scan at a proposed terminal repaired point to verify the actual returned potentials.
Repeated rejected iterations are model-enrichment steps, not a rollback to the solution from an earlier residual window.

The different margins have a purpose: raw model KKT at half tolerance leaves room for the vanishing full-feasibility repair before the three-quarter trial check, and the trial check leaves room for vanishing proximal bias before original KKT termination.
They are fixed proof constants rather than residual-window hyperparameters.

### Finite phase proof

Suppose one center phase rejects forever.
Its error budgets are summable and tend to zero.
Let $H_k$ be the exact restricted maximum of the same fixed-center $h_B$ at iteration $k$.
The center is feasible on every support, so $H_k\ge D(\bar z)$.
Active feasibility and the certified model gap give $h_B(z_k)\ge D(\bar z)-\delta_0$.

For positive $\mu$ and positive anchor responses, $h_B$ is coercive: exponential terms control potentials tending to minus infinity and the negative linear anchor term controls potentials tending to plus infinity.
Thus these raw points and restricted maximizers belong to a common compact superlevel set.
On its convex hull, $h_B$ has a positive Euclidean strong-concavity constant $\lambda$.
The algorithm does not need to compute this possibly very conservative constant.

The support-deletion argument of Section 5 applies with that constant on this set.
Cost-preserving sparsification retains a primal upper bound and therefore loses at most $\delta_k$ in the exact restricted-model bound.
Inserting a maximally violated edge yields

$$H_k-H_{k+1}\ge\frac{\lambda}{4}(v_k-2\sqrt{\delta_k/\lambda})_+^2-\delta_k.$$

When $v_k=0$, the same inequality holds without any insertion.
The complete feasible center gives a common lower bound for $H_k$.
Summing the inequality and using summability of $\delta_k$ proves $v_k\to0$.
This argument allows nonmonotone individual raw violations and deletion of old constraints.

The full-feasible repairs $y_k=z_k-v_k\mathbf1/2$ therefore differ from the raw points by a quantity tending to zero.
Let $H_*$ be the complete stabilized optimum.
Restricted relaxation gives $H_k\ge H_*$, while $h_B(z_k)\ge H_k-\delta_k$ and $h_B(y_k)\le H_*$.
Continuity on the common bounded region implies $h_B(z_k)\to H_*$.
Strict concavity implies both $z_k$ and $y_k$ approach the unique complete stabilized optimum $z_*$.

If $z_*\ne\bar z$, its exact proximal step has a strictly positive $R_*$ and gain at least $R_*$.
Consequently the half-$R$ gain condition eventually passes.
The raw model KKT bound and the vanishing repair make the three-quarter trial model test pass as well.
This contradicts infinite rejection.
If $z_*=\bar z$, the proximal bias and repair vanish, so the original KKT test eventually passes from the raw half-tolerance margin instead.
Hence every phase terminates in finitely many iterations.

### Finite total refinement

Accepted full-feasible centers have a nondecreasing original dual objective and belong to a common compact superlevel set.
The sum of their accepted $R$ values is finite because each gain is at least $R/2$ and $D$ is bounded above.
With fixed positive $\mu$, infinitely many accepted centers would have vanishing successive potential and response differences.
The three-quarter model-KKT margin would then imply eventual original KKT termination, by exactly the residual comparison in Section 11.
Thus only finitely many centers are accepted.
Each phase is finite, so the total number of restricted solves and full scans is finite.

This argument does not use a uniform per-round raw-violation decrease, a minimum primal marginal, or exact restricted solves.
It does use a computable model-gap budget tightened after rejected trials, globally feasible center trials, and a convergent stabilized restricted oracle.
The precision budget is not derived from a worst-case numerical curvature constant, but the worst-case proof still does not bound how small it may become in FP64.

### Hard support budget

Two-pass sparsification retains at most $2(m+n-1)$ positive edges and preserves the fixed-center model primal bound.
Protecting those edges and a bounded pricing batch leaves linear active-support storage, with structural-edge capacity reserved as in hier_uot.
The maximal violating edge must remain protected until the next restricted solve.
Changing the graph normalization after pruning does not silently preserve native residual values; those tests are evaluated on the current graph at the next solve.

### Rejection-gate witness

The unit test `test_rejected_native_accurate_trial_can_be_excluded_by_gap_tightening` constructs a feasible trial whose model KKT is approximately $3.40\times10^{-5}$, below the half-$10^{-4}$ threshold, but whose original KKT is approximately $1.56\times10^{-4}$.
Its original dual objective increases, yet too little relative to its Bregman movement, so the center-gain condition correctly rejects it.
Its model gap is approximately $4.40\times10^{-6}$.
After a single quartering from twice that gap, this output is excluded and a different nonexact numerical master output meets both the gap budget and center acceptance.
This test exercises a genuine rejection gate; it does not simulate every step of a hard-budget production trajectory.

## 13. Experimental PyTorch PDUOT adapter

`experiments/refinement_forcing_uot/bregman_pduot.py` temporarily adapts the existing experimental PyTorch engine's node prox and certificates.
It adds the anchored response offset inside the node prox and scales the reference by $1+\mu$.
The incidence operator is unchanged and remains linear, including inside norm estimates and adaptive-step diagnostics.
Translation calibration is disabled for this adapter because its original unregularized formula would not optimize the stabilized model.
This adapter is single-threaded at the orchestration level and is not a production CUDA-kernel implementation.

Five adapter tests passed: zero-strength agreement with production's three original KKT metrics, three nonzero/zero-strength comparisons with independent SciPy model optima, and preservation of operator linearity.
The older experimental return structure names its split-gap stopping field `relative_raw_gap` in this adapter; the field is explicitly documented and is not interpreted as a primal-dual objective-error bound.
The actual feasible model primal-dual gap is recorded separately as `relative_certified_gap`.

### First serial GPU snapshot check

`benchmark_bregman_pduot.py` ran on idle physical GPU 2, one solve at a time, using the five saved $256\times256$ coarsest full-support problems from the real $n=65536$ hierarchy captures.
The same engine, warm starts, controller settings, and inner tolerance $5\times10^{-7}$ were used for both strengths.
The center was zero and the target original tolerance was $10^{-6}$.
The experiment cap was 20,000 inner iterations, not a convergence assumption.

| Penalties | Iterations, no stabilization | Iterations, $\mu=10^{-6}$ | Outcome |
|---|---:|---:|---|
| $(0.01,0.01)$ | 16,640 | 10,660 | Both original KKT pass |
| $(0.1,0.1)$ | 20,000 | 20,000 | Both capped, original KKT not reached |
| $(1,1)$ | 12,760 | 12,740 | Both original KKT pass |
| $(10,10)$ | 14,720 | 14,720 | Both original KKT pass |
| $(0.045,99.995)$ | 20,000 | 15,520 | Baseline capped; stabilized original KKT passes |

These are iterations of the existing experimental PyTorch engine, not the optimized production CUDA solver.
Single-run times are saved in `results/bregman_pduot_coarsest.json`; controller path changes and timing variation prevent claiming a systematic speedup from them.
The $(0.1,0.1)$ cap hits and the lack of same-level sparse-refinement tests remain limitations.
The model's benefit and production-path overhead are not established by this first GPU check.

The next evidence gate is a genuine sparse captured problem and an end-to-end experimental implementation of the center/phase contract, followed by a production-kernel-comparable measurement if warranted.

### Real sparse captured problems: a negative performance result

The serial GPU-2 run in `results/bregman_pduot_sparse_level6.json` uses the first $1024\times1024$ restricted problem at hierarchy level 6 for each penalty pair.
Supports contain approximately 25,000 edges rather than the complete million pairs.
All ten runs reached the original $10^{-6}$ KKT tolerance.

| Penalties | Inner iterations, no stabilization | Inner iterations, $\mu=10^{-6}$ |
|---|---:|---:|
| $(0.01,0.01)$ | 3,240 | 7,060 |
| $(0.1,0.1)$ | 3,800 | 3,960 |
| $(1,1)$ | 3,680 | 3,680 |
| $(10,10)$ | 9,420 | 9,440 |
| $(0.045,99.995)$ | 1,820 | 1,820 |

The small-penalty case is more than twice as many iterations, despite the tiny coefficient.
This is an actual sparse captured problem in the experimental PyTorch engine, not merely timing noise in the CPU toy solver.
Controller discontinuities may contribute, but this experiment does not isolate their cause.
Consequently unconditional stabilization is not supported by the no-normal-path-degradation criterion.
The earlier CPU equal-call-count observation cannot be extrapolated to production-like sparse solves.

## 14. Candidate localized fallback without a residual window

The sparse result motivates preserving the ordinary solver until a mathematical progress condition fails, rather than enabling the proximal model on every call.
The following hybrid is a proposed research direction, not an implemented end-to-end solver.

In normal mode, perform the ordinary restricted solve and full scan.
For returned new candidate edges, evaluate their primal-consistent score and one-dimensional feasible gain using the actual transported marginals.
Use a fixed positive score margin derived from the existing full-scan tolerance, for example half its implied maximum-edge score floor.
If at least one new candidate has that margin, require actual primal-objective decrease of at least half its coordinate gain on the next restricted solve.
Cost-preserving sparsification and zero-flow budgeted pruning keep the accepted objective unchanged.
If no candidate meets the margin, enter stabilized mode once, with a full-feasible center obtained from the existing scan or zero, while retaining the current primal and potentials as the inner warm start.
No residual-contraction window is used and no preceding segment of the ordinary optimization trajectory is rolled back.

### Why the normal phase can be finite with approximate solves

For fixed positive reference masses, finite nonnegative costs and a bounded primal objective level, all transported marginals are bounded above.
For one candidate edge with marginals $r,q$, define its exact nonnegative coordinate gain $G(r,q)$.
Restrict to scores at least $\eta>0$, interpreting a zero incident marginal by its infinite one-sided KL slope.
Equivalently,

$$r^{\rho_a}q^{\rho_b}\le a_i^{\rho_a}b_j^{\rho_b}\exp(-c_{ij}-\eta).$$

This describes a closed subset of the bounded marginal box.
The optimal added flow lies in a common finite interval, since its derivative is positive once the added flow exceeds $\exp((\rho_a\log a_i+\rho_b\log b_j-c_{ij})/(\rho_a+\rho_b))$.
The coordinate gain is therefore continuous, including at zero marginals, by maximization of a continuous function on that common compact interval.
It is strictly positive at every point of the score-margin set, so it has a positive minimum there.
Taking the minimum across the finite edge set gives a uniform $G_{\min}>0$.

Each accepted normal refinement then decreases the actual primal objective by at least $G_{\min}/2$.
Hence an infinite normal phase is impossible.
Exact restricted solutions are unnecessary: the coordinate trial already gives an attainable decrease, and a convergent restricted method can meet a strict half-gain requirement.
For the existing production positive-part lower bound, write $w=c-\mathbf A^Tz-s$ with $s\ge0$ and $s^Tx=0$ supplied by the primal projection.
Its expression is

$$L=s^Tx^{\mathrm{old}}+\sum_v\rho_v[\operatorname{KL}(r_v^{\mathrm{old}}\mid h_v)-\operatorname{KL}(r_v\mid h_v)]-\sum_e(w_e(x_e-x_e^{\mathrm{old}}))_+,$$

where $r=\mathbf A x$ and $h=\nabla D(z)$.
Expanding the KL terms gives $L\le\Phi(x^{\mathrm{old}})-\Phi(x)$; the difference is $\sum_e(-w_e(x_e-x_e^{\mathrm{old}}))_+$.
Along a convergent finite primal--dual sequence, $w\to0$ and bounded flows make this difference vanish.
Consequently $L$ approaches the true decrease, which is at least the available coordinate gain $G$ at the restricted optimum, and the strict $G/2$ test is attainable.
This is conditional on inner convergence and the projection identities; native KKT tolerance alone does not prove it.
If isolated nodes have diverging potentials, the finite-sequence argument does not directly apply: attainability of the stated stopping contract remains an explicit inner-oracle assumption, rather than a claim that every controller/restart configuration is proved convergent.

If normal mode terminates, the original solver's tests apply.
If it switches, the stabilized construction in Section 12 provides the conditional finite-termination route.
This would preserve ordinary maps until a genuine score-margin failure, rather than react to healthy full-violation oscillations.

### Evidence and unresolved gate

The earlier candidate-alignment audit found its half-floor margin satisfied at all 205 recorded nonterminal scans; that is encouraging for trigger rarity on those trajectories, not a universal guarantee.
The ordinary half-gain acceptance can itself require extra inner iterations and must be measured against current production behavior.
Section 15 implements the exceptional phase separately, including model-gap tightening, repaired-trial KKT tests, and center gain.
Section 17 now records integration with the ordinary hierarchy and validation of the actual switch.
The result is a conditional research candidate; large exceptional-phase performance and FP64 attainability are still limitations before production adoption.

## 15. Complete experimental stabilized phase

New files:

- `experiments/refinement_forcing_uot/bregman_refinement.py`
- `experiments/refinement_forcing_uot/run_bregman_refinement.py`
- `experiments/refinement_forcing_uot/test_bregman_refinement.py`

The driver keeps restricted solving and full scanning separate.
It performs one blocked scan per refinement round, inserts a bidirectional batch containing a global maximizer, compresses oversized positive flow supports with production sparsification, and prunes only zero flows.
The phase uses the actual model KKT and an additional absolute model-gap budget; a rejection quarters that budget and leaves the center unchanged.
Every successful exit recomputes original production KKT at the full-feasible repaired potentials.
The operator is supplied by a pair-cost callback, and full scanning uses $O(\text{block rows}\times n_t)$ scratch rather than storing all costs.
Small tests supply a dense cost matrix only as their input oracle.
Diagnostic traces are retained for research; a strict production working-memory implementation would bound or stream these logs.

### Numerical implementation corrections found by the driver

1. A single downward ULP after uniform dual repair did not always remove an edge violation caused by rounded arithmetic. The experimental restricted repair now applies one bounded additional rounding correction when needed; the full-trial repair includes a rounding margin without an extra full scan.
2. Model gap evaluation uses a sum of Fenchel gaps plus a nonnegative complementary term, rather than subtracting large primal and dual objectives. The KL term is evaluated from the log response, so a response exponential underflow does not create an artificial NaN.
3. The legacy PyTorch reference engine divided by zero for isolated-node Pock--Chambolle degrees. The temporary experimental adapter now leaves those zero incidence rows at a finite positive step. The production solver and legacy source files were not edited. A separate isolated-node regression checks the known finite stabilized solution.

The last issue caused three small-$\rho$ failures in the initial 15-case run.
Those failure artifacts are retained in `bregman_refinement_end_to_end.json` and `bregman_refinement_end_to_end_loggap.json`.
The authoritative post-fix run is `bregman_refinement_end_to_end_isolated_fix.json`: 15/15 cases reached original tolerance $10^{-4}$ with $m=n=8$, three seeds, and the same five symmetric/asymmetric penalty pairs.
It took 2--9 restricted solves/full scans per case, with 43 rejected center trials in total and no center updates; those rejections still enriched the support and tightened the gap budget.
The smallest requested gap in this run was approximately $2.24\times10^{-10}$.
This exercises rejected phases, but the lack of center updates means it alone does not validate the moving-center branch.

A second actual-PDUOT run, `bregman_refinement_strong_centers.json`, uses strength 0.1 at one seed for all five penalty pairs.
All five cases reached original KKT tolerance; they include eleven accepted center updates and seventeen rejected trials.
These are actual PyTorch iteration paths, not the synthetic-error or SciPy oracle.
The stronger setting is a branch-validation stress test, not the recommended default.

The unit suite also includes an independent SciPy admissible-error oracle that causes a deliberate center-gain rejection and then recovers under the tightened budget.
Separate tests trigger real CPU sparsification and check preserved model gaps, retained candidates, and linear support caps.
All these checks remain small-scale; the optimized CUDA solver is not being benchmarked by this phase driver.

## 16. Production normal-path timing and pricing-margin audit

Script: `experiments/refinement_forcing_uot/benchmark_pricing_margin_normal.py`.
Artifact: `experiments/refinement_forcing_uot/results/pricing_margin_normal_timing.json`.

The run uses the original production solver on the TOME $n=4096$ cases, tolerance $10^{-6}$, physical GPU 2, and three alternating repetitions of stock and sufficient-progress-plus-margin modes.
Dataset loading and warmup are outside the timer.
The margin check reuses the coordinate-gain calculation's marginals and candidate costs; it adds no full scan or pair-cost evaluation.
It is an audit that would report a fallback requirement, not an integrated fallback implementation.

All thirty solves converged and all 63 candidate-margin checks passed.
The production-source fingerprint was unchanged.

| Penalties | Stock inner iterations | Progress + margin inner iterations | Median runtime change |
|---|---:|---:|---:|
| $(0.01,0.01)$ | 19,170 | 19,760 | +6.24% |
| $(0.1,0.1)$ | 21,120 | 21,120 | -0.97% |
| $(1,1)$ | 30,670 | 30,670 | -0.10% |
| $(10,10)$ | 68,000 | 68,000 | +0.45% |
| $(0.045,99.995)$ | 35,990 | 35,990 | -0.21% |

All outer iteration counts were unchanged.
The small-penalty inner increase is approximately 3.08%; it comes from enabling the existing sufficient-progress condition and is distinct from the much larger unconditional-stabilization slowdown in the sparse master benchmark.
The other timing differences are small enough that noise remains a plausible explanation.
This supports a modest ordinary-path cost on this configuration, not a guarantee of zero overhead or a large-scale timing claim.

### Historical completion status before integration

- Paper presentation: the candidate can be described as ordinary sufficient-progress refinement with a mathematical margin gate and a stabilized exceptional phase; detailed phase logic can stay in an appendix. The complete pseudocode has not yet been distilled or reviewed with the author.
- Local code changes: the exceptional driver, node-prox adapter, and ordinary-path hooks all reside in experiments, and production is untouched. A single coherent hybrid controller still needs implementation.
- Normal performance: the first production audit is encouraging, with zero triggers and a maximum +6.24% median cost across five cases. More sizes and actual switched paths remain unverified.
- Finite original-KKT refinement: Section 12 provides the conditional exact-arithmetic exceptional-phase proof and Section 14 gives the normal-phase argument. The integrated implementation has not yet been verified to satisfy every premise, and FP64 gap/underflow limitations remain explicit.

These were the unresolved items at the component-audit stage; Section 17 supersedes this historical status.

## 17. Integrated controller and final research assessment

`experiments/refinement_forcing_uot/hybrid_stabilization.py` now connects ordinary native hierarchy solving, mathematical margin triggering, and the stabilized phase in a single experimental context.
It temporarily adapts five hierarchy functions, restores them on exit, and resets all center/gap state at each new level.
The native budgeted-pruning implementation is retained.
Production files, the manuscript, and the bibliography were not edited by this investigation.
The exceptional model currently uses the PyTorch reference engine, so its runtime is not a prediction for a future native CUDA implementation.

### Integrated branch validation

`hybrid_hierarchy_forced_n128.json` records five actual hierarchy solves at tolerance $10^{-4}$, with one explicitly forced switch per case.
All five return original KKT below tolerance and perform an actual final native verification scan.
The exceptional branch takes 1, 3, 3, 4, and 3 restricted solves respectively across the five penalty settings.
These forced tests validate branch execution; they do not measure natural trigger frequency.

`hybrid_margin_adversarial_witness.json` instead disables forced activation and injects one constructed admissible inexact restricted output into the real hierarchy.
Its restricted KKT is approximately $1.62\times10^{-37}$, while a missing edge has raw violation about 10 and the candidate's primal-consistent score is about -20.
The mathematical margin test activates the exceptional phase, which returns original KKT approximately $3.92\times10^{-5}$ and passes the terminal native scan.
This is a constructed oracle witness, not a naturally observed PDUOT trajectory or evidence of actual cycling.

### Ordinary-path timing at two sizes

`hybrid_normal_timing_n4096.json` uses three alternating repetitions per mode and penalty; all thirty solves pass, with zero activations over 63 checks.
Median timing changes relative to stock are +0.87%, +0.14%, +0.75%, +0.38%, and +1.61%.
At $(0.01,0.01)$, inner iterations increase from 19,170 to 19,760 (+3.08%); other inner counts and every outer count are unchanged.
The earlier nonintegrated audit showed +6.24% in that small-penalty timing, so sub-percent measurements should not be treated as precise overhead estimates.

`hybrid_normal_timing_n16384.json` uses two alternating repetitions per mode and penalty; all twenty solves pass with no activation over 54 checks.
Every inner and outer iteration count matches stock.
Median runtime changes range from -4.28% to -0.75%, which is compatible with timing variability and is not evidence of acceleration.
Both experiments use the original TOME preprocessing, target $10^{-6}$, serial jobs on physical GPU 2, and exclude loading/warmup.
They support modest normal-path overhead on the measured configurations; they do not establish a universal no-slowdown result.

### Assessment against the four requirements

1. Paper: the outer pseudocode can expose a single mathematical mode switch and keep center acceptance and gap tightening in an appendix. Whether this is sufficiently concise is an author judgment; the mechanism still has a genuine exceptional phase.
2. Code: experiments use a localized controller and node-prox adapter. A production port would touch the hierarchy integration plus the node prox/certificate layer, not merely the scan function.
3. Performance: measured normal paths have no major slowdown; unconditional stabilization has a real negative result. Large naturally triggered exceptional instances have not been timed.
4. Theory: Sections 12 and 14 give conditional exact-arithmetic finite refinement with inexact solves and sparse support, assuming the stated inner stopping contracts are attainable. Arbitrarily fixed native KKT error alone is insufficient. There is no proved FP64 lower bound on the eventual required gap budget.

The research question therefore has a conditional positive answer for a localized exceptional stabilization scheme, and a negative answer for simple smoothing or unconditional stabilization as a free convergence guarantee.
The experimental candidate is suitable for author review, not an already established theorem for unchanged production hier_uot.
