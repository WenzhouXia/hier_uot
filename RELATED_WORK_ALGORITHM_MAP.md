# UOT related work：算法与分类备忘

本文档用于讨论 introduction 的分类，不替代文献综述或论文正文。覆盖当前 related work 的主要算法论文，并补充已讨论的 ETM、UOT 综述、HELLO 和近期 network-simplex 路线。

核对日期：2026-10-18。下文将原论文结论、标准实现的成本和本文写作建议分开。复杂度一般是单次迭代或单次扫描的成本，不能直接当成达到目标精度的总成本。记 $s$ 为保留的边数，$r$ 为 coupling 的非负秩，$k$ 为 cost factorization 的秩。

2026-11-12 增补 Auricchio et al. 的 cost-truncation/PFW 论文（Section 2.15），并更新 Sections 3、4、9 的分类和叙事建议；其余条目保留各自的核对范围，不代表全量重新核验。当前引言叙事以 [STORYLINE_INTRO.md](STORYLINE_INTRO.md) 为准。

2026-11-14 系统补查见 Section 10，新增 GeomLoss、POT L-BFGS-B、Bregman proximal、dynamic-penalty BPD、NFFT 及更多软件/模型路线；当前代码可获取性、候选资格与未核实项以 Section 10 为准。

## 1. 分类前先区分的几个概念

| 信息 | 要问的问题 | 不能混淆的内容 |
|---|---|---|
| 求解目标 | 是否仍是原始 marginal-penalized UOT？ | 无熵不等于没有其他 coupling 正则；平方范数 coupling 正则不等于 L2² marginal penalty |
| coupling 表示 | dense、非负低秩，还是 sparse edge list？ | 低秩 coupling 仍可能所有条目均为正 |
| 候选边处理 | 每轮遍历全部点对、采样、筛除，还是动态定位？ | 输出稀疏不代表计算过程已经利用稀疏性 |
| cost 假设 | 任意 pairwise cost、低秩 cost、一维，还是树度量？ | 低秩 cost 与低秩 coupling 是两个独立条件 |
| 近似来源 | 熵、平方范数、rank constraint、kernel truncation、sampling、metric replacement？ | 数值停止误差与模型近似误差不同 |
| 保证 | 原目标最优性、修改目标的最优性、stationarity，还是统计一致性？ | 这些保证不能互相替换 |
| 并行性 | 基础操作是否适合 GPU？ | GPU-friendly 不等于论文有官方 GPU 实现 |

## 2. 逐篇算法介绍

### 2.1 Chizat et al. — Scaling algorithms for unbalanced optimal transport problems

- **引用键：** `chizat2018scaling`。
- **来源：** [论文](https://arxiv.org/abs/1607.05816)，重点见 generalized scaling 算法及 KL-UOT 特例。
- **算法：** 在 transport coupling 上加入熵正则，将优化转成广义 Sinkhorn scaling；交替更新两侧 scaling，KL marginal penalty 对应带指数的 scaling 更新。框架还处理其他边际项、barycenters 和 gradient flows。
- **目标：** 有熵 UOT；有限熵系数下与正文无熵 KL-UOT 不同。熵趋零提供逼近路线。
- **表示与成本：** coupling 隐式表示成 $\operatorname{diag}(u)K\operatorname{diag}(v)$，其中 $K_{ij}=\exp(-C_{ij}/\varepsilon)$。普通完整 kernel 更新需要遍历 $mn$ 个 kernel 项；scalings 本身只占 $O(m+n)$ 内存。显式 kernel/coupling 占 $O(mn)$，matrix-free 可降低存储。
- **关键优点：** 简单、并行性强；是有熵 UOT 的基础算法，而不只是用于逼近无熵问题的工具。
- **分类标签：** 熵正则；scaling；完整 kernel 基线。
- **写作边界：** 不要写“所有 Sinkhorn 实现都需要二次内存”。

### 2.2 Pham et al. — On Unbalanced Optimal Transport: An Analysis of Sinkhorn Algorithm

- **引用键：** `pham2020unbalanced`。
- **来源：** [ICML 2020 页面与原文](https://proceedings.mlr.press/v119/pham20a.html)。
- **算法：** 研究 KL-UOT 的 Sinkhorn 更新及其几何收敛，并控制熵正则引入的误差，以获得原始 UOT 的近似解。
- **目标：** 算法内部求有熵问题；理论通过选择正则系数，分析对无熵 UOT 的近似。
- **规模结论：** 对每侧至多 $N$ 个点，论文给出求 $\delta$-近似 UOT 解的 $\widetilde O(N^2/\delta)$ 总复杂度；有论文设定与参数依赖，不能把它当成任意实现的实测 scaling。
- **关键优点：** 为广义 Sinkhorn 提供明确的精度复杂度分析。
- **分类标签：** 熵正则；scaling；理论分析。
- **写作位置：** 与 Chizat 合并引用，不必在 introduction 为它单独介绍一个算法家族。

### 2.3 Séjourné et al. — Faster Unbalanced Optimal Transport: Translation invariant Sinkhorn and 1-D Frank-Wolfe

- **引用键：** `sejourne2022faster`。
- **来源：** [AISTATS 2022 页面与原文](https://proceedings.mlr.press/v151/sejourne22a.html)。
- **这篇有两条算法路线，不能只归为 Sinkhorn。**
- **路线 A：translation-invariant Sinkhorn。** 利用 $f\leftarrow f+t$、$g\leftarrow g-t$ 保持 pairwise sums 的性质，对全局质量/势平移方向进行优化，改进 UOT scaling 的收敛。仍求有熵目标，普通完整 kernel 下仍有全点对工作。
- **路线 B：OT-oracle Frank–Wolfe。** 原论文对平移优化后的 formulation 使用 Frank–Wolfe，并重点利用已排序一维 balanced OT 的线性时间 oracle；这条路线可处理无熵 UOT。框架本身并不局限于一维：HELLO 的 UOT 扩展以一般维度 balanced OT oracle 实现 translation-invariant fully-corrective Frank–Wolfe，见本地 `papers/hello/main_appendix.tex` 的 UOT 部分。正文可以并列引用 `sejourne2022faster,xia2026dual`，无需另起 HELLO-UOT 方法名；这里的 oracle 用途与后文直接迁移 dual-guided hierarchy 是两个不同层次。
- **关键优点：** 揭示 UOT 的全局 normalization 问题；一维算法利用的结构非常强。
- **分类标签：** A：熵正则/scaling；B：OT-oracle reformulation/一维结构。
- **与 hier_uot 的关系：** 势平移是直接相关的先例。不能将 score-preserving translation 本身当作我们首次提出的机制；应强调它在跨层 potential calibration 中的用途。
- **写作边界：** 一维 oracle 的线性成本不能外推到任意高维 cost。

### 2.4 Schmitzer — Stabilized sparse scaling algorithms for entropy regularized transport problems

- **引用键：** `schmitzer2019stabilized`。
- **来源：** [论文](https://arxiv.org/abs/1610.06519)，摘要及 stabilization、truncation、coarse-to-fine 部分。
- **算法：** 组合 log-domain stabilization、$\varepsilon$-scaling、adaptive kernel truncation 和 coarse-to-fine 计算。对当前势下不重要的 kernel 条目做截断，在保留的 sparse kernel 上进行 scaling。
- **目标：** 有熵 transport，包括 KL-UOT；不是无熵 active-support optimization。
- **表示与成本：** 若 kernel 保留 $s$ 条边，scaling 的稀疏矩阵操作可按 $O(s+m+n)$ 执行；总体成本还包括 support 构造、更新和层级处理，取决于数据与截断条件。
- **点云适用性：** 不限于标准网格。原文 Section 3.4、Definition 12 与 Algorithm 4 给出一般离散集上的 hierarchical partitions；Algorithm 4 后明确讨论 $\mathbb R^d$ 点云和空间树，以及如何用 block cost 下界避免存储完整 cost。实验主要使用 Cartesian grids，不等于算法仅适用 grid。点云适配的实际效率依赖空间树和有效 cost 下界，高维效果不能凭此直接断言。
- **关键优点：** 同时处理小熵数值稳定性和稠密 kernel 成本；已有 hierarchy 与 sparse computation。
- **分类标签：** 熵正则；adaptive kernel truncation；multiscale。
- **写作边界：** 它不只是“稳定化技巧”。其稀疏、层级组成与我们的框架有关，必须准确承认；差异应落在目标和定位/求解机制上。

### 2.5 Li et al. — Importance Sparsification for Sinkhorn Algorithm

- **引用键：** `li2023importance`。
- **来源：** [JMLR 2023 页面](https://jmlr.org/papers/v24/22-1311.html)，原文 Section 3 与理论部分。
- **算法：** 从未知最优 coupling 的可计算上界构造 importance sampling probabilities；随机采样并重加权 kernel 条目，之后在 sparse kernel 上运行 Sinkhorn（Spar-Sink）。覆盖 OT 与 UOT。
- **目标：** 近似有熵 OT/UOT；同时有熵正则与 kernel sampling 两类因素。
- **表示与成本：** 采样后每次 kernel 操作为 $O(s)$，论文在相应条件下以 $\widetilde O(N)$ 采样规模给出一致性结果。初始化、概率构造和抽样成本需单独计算，不能从每次迭代的线性成本直接推出端到端线性成本。
- **关键优点：** 用随机 kernel 稀疏化减少 Sinkhorn 迭代工作，并分析一致性。
- **分类标签：** 熵正则；importance sampling；sparse kernel。
- **写作边界：** 随机采样边不是 safe elimination，也不是非负低秩 coupling；不能称作确定性无熵最优 support 恢复。

### 2.6 Scetbon et al. — Unbalanced Low-rank Optimal Transport Solvers

- **引用键：** `scetbon2023unbalanced`。
- **来源：** [NeurIPS 2023 原文](https://proceedings.neurips.cc/paper_files/paper/2023/file/a439259e78294c38d157a51a2c40486b-Paper-Conference.pdf)，Sections 2–3 的目标与 Complexity 段。
- **算法：** 将 coupling 表示为 $P=Q\operatorname{diag}(1/g)R^\top$，以 KL 边际惩罚放松 mass constraints。外层在 factor variables 上做 KL-proximal gradient 更新，内层使用 unbalanced Dykstra 型算法处理约束和边际项。扩展至 ULGW/ULFGW。
- **目标：** rank-constrained UOT；不必依靠 coupling 熵正则。因子化约束导致非凸优化，通常分析 stationarity。
- **表示与成本：** coupling factor storage 为 $O((m+n)r)$。当 cost 有秩 $k$ 的有效分解时，线性 UOT 外层梯度可用 $O((m+n)rk)$ 时间计算；内层迭代另有成本。任意 dense cost 不自动享受线性时间。GW/FGW 需要相应结构 cost 的 factorization。
- **关键优点：** 官方 ott-jax 实现；可直接对 factorized coupling 做下游操作，大规模应用基础较强。
- **分类标签：** 非负低秩 coupling；structured representation；rank-constrained optimization。
- **写作边界：** 因子上的 KL proximal term 是算法更新的一部分，不应直接说成原目标加了 coupling 熵；非负低秩也不等于 sparse coupling。

### 2.7 Sato et al. — Fast Unbalanced Optimal Transport on a Tree（不纳入正文）

- **引用键：** `sato2020fast`。
- **来源：** [NeurIPS 2020 原文](https://proceedings.neurips.cc/paper_files/paper/2020/file/dba31bb5c75992690f20c2d3b370ec7c-Paper.pdf)，GKR 定义、Theorem 2 与 Section 4。
- **算法：** 在 tree metric 上求 generalized Kantorovich–Rubinstein（GKR）问题，允许按节点代价创建/销毁质量。自底向上动态规划，以 convex piecewise-linear functions 表示子树状态，用快速 min-sum convolution 和数据结构合并。
- **目标：** 树度量上的 GKR 类 UOT，包含 KR/partial-transport 相关模型；不是任意 pairwise cost 下本文的 KL marginal-penalized UOT。
- **规模结论：** $O(V\log^2 V)$ 时间，$V$ 是树节点数。论文报告百万节点的 CPU 实验。其高维困难性结论针对特定 KR/partial OT 问题及维度条件，不能直接引用为本文 KL-UOT 的下界。
- **关键优点：** 在明确结构下做精确求解，而不是必然有近似；若用树替换原始几何，近似来自该替换。
- **分类标签：** 特殊 ground metric；tree dynamic programming。
- **写作决定：** 根据作者选择，正文不再纳入此文献；这里保留核对记录。相应分类收紧为 low-rank methods，不再为 tree metric 保留位置。

### 2.8 Chapel et al. — Unbalanced Optimal Transport through Non-negative Penalized Linear Regression

- **引用键：** `chapel2021unbalanced`。
- **来源：** [NeurIPS 2021 原文](https://proceedings.neurips.cc/paper_files/paper/2021/file/c3c617a9b80b3ae1ebd868b0017cc349-Paper.pdf)，Section 3.1 与 Section 3.2。
- **共同出发点：** 将 UOT 写成非负 penalized regression，运输 cost 是线性项，incidence operator 汇总 transported marginals。
- **路线 A：MM。** 构造 majorizer，得到逐边 multiplicative updates；覆盖 KL、L2² 等 marginal penalties，可直接用于无额外 coupling 正则的 UOT。每轮需要边流与 row/column sums，操作简单、适合 GPU。完整 dense support 下每轮 $O(mn)$；若专门改写为 restricted edge list，则可按边数做稀疏计算，但这不是自动产生动态 support 策略。
- **路线 B：L2² regularization path。** 利用 weighted nonnegative Lasso 形式，按参数断点维护正流 support，求分段线性的整条解路径；需要求解 support 上的线性系统，并搜索下一次边进入/离开事件。论文在 cost 的倒数权重上参数化，不能直接把其 $\lambda$ 当作我们的 $\rho$。
- **关键优点：** MM 是原始无熵目标的直接、可并行强 baseline；path algorithm 显式利用 support，适合考察一系列参数。
- **分类标签：** A：直接目标优化/MM；B：support/path method。
- **写作边界：** 有稀疏输出不代表 dense MM 已减少运算。也不能笼统说 MM 无法产生任何 dual information；标准输出和停止准则不控制高质量 dual，与理论上不能恢复 dual 是不同的判断。

### 2.9 Nguyen et al. — On Unbalanced Optimal Transport: Gradient Methods, Sparsity and Approximation Error

- **引用键：** `nguyen2023unbalanced`。
- **来源：** [JMLR 2023 页面](https://jmlr.org/papers/v24/22-1158.html)，特别是 Section 2.2、Eqs. (5)–(7)、Algorithm 1 和 Theorem 13。
- **算法：** 在原始 KL-UOT 上额外加入 coupling 的平方范数项 $\eta\|X\|_F^2$，推导包含 squared positive-part 项的光滑 dual，再用 Gradient Extrapolation Method（GEM-UOT）求解；coupling 可由 dual score 的正部恢复。论文通过足够小的 $\eta$ 控制对原始 UOT 的近似误差。
- **目标：** KL marginal penalty + L2² coupling regularization；**不是 L2² marginal penalty，也不是有限 $\eta$ 下完全相同的原始 KL-UOT。**
- **表示与成本：** dual 主要变量只有 $m+n$，但梯度需要聚合 pairwise positive-part terms。论文给出每轮近二次成本和相应条件下的迭代复杂度；低维 dual 不自动消除完整点对计算。恢复的 coupling 可以有精确零项。
- **关键优点：** 有明确的梯度算法和近似误差理论，说明稀疏输出不必依赖熵趋零。
- **分类标签：** 平方范数 coupling 正则；smooth dual；gradient extrapolation。
- **当前 tex 的风险：** 不宜把 MM 与 GEM 一并写成“直接优化原始无正则 UOT 的 dense primal updates”。GEM 的主算法是 dual formulation，而且额外正则是关键组成。

### 2.10 Su et al. — Safe Screening for Unbalanced Optimal Transport

- **引用键：** `su2025safe`。
- **来源：** [公开预印本](https://arxiv.org/abs/2307.00247)，Sections 3.1–3.4、Table 2、Appendix B.2；[期刊 DOI](https://doi.org/10.1016/j.neucom.2025.132308)。本次算法细节核对的是 2023 arXiv v1，未逐条对照期刊最终版本。
- **算法：** 根据 KKT，若某条边在最优 dual 下严格不紧，则其最优 flow 必为零。先从 feasible dual 和 primal–dual gap 构造包含最优 dual 的 safe region；若该 region 上这条边的最大 dual score 仍严格为负，就安全删除。提出 shifting projection、gap-based ball/ellipse，以及利用双超平面进一步收紧的 CTP 规则。
- **KL 与 L2² 的区别：** L2² marginal penalty 的 dual 有较直接的强凹性；KL 需要用局部坐标界构造曲率和椭球。公开版 Table 2 / Appendix B.2 的 KL 公式含 transported marginal 的 $+\epsilon$ 平移，不能不加说明就认定它与我们未平移的 KL objective 完全一致；需要引用具体版本和公式。
- **筛完用什么 solver：** screening 是独立加速层，不是一个新 MM 或 primal–dual solver。论文 Section 4 对 L2 情形结合 FISTA、MM、coordinate descent、BFGS，对 KL 情形结合 MM、BFGS；代码实验为 Matlab。
- **表示与成本：** 论文 Algorithm 1 从 $mn$ 维 mask 出发，按周期筛边，优化器只处理保留变量。Section 3.4 分析完整 screening pass 的 $O(mn)$ 工作；这不意味着 incidence matrix 必须 dense 存储，也不意味着任何 screening 实现都必需二次内存。
- **关键优点：** 显式、带保证地缩减 support，可以与多种 solver 组合。
- **分类标签：** safe support elimination；solver-independent acceleration。
- **与 hier_uot 的关系：** screening 排除不可能的边，hierarchical localization 构造/补充候选边，可以互补。我们也有 full scans，因此不能仅以“它要二次扫描”解释差异。
- **年份提醒：** 当前 bib 写 2025；Crossref 的期刊卷期为 Neurocomputing 668、2026，DOI 含 2025。由作者自行决定按 online-first 或卷期年份维护，本文档不改 bib。

### 2.11 Liu et al. — Solving Discrete (Semi) Unbalanced Optimal Transport with Equivalent Transformation Mechanism and KKT-Multiplier Regularization

- **引用键：** `liu2026solving`。引用键保留原名，书目信息按 NeurIPS 2025 proceedings 记为 2025。
- **来源：** [NeurIPS 2025 proceedings PDF](https://proceedings.neurips.cc/paper_files/paper/2025/file/97a36b5f6db9e6703e4154cf0c582214-Paper-Conference.pdf)，Sections 3–4，Algorithms 1–2。
- **算法：** 先恢复 transported marginals，再将 coupling 求解转换为这些边际上的 balanced OT。ETM-Exact 使用含 hard c-transform 的 formulation 和 L-BFGS 型优化；ETM-Approx 使用 log-sum-exp 平滑与 fixed-point updates；ETM-Refine 用 Approx 初始化 Exact。论文还给出 KKT-multiplier regularization / MROT 路线，需与基本 ETM 分开。
- **目标与近似：** 理想精确边际下，最后的 OT 可恢复原 UOT 最优 coupling。仅用 Approx 的边际仍带平滑误差；额外 MROT 正则也需核对是否改变目标。不能把整篇所有配置都叫“精确无熵 solver”。
- **表示与成本：** 边际/势变量规模为 $m+n$，但 hard/soft c-transform 仍涉及点对运算；最后 balanced OT 的成本由所选 oracle 决定。精确转化不是自动的线性复杂度保证。
- **关键优点：** 将 nonlinear marginal selection 与 conditional balanced coupling 分开，直接连接成熟 OT solvers。
- **分类标签：** marginal-first reformulation；OT oracle；hard/soft c-transform。
- **与 hier_uot 的关系：** 可支持“固定 transported marginals 后变成 OT”的讨论；由 OT 基本解性质可推出**存在**至多 $m+n-1$ 条正边的 UOT 最优解，不表示每个最优解都这么稀疏。共享 sparse-optimum structure 与共享 dual constraints 分别支持 sparse representation 与 dual-guided localization。

### 2.12 Séjourné et al. — Unbalanced optimal transport, from theory to numerics

- **引用键：** `sejourne2023unbalanced`。
- **作用：** 综述与背景引用；不需要单列成一个 solver 家族。
- **写作用途：** 一般 UOT 定义、不同 divergence、理论与数值路线的总览；具体算法的技术结论优先引原始论文。
- **核对范围：** 本次按现有书目信息记录其背景角色，未重新逐章审读综述。

### 2.13 Xia et al. — Dual-guided Hierarchical Edge Localization for Large-scale Optimal Transport Across Dimensions

- **引用键：** `xia2026dual`。
- **来源：** 本地 `papers/hello/main_body.tex` 与 `TERMINOLOGY.md`。
- **算法：** balanced OT 的 dual-guided hierarchy。跨层传播 dual potentials 并构造初始 support；层内交替 restricted LP solve、full-space dual-violation detection、edge insertion 与 budgeted pruning。
- **目标：** 主算法求解原始 balanced discrete OT；其 UOT 扩展通过 balanced-OT oracle 执行 fully-corrective Frank--Wolfe，应与直接 restricted-UOT 求解区分。
- **表示与成本：** 固定特征维数与 support budget 下，持久状态为线性内存；完整扫描仍有 $mn$ 级点对工作，特征计算还依赖维数。
- **关键优点：** 统一跨层与层内的边定位信号。
- **写作用途：** Related work 中先介绍 HELLO-UOT 的 OT-oracle 路线；Our approach 解释层级初始化时，明确 dual-guided hierarchy 的来源。hier_uot 以 scalable active-support 求解为整体定位，优先强调高效 restricted nonlinear solver 和内外层保证，不能再次声称发明 dual-guided hierarchy。

### 2.14 Agazzotti et al. — A Network Simplex Framework for Discrete Unbalanced Optimal Transport

- **引用键：** `agazzotti2026network`。
- **来源：** [arXiv 2610.13847](https://arxiv.org/abs/2610.13847)，特别是 Sections 3--6。该文于 2026-10-09 首次公开，属于需要纳入 ICML 2027 related work 的近期工作。
- **算法：** 将 balanced OT network simplex 的 tree/forest basis、flow push 和 pivot 机制推广到离散 UOT。每次迭代选择一条违反 dual feasibility 的边，连接两个 support components，沿受影响的 trees 更新 primal flow 与 dual potentials，并删除变为零的边。
- **适用目标：** 框架面向 separable convex marginal relaxations；论文分别为平方惩罚和 KL 惩罚给出显式更新，也覆盖 semi-UOT。
- **表示与成本：** coupling 以 forest support 稀疏存储，并同时维护 $m+n$ 个 dual potentials，因此持久优化状态可以是线性的。Dantzig pivot 每轮需要在全部 $mn$ 条边中寻找最大 dual violation；论文明确指出该规则在大实例上昂贵，并测试 candidate-list、block-search 和 scaling 等近似定价规则。
- **理论：** 当前复杂度结果主要在强凸光滑 relaxations 下给出，平方惩罚还有额外的有限终止/伪多项式分析；KL 有显式 flow-push 公式，但不能把平方惩罚下的全部复杂度结论直接移植到 KL。
- **与本文的直接关系：** 它已经建立了“稀疏 primal--dual support + full-space pricing”的 UOT 先例，因此正文不能再笼统声称已有无熵 UOT solver 都需要二次内存。区分点应落在 hierarchical localization、批量 edge insertion、GPU restricted solve、高维 matrix-free cost 和 support budget，而不是“首次使用 sparse active support”。
- **分类标签：** sparse combinatorial solver；adapted network simplex；edgewise pricing。

### 2.15 Auricchio et al. — Transport Less, Solve Faster: Exploiting sparsity in algorithm design for Unbalanced Optimal Transport

- **作者与来源**：Gennaro Auricchio、Francesco Rinaldi、Saverio Salzo、Giovanni Spisso；[arXiv:2611.10268v1](https://arxiv.org/abs/2611.10268v1)，2026-11-06；[全文](https://arxiv.org/html/2611.10268v1)。本次重点核对 Sections 3--6 和支持识别定理；尚未加入 `references.bib`。
- **目标与表示**：覆盖 KL 的一般 marginal-penalized UOT。令 $c^{(R)}_{ij}=\min\{c_{ij},R\}$，显式维护 $\mathcal E_R=\{(i,j):c_{ij}<R\}$ 上的流量，高成本部分通过两侧 residual masses 压缩；变量数为 $|\mathcal E_R|+m+n$。
- **迭代**：压缩问题上使用 pairwise Frank--Wolfe，每步在新 atom 与 active atom 之间转移质量；不执行当前支持上完整的 restricted-UOT reoptimization。
- **理论**：分析截断/重构误差、PFW 收敛率、局部条件下的 extended-support identification，以及 FW gap 加重构误差的原目标证书。KL 情形的理论采用保持压缩问题最优解不变的边际 barrier 修改；速率按 good steps 表述，不能直接当作 GPU runtime 保证。有限识别也不等同于无条件恢复唯一 coupling 的全部正边。
- **与 hier_uot 的比较**：比较 pairwise 更新与 PDUOT restricted reoptimization、成本阈值压缩与动态支持预算、各自的保证对象。不能说其不支持 KL 或缺乏收敛理论，也不能把 cost capping 简化成直接删掉所有高成本边。$|\mathcal E_R|$ 未必线性；PFW 的稀疏迭代表示与完整变量集合的规模需要分别讨论。
- **分类标签**：sparsity-exploiting UOT；cost truncation/compression；pairwise Frank--Wolfe。纳入正文最近邻 related work，不能据此直接宣称 hier_uot 更快，性能结论仍需实验。

## 3. 无熵 UOT 内部的建议分类

“Direct methods”过于宽泛，也容易让读者误以为后面列出的 MM、Frank--Wolfe 和 screening 是三个穷尽的 solver 家族。更准确的上位名称是 **solvers for unregularized UOT**：它们保留原始 marginal-penalized objective，不额外加入 coupling regularizer，也不对 coupling 施加低秩约束。内部按优化组织方式分为三类，safe screening 另列为可叠加的加速层。

| 无熵子类 | 建议英文名 | 核心机制 | 值得在正文出现的代表 |
|---|---|---|---|
| 1 | Direct plan optimization | 直接以 coupling 或其 row/column sums 更新原目标 | MM；BFGS/L-BFGS-B 和 coordinate descent 可在调研文档或实验说明中出现，不必在 introduction 罗列 |
| 2 | Reformulation and OT-oracle methods | 先求 transported marginals，或在外层迭代中调用 balanced OT oracle | ETM；translation-invariant Frank--Wolfe（现有主要结果限于 1-D） |
| 3 | Sparsity-exploiting UOT methods | 利用稀疏 support/basis 或截断压缩，通过 support event、pricing 或原子更新推进优化 | L2² regularization path；adapted network simplex（L2²/KL）；cost-truncation PFW |
| 加速层 | Support-reduction techniques | 在 underlying solver 之外安全删除必为零的变量 | safe screening |

上述内部分类用于核查机制；2026-11-12 确定的正文组织为四个短段落：

1. Coupling-regularized methods。
2. Low-rank coupling methods。
3. Direct updates and OT-oracle reductions：MM、marginal-first 与 balanced-OT oracle 路线。
4. Sparsity-exploiting UOT methods：regularization path、adapted network simplex、cost-truncation PFW。

第四段单独介绍与本文最近的稀疏路线，具体说明其优化操作、目标和理论范围，再引出 hier_uot 选择的反复 restricted reoptimization 路线。分类用于呈现差异，不证明性能优劣，也不是穷尽且互斥的算法分类。Safe screening 仍是 complementary acceleration，不单列成独立 solver 家族。

## 4. 候选方法的纳入与排除

### 4.1 建议纳入正文

- **MM：** 经典、通用 marginal divergences、直接优化 plan，是 direct plan optimization 的代表。
- **ETM：** 近期的 general-dimensional KL-UOT reformulation，补足只写 Frank--Wolfe 时遗漏的 marginal-first 路线。
- **1-D Frank--Wolfe：** 可保留，但必须写出 one-dimensional specialization；不能用它代表一般高维 OT-oracle solver。
- **Regularization path：** 与 MM 来自同一篇论文，但机制不同；它是 L2²-specific sparse support solver，适合和 network simplex 放在一句。
- **Adapted network simplex：** 最新且与本文最接近的 sparse primal--dual UOT solver，必须纳入并准确区分。
- **Cost-truncation PFW：** Auricchio et al. 2026 的新近稀疏 UOT 路线，见 Section 2.15；应与 network simplex 等一起单独介绍，并区分 pairwise 更新和完整 restricted reoptimization。
- **Safe screening：** 值得保留，但作为 solver-independent support reduction。

### 4.2 不建议在 introduction 的无熵段落罗列

- **PDCS、PDHCG-CQP、Clarabel/MOSEK：** KL epigraph 可以转成 exponential-cone formulation，平方惩罚也可写成相应 convex program，因此这些通用 conic solvers 可以求解 UOT。它们的主要贡献是通用数值优化器，不构成新的 UOT-native algorithm family；适合在实验 baseline 或 restricted-solver 实现处交代。
- **Vanilla PDHG / Chambolle--Pock：** 是 restricted primal--dual solver 的算法来源，不应仅因能套用到 UOT 就在 introduction 中与 UOT 专用方法并列。
- **BFGS/L-BFGS-B、coordinate descent：** Chapel 和 safe-screening 实验中使用过，属于通用 optimizer choices；MM 已足以代表 direct plan optimization，正文无需枚举。
- **GEM-UOT：** 有限 coupling regularization 下改变目标，应留在 coupling-regularized 类。
- **Adaptive semi-dual gradient methods（Genans, COLT 2026）：** 研究的是 entropic UOT semi-dual，应归入第一类，不属于无熵 solver。
- **Tree-GKR 与 structured-sparse/MMD-UOT：** 改变 ground model 或引入额外 sparsity constraints，不应当作原始 KL-UOT solver。

## 5. 当前 tex 中应避免沿用的表述

| 当前叙述倾向 | 需要调整的原因 |
|---|---|
| MM 和 GEM 都直接优化无正则原目标、都更新 dense plan | GEM 的主 formulation 是加 coupling L2² 后的 dual；需要区分目标和算法变量 |
| tree UOT 是一般 KL-UOT 的几何加速器 | 其具体模型是 tree-GKR，不应省略模型范围 |
| 稀疏最优解意味着 solver 运算稀疏 | 还需要 sparse storage、support selection 和避免遍历被删边的实现 |
| 所有 Sinkhorn 都有二次内存 | matrix-free、truncated 和 sampled kernels 都是反例 |
| screening 有二次扫描，所以不够 scalable | hier_uot 也有 full scan；应比较持久存储、扫描频率、候选 support 的获取和 restricted solve 成本 |
| low-rank UOT 的线性复杂度无条件成立 | 还依赖 rank、cost factorization，以及内外迭代次数 |
| safe KL screening 完全等于我们的原始 KL 设定 | 公开版存在 $+\epsilon$ convention，需逐公式核对版本 |

## 6. 可留在正文与可后移的信息

- Introduction 必须讲：各路线的主要机制、改动了什么目标/表示、与 hier_uot 的关系。
- Method / appendix 再讲：具体 update、精确复杂度条件、stopping、safe region 推导、正则参考测度。
- 不必为凑齐分类把应用论文、综述、通用 PDHG 文献混进 UOT solver taxonomy；这些引用各自放在应用背景、定义和子求解器来源处。
- 本文档覆盖当前段落及已讨论的 ETM/HELLO，不声称覆盖全部 UOT 文献。PDCS、PDHCG-CQP、Moreau 等通用 conic 求解路线若要写入，需先逐篇核对其论文与 KL-UOT 转化，而不能仅按本地实验方法名当作新的 UOT 论文家族。

## 7. 补充低秩方法：FRLC

- **论文：** Halmos et al., Low-Rank Optimal Transport through Factor Relaxation with Latent Coupling，NeurIPS 2024。[原文](https://arxiv.org/abs/2411.10555)，[官方代码](https://github.com/raphael-group/FRLC)，本地副本 `third_party/FRLC/`。
- **算法：** 使用 $P=Q\operatorname{diag}(1/g_Q)T\operatorname{diag}(1/g_R)R^\top$ 的 latent-coupling factorization，以 coordinate mirror descent 交替更新外部因子与内部小 coupling。支持 balanced、unbalanced、semi-relaxed 的 W/GW/FGW，不是只能做 balanced OT。
- **成本：** factor storage 为 $O(mr_1+nr_2+r_1r_2)$；cost 的表示另计，低秩 cost 下有相应线性规模计算。详见原文 Appendix H。
- **定位：** 与 ULOT 同属低秩 coupling 类，可作为主要实验 baseline。正文这类用 ULOT + FRLC 已足够，若要交代来源，加 Scetbon et al. 2021 的 Low-rank Sinkhorn factorization 一句即可；不必罗列仅 balanced 的更多变体。

## 8. 两个 sparse Sinkhorn baseline 的比较价值

### Schmitzer sparse scaling

- **建议：** 当实验包含 sparse entropic refinement 时，优先考虑在低维点云上加一组；不作为无熵 restricted solver 的同目标 baseline。
- **适用范围：** 算法明确支持点云；不能因 Section 5 的主要实验是 grid 就排除。标准空间层级的 high-dimensional pruning 效率需实测。
- **实现：** [作者 MultiScaleOT](https://github.com/bernhard-schmitzer/MultiScaleOT)，[文档](https://bernhard-schmitzer.github.io/MultiScaleOT/)。原论文 Section 5 报告的是单核 CPU 时间，不能将其原版计时直接解释成与我们 CUDA 实现的纯算法差距。当前库的具体 GPU/point-cloud UOT API 尚需适配前进一步审查。

### Spar-Sink

- **建议：** 是 hier_uot + sparse Sinkhorn 在“逼近 full entropic UOT”任务上的直接相关 baseline，尤其当论文要强调 sparse entropic extension 的收益时。
- **相同点：** 都减少 kernel 运算、输出 sparse plan。
- **不同点：** Spar-Sink 使用 importance sampling 和 kernel reweighting；我们用无熵优化产生的 support，默认沿用该 support 上的原始 entropic kernel。二者不是同一个 support 上的两种 scaling 更新，也不保证同样的近似偏差。
- **官方实现核对：** [all_funcs.py](https://github.com/Mengyu8042/Spar-Sink/blob/main/code/all_funcs.py) 的 `spar_sinkhorn_unbalanced` 接受完整 `M,K`，构造 dense probability、mask 和 `K_spar`。官方版本的前处理/表示仍可能为二次内存；这与理论上的稀疏迭代成本应分别报告。不能拿它的 dense 前处理直接宣称 sampling 方法本身不可能 matrix-free。
- **公平口径：** 对齐 cost、marginal penalty、熵参考测度与系数；含 support 构建的 end-to-end 时间 + peak memory；以相同 kernel 边预算和 time–accuracy 曲线做比较，sampling 用多 seeds。公共精度指标应评估同一个 full entropic objective / 有效 certificate，不能各用自己的 native stopping residual 当成跨方法精度。若对照官方 CPU 与我们 GPU，也要标明实现差异。

## 9. UOT active-support / column-generation 先例核查

### 9.1 术语先校正

active-set 不专属于 dual，column generation 也不是不用 dual 的 primal 技术。对本问题，增加 primal edge variable 对应加入 dual constraint，pricing 通常由 dual violation 驱动。同一个 outer loop 可有 primal column-generation 与 dual constraint-generation 两种解释。论文沿用术语表的 active support，只有讨论文献时引用其原有 active-set 名称。

### 9.2 已确认的相关先例

1. **Chapel 2021，Section 3.2 / Algorithm 1：** L2² UOT 的 regularization path 显式维护 support；Eq. (11) 在 inactive KKT 条件变为 tight 时加入边，Eq. (10) 在 flow 到零时删除边。这是明确的 UOT support/active-set 先例。区别是它跟踪 penalty 路径，且针对 L2²，并非本文固定 KL penalty 下的层级 restricted-solve + pricing。
2. **Su safe screening：** 通过 dual safe region 删除必零边，是 dual-driven support reduction，但不等于从小 restricted master 按 violation 动态补边。
3. **Manupriya et al., Submodular Framework for Structured-Sparse Optimal Transport：** [原文](https://arxiv.org/abs/2406.04914)，[代码](https://github.com/Piyushi-0/Sparse-UOT)。Algorithm 1 从空 support 出发，选择 gradient 得分最大的候选边，加入后在当前 support 上重新优化。它明确存在“选边 + restricted reoptimization”结构；但目标是带 cardinality / structured sparsity constraints 的 MMD-UOT，并非原始无 rank/cardinality 约束的 KL-UOT。不能笼统说此前 UOT 没有主动构建 support。
4. **更广义的 unbalanced transport 优化：** Carioni–Iglesias–Walter, Extremal points and sparse optimization for generalized Kantorovich–Rubinstein norms，[原文](https://arxiv.org/abs/2209.09167)，FoCM 2025。对 smooth fidelity + generalized KR norm 的 measure optimization 使用 accelerated generalized conditional gradient。不是本文离散 KL coupling 问题，但足以说明“unbalanced transport 从未使用原子生成”会过宽。此条仅按公开摘要确认问题范围与算法，未细读全部证明。
5. **HELLO / OT-oracle fully-corrective FW：** 维护的 atoms 是完整 balanced OT solutions / potential candidates，不是每个 atom 一条运输边。它属于 UOT 的 oracle-based 迭代，但不能直接等同于我们按边的 restricted optimization。
6. **Adapted network simplex：** Section 2.14 已给出 KL-UOT 上稀疏 primal--dual support 和 pricing 的先例；不能把新颖性建立在此前没有 dual 选边上。
7. **Auricchio et al. 2026：** Section 2.15 的 cost-truncation/PFW 同样利用 UOT 稀疏性并给出理论保证，但采用压缩问题上的 pairwise 原子更新。

### 9.3 当前可以与不能说什么

- **可以说：** 本文建立面向原始无正则 KL-UOT 的 scalable active-support 方法，重点是高效 PDUOT restricted reoptimization、内外层收敛保障，以及支持初始化和预算约束下的有效更新。与上述方法逐项比较具体操作和条件，不用完整组件组合来替代论证，也不依赖 first claim。
- **不能说：** 首次对 UOT 使用 active-set、首次使用 dual 选边、首次用 sparse support，或者整个 UOT 文献没有 column generation。
- **未确认：** 本次未找到并核实一个与固定 KL-UOT 逐边 restricted master + full-space pricing 完全同构、且先于本工作的独立算法；这不是不存在的证明。搜索覆盖当前原始论文、引用线索、arXiv metadata 的 active-set / column-generation / working-set / constraint-generation / greedy 等关键词。通用搜索部分受限，不能将零结果当成全面 full-text 检索。
- **创新性判断：** 即使最终没有找到完全对应的 KL 先例，把通用 constraint generation 应用于这组 KKT 也不是自动很强的贡献。需要把新增机制及其必要性、理论条件和大规模实测结果讲清楚，尤其区分从 HELLO 继承的部分。

## 10. 系统补查：离散 UOT 求解路线、公开实现与比较资格（2026-11-14）

本节补充并覆盖前文关于“是否有可用代码”的历史判断；前文逐篇机制说明仍保留。此前将新增基线概括为“只有 ETM 和 FRLC”过早，漏查了 GeomLoss、POT L-BFGS-B，并遗漏了与原目标直接相关的 Bregman proximal、动态 penalty 等文献路线。

### 10.1 范围、筛选口径与检索记录

核心问题为两个有限加权点云上的 static marginal-penalized UOT，主要是 KL，兼顾平方 L2 marginal penalty。允许 coupling 正则化、熵正则化、低秩表示与可追溯的成本近似；统一对返回的非负 coupling 计算原 UOT objective 和独立参考下界的 shared gap。参数不必与本文 rho 一一对应，可以扫描近似参数。CPU 实现不是排除理由，但须注明执行方式。

不纳入本组高维实验：只能接受规则网格、一维专用 oracle、默认高维实现存在明确障碍且需要重新开发、改变为 BP 插入/删除或 MMD marginal 模型，以及没有直接产生当前两个有限点集之间 coupling 的连续生成/动态流模型。后几类仍列入领域版图，不据此称其工作不相关或不开源。Point-cloud surface PDE solver 不等于任意维点云之间的离散 coupling solver。

检索同时沿四个入口推进：已有论文与综述的参考文献；按机制搜索 scaling/low-rank/sparse/gradient/proximal/Newton/ADMM/oracle；作者论文页与仓库；POT、OTT、GeomLoss 和 Julia/R 软件接口。搜索语句包括 `unbalanced optimal transport solver algorithms github KL regularization sparse gradient methods`、`unbalanced optimal transport proximal quasi newton`、`GEM-UOT implementation code`、`Safe Screening for Unbalanced Optimal Transport code`、`inexact Bregman unbalanced github`、`Dynamic Penalty Updating UOT`、`unbalanced optimal transport Newton/semismooth/ADMM/coordinate descent`，并补查 2025–2026 的算法结果。

GitHub repository search 对完整短语 `"unbalanced optimal transport"` 返回 62 个仓库，已浏览结果的名称与描述并对相关线索进一步检查；该检索只覆盖仓库索引，不等于搜索全部源码。另对 `"GEM-UOT"`、`"IBPUOT"`、`"safe screening" transport`、`"gradient extrapolation" transport`、`Bregman unbalanced` 做 repository search，未找到对应候选。JMLR 论文页无代码链接、全文无 GitHub 链接也不构成“未开源”的证明。未使用需登录的 GitHub 全量 code search；没有联系作者索取未公开代码，没有审完全部出版商补充材料。

核查级别分开记录：**源码核查**表示实际读取输入、更新或输出；**文献核查**表示读过论文对应问题/算法部分；**线索核查**仅确认论文或仓库存在。下列“候选”均未表示安装、数值正确性、运行速度或对照实验已验证。本轮没有运行 GPU 实验，也没有修改 `.tex` 或 `.bib`。

### 10.2 完整候选版图与处理决定

| 路线/方法 | 原始来源与公开实现 | 目标/输入/输出及核查范围 | 当前处理 |
|---|---|---|---|
| Generalized Sinkhorn / Chizat scaling | [原论文](https://arxiv.org/abs/1607.05816)、[POT](https://pythonot.github.io/gen_modules/ot.unbalanced.html)、[OTT](https://ott-jax.readthedocs.io/solvers/_autosummary/ott.solvers.linear.sinkhorn.Sinkhorn.html) | KL-UOT 加熵，成本矩阵或点云，coupling 可恢复 | 已覆盖基本路线 |
| Stabilization、epsilon continuation、translation-invariant Sinkhorn | [Séjourné 2022](https://proceedings.mlr.press/v151/sejourne22a.html)、[fast_uot](https://github.com/thibsej/fast_uot) | 一般点云成本；现有 OTT 固定 epsilon 基线已开启 `recenter_potentials`，不是新增算法家族 | 不为换库重复增加曲线 |
| GeomLoss online / annealed Sinkhorn | [官方库](https://github.com/jeanfeydy/geomloss)、[接口文档](https://www.kernel-operations.io/geomloss/api/pytorch-api.html) | 源码核查：一般维点云、KL marginal relaxation、PyTorch/KeOps、可恢复 coupling；online 不要求网格 | **新增候选**。虽然同属 Sinkhorn，其 annealing 与实现路线值得与现有 OTT 明确对照，不能因同族自动删除 |
| GeomLoss multiscale | 同上 | 稀疏/聚类 truncation；legacy auto 仅在低维等条件下选用，并非 API 硬限制所有高维输入 | 本组优先 online；不未经验证把 multiscale 的低维加速承诺扩展到 PCA30 |
| Schmitzer MultiScaleOT | [官方代码](https://github.com/bernhard-schmitzer/MultiScaleOT) | 源码核查：点云、KL、稀疏 coupling 均有；默认 hierarchy 枚举 $2^d$ 子盒 | 按作者决定排除 PCA30 比较；不改造 hierarchy、不另加低维专属实验 |
| GPU Domain Decomposition UOT | [论文](https://arxiv.org/abs/2410.08859)、[代码](https://github.com/OTGroupGoe/DomainDecomposition) | 源码核查：公开 GPU-UOT 路径依赖二维规则网格、cell reshape 和 padding | 排除当前点云直接比较 |
| Spar-Sink | [JMLR 原文](https://jmlr.org/papers/v24/22-1311.html)、[代码](https://github.com/Mengyu8042/Spar-Sink) | 采样/重加权 kernel 的 entropic UOT；已有 adapter，coupling 可评价 | 已用于 entropic 扩展；原 UOT gap 下的 epsilon 扫描可复用实现，但不是已完成结果 |
| NFFT accelerated UOT | [JSC 2024 原文](https://link.springer.com/article/10.1007/s10915-024-02586-2)、[FastUOTMMD](https://github.com/rajmadan96/FastUOTMMD) | 源码核查：KL+熵、点云、两侧 eta；NFFT 函数只实现 1/2/3 维，否则 `error("High dimension")` | 排除 PCA30；不能仅凭摘要“high-dimensional”列为高维候选 |
| Nyström / LCN sparse-kernel approximation | [LCN 代码](https://github.com/gasteigerjo/lcn) | 源码核查：快速 unbalanced 路线为 BP 插入/删除模型；独立标准 KL dense Sinkhorn 不代表 LCN-KL 算法已实现 | 按作者决定排除 BP 模型，不因 coupling 正则化排除 |
| Anderson / momentum Sinkhorn | [OTT API](https://ott-jax.readthedocs.io/solvers/_autosummary/ott.solvers.linear.sinkhorn.Sinkhorn.html) | 已有库中的加速控制选项；本轮仅查 API，未核查 UOT 特定组合与实测收益 | 可选的强 Sinkhorn 配置核验，不另算一篇新 UOT 方法 |
| ULOT | [NeurIPS 2023 原文](https://proceedings.neurips.cc/paper_files/paper/2023/hash/a439259e78294c38d157a51a2c40486b-Abstract-Conference.html)、OTT LRSinkhorn | 低秩 coupling、KL marginal penalty；成本表示另计 | 正文已比较 |
| FRLC | [官方代码](https://github.com/raphael-group/FRLC) | 源码核查：点云成本、PyTorch、unbalanced 更新、完整 coupling/因子输出；外边际共用 tau_out | 保留候选；free mass 与 penalty 映射须验证，非对称接口需额外适配 |
| MM | [Chapel 2021 代码](https://github.com/lchapel/UOT-though-penalized-linear-regression)、POT | 原 KL/L2 UOT、任意成本矩阵、完整 coupling | 已比较；不是尚缺的新方法 |
| L-BFGS-B | [POT 源码](https://pythonot.github.io/_modules/ot/unbalanced/_lbfgs.html) | 源码核查：原 KL/L2 目标或可选 coupling 正则、两侧 penalty、完整 coupling；转 NumPy 后调用 SciPy | **新增小规模 CPU 对照候选**；通用优化器，不包装为 UOT 新专用算法 |
| GEM-UOT / GEM-RUOT | [JMLR 2023](https://jmlr.org/papers/v24/22-1158.html) | KL marginal + coupling L2 正则，梯度外推与稀疏输出；未找到可获取的作者实现 | 保留文献，代码待确认；不能当作原目标上稀疏计算，也不能断言未开源 |
| IBPUOT / AIBPUOT | [Chen et al. 2024](https://arxiv.org/html/2402.16978) | 文献核查：原始双侧 KL-UOT、不精确 Bregman proximal point、内层 scaling、外层加速及收敛；任意有限成本矩阵 formulation | **新增相关文献**；未找到可获取实现。与本文不精确求解/收敛定位相关，不能只因代码未找到而漏引其路线 |
| Dynamic-penalty accelerated BPD/MM | [Su–Kasai, IJCNN 2024](https://doi.org/10.1109/IJCNN60899.2024.10650530)、[作者机构记录](https://waseda.elsevierpure.com/en/publications/accelerating-unbalanced-optimal-transport-problem-using-dynamic-p/) | 摘要级核查：MM 的 Bregman proximal descent 解释、动态 penalty 与 Nesterov 加速，针对大 penalty 的性能退化 | **新增文献线索**，完整算法与代码尚未核实；不能笼统暗示此前没有处理 MM 大 penalty 的研究 |
| Inexact penalty precursor | [Su–Kasai, JSAI 2023](https://www.jstage.jst.go.jp/article/pjsai/JSAI2023/0/JSAI2023_2U6IS1c02/_article/-char/ja/) | 会议短文/前序工作线索，可能与上一条有重叠 | 保留追溯，不重复算独立基线；代码未确认 |
| ETM | [官方代码](https://github.com/XeniaLLL/ETM)、[NeurIPS 原文](https://proceedings.neurips.cc/paper_files/paper/2025/file/97a36b5f6db9e6703e4154cf0c582214-Paper-Conference.pdf) | 源码核查：公开 UOT demo 为 Approx 型迭代加 coupling 构造；未见论文 Refine 的 L-BFGS 阶段 | 保留实际公开版本候选；不能标成已获得完整 Refine 实现 |
| Translation-invariant FW / HELLO-UOT | [Séjourné 2022](https://proceedings.mlr.press/v151/sejourne22a.html)、本地 HELLO | 一维 FW 专用实现不作为高维基线；HELLO 使用高维 balanced oracle | HELLO-UOT 已比较 |
| L2 regularization path | Chapel 官方代码、[POT regpath](https://pythonot.github.io/gen_modules/ot.regpath.html) | 原 L2 marginal UOT 的整条参数路径；输出 coupling | L2 附录候选；路径任务与单个参数求解需说明 |
| Adapted network simplex | [论文](https://arxiv.org/html/2610.13847)、论文链接 AdNS-UOT 当前 404 | 稀疏 primal-dual tree/forest，KL 和 L2 | 相关文献保留；不能获取对应发布代码，暂不实验 |
| Cost truncation + PFW | [Auricchio et al. 2026](https://arxiv.org/html/2611.10268v1) | KL/L2 等边际惩罚、成本截断压缩与 pairwise FW；当前版本无数值实验，未确认代码 | 最近邻理论路线保留调研；按此前决定不列实验候选 |
| Safe screening | [公开稿](https://arxiv.org/html/2307.00247)、[期刊](https://doi.org/10.1016/j.neucom.2025.132308) | KL/L2 的 solver-independent 加速，需搭配 MM/BFGS；文章描述 Matlab，但未定位可获取代码 | 代码待确认，不将其视为单独底层求解器 |
| Adaptive semi-dual gradient / ANAG | [Genans, COLT 2026](https://proceedings.mlr.press/v336/genans26a.html)、[作者页](https://ferdinand-genans.github.io/research/) | entropic KL-UOT 的 stochastic/full-batch gradient 理论；本次论文页和作者页未发现代码 | 新近文献覆盖，暂不列可执行候选 |
| Dense PDHG research prototype | [gagazzotti/rPD-UOT](https://github.com/gagazzotti/rPD-UOT) | 源码核查 `kl.py::pdhg_uot_kl`：NumPy dense coupling、Lambert-W KL prox、两侧 rho、返回 P/u/v；README 只有 first commit | 代码存在，但没有明确对应论文/稳定发布身份，不等于 AdNS-UOT 已开源；不列主补充基线，可作研究对照 |
| Generic conic/QP solvers | PDCS、Clarabel/MOSEK 等；本地 PDCS adapter | 显式 KL epigraph / L2 QP 转化，返回 coupling | PDCS 已用于 restricted 实验；其他通用 solver 可做小规模核验，不必在 UOT-native 相关工作逐项列举 |
| RegOT sparse Newton / SSNS / SPLR | [公开库](https://github.com/yixuan/regot-python) | 源码核查 README 与 QROT dual：本次确认的是 balanced EROT/QROT solver，未确认 KL marginal relaxation 接口 | 不将 balanced Newton solver 自动列为现成 UOT solver；需改算法则超出直接比较 |
| Pearson marginal / semismooth Newton | [Phung–Tran 预印本](https://arxiv.org/abs/2503.15105) | 本次搜索确认论文；平方/Pearson marginal 与 coupling quadratic regularization、mesh/interface 理论，尚未核实全部版本和代码 | L2 相关文献线索，非已审查 KL 基线；不能据搜索摘要作性能判断 |
| Julia/R UOT packages | [OptimalTransport.jl](https://juliaoptimaltransport.github.io/OptimalTransport.jl/stable/)、[UnbalancedOptimalTransport.jl](https://github.com/ericphanson/UnbalancedOptimalTransport.jl)、[R unbalancedTransport](https://github.com/larskruse/unbalancedTransport) | 官方文档/README 核查：generalized scaling/Sinkhorn、部分输出 coupling；不代表新增优化机制 | 说明领域有公开实现；不只为语言/软件库不同重复实验 |
| Original ICML2020 Sinkhorn code | [lntk/uot](https://github.com/lntk/uot) | 已确认作者仓库和论文对应关系；属于已覆盖 scaling 路线 | 不必另加曲线 |
| Neural continuous UEOT / semi-couplings | [LightUOT](https://github.com/milenagazdieva/LightUnbalancedOptimalTransport)、[NUBOT](https://github.com/FrederikeLuebeck/nubot)、[UOT generative model](https://github.com/jaemoo-choi/Unbalanced-Optimal-Transport-Generative-Model) | README/论文范围核查：学习连续输运、生成模型或重加权 map；未确认直接输出固定有限两点集的矩阵 | 领域有开源；不属于当前可直接用离散 shared gap 的 coupling solver，不在本轮另设计离散化 |
| Tree / sliced / structured-MMD UOT | [treegkr](https://github.com/joisino/treegkr)、[UOT-Lasso](https://github.com/Tran-Thu-Le/P2025-UOT-Lasso)、[sliced UOT](https://github.com/clbonet/Slicing_Unbalanced_Optimal_Transport)、[Sparse-UOT](https://github.com/Piyushi-0/Sparse-UOT) | 改 ground/model、切片距离或 MMD penalty/稀疏约束；不是简单加 coupling regularization | 按作者范围不列当前比较；不是没有开源 |
| Dynamic / surface PDE UOT | [ACUOT](https://github.com/mao1756/acuot)、[ADMM-TRBF-SUOT](https://github.com/Poker-Pan/ADMM-TRBF-SUOT)、[urOMT](https://github.com/xinan-nancy-chen/urOMT) | 动态 WFR、密度/速度/source 或曲面切向 RBF；“点云”是曲面离散，并非两个任意高维经验分布的原 KL coupling | 排除当前离散基线，不把动态模型统称原问题正则近似 |

### 10.3 新增实现的关键审查证据

**GeomLoss。** 当前 upstream checkout 为 `00e493f36bd6cc8471526e59afc07193a1926e47`。Legacy `src/geomloss/_legacy/samples_loss.py` 支持 `reach`（KL rho）、`potentials=True`、`debias=False` 与 `online`；auto 在高维大样本退回 online，并非拒绝高维点云。Legacy 平方成本是 $\|x-y\|^2/2$，rho/epsilon 与本文单位需统一。当前新版 `ot/_implementations/sample.py::solve_sample` 接受点云、weights、`reg`、`unbalanced`，`OTResultSample._plan/_lazy_plan` 明确构造 coupling；`_plan` 乘 $a\otimes b$，不能只把 density 当 flow。当前 scalar rho 接口不直接支持本文所有非对称配置。比较应关闭 debias，使用实际耦合的原 UOT objective，不拿 Sinkhorn divergence 标量代替 primal 值。新版与 legacy 不混用系数换算，先冻结版本。此前没有核对 GeomLoss 就将剩余候选缩到两项，是遗漏。

**POT L-BFGS-B。** `ot/unbalanced/_lbfgs.py` 的 `lbfgsb_unbalanced` 接收任意 M、两侧 `reg_m`、`regm_div='kl'/'l2'` 与 `reg=0`；内部转 NumPy、维护完整 coupling，调用 SciPy `minimize(..., method='L-BFGS-B', bounds=Bounds(0,np.inf))` 并返回 coupling。它有资格作为小规模 CPU 对照，不因不是新专用算法而从“可比较方法”清单删除。不能把它误报成 GPU solver，也不能将 coupling `reg_div='l2'` 与 L2 marginal `regm_div='l2'` 混淆。

**NFFT-UOT。** `FastUOTMMD` checkout 为 `90e4a95a9e16b65711955caf12bd3fcd4c438d1a`。`src/UOT_NFFT.jl::UOTSinkhornKLNFFTStabilized` 接受点坐标和两侧 eta，返回 f/g；明确按 1、2、3 维分支构造 FASTSUM，其他维数直接抛 `High dimension`。同仓库普通 dense Sinkhorn 支持一般维数，但退回该函数已失去 NFFT 加速机制，不能冒充高维 NFFT 比较。

**rPD-UOT。** 与已失效 AdNS-UOT 链接属于同一作者账号，但仓库身份不同。`kl.py` 的确是原双侧 KL-UOT dense PDHG：每轮维护 P、行列求和与 Lambert-W proximal，返回 primal/dual。作者 README 未说明稳定算法名或论文关系，因此只能称公开研究 prototype，不据此重新宣布 network simplex 代码可用。

### 10.4 理论与叙事上的补查结果

新增 Bregman proximal 与动态 penalty MM 文献意味着，不能仅对比 vanilla MM 后就概括“现有直接方法没有处理高 penalty 的技巧”，也不能把“允许 inexact inner solves”单独作为没有先例的创新。本文仍应具体定位 PDUOT 的受限求解结构、自适应控制的分析，以及预算内 active-support refinement 的输出条件与有限终止。IBPUOT 的 inner scaling subproblem 与本文 restricted-UOT solve 不同，不能因都叫 inexact 就把两者理论视为相同。

现有四段 related work 的大类仍可保留，但第三段在最终清稿时应检查是否需要用一个合并引用补上 Bregman proximal/BPD 路线。先核实 Su–Kasai 完整算法再决定具体措辞；本轮不改正文、不动引用库。

### 10.5 当前建议与仍未解决的检索边界

1. **可进入接入评估**：ETM 官方实际版本、FRLC、GeomLoss online（含其 annealing）；POT L-BFGS-B 为可选小规模 CPU 对照。前面两项不再被当作穷尽候选。
2. **可复用现有代码拓展评价**：Spar-Sink 的原 UOT gap 曲线；它已在 entropic 节比较，不表示已经完成该新任务。额外耦合正则的方法可以用原目标 gap 比较，不因目标变化自动排除。
3. **值得补文献但当前不能安排官方实现实验**：IBPUOT/AIBPUOT、dynamic-penalty BPD/MM、GEM-UOT、safe screening、ANAG、AdNS-UOT。证据状态是“未找到/无法获取”，不是“确认未开源”。
4. **按适用范围排除**：MultiScaleOT 默认高维 hierarchy、GPU grid DomDec、NFFT 的 1–3 维实现、一维/树/PDE/连续生成模型、BP/MMD 模型。排除原因逐项写明，不能合并成“不是原目标”。
5. 本轮扩大检索后未确认一个可直接接入、支持高维点云并返回 coupling 的额外专用 UOT Newton/GPU 稀疏 solver；这不证明不存在。出版商 supplementary、未索引仓库、近期更新和未联系的作者代码仍可能带来新增项。未来补查只需沿这些明确空缺推进，不能将本清单称为全领域零遗漏的证明。
