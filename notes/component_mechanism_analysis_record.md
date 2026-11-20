# Component and mechanism analysis: archived version

Archived on 2026-11-15 before the first compression of Appendix F.
The manuscript retains the component experiments and the shared-side response-stability result.
The auxiliary inheritance bound, response predictor, certificate interval, sampling counterexample, and associated synthetic diagnostics below are retained as research material; they are not production hierarchy operations.
The original compiled input and the F source are preserved separately below, including data provenance and pending-rerun comments.
References in these TeX fragments use manuscript labels.

## Original inter-level theory

```
% CN: 层间稳定性命题的证明，以及更精细的诊断与预测。
% EN: Proof of inter-level stability and sharper diagnostics and prediction.
\providecommand{\uotHierarchyH}{\mathcal H}
\subsection{Inter-Level Response Stability for KL-UOT}
\label{app:uot-hierarchy-stability}
\subsubsection{Setting and the mass--shape decomposition}
Consider $\Phi_a(X)=\langle C,X\rangle+\rho_a\operatorname{KL}(X\mathbf1\mid a)+\rho_b\operatorname{KL}(X^\top\mathbf1\mid b)$, where $a,b$ are strictly positive, the cost is finite, and $\rho_a,\rho_b>0$.
The coupling itself is not entropy regularized.
An inheritance step changes the source instance while keeping target locations and $b$ fixed.
This includes a coarse-to-fine source augmentation; the opposite direction follows by exchanging the marginals.
Let $q^\star$ be the finer optimal target marginal and $p^\star=q^\star/\|q^\star\|_1$.
From a coarse target potential $g^0$, form $q^0_j=b_j\exp(-g^0_j/\rho_b)$, $M_0=\|q^0\|_1$, and $p=q^0/M_0$.
The coarse potential need not be exactly optimal.
For a target potential $\mathbf g$, the normalized response is
\begin{equation*}
p_j(\mathbf g)=\frac{b_j e^{-g_j/\rho_b}}{\sum_k b_k e^{-g_k/\rho_b}}
\end{equation*}
This separates the response shape from total transported mass and is invariant under scalar translations of $\mathbf g$.
We use $H^2(p,z)=\sum_j(\sqrt{p_j}-\sqrt{z_j})^2$ and $J(p,z)=\operatorname{KL}(p\mid z)+\operatorname{KL}(z\mid p)$ for probability vectors.

\begin{lemma}[Mass and shape]
The normalized optimal coupling minimizes $\Phi_a$ over unit-mass couplings.
Consequently, if
$$\uotHierarchyH_a(z)=\inf_{X\geq0,\ X^\top\mathbf1=z}\{\langle C,X\rangle+\rho_a\operatorname{KL}(X\mathbf1\mid a)\},$$
then $p^\star$ minimizes $F_a(z)=\uotHierarchyH_a(z)+\rho_b\operatorname{KL}(z\mid b)$ over the probability simplex.
\end{lemma}
\begin{proof}
For a unit-mass coupling $Z$, $\lambda>0$, and $K=\rho_a\|a\|_1+\rho_b\|b\|_1$,
$$\Phi_a(\lambda Z)=\lambda\Phi_a(Z)+(\rho_a+\rho_b)\lambda\log\lambda+(1-\lambda)K.$$
Its minimum over $\lambda$ is strictly increasing in $\Phi_a(Z)$.
The marginal formulation follows by minimizing over couplings at fixed target shape.
\end{proof}

\subsubsection{An a priori interaction bound}
For two source instances with a common target set, take their union as the source index set and define the rectangular cost oscillation
$$\Gamma=\max_{i,i',j,j'}|C_{ij}-C_{ij'}-C_{i'j}+C_{i'j'}|.$$

\begin{proposition}[Shared-side response stability]
\label{prop:uot-hierarchy-stability}
\label{prop:uot-hierarchy-interaction}
Let $p^0,p^1$ be the normalized optimal target marginals of any two such source instances with the same $b$ and $\rho_b$.
Then
$$H^2(p^0,p^1)\leq2\left[1-\operatorname{sech}\!\left(\frac{\Gamma}{4\rho_b}\right)\right]\leq\frac{\Gamma^2}{16\rho_b^2}.$$
In particular, for squared Euclidean cost, $\Gamma\leq2\operatorname{diam}(S)\operatorname{diam}(T)$.
For separable cost $C_{ij}=u_i+v_j$, the target-response shape is exactly $p_j\propto b_j e^{-v_j/\rho_b}$ and is unchanged by source subsampling or source reweighting.
The first bound is sharp over pairs of source instances.
\end{proposition}
\begin{proof}[Proof of Proposition~\ref{prop:uot-hierarchy-stability} and the additional claims]
Positive optimal target marginals imply $g_j=\min_i(C_{ij}-f_i)$.
Thus each difference $g_j-g_{j'}$ lies between the minimum and maximum of $C_{ij}-C_{ij'}$ over the available source indices.
Using the union of both source sets gives $\operatorname{osc}(g^1-g^0)\leq\Gamma$.
The normalized log-likelihood ratio therefore has oscillation at most $D=\Gamma/\rho_b$.

For completeness, let $x_j=\sqrt{p^1_j/p^0_j}\in[\alpha,\beta]$, with $\beta/\alpha\leq e^{D/2}$.
Since $\mathbb E_{p^0}x^2=1$ and $(x-\alpha)(x-\beta)\leq0$,
$$\mathbb E_{p^0}x\geq\frac{1+\alpha\beta}{\alpha+\beta}\geq\operatorname{sech}(D/4).$$
The final inequality follows by minimizing over $\alpha$ at fixed $\beta/\alpha$.
The affinity identity $H^2=2-2\mathbb E x$ proves the first bound.
The inequality $2(1-\operatorname{sech} t)\leq t^2$ proves the second.
For quadratic cost the rectangular difference is $-2(s_i-s_{i'})^\top(t_j-t_{j'})$.
If $\Gamma=0$, the bound gives exact inheritance; the displayed separable response also follows directly from the optimality conditions.
For sharpness, take two singleton source instances whose costs to two equally weighted targets are $(0,\Gamma/2)$ and $(\Gamma/2,0)$.
Their normalized target responses attain $H^2=2[1-\operatorname{sech}(\Gamma/(4\rho_b))]$.
\end{proof}

This bound isolates source--target interaction and proves a quadratic dependence on $1/\rho_b$ without a sampling assumption.
It is not a rate in sample size and can be conservative on large supports.
It applies to optimal endpoint responses; inexact coarse potentials can instead be handled directly by the computable bound below.

\begin{corollary}[Weighted potential stability]
\label{cor:uot-hierarchy-weighted-potentials}
For any two finite target potentials $g^0,g^1$ with a common positive reference $b$ and penalty $\rho_b>0$, define
$$Z_s=\sum_j b_j e^{-g_j^s/\rho_b},\qquad p_j^s=\frac{b_j e^{-g_j^s/\rho_b}}{Z_s},\qquad s\in\{0,1\},$$
and remove scalar translations by setting $\bar g^s=g^s+\rho_b\log Z_s\,\mathbf1$.
Then
\begin{equation*}
\sum_j\sqrt{p_j^0p_j^1}\,(\bar g_j^1-\bar g_j^0)^2\leq4\rho_b^2H^2(p^0,p^1).
\end{equation*}
No uniform positive lower bound on the response entries is required.
\end{corollary}
\begin{proof}
Writing $\delta_j=\bar g_j^1-\bar g_j^0$, the response identity gives $\delta_j=-\rho_b\log(p_j^1/p_j^0)$.
Consequently,
$$H^2(p^0,p^1)=4\sum_j\sqrt{p_j^0p_j^1}\,\sinh^2\!\left(\frac{\delta_j}{4\rho_b}\right)\geq\frac{1}{4\rho_b^2}\sum_j\sqrt{p_j^0p_j^1}\,\delta_j^2,$$
where the inequality uses $|\sinh x|\geq|x|$.
\end{proof}

The estimate connects response stability to dual propagation by controlling the aligned potentials with weights that emphasize coordinates carrying mass in both responses.
Coordinates with vanishing response weight may still have large potential differences, so the estimate does not imply uniform coordinatewise stability.

\subsubsection{A computable inheritance bound}
On the finer source instance, consider the auxiliary fixed-target problem defining $\uotHierarchyH_a(q^0)$.
Let $Y$ have target marginal $q^0$ and let $(h,v)$ be auxiliary dual feasible, $h_i+v_j\leq C_{ij}$.
Define its certified gap and scaled target residual by
$$\eta=\langle C,Y\rangle+\rho_a\operatorname{KL}(Y\mathbf1\mid a)-\left[(q^0)^\top v+\rho_a\sum_i a_i(1-e^{-h_i/\rho_a})\right],\qquad d_j=\frac{v_j-g^0_j}{\rho_b},\qquad \epsilon=\frac{\eta}{\rho_bM_0}.$$
The auxiliary problem may be solved on candidate edges: a restricted primal remains a valid witness, and setting $h_i=\min_j(C_{ij}-v_j)$ makes the dual globally feasible.
The resulting $\eta$ includes any omitted-edge or numerical error.
No finer optimal marginal is needed to compute these quantities.

\begin{proposition}[Translation-invariant inheritance]\label{prop:uot-hierarchy-inheritance}
For any such auxiliary primal--dual pair, define
$$R(p,d)=\log\sum_jp_je^{-d_j}+\sum_jp_jd_j,$$
and
$$B(p,d)=\max_{z\in\Delta}\left\{H^2(z,p)-\tfrac12\big[J(z,p)+\langle d,z-p\rangle\big]\right\}.$$
Then
$$H^2(p,p^\star)\leq\min\{2,\ R(p,d)+\epsilon,\ B(p,d)+\tfrac12\epsilon\}.$$
Both $R$ and $B$ are invariant under adding a scalar to $d$.
The maximization defining $B$ is strictly concave, with an interior optimizer, and reduces to a scalar normalization multiplier.
For an exact auxiliary solve and $d=\tau d_0$ with fixed $p,d_0$,
$$R(p,\tau d_0)=\frac{\tau^2}{2}\operatorname{Var}_p(d_0)+O(\tau^3),\qquad B(p,\tau d_0)=\frac{\tau^2}{4}\operatorname{Var}_p(d_0)+O(\tau^3).$$
\end{proposition}
\begin{proof}
The auxiliary dual gives an $\eta$-approximate supporting hyperplane for $\uotHierarchyH_a$ at $q^0$.
After normalizing to unit mass, its error is $\eta/M_0$; its slope changes by $-\rho_a\log M_0$, which disappears on the simplex.
The KL Bregman identity therefore gives
$$F_a(z)\geq F_a(p)+\rho_b\langle d,z-p\rangle+\rho_b\operatorname{KL}(z\mid p)-\eta/M_0.$$
Minimizing the right-hand side on the simplex and using KL strong convexity at $p^\star$ yields $\operatorname{KL}(p\mid p^\star)\leq R(p,d)+\epsilon$.
Since $H^2\leq\operatorname{KL}$, this proves the $R$ bound.

Combining the approximate support inequality for $\uotHierarchyH_a$ at $p$ with the exact support inequality at $p^\star$ gives
$$J(p^\star,p)+\langle d,p^\star-p\rangle\leq\epsilon.$$
Substituting this into the definition of $B$ proves the direct Hellinger bound.
For $t=z_j/p_j$, the scalar integrand of $B$ is $(\sqrt t-1)^2-\frac12(t-1)\log t-\frac12d_j(t-1)$.
Its second derivative is $-(t-\sqrt t+1)/(2t^2)<0$.
Thus the constrained maximum is strictly concave and can be computed by a single scalar multiplier and coordinatewise monotone roots.
Finally, expand about $z=p$: $H^2(z,p)=\frac14\sum_j(z_j-p_j)^2/p_j+O(\|z-p\|^3)$ and $J(z,p)=\sum_j(z_j-p_j)^2/p_j+O(\|z-p\|^3)$.
Maximizing the resulting quadratic gives the stated expansion for $B$; the expansion of $R$ is the cumulant expansion of log-sum-exp.
\end{proof}

The direct Hellinger bound improves the local leading constant of the KL-based bound by a factor of two.
For exact auxiliary solves, a simple additional bound is $R(p,d)\leq\operatorname{osc}(d)^2/8$ by Hoeffding's lemma.
An explicit random-subsampling rate still requires control of the distribution of $d$ as a function of the retained sample size.

\subsubsection{Response prediction on an auxiliary active graph}
Assume now that the auxiliary problem is solved exactly.
Let $E$ be the support of an auxiliary optimum, with connected bipartite components $(I_\alpha,J_\alpha)$.
Write $r=Y\mathbf1$, $Q_\alpha=\sum_{j\in J_\alpha}q^0_j=\sum_{i\in I_\alpha}r_i$, $P_\alpha=Q_\alpha/M_0$, and $\theta=\rho_a/(\rho_a+\rho_b)$.
Define
$$A_\alpha=\frac{1}{Q_\alpha}\sum_{j\in J_\alpha}q^0_je^{-d_j},\qquad \gamma_\alpha=\frac{\rho_a\rho_b}{\rho_a+\rho_b}\log A_\alpha,$$
$$\widehat r_i=r_iA_\alpha^{\rho_b/(\rho_a+\rho_b)},\quad\widehat q_j=q^0_je^{-d_j}A_\alpha^{-\theta},\quad\widehat f_i=h_i-\gamma_\alpha,\quad\widehat g_j=v_j+\gamma_\alpha.$$

\begin{proposition}[Conditional exact response prediction]\label{prop:uot-hierarchy-prediction}
Suppose $(\widehat f,\widehat g)$ is globally dual feasible and a nonnegative coupling with marginals $(\widehat r,\widehat q)$ exists on $E$.
Then these potentials and that coupling satisfy the finer KL-UOT optimality conditions.
In particular $q^\star=\widehat q$.
Both conditions can be checked without computing the finer optimum: one dual scan and one transportation feasibility problem suffice.
No forest, uniqueness of coupling, or strict complementarity assumption is required.
\end{proposition}
\begin{proof}
The shifts preserve equality on every auxiliary active edge.
The exponential response identities give $a_i e^{-\widehat f_i/\rho_a}=\widehat r_i$ and $b_j e^{-\widehat g_j/\rho_b}=\widehat q_j$.
The choice of $\gamma_\alpha$ makes source and target mass equal within every component.
The assumed feasible coupling and global dual feasibility therefore establish primal feasibility, response consistency, and complementarity.
These are the sufficient convex KKT conditions.
\end{proof}

When the condition holds, normalizing $\widehat q$ gives an exact error prediction.
Its small-perturbation expansion is
$$H^2(p,p^\star)=\frac14\left[\sum_\alpha P_\alpha\operatorname{Var}_{p(\cdot\mid J_\alpha)}(d)+\left(\frac{\rho_b}{\rho_a+\rho_b}\right)^2\operatorname{Var}_{P}(\bar d_\alpha)\right]+O(\|d-\mathbb E_pd\|_\infty^3),$$
where $\bar d_\alpha=\mathbb E_p[d\mid J_\alpha]$.
This separates within-component deformation from changes in component masses.
The latter are damped by the source marginal penalty.
Outside the verified regime, the formula is a predictor whose accuracy must be measured empirically.

\begin{corollary}[A certified interval for the prediction]
Let $\widehat X$ be any finer coupling with target marginal $\widehat q$, let a globally feasible dual provide a gap certificate $G$, and write $\widehat p=\widehat q/\|\widehat q\|_1$.
Then, with $e=H^2(p,\widehat p)$ and $r_G=\sqrt{G/(\rho_b\|\widehat q\|_1)}$,
$$\max\{0,\sqrt e-r_G\}^2\leq H^2(p,p^\star)\leq\min\{2,(\sqrt e+r_G)^2\}.$$
\end{corollary}
\begin{proof}
The primal objective difference from optimality is at least $\rho_b\operatorname{KL}(\widehat q\mid q^\star)$, and is bounded by $G$.
KL mass decomposition gives $H^2(\widehat p,p^\star)\leq\operatorname{KL}(\widehat p\mid p^\star)\leq G/(\rho_b\|\widehat q\|_1)$.
Apply the triangle and reverse triangle inequalities for Hellinger distance.
\end{proof}

\subsubsection{Why a uniform sampling-rate claim needs assumptions}
Set $m=n$, $a=b=\mathbf1/m$, $C_{ii}=0$, and $C_{ij}=c>0$ for $i\ne j$.
The fine optimum has normalized target response $p_j=1/m$.
After retaining any fraction $\vartheta=k/m$ of source rows and assigning uniform coarse weights, symmetry and the response equations give
$$p^S_j=\frac{1}{mZ}\ \ (j\in S),\qquad p^S_j=\frac{e^{-c/\rho_b}}{mZ}\ \ (j\notin S),\qquad Z=\vartheta+(1-\vartheta)e^{-c/\rho_b}.$$
Hence
$$H^2(p,p^S)=2-2\frac{\vartheta+(1-\vartheta)e^{-c/(2\rho_b)}}{\sqrt{\vartheta+(1-\vartheta)e^{-c/\rho_b}}}.$$
For fixed $\vartheta,c,\rho_b$ this is independent of $m$ and strictly positive.
The cost can be realized by squared distances between orthogonal points in a growing-dimensional space.
Thus increasing sample size alone cannot yield a uniform vanishing bound over arbitrary geometries.
This does not contradict rates under fixed covering dimension or other uniform geometric regularity.
```

## Original F source

```
\section{Component and Mechanism Analysis}
\label{app:component-mechanism-analysis}

\subsection{Hyperparameter Sensitivity}
\label{app:uot-parameter-sensitivity}

We vary the hierarchy split factor $s$, dual-assignment budget $\kappa$, pricing budget $\gamma$, and support budget factor $\beta$ one at a time.
The other budget parameters remain at their default values $(s,\kappa,\gamma,\beta)=(4,16,2,10)$, and the coarsest-size threshold is fixed at 256.
The split factor is the reciprocal of the sampling ratio used in \hello, so $s\in\{2,4,8\}$ corresponds to sampling ratios $\{0.5,0.25,0.125\}$.
All settings satisfy $\beta\geq\gamma+3$ and use the same original full-space KKT tolerance of $10^{-6}$.
The common default configuration is measured once per penalty pair and reused across the four blocks, giving 36 distinct runs; all reach the target tolerance.

\begin{table}[htbp]
\centering
% CN: 全部耗时与显存来自 paper_experiments_uot/parameter_sensitivity/results/20261110_v2_paper_data/summary_table.json；原始指标为同批次 cases/*/*/metrics.json；n=262144，36/36 成功。按 groups.parameter/value 匹配各行；四块共享每组 penalty 的 baseline，显存为 peak_gpu_memory_mib / 1024。
% EN: All runtimes and memory measurements come from paper_experiments_uot/parameter_sensitivity/results/20261110_v2_paper_data/summary_table.json, with raw metrics in cases/*/*/metrics.json; n=262144 and 36/36 runs succeeded. Match rows by groups.parameter/value; blocks share each penalty's baseline, and memory is peak_gpu_memory_mib / 1024.
% \xwz{Safeguard rerun pending: this sensitivity batch used refinement_forcing_check=False and refinement_progress_check=False; replace these measurements after the supported safeguard-enabled rerun.}
\caption{\textbf{Hyperparameter sensitivity across marginal penalties.}
TOME E11.5$\to$E12.5 with $m=n=262{,}144$, $d=30$, seed 42, and one measurement per configuration at KKT tolerance $10^{-6}$.
\runtime is in seconds; \gpumem is peak active GPU allocation in GiB.
Each block varies one parameter; bold and underlined entries mark the best and second-best displayed values within that block and penalty setting.}
\label{tab:uot-parameter-sensitivity}
\small
\setlength{\tabcolsep}{3pt}
\begin{tabular}{@{}l cc cc cc cc@{}}
\toprule
\multirow{2}{*}{Variant} & \multicolumn{2}{c}{$(0.1,0.1)$} & \multicolumn{2}{c}{$(1,1)$} & \multicolumn{2}{c}{$(10,10)$} & \multicolumn{2}{c}{$(0.045,99.995)$} \\
\cmidrule(lr){2-3}\cmidrule(lr){4-5}\cmidrule(lr){6-7}\cmidrule(lr){8-9}
 & \runtime & \gpumem & \runtime & \gpumem & \runtime & \gpumem & \runtime & \gpumem \\
\midrule
\multicolumn{9}{l}{\textit{(a) Hierarchy split factor $s$ ($\kappa=16,\gamma=2,\beta=10$)}} \\
$s=2$ & 16.54 & \textbf{1.631} & 18.49 & \textbf{1.600} & \underline{26.61} & \textbf{1.591} & 16.29 & \textbf{1.637} \\
$s=4$ & \underline{12.76} & \underline{1.659} & \underline{14.18} & \underline{1.630} & \textbf{20.15} & 1.621 & \underline{11.65} & \underline{1.658} \\
$s=8$ & \textbf{10.55} & 1.697 & \textbf{13.11} & 1.664 & 26.92 & \underline{1.611} & \textbf{10.36} & 1.696 \\
\midrule
\multicolumn{9}{l}{\textit{(b) Dual-assignment budget $\kappa$ ($s=4,\gamma=2,\beta=10$)}} \\
$\kappa=8$ & \underline{14.05} & \textbf{0.995} & \underline{15.99} & \textbf{0.981} & \underline{22.25} & \textbf{0.979} & \underline{14.13} & \textbf{0.998} \\
$\kappa=16$ & \textbf{12.76} & \underline{1.659} & \textbf{14.18} & \underline{1.630} & \textbf{20.15} & \underline{1.621} & \textbf{11.65} & \underline{1.658} \\
$\kappa=32$ & 14.59 & 3.063 & 20.83 & 3.008 & 39.61 & 2.997 & 14.65 & 3.071 \\
\midrule
\multicolumn{9}{l}{\textit{(c) Pricing budget $\gamma$ ($s=4,\kappa=16,\beta=10$)}} \\
$\gamma=1$ & \textbf{11.84} & \textbf{1.659} & \textbf{13.19} & \textbf{1.630} & \textbf{18.96} & \textbf{1.620} & \textbf{10.59} & \textbf{1.658} \\
$\gamma=2$ & \underline{12.76} & \textbf{1.659} & \underline{14.18} & \textbf{1.630} & \underline{20.15} & \underline{1.621} & \underline{11.65} & \textbf{1.658} \\
$\gamma=4$ & 14.18 & \textbf{1.659} & 15.05 & \textbf{1.630} & 21.26 & \underline{1.621} & 12.66 & \textbf{1.658} \\
\midrule
\multicolumn{9}{l}{\textit{(d) Support budget factor $\beta$ ($s=4,\kappa=16,\gamma=2$)}} \\
$\beta=5$ & \underline{12.67} & \textbf{1.657} & \textbf{13.96} & \textbf{1.628} & \textbf{19.83} & \underline{1.623} & \textbf{11.48} & 1.661 \\
$\beta=10$ & 12.76 & \underline{1.659} & 14.18 & \underline{1.630} & \underline{20.15} & \textbf{1.621} & \underline{11.65} & \textbf{1.658} \\
$\beta=20$ & \textbf{12.05} & 1.660 & \underline{14.03} & \textbf{1.628} & 20.21 & \textbf{1.621} & 11.66 & \underline{1.659} \\
\bottomrule
\end{tabular}
\end{table}

\subsection{Runtime Breakdown}
\label{app:runtime-breakdown}

Figure~\ref{fig:uot-runtime-breakdown} partitions the instrumented end-to-end runtime into initialization, restricted solves, pricing, and other work, with nested timing scopes counted once.
Restricted solves account for most runtime at smaller sizes, while initialization and pricing take a larger share at $n=262{,}144$.

\begin{figure}[htbp]
\centering
% CN: 数据来源：paper_experiments_uot/runtime_breakdown/results/20261114_runtime_breakdown_preview_my4090/summary_table.json 提供 n=4096/16384/65536；20261114_runtime_breakdown_n262144_my4090/summary_table.json 提供 n=262144，16/16 个 profile 成功。
% EN: Sources: paper_experiments_uot/runtime_breakdown/results/20261114_runtime_breakdown_preview_my4090/summary_table.json for n=4096/16384/65536; 20261114_runtime_breakdown_n262144_my4090/summary_table.json for n=262144; all 16 profiles succeeded.
% CN: 固定绘图数据与 SHA256：figures/plot_sources/runtime_breakdown_pilot.json；复现入口：scripts/plot_runtime_breakdown.py。
% EN: Frozen plot inputs and SHA256: figures/plot_sources/runtime_breakdown_pilot.json; reproduce with scripts/plot_runtime_breakdown.py.
\includegraphics[width=\linewidth]{figures/uot_runtime_breakdown_pilot.pdf}
\caption{\textbf{Runtime breakdown of \ours (profiling preview).}
TOME E11.5$\to$E12.5 with $m=n\in\{2^{12},2^{14},2^{16},2^{18}\}$ and $d=30$; panels correspond to the four indicated marginal-penalty settings.
Other includes support maintenance, and labels above the bars give total runtime in seconds.
All runs reach the original UOT KKT tolerance $10^{-6}$, using seed 42 with one run per configuration on RTX 4090; GPU contamination monitoring was disabled for this preview.}
\label{fig:uot-runtime-breakdown}
\end{figure}

% \xwz{Temporarily omit the historical runtime-breakdown section; rerun and audit non-overlapping timers before restoring.}
% \section{Runtime Breakdown}
% \label{app:runtime-breakdown}
%
% We separate end-to-end runtime into hierarchy construction and initialization, restricted solves, full scans, support updates, and remaining overhead.
% The first category includes hierarchy preparation, dual propagation, potential translation, and initial support construction across all levels.
% Restricted time counts the inner solver only; support-update time includes insertion, deduplication, budgeted pruning, and triggered sparsification, with each operation counted once.
% Full-scan time counts each complete-edge traversal once, including fused candidate selection and violation evaluation.
% The remaining overhead is the end-to-end time not assigned to these categories, making their sum equal the reported total.
% This partition requires non-overlapping timing scopes; nested sparsification or initialization timers must be separated before aggregation.
% Compilation warm-up and common post-solve evaluation are excluded as in the main comparison.
%
% \begin{table}[htbp]
% \centering
% % CN: n=16384 来自 paper_experiments_uot/accuracy_runtime_pareto/results/20261025_222731/cases/n16384_rhoa*_rhob*_seed42/shuttle_tolerance_1e-06_repeat0/metrics.json；n=65536 来自 paper_experiments_uot/component_ablation/results/20261102_193809/cases/n65536_rhoa*_rhob*_seed42/shuttle_fixed_repeat0/metrics.json。
% % EN: n=16384 uses paper_experiments_uot/accuracy_runtime_pareto/results/20261025_222731/cases/n16384_rhoa*_rhob*_seed42/shuttle_tolerance_1e-06_repeat0/metrics.json; n=65536 uses paper_experiments_uot/component_ablation/results/20261102_193809/cases/n65536_rhoa*_rhob*_seed42/shuttle_fixed_repeat0/metrics.json.
% % CN: Init=hierarchy_build_time+各层 initialization_time；Restricted=粗层 diagnostics.restricted_time+各细层 iteration.restricted_time；Scan/Update 累加对应迭代计时；Other 为 runtime_sec 减去前四项。未记录触发的 sparsification；舍入后的 Other 吸收最多毫秒级的舍入差。
% % EN: Init sums hierarchy_build_time and level initialization_time; Restricted sums coarsest diagnostics.restricted_time and refined iteration.restricted_time; Scan/Update sum their iteration timers; Other is the runtime_sec remainder. No triggered sparsification was recorded; rounded Other absorbs millisecond-scale rounding differences.
% % \xwz{RERUN REQUIRED: these are approximate layout values extracted from historical runs with different source versions. Rerun the current production solver on a common unshared-GPU protocol and audit non-overlapping timer scopes before treating this table as a final runtime breakdown.}
% \caption{\textbf{End-to-end runtime breakdown for \ours.}
% Preliminary historical timings on TOME E11.5$\to$E12.5 with $d=30$ and $m=n$.
% Init includes hierarchy construction and initialization; Update includes triggered sparsification.
% All component entries are seconds, and their sum equals Total.}
% \label{tab:uot-runtime-breakdown}
% \small
% \setlength{\tabcolsep}{5pt}
% \begin{tabular}{rlrrrrrr}
% \toprule
% $n$ & $(\rho_a,\rho_b)$ & Init & Restricted & Scan & Update & Other & Total \\
% \midrule
% \multirow{4}{*}{$2^{14}$} & $(0.1,0.1)$ & 0.131 & 1.581 & 0.062 & 0.015 & 0.057 & 1.846 \\
%  & $(1,1)$ & 0.124 & 2.287 & 0.068 & 0.018 & 0.034 & 2.531 \\
%  & $(10,10)$ & 0.123 & 7.139 & 0.133 & 0.050 & 0.050 & 7.495 \\
%  & $(0.045,99.995)$ & 0.113 & 1.626 & 0.057 & 0.011 & 0.030 & 1.837 \\
% \midrule
% \multirow{4}{*}{$2^{16}$} & $(0.1,0.1)$ & 0.552 & 2.666 & 0.575 & 0.022 & 0.044 & 3.859 \\
%  & $(1,1)$ & 0.592 & 5.854 & 0.592 & 0.028 & 0.053 & 7.119 \\
%  & $(10,10)$ & 0.584 & 23.108 & 0.914 & 0.066 & 0.089 & 24.761 \\
%  & $(0.045,99.995)$ & 0.600 & 2.901 & 0.595 & 0.021 & 0.044 & 4.161 \\
% \bottomrule
% \end{tabular}
%
% \smallskip
% % \xwz{Placeholder: finalize the profiled sizes and seed counts, and insert exact source paths.
% % If additional timing instrumentation is needed to separate nested scopes, add it before reporting this partition; do not interpret missing timers as zero cost.}
% \end{table}

\subsection{\subsolver Component Ablations}
\label{app:pduot-component-ablation}
% CN: J=64 审计：本图全部 2598 次测量均保存重启计数，最大为 25，预算不会触发；保留原实验来源，不将其重标为已运行新保护版本。
% EN: J=64 audit: all 2598 measurements record restart counts, maximum 25, so the budget cannot trigger. Retain historical provenance rather than relabeling these runs as executions of the protected implementation. Evidence: experiments/primal_weight_budget_20261111/report/history_J64_audit.json.
We isolate the internal components of \subsolver on fixed restricted problems captured from TOME E11.5$\to$E12.5 runs with $m=n=65{,}536$ and $d=30$.
For each penalty pair, we increment the random seed from 42 and save every restricted solve across all hierarchy levels and refinement rounds until a completed parent run brings the corpus to at least 100 problems.
The four corpora contain 108, 106, 119, and 100 problems from 8, 7, 5, and 8 parent runs, respectively, in the panel order of Figure~\ref{fig:pduot-component-ablation-cdf}.
These include rectangular intermediate levels; problems from the same parent run are correlated.
Each variant is run once per snapshot with fixed support, costs, masses, output-translation policy, and an original restricted KKT tolerance of $10^{-6}$.

All six variants retain adaptive restart.
The weight ablation freezes the common initial primal weight $w_0$; the Halpern ablation removes anchor mixing while retaining reflection; and the reflection ablation retains Halpern anchoring.
The warm-start ablation zeros both the transport flow and dual potentials.
The preconditioning ablation replaces degree-based diagonal steps with scalar base steps under the same operator-norm safety bound and initial $w_0$.

\begin{figure}[htbp]
\centering
% CN: 图来自 paper_experiments_uot/pduot_ablation/results/pduot_cdf_n65536_seeds_20261110_gpu6/cdf_components_iterations.pdf；逐次结果与曲线数据分别见同目录 summary.json 和 cdf_data.json；采集来源为 results/corpus_n65536_seeds_20261110。
% EN: Figure source: paper_experiments_uot/pduot_ablation/results/pduot_cdf_n65536_seeds_20261110_gpu6/cdf_components_iterations.pdf; per-run results and curve data are summary.json and cdf_data.json in that directory; snapshots come from results/corpus_n65536_seeds_20261110.
\includegraphics[width=\linewidth]{figures/pduot_component_ablation_cdf_iterations.pdf}
\caption{\textbf{Internal \subsolver component ablations.}
Empirical CDFs of PDHG map evaluations to reach a restricted KKT residual of $10^{-6}$ on TOME snapshots ($d=30$, parent size $m=n=65{,}536$).
Panels separate the four penalty pairs; $N$ counts restricted problems, and curves farther left require fewer iterations.
Every variant retains adaptive restart, and each ablation removes only its named component.
The denominator includes all planned problems, including failures and timeouts; all 2,598 runs in this batch converged.}
\label{fig:pduot-component-ablation-cdf}
\end{figure}

Primal-weight updates, reflection, and diagonal preconditioning reduce total iteration counts in all four penalty settings.
Halpern anchoring helps at $(\rho_a,\rho_b)=(1,1)$ and $(10,10)$ and most strongly in the asymmetric setting, whereas removing it reduces total iterations at $(0.1,0.1)$.
Warm starts reduce total iterations in all four settings, although the corpus also includes coarsest problems whose initial flow and potentials are already zero.

\subsection{Primal-Weight Budget Intervention}
\label{app:pduot-weight-budget-experiment}

We examine the iteration cost of the summable weight-update budget~\eqref{eq:pduot-weight-budget} in complete \ours solves.
We fix $p=1.01$ and compare $J\in\{1,2,4,8,16,32,64\}$ with the adaptive controller with the budget disabled.
The experiment uses TOME E11.5$\to$E12.5 with $m=n=65{,}536$, $d=30$, the four main-comparison penalty pairs, and seeds 42--46.
All 160 runs reach KKT tolerance $10^{-6}$ using \texttt{finest\_fp64} costs and the refinement safeguard.
For each seed, we sum inner iterations over all hierarchy levels and the four penalty pairs before computing the mean and standard deviation in Figure~\ref{fig:pduot-weight-budget}.
For every $J\geq4$, no update is clipped and every problem retains its unbudgeted iteration count, including at the default $J=64$.
At $J=1$ and $J=2$, the mean total increases by $2.72\%$ and $0.62\%$, respectively.
Thus the default budget adds no iterations on these tested problems.

\begin{figure}[htbp]
\centering
% CN: 数据来源：paper_experiments_uot/primal_weight_budget/results/20261115_195720_J1_my4090/summary.json；160/160 个测量成功，其中 140 个原始测量复用自 20261115_193416_my4090，新增 20 个 J=1 测量，RTX 4090，固定 p=1.01。
% EN: Source: paper_experiments_uot/primal_weight_budget/results/20261115_195720_J1_my4090/summary.json; all 160 observations succeeded, reusing 140 measurements from 20261115_193416_my4090 and adding 20 J=1 measurements on RTX 4090 with fixed p=1.01.
% CN: 固定汇总与原始指标 SHA256：figures/plot_sources/primal_weight_budget_20261115.json；复现入口：paper_experiments_uot/primal_weight_budget/collect.py --batch-id 20261115_195720_J1_my4090。
% EN: Frozen summary and raw-metric SHA256: figures/plot_sources/primal_weight_budget_20261115.json; reproduce with paper_experiments_uot/primal_weight_budget/collect.py --batch-id 20261115_195720_J1_my4090.
\includegraphics[width=3.45in]{figures/uot_primal_weight_budget.pdf}
\caption{\textbf{Iteration cost of the weight-update budget.}
Total inner iterations per seed, summed over the four penalty settings on TOME with $m=n=65{,}536$ and $p=1.01$.
The disabled-budget control is measured once per seed and penalty pair and reused across $J$ groups.
Across the 20 problems, four updates are clipped at $J=1$ and three at $J=2$; no clipping occurs for $J\geq4$.
Bars show means and error bars denote sample standard deviations over five random seeds.}
\label{fig:pduot-weight-budget}
\end{figure}


\subsection{Support Sparsification}
\label{app:sparsification-experiment}

\paragraph{Empirical scaling.}
We evaluate the two-pass construction on cyclic sparse supports with $m=n$ ranging from $2^{10}$ to $2^{20}$, using four ground costs and three feature dimensions.
All 360 recorded runs satisfy the prescribed output-support cap.
The maximum absolute source and target marginal errors are below $1.1\times10^{-18}$, and the maximum absolute objective error is below $1.1\times10^{-11}$ for both KL and squared-$\ell_2$ penalties.
These controlled tests exercise compression directly; they do not estimate how often sparsification triggers on real hierarchy trajectories.

\begin{figure}[htbp]
\centering
% CN: 图源 paper_experiments/support_sparsification_uot/results/support_sparsification_uot_scaling.pdf；绘图输入为同目录 summary.json，原始记录为 records.jsonl。
% EN: Figure source: paper_experiments/support_sparsification_uot/results/support_sparsification_uot_scaling.pdf; plotting input: summary.json, raw measurements: records.jsonl in the same directory.
% CN: 由 paper_experiments/support_sparsification_uot/plot_scaling.py 生成；正文数值核验使用全部 360 条 records.jsonl 记录。
% EN: Generated by paper_experiments/support_sparsification_uot/plot_scaling.py; numerical checks in the text use all 360 records in records.jsonl.
\includegraphics[width=0.52\linewidth]{figures/support_sparsification_uot_scaling.pdf}
\caption{\textbf{UOT support-sparsification scaling.}
Panels (a)--(c) use feature dimensions $d=4,128,4096$, respectively, on cyclic sparse supports.
Curves distinguish the four ground costs.
Time includes both CPU cycle-cancellation passes and convex mixing, excluding compilation, feature and cost preparation, GPU/CPU transfers, and validation.
Results are medians over five repeated timings per configuration.}
\label{fig:uot-sparsification-scaling}
\end{figure}

\input{theory/inter_level_response_stability}

\subsubsection{Inter-Level Stability Diagnostics}
\label{app:stability-experiment}

We evaluate the computable inheritance bound and component response predictor from Appendix~\ref{app:uot-hierarchy-stability} on 1,080 synthetic source-subsampling transitions.
The six families comprise uniform clouds in dimensions 1, 2, and 8, shifted two-dimensional clouds, two-cluster mixtures, and two-dimensional clouds with nonuniform target weights.
Each family uses fine sizes $m=n\in\{32,128\}$, retained source fractions $\{1/4,1/2,3/4\}$, five penalty pairs, three seeds, and two subset draws per configuration.
Target locations and reference masses remain fixed within each transition; these tests isolate the inheritance mechanism rather than run an entire nested hierarchy.
Coarse and fine references use CPU conic solves, with high-accuracy dual and transportation recovery when needed.

Let $e=H^2(p^0,p^\star)$ be the measured squared Hellinger error between the normalized coarse and fine target responses.
We evaluate $B_{\mathrm{comp}}=\min\{2,R(p,d)+\epsilon,B(p,d)+\epsilon/2\}$ from Proposition~\ref{prop:uot-hierarchy-inheritance}, including the auxiliary primal--dual error, and the predicted error $\widehat e=H^2(p^0,\widehat p)$ from the component response construction in Proposition~\ref{prop:uot-hierarchy-prediction}.
Neither calculation receives the fine reference solution, and no coefficient is fitted.
The predictor is conditionally exact under the proposition's feasibility conditions; its accuracy outside that regime is evaluated empirically.

\begin{figure}[htbp]
\centering
% CN: 全部 1080 个转换来自 /home/xiawenzhou/project/hierarchical_ot/results/uot_hierarchy_paper_candidate_20261019/forward_results.json，SHA256=4be52dda8cac929ff1d9524a04d242c0e9956523302432a0d8f085558d38e5c4。历史原目录为 /home/xiawenzhou/.codex/worktrees/ffba/hierarchical_ot/results/uot_hierarchy_paper_candidate_20261019；历史实现 commit=3b92f455866dc9b3432b2ebcfe3fb2086ead5c9e。
% EN: All 1,080 transitions come from /home/xiawenzhou/project/hierarchical_ot/results/uot_hierarchy_paper_candidate_20261019/forward_results.json, SHA256=4be52dda8cac929ff1d9524a04d242c0e9956523302432a0d8f085558d38e5c4. Original directory: /home/xiawenzhou/.codex/worktrees/ffba/hierarchical_ot/results/uot_hierarchy_paper_candidate_20261019; historical implementation commit: 3b92f455866dc9b3432b2ebcfe3fb2086ead5c9e.
% CN: 图由 scripts/plot_hierarchy_stability.py 重画，绘图范围及重新计算的统计见 figures/hierarchy_stability_validation.json；使用所有 penalty、几何、seed 和 subset，不筛除困难配置。
% EN: Redrawn by scripts/plot_hierarchy_stability.py, with selection scope and recomputed statistics in figures/hierarchy_stability_validation.json; all penalties, geometries, seeds and subsets are retained, including the difficult configurations.
\includegraphics[width=\linewidth]{figures/hierarchy_stability_validation.pdf}
\caption{\textbf{Computable inter-level response diagnostics.}
All 1,080 source-subsampling transitions across six synthetic families and five penalty pairs.
Left: the computable upper bound $B_{\mathrm{comp}}$ against measured error $e$; right: component prediction $\widehat e$ against $e$.
The diagonal denotes equality, and the shaded band spans a factor of two.
Colors and markers distinguish $\rho_a\leq\rho_b$ from $\rho_a>\rho_b$; predictions are less accurate in the latter regime.}
\label{fig:hierarchy-stability-validation}
\end{figure}

\begin{table}[htbp]
\centering
% CN: 各行由同一 forward_results.json 全量分组重新计算，核对同批 summary.json；精确数值见 figures/hierarchy_stability_validation.json。每组 216 个转换，Overall 为全部 1080 个转换的 pooled 统计，未平均各组中位数。
% EN: Rows are recomputed by grouping the same complete forward_results.json and checked against summary.json in that batch; exact values are in figures/hierarchy_stability_validation.json. Each group has 216 transitions; Overall pools all 1,080 transitions rather than averaging group medians.
\caption{\textbf{Accuracy of inheritance bounds and response predictions.}
Each penalty pair includes 216 transitions from Figure~\ref{fig:hierarchy-stability-validation}.
Bound ratios and prediction fold errors $\max\{\widehat e/e,e/\widehat e\}$ are medians; the final column gives the percentage of predictions within a factor of two.}
\label{tab:stability-diagnostics}
\small
\setlength{\tabcolsep}{7pt}
\begin{tabular}{lrrr}
\toprule
$(\rho_a,\rho_b)$ & $B_{\mathrm{comp}}/e$ & Prediction fold & Within $2\times$ \\
\midrule
$(0.1,0.1)$ & 2.40 & 1.27 & 91.7\% \\
$(1,1)$ & 1.37 & 1.22 & 97.2\% \\
$(10,10)$ & 1.03 & 1.02 & 99.1\% \\
$(0.1,2)$ & 1.05 & 1.00 & 100.0\% \\
$(2,0.1)$ & 6.51 & 3.95 & 20.4\% \\
\midrule
Overall & 1.42 & 1.12 & 81.7\% \\
\bottomrule
\end{tabular}

\end{table}

The computable bound covers the measured error in all 1,080 transitions, with median bound/error ratio $1.42$ and 90th percentile $6.56$.
Its worst ratio is $588$, showing that the bound can remain conservative.
The component predictor has median fold error $1.12$, with $81.7\%$ of predictions within a factor of two and a maximum fold error of $25.26$.
Table~\ref{tab:stability-diagnostics} shows that the $(2,0.1)$ penalty regime accounts for the largest loss of accuracy.
The purely geometric interaction bound is substantially looser, with median bound/error ratio approximately $1{,}281$ on the same transitions.

% CN: 独立证书验证来自同批 full_certificate_results.json，SHA256=d88f688950a3a497ec55b3d6dfc3686caf99b5f6cc3d779d5da7183a77ede789；预测先冻结，再求细层参考；120/120 区间覆盖对应误差，但部分区间较宽。
% EN: Independent certificates come from full_certificate_results.json in the same batch, SHA256=d88f688950a3a497ec55b3d6dfc3686caf99b5f6cc3d779d5da7183a77ede789; predictions are frozen before solving fine references; 120/120 intervals contain the corresponding errors, although some intervals are wide.
A separate 120-transition test freezes predictions before computing the fine references; all returned certificate intervals contain the corresponding reference errors, although some intervals are wide.
These auxiliary computations validate the response diagnostics; they are not production hierarchy steps or measurements of warm-start speedup.
```
