# UOT related work：算法与分类备忘

本文档用于讨论 introduction 的分类，不替代文献综述或论文正文。覆盖当前 related work 的主要算法论文，并补充已讨论的 ETM、UOT 综述、HELLO 和近期 network-simplex 路线。

核对日期：2026-10-18。下文将原论文结论、标准实现的成本和本文写作建议分开。复杂度一般是单次迭代或单次扫描的成本，不能直接当成达到目标精度的总成本。记 $s$ 为保留的边数，$r$ 为 coupling 的非负秩，$k$ 为 cost factorization 的秩。

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
- **与 SHUTTLE 的关系：** 势平移是直接相关的先例。不能将 score-preserving translation 本身当作我们首次提出的机制；应强调它在跨层 potential calibration 中的用途。
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
- **与 SHUTTLE 的关系：** screening 排除不可能的边，hierarchical localization 构造/补充候选边，可以互补。我们也有 full scans，因此不能仅以“它要二次扫描”解释差异。
- **年份提醒：** 当前 bib 写 2025；Crossref 的期刊卷期为 Neurocomputing 668、2026，DOI 含 2025。由作者自行决定按 online-first 或卷期年份维护，本文档不改 bib。

### 2.11 Liu et al. — Solving Discrete (Semi) Unbalanced Optimal Transport with Equivalent Transformation Mechanism and KKT-Multiplier Regularization

- **引用键：** `liu2026solving`。引用键保留原名，书目信息按 NeurIPS 2025 proceedings 记为 2025。
- **来源：** [NeurIPS 2025 proceedings PDF](https://proceedings.neurips.cc/paper_files/paper/2025/file/97a36b5f6db9e6703e4154cf0c582214-Paper-Conference.pdf)，Sections 3–4，Algorithms 1–2。
- **算法：** 先恢复 transported marginals，再将 coupling 求解转换为这些边际上的 balanced OT。ETM-Exact 使用含 hard c-transform 的 formulation 和 L-BFGS 型优化；ETM-Approx 使用 log-sum-exp 平滑与 fixed-point updates；ETM-Refine 用 Approx 初始化 Exact。论文还给出 KKT-multiplier regularization / MROT 路线，需与基本 ETM 分开。
- **目标与近似：** 理想精确边际下，最后的 OT 可恢复原 UOT 最优 coupling。仅用 Approx 的边际仍带平滑误差；额外 MROT 正则也需核对是否改变目标。不能把整篇所有配置都叫“精确无熵 solver”。
- **表示与成本：** 边际/势变量规模为 $m+n$，但 hard/soft c-transform 仍涉及点对运算；最后 balanced OT 的成本由所选 oracle 决定。精确转化不是自动的线性复杂度保证。
- **关键优点：** 将 nonlinear marginal selection 与 conditional balanced coupling 分开，直接连接成熟 OT solvers。
- **分类标签：** marginal-first reformulation；OT oracle；hard/soft c-transform。
- **与 SHUTTLE 的关系：** 可支持“固定 transported marginals 后变成 OT”的讨论；由 OT 基本解性质可推出**存在**至多 $m+n-1$ 条正边的 UOT 最优解，不表示每个最优解都这么稀疏。共享 sparse-optimum structure 与共享 dual constraints 分别支持 sparse representation 与 dual-guided localization。

### 2.12 Séjourné et al. — Unbalanced optimal transport, from theory to numerics

- **引用键：** `sejourne2023unbalanced`。
- **作用：** 综述与背景引用；不需要单列成一个 solver 家族。
- **写作用途：** 一般 UOT 定义、不同 divergence、理论与数值路线的总览；具体算法的技术结论优先引原始论文。
- **核对范围：** 本次按现有书目信息记录其背景角色，未重新逐章审读综述。

### 2.13 Xia et al. — Dual-guided Hierarchical Edge Localization for Large-scale Optimal Transport Across Dimensions

- **引用键：** `xia2026dual`。
- **来源：** 本地 `papers/hello/main_body.tex` 与 `TERMINOLOGY.md`。
- **算法：** balanced OT 的 dual-guided hierarchy。跨层传播 dual potentials 并构造初始 support；层内交替 restricted LP solve、full-space dual-violation detection、edge insertion 与 budgeted pruning。
- **目标：** 原始 balanced discrete OT；不是 UOT solver。
- **表示与成本：** 固定特征维数与 support budget 下，持久状态为线性内存；完整扫描仍有 $mn$ 级点对工作，特征计算还依赖维数。
- **关键优点：** 统一跨层与层内的边定位信号。
- **写作用途：** 在“我们的方法”承接来源。SHUTTLE 的贡献应明确为 UOT 适配、calibration、restricted nonlinear solver 及相应保证，不能再次声称发明 dual-guided hierarchy。

### 2.14 Agazzotti et al. — A Network Simplex Framework for Discrete Unbalanced Optimal Transport

- **引用键：** `agazzotti2026network`。
- **来源：** [arXiv 2610.13847](https://arxiv.org/abs/2610.13847)，特别是 Sections 3--6。该文于 2026-10-09 首次公开，属于需要纳入 ICML 2027 related work 的近期工作。
- **算法：** 将 balanced OT network simplex 的 tree/forest basis、flow push 和 pivot 机制推广到离散 UOT。每次迭代选择一条违反 dual feasibility 的边，连接两个 support components，沿受影响的 trees 更新 primal flow 与 dual potentials，并删除变为零的边。
- **适用目标：** 框架面向 separable convex marginal relaxations；论文分别为平方惩罚和 KL 惩罚给出显式更新，也覆盖 semi-UOT。
- **表示与成本：** coupling 以 forest support 稀疏存储，并同时维护 $m+n$ 个 dual potentials，因此持久优化状态可以是线性的。Dantzig pivot 每轮需要在全部 $mn$ 条边中寻找最大 dual violation；论文明确指出该规则在大实例上昂贵，并测试 candidate-list、block-search 和 scaling 等近似定价规则。
- **理论：** 当前复杂度结果主要在强凸光滑 relaxations 下给出，平方惩罚还有额外的有限终止/伪多项式分析；KL 有显式 flow-push 公式，但不能把平方惩罚下的全部复杂度结论直接移植到 KL。
- **与本文的直接关系：** 它已经建立了“稀疏 primal--dual support + full-space pricing”的 UOT 先例，因此正文不能再笼统声称已有无熵 UOT solver 都需要二次内存。区分点应落在 hierarchical localization、批量 edge insertion、GPU restricted solve、高维 matrix-free cost 和 support budget，而不是“首次使用 sparse active support”。
- **分类标签：** sparse combinatorial solver；adapted network simplex；edgewise pricing。

## 3. 无熵 UOT 内部的建议分类

“Direct methods”过于宽泛，也容易让读者误以为后面列出的 MM、Frank--Wolfe 和 screening 是三个穷尽的 solver 家族。更准确的上位名称是 **solvers for unregularized UOT**：它们保留原始 marginal-penalized objective，不额外加入 coupling regularizer，也不对 coupling 施加低秩约束。内部按优化组织方式分为三类，safe screening 另列为可叠加的加速层。

| 无熵子类 | 建议英文名 | 核心机制 | 值得在正文出现的代表 |
|---|---|---|---|
| 1 | Direct plan optimization | 直接以 coupling 或其 row/column sums 更新原目标 | MM；BFGS/L-BFGS-B 和 coordinate descent 可在调研文档或实验说明中出现，不必在 introduction 罗列 |
| 2 | Reformulation and OT-oracle methods | 先求 transported marginals，或在外层迭代中调用 balanced OT oracle | ETM；translation-invariant Frank--Wolfe（现有主要结果限于 1-D） |
| 3 | Sparse combinatorial methods | 显式维护稀疏 support/basis，通过 support event 或 dual pricing 改变结构 | L2² regularization path；adapted network simplex（L2²/KL） |
| 加速层 | Support-reduction techniques | 在 underlying solver 之外安全删除必为零的变量 | safe screening |

这个分类与前两大类组成完整 related-work 结构：

1. Coupling-regularized methods。
2. Low-rank coupling methods。
3. Solvers for unregularized UOT，其中再用上述三个机制组织代表工作。

正文不需要给三个无熵子类分别起段落；用一句总领，再用三句覆盖即可。Safe screening 的句子应明确它是 complementary acceleration，而不是第四种独立 solver。推荐顺序仍为 coupling regularization → low rank → unregularized solvers → our approach。

## 4. 候选方法的纳入与排除

### 4.1 建议纳入正文

- **MM：** 经典、通用 marginal divergences、直接优化 plan，是 direct plan optimization 的代表。
- **ETM：** 近期的 general-dimensional KL-UOT reformulation，补足只写 Frank--Wolfe 时遗漏的 marginal-first 路线。
- **1-D Frank--Wolfe：** 可保留，但必须写出 one-dimensional specialization；不能用它代表一般高维 OT-oracle solver。
- **Regularization path：** 与 MM 来自同一篇论文，但机制不同；它是 L2²-specific sparse support solver，适合和 network simplex 放在一句。
- **Adapted network simplex：** 最新且与本文最接近的 sparse primal--dual UOT solver，必须纳入并准确区分。
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
| screening 有二次扫描，所以不够 scalable | SHUTTLE 也有 full scan；应比较持久存储、扫描频率、候选 support 的获取和 restricted solve 成本 |
| low-rank UOT 的线性复杂度无条件成立 | 还依赖 rank、cost factorization，以及内外迭代次数 |
| safe KL screening 完全等于我们的原始 KL 设定 | 公开版存在 $+\epsilon$ convention，需逐公式核对版本 |

## 6. 可留在正文与可后移的信息

- Introduction 必须讲：各路线的主要机制、改动了什么目标/表示、与 SHUTTLE 的关系。
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

- **建议：** 是 SHUTTLE + sparse Sinkhorn 在“逼近 full entropic UOT”任务上的直接相关 baseline，尤其当论文要强调 sparse entropic extension 的收益时。
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

### 9.3 当前可以与不能说什么

- **可以说：** 已核对的上述方法没有直接覆盖“固定 KL penalty、无 coupling 额外正则/非负秩约束、跨层与层内 dual-guided edge localization、sparse restricted primal–dual solver、线性持久存储”的完整组合。正文最好正面陈述这个组合，不依赖 first claim。
- **不能说：** 首次对 UOT 使用 active-set、首次使用 dual 选边、首次用 sparse support，或者整个 UOT 文献没有 column generation。
- **未确认：** 本次未找到并核实一个与固定 KL-UOT 逐边 restricted master + full-space pricing 完全同构、且先于本工作的独立算法；这不是不存在的证明。搜索覆盖当前原始论文、引用线索、arXiv metadata 的 active-set / column-generation / working-set / constraint-generation / greedy 等关键词。通用搜索部分受限，不能将零结果当成全面 full-text 检索。
- **创新性判断：** 即使最终没有找到完全对应的 KL 先例，把通用 constraint generation 应用于这组 KKT 也不是自动很强的贡献。需要把新增机制及其必要性、理论条件和大规模实测结果讲清楚，尤其区分从 HELLO 继承的部分。
