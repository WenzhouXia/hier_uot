# Experimental setup: implementation and measurement record

Archived on 2026-11-15 before the first compression of Appendix D.
This is a historical manuscript snapshot, not a statement of current implementation defaults.
It preserves the ETM and MultiScaleOT port measurements, PDCS engineering and validation details, snapshot-selection history, and per-artifact provenance comments removed or shortened in the manuscript.
Pending reruns and protocol differences remain identified in the original text.

```
\section{Experimental Setup}
\label{app:extension-experiment-protocols}

\subsection{Benchmark Data}
\label{app:benchmark-data}

\paragraph{TOME mouse embryogenesis.}
% CN: 预处理设置来自 data/tome_embryogenesis/E11.5_E12.5/preprocessing.json；采样与缩放见 src/hierarchical_ot/benchmarks/tome_data_generator.py。
% EN: Preprocessing settings: data/tome_embryogenesis/E11.5_E12.5/preprocessing.json; sampling and scaling: src/hierarchical_ot/benchmarks/tome_data_generator.py.
We construct UOT problems between cells from developmental stages E11.5 and E12.5, represented in a common 30-dimensional PCA space.
Expression counts are normalized to a library size of $10^4$ and log-transformed, with 2,000 highly variable genes selected using the Seurat-v3 procedure.
Selected features are standardized and clipped at 10 before PCA.
For each seed, cells are sampled independently without replacement from each stage, and all compared methods use the same sampled inputs.
The main solver comparisons, restricted-solver snapshots, and entropic UOT comparisons use this benchmark.

\paragraph{Zhuang MERFISH.} 
% CN: 预处理与采样设置来自 data/zhuang_merfish/cache/Zhuang-ABCA-1_to_Zhuang-ABCA-2/pca_30/metadata.json 及 src/hierarchical_ot/benchmarks/zhuang_{preprocessing,data_generator}.py。
% EN: Preprocessing and sampling: data/zhuang_merfish/cache/Zhuang-ABCA-1_to_Zhuang-ABCA-2/pca_30/metadata.json and src/hierarchical_ot/benchmarks/zhuang_{preprocessing,data_generator}.py.
The scalability benchmark uses two whole-brain samples, Zhuang-ABCA-1 and Zhuang-ABCA-2~\citep{zhang2023wholebrainmerfish}, with a common 30-dimensional PCA representation of 1,122 measured genes.
Counts are normalized to a total of 1,000 per cell and log-transformed; gene standardization and PCA are fitted jointly across both samples.
Within each seed, nested subsets are drawn from fixed permutations of the two samples, reaching $m=n=1{,}048{,}576$.

\paragraph{Costs and reference masses.}
Unless otherwise specified, we use uniform reference masses $a_i=1/m$, $b_j=1/n$, and squared-Euclidean costs on the input features.
For each sampled problem, both point clouds are scaled by the same factor so that the mean cost $(mn)^{-1}\sum_{i,j}C_{ij}$ equals one.
The four standard marginal-penalty settings are $(\rho_a,\rho_b)\in\{(0.1,0.1),(1,1),(10,10),(0.045,99.995)\}$.
Each hierarchy level retains its selected reference weights; normalized-reference experiments rescale each side to unit mass, while runs preserving absolute masses leave these weights unscaled.
Task-specific representations, growth priors, and cost settings for the downstream applications are described below.

\subsection{Metrics and Measurements}
\label{app:experiment-metrics}

\paragraph{Runtime and memory.}
Unless otherwise specified, \runtime measures wall-clock time from prepared CPU inputs to synchronized solver output, including input transfer, cost construction, hierarchy construction, initialization, and native stopping checks when applicable.
Compilation, explicit warmup, common post-solve evaluation, and serialization are excluded.
\gpumem is peak active GPU allocation in GiB, including inputs, workspace, and outputs.
Method-specific measurement conventions are given in Appendix~\ref{app:implementation-details}.

\paragraph{Primal accuracy.}
For UOT comparisons, we evaluate all returned couplings using the objective $\Phi$ in~\eqref{eq:primal-uot}, including those obtained with entropic regularization or low-rank constraints.
Using the same feasible dual bound $D_{\mathrm{ref}}$ for every method and parameter setting on an instance, we report
\begin{equation}
\sharedgap=\frac{\Phi(\mathbf X)-D_{\mathrm{ref}}}{\max\{|\Phi(\mathbf X)|,|D_{\mathrm{ref}}|,10^{-15}\}}.
\label{eq:experimental-shared-gap}
\end{equation}
This measures primal accuracy independently of each solver's returned dual variables.
For complete UOT problems, a separate \ours solve at KKT tolerance $10^{-8}$ supplies reference potentials, which undergo FP64 full-space c-transforms, potential translation, and a numerical safety shift followed by an independent dual-feasibility audit.
Restricted-solver comparisons construct the bound on the common restricted problem instead.
The entropic and UFGW evaluations use their respective objectives, as specified below.

\paragraph{Reporting.}
Seeds and repeat counts are specified for each experiment.
In tables, bold marks the best displayed values within each comparison, including ties.

\subsection{Implementation Details of Compared Algorithms}
\label{app:implementation-details}

\subsubsection{\ours and \subsolver}
\label{app:implementation-shuttle}
\ours uses PyTorch for GPU data management and custom C++/CUDA kernels for hierarchy scans and restricted UOT solves.
The \subsolver backend maintains FP64 primal and dual iterates and evaluates the original UOT stopping measures.
The component comparisons use the same hierarchy parameters, support-management rules, cost-precision policy, and KKT tolerance, with only the declared component changed.

\paragraph{Precision and refinement safeguard.}
The default cost policy in the current \ours experiment configurations is \texttt{finest\_fp64}: input features are stored in FP32, coarse-level costs are evaluated in FP32, and finest-level costs and full-space stopping checks are evaluated in FP64.
The primal and dual iteration states remain in FP64 at every level.
The shared lower-bound construction additionally uses FP64 cost evaluation and a full-space dual-feasibility audit.
% \xwz{Protocol audit: verify the actual cost policy and source version of every historical table/figure before finalization; this paragraph describes the current experiment configurations. Retain per-artifact provenance rather than assuming historical defaults match.}

The \checkstop operator includes the local decrease and pricing-fidelity checks defined in Appendix~\ref{app:refinement-local-stopping} as part of \subsolver's stopping rule.
The checks use the costs evaluated at that level, with FP64 arithmetic for the bounds, under the same cost-precision policy.
The bound arithmetic and coordinate minimization use ordinary floating-point operations, so the computed bounds approximate the exact-arithmetic quantities in the proofs.
The finite-termination results assume valid bounds and attainable outputs; they do not assert universal finite-precision termination.
An unmet stopping condition at an iteration or time limit is reported as failure.
At restricted-solver termination checks, the implementation may apply the score-preserving translation~\eqref{eq:potential-translation} to output potentials, accepting them only if all stopping conditions pass.
A rejected translation leaves the iteration state unchanged.

\subsubsection{Main UOT Baselines}
\label{app:implementation-uot-baselines}

\paragraph{\mm.}
We use GPU multiplicative majorization--minimization updates for KL-UOT~\citep{chapel2021unbalanced} and sweep the native stopping tolerance.
The coupling and cost matrix are stored densely in FP64.

\paragraph{\sinkhorn.}
We use the OTT-JAX implementation of unbalanced \sinkhorn~\citep{chizat2018scaling}, with FP64 log-domain updates and potential recentering.
The complete-UOT Pareto comparison uses dense costs and sweeps the entropic strength; the entropic extension uses online cost evaluation and sweeps the native stopping threshold.
Compilation is performed in a separate process before measurement, followed by independent warmup and a fresh timed solve.

\paragraph{\ulot and \hellouot.}
\ulot constrains the coupling to a nonnegative low-rank factorization~\citep{scetbon2023unbalanced}; its rank is varied in the runtime--accuracy comparison.
\hellouot uses fully corrective Frank--Wolfe with balanced \hello oracles~\citep{xia2026dual}; Appendix~\ref{app:hello-uot-comparison} gives its initialization and stopping settings.

\subsubsection{Supplementary UOT Baselines}
\label{app:implementation-extra-baselines}

\paragraph{\etm.}
We reimplement the authors' public \etm-Approx iterations~\citep{liu2026solving} in PyTorch/CUDA with FP64 arithmetic and replace the final balanced OT solver with \hello, preserving the estimated transported marginals and their common total mass.
We denote this variant by \etm-Approx+\hello and sweep the entropic strength with a fixed budget of 1,000 marginal-estimation iterations.
% CN: 加速数据来自 experiments/etm_online_profile/results/20261115_short32768_my4090/metrics.json 的首遍完整测量：n=32768，5 轮，rho=(1,1)，epsilon=0.01；NumPy 106.940 s，CUDA 2.181 s。NumPy 预建成本，CUDA online；省略未使用的 slack 输出，均不含 HELLO；第二遍按作者要求停止。
% EN: Speedup: first completed measurement in experiments/etm_online_profile/results/20261115_short32768_my4090/metrics.json: n=32768, five iterations, rho=(1,1), epsilon=0.01; NumPy 106.940 s, CUDA 2.181 s. NumPy uses prepared costs and CUDA uses online costs; unused slack output and HELLO are excluded. The second repeat was stopped at the author's request.
On RTX 4090, GPU marginal estimation is tens of times faster than the official NumPy implementation in our pilot measurements.
End-to-end comparisons include marginal estimation and \hello coupling construction.

\paragraph{\potlbfgsb.}
We use POT 0.9.7.post1's CPU L-BFGS-B solver in FP64, with KL marginal penalties and zero coupling regularization.
We sweep its native tolerance with at most 1,000 iterations and evaluate the returned coupling using the shared original-UOT gap.
Runtime includes dense cost construction and optimization.

\paragraph{\multiscaleot.}
We use the KL soft-marginal solver in \multiscaleot 0.3.8~\citep{schmitzer2019stabilized} on three-dimensional point clouds, with separate marginal penalties and squared-Euclidean costs.
We reimplement its sparse scaling iterations in PyTorch/CUDA FP64, retaining the official CPU hierarchy, kernel truncation, absorption rules, epsilon schedule, and stopping checks.
% CN: 加速与等价性数据来自 paper_experiments_uot/accuracy_runtime_pareto/results/20261115_lowdim_my4090/lowdim_baselines/multiscale_equivalence.json；四组 rho、三个 epsilon，包含 CPU 结构及数据传输。
% EN: Speedups and equivalence: paper_experiments_uot/accuracy_runtime_pareto/results/20261115_lowdim_my4090/lowdim_baselines/multiscale_equivalence.json; four rho pairs and three epsilon values, including CPU structures and transfers.
Across 12 configurations at $n=4{,}096$, this implementation is 2.2--5.0$\times$ faster than the official CPU solver on RTX 4090, with identical final supports and maximum coupling-entry difference below $10^{-15}$.
We sweep the final entropic strength over $10^{-2},10^{-3},10^{-4}$, using hierarchy depth four, truncation threshold $10^{-20}$, and the native error goal $10^{-8}$.
Runtime includes CPU setup, GPU iterations, and data transfers.

\subsubsection{\pdcs}
\label{app:implementation-pdcs}
Our \pdcs implementation is based on the official GPU implementation of \citet{lin2025practical} in the \texttt{src/pdcs\_gpu} directory of \href{https://github.com/ZikaiXiong/PDCS}{\texttt{ZikaiXiong/PDCS}}, at commit \href{https://github.com/ZikaiXiong/PDCS/commit/d7e15f5f14b1bf3f503eac155906923c5de07c63}{\texttt{d7e15f5f14b1bf3f503eac155906923c5de07c63}}.
Starting from this implementation, we implement a PyTorch interface with custom C++/CUDA kernels and optimize generic execution overhead.
Each restricted KL-UOT problem is represented exactly as an exponential-cone program with an explicit sparse conic matrix.
The port retains the upstream scaling, adaptive step-size, restart, and primal-weight update rules.

The CUDA extension reuses the upstream exponential-cone projection device routines and applies buffer reuse, cached cuSPARSE descriptors and workspaces, and fusion of vector updates, projections, and reductions.
These optimizations operate on general sparse matrices, cone projections, and vectors.
Solver iterates and original-coordinate UOT certificate checks use FP64 arithmetic.
The scaled model, initialization, and early iteration updates are checked against the Julia/CUDA implementation; floating-point accumulation and fusion can change later adaptive decisions.
The Julia validation baseline uses the same pinned commit with a recorded compatibility patch for CUDA.jl dispatch, optional certificate callbacks, import-time setup, and the initial matrix infinity norm.

\paragraph{Integration and measurement.}
The notation \ours (\pdcs) denotes the full \ours hierarchy with \pdcs replacing every restricted solve, including the coarsest solve.
The measured backend configurations use zero initialization for each \pdcs restricted problem and propagated warm starts for \subsolver.
% \xwz{Pending matched-initialization rerun: the present 43.09 s PDCS result is cold-started and the 0.77 s PDUOT result is warm-started. Do not relabel these as warm-start PDCS versus warm-start PDUOT; replace the data only after implementing and measuring PDCS warm starts.}
Both backends are checked using the original unregularized UOT certificate rather than the native conic residual alone.
End-to-end timing includes model conversion, workspace construction, GPU transfers, and certificate checks, while compilation and explicit prewarming are excluded.
The reported comparison therefore measures the complete backend implementations under their recorded initialization policies; it does not isolate the effect of their update formulas.

\subsubsection{UFGW Block-Coordinate Solvers}
\label{app:implementation-ufgw}
% CN: 实现来源和版本见 /home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/ufgw_solver_comparison/results/20261110_ufgw_starmap_n16384/cases/*/{shuttle,pot}_repeat0/provenance.json；实际参数见同目录 request.json 和批次 config.json。
% EN: Implementation sources and versions are recorded in /home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/ufgw_solver_comparison/results/20261110_ufgw_starmap_n16384/cases/*/{shuttle,pot}_repeat0/provenance.json; request.json and the batch config.json record actual settings.
The UFGW comparison uses the two-coupling tensorized-KL objective in Appendix~\ref{app:ufgw-extension}, with identical product initialization and mass rescaling after each coupling update.
Each method completes ten full sweeps, with outer early stopping disabled.
Inner solvers use their native stopping tests at tolerance $10^{-6}$, and optimization quality is evaluated through the common FP64 objective.
% \xwz{PRECISION CHECK PENDING: POT 0.9.7.post1 UFGW defaults to tol_ot=1e-7, whereas this batch explicitly uses 1e-6. Native stopping residuals are not equivalent across POT and PDUOT. No tighter-tolerance results have been measured here; run a POT-MM pilot at 1e-7 and 1e-8 before making equal-inner-accuracy claims, then update the comparison if needed.}

POT version \texttt{0.9.7.post1} runs its dense BCD algorithm on GPU in FP64, using \mm for unregularized blocks and a local log-domain \sinkhorn adapter for entropic blocks.
We denote these baselines by \bcdmm and \bcdsinkhorn, respectively.
The \mm adapter preserves the installed POT updates and stopping rule while suppressing storage of full coupling matrices at every inner iteration.
The entropic adapter solves the same KL-regularized block using log-sum-exp updates, avoiding the kernel-domain path selected by the installed unified solver interface.
It stops when the maximum change in either log scaling, multiplied by the block entropy coefficient, is below the inner tolerance.
Both adapters retain POT's coupling and dual warm starts, and are checked against POT solutions on small problems without underflow.

\oursufgw uses the native mixed-precision cost policy and FP64 \subsolver iterates.
It retains cross-block support, primal, and dual warm starts subject to the complementarity gate with threshold $0.1$, using a fixed inner tolerance throughout.
The entropic variant, \ourssinkhornufgw, uses automatic support reconstruction followed by sparse \sinkhorn refinement, returning sparse couplings without dense reconstruction.

The common objective is evaluated independently in CPU FP64 after each complete sweep, including all mass corrections and the joint entropy constant.
Runtime includes input transfer, cost or hierarchy construction, block updates, mass rescaling, and native diagnostics; compilation, warmup, common objective evaluation, and serialization are excluded.
GPU memory is the maximum active PyTorch allocation during the algorithm, measured separately from common evaluation.
Before measurement, each worker runs one complete warmup sweep on a 32-point problem with the same method and entropy setting.
\subsection{Task-Specific Protocols}

\subsubsection{Unregularized UOT Comparisons}
The complete-problem Pareto figure varies stopping tolerances for \ours, \mm, and \hellouot, entropic strength for \sinkhorn, and rank for \ulot.
Larger markers indicate tighter stopping tolerances, smaller \sinkhorn regularization, or larger \ulot rank; lines connect configurations in sweep order.
The current figure uses means over available valid paired runtime and shared-gap observations from planned seeds 42--46, with incomplete coverage that varies by configuration.
% CN: 当前图及各点覆盖记录来自 paper_experiments_uot/accuracy_runtime_pareto/results/20261111_202336/{plot_selection.json,pareto_aggregate.csv}；plot_count、plot_seeds、plot_complete 记录有效覆盖，最终五 seed 汇总待完成。
% EN: Current plotting and coverage records are paper_experiments_uot/accuracy_runtime_pareto/results/20261111_202336/{plot_selection.json,pareto_aggregate.csv}; plot_count, plot_seeds, and plot_complete record valid coverage, pending the complete five-seed summary.

The million-point scaling figure uses seed 42 and one measurement per configuration on a single A100 GPU.
The gray linear and quadratic slope guides have arbitrary vertical offsets and are not fitted models or complexity bounds.

\subsubsection{Restricted-Solver Snapshots}
\label{app:restricted-experiment-protocol}
The current restricted-solver Pareto figure uses the lower-middle restricted problem among the finest-level solves of a parent \ours run on TOME E11.5--E12.5 ($m=n=65{,}536$, $d=30$).
This is the historical snapshot-selection rule; newer captures use the upper-middle solve, and historical snapshots retain their original metadata.
The four penalty settings have active supports between $1.31$ and $1.68$ million edges.
Each solver uses its standard initialization and native stopping rule, with one run per configuration and parent seed 42.
Lines connect valid parameter settings in sweep order; larger markers target higher accuracy.
The common primal-accuracy evaluation uses~\eqref{eq:experimental-shared-gap}.

\subsubsection{System Component Ablations}
The preliminary component table uses equal marginal sizes, seed 42, one run per variant, and a KKT tolerance of $10^{-6}$.
Panels A, B, D, and E use TOME E11.5--E12.5 with $d=30$; Panel C uses Gaussian point clouds with $d=3$.
The common dual-assignment budget is $\kappa=16$ and the coarsest-size threshold is 256.
\refineiters counts restricted-solve rounds at the finest problem size, including the final convergence-check round; it does not count inner iterations.
Memory is peak active PyTorch allocation in GiB, and compilation and prewarming are excluded from timing.
Panel C retains native backend initialization as described in Appendix~\ref{app:implementation-pdcs}; its memory measurements are unavailable.

\subsubsection{Entropic UOT Evaluation}
\label{app:entropic-evaluation}
We evaluate the full entropic primal objective $P_\varepsilon$, including the entropy constant outside the reported support, and use a shared dual lower bound $D_{\varepsilon,\mathrm{ref}}$ from an independent FP64 \ottonline solve with native stopping threshold $10^{-8}$:
\begin{equation}
\entropicgap=\frac{P_\varepsilon-D_{\varepsilon,\mathrm{ref}}}{\max\{|P_\varepsilon|,|D_{\varepsilon,\mathrm{ref}}|,10^{-15}\}}.
\label{eq:entropic-evaluation-gap}
\end{equation}
Each comparison fixes the entropic strength and marginal penalties, so all methods approximate the same full entropic UOT problem.
Runtime covers prepared CPU inputs through synchronized solver output, including input transfer, the unregularized \ours solve, support construction, and sparse refinement when used; compilation, warmup, and common post-solve evaluation are excluded.
The current Pareto figure compares reconstruction budgets $b_{\mathrm e}\in\{2,4,8,16,32\}$ with direct reuse of the final active support.
\ottonline sweeps its native stopping threshold from $10^{-2}$ to $10^{-6}$, and \sparsink sweeps the sampling budget factor from $8$ to $128$.
The current measurements use seed 42 and one run per configuration.
% CN: 当前图仍展示历史 direct-reuse 叉号；自动预算 reconstruction 点待测量或核验后，与图注和正文同步替换，见 EXPERIMENT_PROGRESS.md 的 E14--E15。
% EN: The current figure still shows historical direct-reuse crosses; automatic-budget reconstruction points await measurement or validation and coordinated replacement of the figure, caption, and text. See E14--E15 in EXPERIMENT_PROGRESS.md.

\subsubsection{UFGW Objective}
We denote the two-coupling objective by \ufgwobj, with $\varepsilon=0$ recovering~\eqref{eq:ufgw-relaxation} and $\varepsilon>0$ using the regularized relaxation in Appendix~\ref{app:ufgw-extension}.
The solver comparison matches initialization, feature and structural costs, and penalty coefficients, and runs exactly ten complete coupling-update sweeps with outer early stopping disabled.
STARmap inputs use physical spatial coordinates and 30-dimensional expression features, with $\alpha=0.4$ and $\rho_a=\rho_b=0.1$.
Each configuration uses seed 0 and one measurement on an A100 GPU; the common FP64 objective evaluation is excluded from solver timing.
Appendix~\ref{app:implementation-ufgw} gives the solver implementations and measurement protocol.

\subsubsection{Temporal Transport}
The moscot temporal benchmark uses released 30-dimensional expression embeddings, growth priors, and the authors' downstream evaluation pipeline~\citep{klein2025mapping}.
The current comparison covers all 19 time pairs with seed 42 and one run per configuration on A100 GPUs.
\ourssparsink reconstructs support within the final active-support budget and retains the resulting sparse coupling for downstream evaluation.
Full-rank \sinkhorn and \ourssparsink use $\varepsilon=0.005$ and matched marginal penalties; low-rank UOT follows the authors' separate rank-specific settings with $\varepsilon=10^{-4}$ and $1000$ iterations.
The marginal penalties vary across time pairs according to the authors' calibration of predicted apoptosis rates, so the comparison evaluates downstream utility under the published application settings.
% CN: 统计来自 paper_experiments_uot/moscot_time/results/20261102_005354_paper_data/{summary.csv,summary_table.csv}；114/114 项已完成。
% EN: Statistics come from paper_experiments_uot/moscot_time/results/20261102_005354_paper_data/{summary.csv,summary_table.csv}, with 114/114 configurations complete.
Across all 19 time pairs, the relative deviations of \ourssparsink from full-rank \sinkhorn are below $1.26\%$ for \transitionacc\ and $0.034\%$ for germ-layer accuracy, where relative deviation is the absolute score difference divided by the full-rank score.
Appendix~\ref{app:temporal-timing} reports coupling and downstream evaluation times separately.

\subsubsection{Spatial Alignment}
For each MOSTA time pair, we select the highest-accuracy BCD configuration from 20 settings spanning five values of $\alpha$, two finite marginal penalties, and both directions of a single hard marginal constraint.
The moscot low-rank UFGW baseline uses the authors' selected parameters.
The BCD variant uses the tensorized-KL two-coupling relaxation, whereas moscot uses a low-rank single-coupling model; both are evaluated through the same downstream transition metric.
The inferred coupling is aggregated by cell type, each source-type row is normalized, and \transitionacc\ measures the fraction of transition probability assigned to biologically allowed pairs.
Both methods are measured once per pair with seed 0 on A100 GPUs after independent warmup.
Timing covers prepared normalized CPU inputs through synchronized CPU outputs, excluding compilation, warmup, downstream evaluation, and file I/O.
The table reports \transitionacc\ in percent to one decimal place and runtime in seconds rounded to the nearest integer.
```
