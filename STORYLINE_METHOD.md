# hier_uot Method 叙事与修改提纲

更新日期：2026-11-13。本文是 Method 的中文论证大纲，供逐段审核。Overall Framework 和 PDUOT 已完成多轮正文与伪代码迭代；第 5 节 Active-Support Initialization and Updates 已按最新讨论重排中文大纲并同步到英文。Introduction 的定位与讨论记录见 [STORYLINE_INTRO.md](STORYLINE_INTRO.md)。

## 1. 本章的职责

Introduction 已解释为什么需要兼顾 GPU 效率和线性存储的 active-support optimization。Method 回答 hier_uot 如何组织这套算法、PDUOT 如何执行反复受限求解，以及算法具有哪些保证，不重复文献分类和 gap。

方法身份是面向大规模 UOT 的 active-support algorithm。PDUOT、支持初始化、支持更新与存储控制是整体算法的组成部分。Hierarchy 为初始化提供小问题信息，不能成为整章的首要身份；具体借鉴 HELLO 的机制仍须明确归属。

文档和注释使用稳定小名 `hier_uot`；算法展示名由论文宏 `\ours` 控制，目前为 Salut，内层求解器使用 `\subsolver`。术语与符号以项目根目录 `TERMINOLOGY.md` 为准。

## 2. 当前章节与调整方向

| 当前位置 | 当前叙事重点 | 建议职责与调整 |
|---|---|---|
| Active-Support Optimization for UOT | 章节标题已按 active-support 主线修改 | 保持整体算法定位 |
| Overall Framework | 英文正文已按受限问题定义、支持更新依据和整体算法组织三个单元精简，并突出 PDUOT | 执行细节由伪代码与后续小节承担，继续按作者审核结果打磨 |
| Restricted UOT with PDUOT | 受限目标、saddle formulation、更新、重启和权重控制 | 保留核心公式和完整伪代码，按求解困难及设计职责连接材料；这是方法中的主要技术部分 |
| Active-Support Initialization and Updates | 先由 UOT 层间稳定性引出 shared-side hierarchy，再介绍 translation、统一的双向 top-$k$ 选择及支持规模控制 | 中文大纲与英文已同步；初始化允许非正分数，更新仅保留正分数候选 |
| Convergence and Complexity | 内层收敛、外层有限容差终止、存储界 | 保留两项保证与复杂度，明确它们对应前述算法的哪些操作和输出条件 |

第三个 subsection 使用 Active-Support Initialization and Updates。第 5 节及对应英文已按最新讨论同步，继续逐段打磨。

## 3. Overall Framework 中文逐段大纲

概览只回答求什么、如何更新支持、整体如何组织三个问题。以下是精简后的中文正文大意；公式之外不再逐步复述伪代码。

### 单元 1：稀疏结构与受限问题定义

固定 transported marginals 后，UOT 的边际惩罚成为常数，剩下的是 balanced OT，因此只要最优解存在，就存在正流边数不超过 $m+n-1$ 的最优 coupling。
这一稀疏结构允许我们在 active support $\mathcal N\subseteq[m]\times[n]$ 上优化。
令 $\Phi$ 和 $D$ 分别为原 UOT 的 primal 和 dual 目标，受限问题的 primal--dual pair 为

$$\begin{aligned}\min_{\mathbf X\geq0}\Phi(\mathbf X)\quad&\text{s.t.}\quad\operatorname{supp}(\mathbf X)\subseteq\mathcal N,\\\max_{\mathbf f,\mathbf g}D(\mathbf f,\mathbf g)\quad&\text{s.t.}\quad f_i+g_j\leq C_{ij},\quad(i,j)\in\mathcal N.\end{aligned}$$

### 单元 2：支持更新依据与核心循环

受限求解返回的势提供 dual score：

$$\sigma_{ij}=f_i+g_j-C_{ij}.$$

正分数表示遗漏的 dual inequality 被违反，为新增变量提供候选；若精确受限解的所有遗漏分数均不为正，它就是完整问题的最优解（recovery 命题见附录）。借鉴线性规划中列生成的思路（引用 `lubbecke2005selected`），我们交替求解 restricted UOT，并根据 dual scores 更新 active support，直至达到完整问题的 KKT 容差；近似受限求解下的终止保证在理论节给出。

### 单元 3：核心求解器与整体组织

Active-support 算法需要反复求解非线性的 restricted UOT，因此受限求解的效率直接影响整体计算成本。
我们为此开发 PDUOT，在不同边际惩罚强度下高效提供高精度 primal--dual 解，其返回的势同时用于后续支持更新。

良好的初始支持有望减少后续工作，因此我们沿用 HELLO 的思路，利用小规模 UOT 解提供初始化（引用 `xia2026dual`）。
Budgeted pruning 与必要的 support sparsification 控制支持规模以保持线性工作存储。
总伪代码汇总这些组件，后续小节分别介绍受限求解器、支持初始化与更新，以及理论和复杂度。

### 配套呈现与后文分工

- 保留总伪代码及必要的符号定义，不在正文逐句翻译输入输出、if/else、warm start 和新变量初始化。
- 完整 KKT、精确解下的下降依据与 recovery 证明由求解器小节及附录承担。
- 候选预算、保护集合、sparsification 的保目标性质、势传播和 translation 的细节留给支持管理小节。
- Safeguard 由 PDUOT 的返回检查统一说明，不在总伪代码或概览正文中展开；完整条件与计算复杂度在相应小节交代。
- 存储界的参数依赖及完整扫描的二次点对工作留在复杂度节。概览不以线性存储暗示线性时间。

## 4. Restricted UOT with PDUOT 中文逐段大纲

本节承接整体算法中的 restricted solve，解释 PDUOT 如何直接处理非线性边际惩罚，同时得到 coupling 和支持更新所需的 dual potentials。以下按拟议正文段落写出大意；完整伪代码保留，正文不逐条复述其执行流程。

### 单元 1：从 restricted UOT 到稀疏 saddle formulation

对当前 active support $\mathcal N$，用 $\mathbf x$ 表示其边流量，$\mathbf c_{\mathcal N}$ 表示对应成本，边际求和算子满足 $\mathbf A_{\mathcal N}\mathbf x=(\mathbf X\mathbf1_n,\mathbf X^\top\mathbf1_m)$。令 $G(\mathbf r,\mathbf q)=\rho_a\operatorname{KL}(\mathbf r\mid\mathbf a)+\rho_b\operatorname{KL}(\mathbf q\mid\mathbf b)$，前文已定义的 restricted UOT 可写成

$$\min_{\mathbf x\geq0}\langle\mathbf c_{\mathcal N},\mathbf x\rangle+G(\mathbf A_{\mathcal N}\mathbf x).$$

我们以 PDHG 为基础构造 PDUOT。令 $F(\mathbf x)=\langle\mathbf c_{\mathcal N},\mathbf x\rangle+\iota_{\mathbb R_+^{|\mathcal N|}}(\mathbf x)$，引入 $\mathbf y=-(\mathbf f,\mathbf g)$，得到

$$\min_{\mathbf x}\max_{\mathbf y}F(\mathbf x)+\langle\mathbf A_{\mathcal N}\mathbf x,\mathbf y\rangle-G^*(\mathbf y),\qquad G^*(\mathbf y)=\rho_a\sum_i a_i(e^{y_i/\rho_a}-1)+\rho_b\sum_j b_j(e^{y_{m+j}/\rho_b}-1).$$

### 单元 2：并行 primal--dual 更新与非线性 proximal

给定正对角步长矩阵 $\mathbf D_x,\mathbf D_y$，PDUOT 使用下列 primal-first PDHG 映射 $T$：

$$\begin{aligned}\widehat{\mathbf x}&=[\mathbf x-\mathbf D_x(\mathbf c_{\mathcal N}+\mathbf A_{\mathcal N}^\top\mathbf y)]_+,\\\widehat{\mathbf y}&=\operatorname{prox}_{G^*}^{\mathbf D_y^{-1}}\bigl(\mathbf y+\mathbf D_y\mathbf A_{\mathcal N}(2\widehat{\mathbf x}-\mathbf x)\bigr).\end{aligned}$$

边上的 primal projection 和节点上的 dual proximal 支持稀疏 GPU 并行更新，各节点 proximal 可以独立、稳定地计算。标量 proximal 问题、其最优性方程和 log-domain 求解全部留附录；这里不展开实现或标准 PDHG 的一般推导。

### 单元 3：reflected Halpern、restart 与步长调节

PDUOT 在上述映射上采用 reflected Halpern iteration，并结合 adaptive restart（引用现有 restarted primal--dual 方法）。使用标准 Pock--Chambolle diagonal preconditioning；固定的基础步长通过 primal weight $w>0$ 调节两侧尺度，即 $\mathbf D_x=w\overline{\mathbf D}_x$、$\mathbf D_y=\overline{\mathbf D}_y/w$。Restart 时根据 primal 和 dual displacement 更新 $w$，并通过 summable log-weight budget 限制累计调节，以支持后文的收敛保证。完整迭代式放在伪代码中，基础步长、restart 判据和权重控制公式留附录，不在正文重复展开。

### 单元 4：检查、输出与外层算法的衔接

总伪代码给出 PDUOT 的完整流程。停止检查与输出均使用 mapped point $\widehat{\mathbf z}=T\mathbf z$，从而输出非负 flow，并将 $-\widehat{\mathbf y}$ 作为 dual potentials 交给外层支持更新；不要直接输出可能不满足非负性的 Halpern 内部状态。Restricted KKT 的各项残差定义留附录；返回检查默认包含适用的 safeguard 条件，具体适用范围统一在附录 Local Stopping Implementation 中说明，不在正文或伪代码中重复展开。后文理论节建立 PDUOT 的全局收敛与局部线性收敛，实验节比较其在不同 penalty 下达到高精度所需的时间。

### 配套呈现与取舍

- 正文保留稀疏表示、saddle formulation 和 PDHG map；标量 proximal 及 log-domain 求解留附录。不重新定义 active-support 算法，也不重复 Overall Framework 的动机。
- 保留完整 PDUOT 伪代码。Mapped-point 检查、势的符号转换及返回值在伪代码中写清，正文不逐句解释初始化、计数器、if/else 和 warm start。
- PDHG、reflected Halpern、restart 和 Pock--Chambolle preconditioning 均明确已有来源；本节解释它们如何组成面向 restricted UOT 的求解器，不把标准构件逐项宣称为独立创新。
- Summable log-weight budget 简要连接理论保证；具体约束及证明在附录和理论节展开。Safeguard 与该权重预算是不同机制，前者约束 refinement 调用的返回，后者约束求解器内的权重调节。
- GPU 并行性由支持上的操作结构解释；跨 penalty 的高精度求解效率由实验建立，不从收敛结论推出 penalty-independent 的速度或条件数。
- 各单元是审核用的段落划分，不意味着英文正文需要添加四个小标题。

## 5. Active-Support Initialization and Updates 中文逐段大纲（本轮重点）

本节只保留 Active-support initialization 和 Active-support updates 两个 paragraph 标题，分别回答支持如何构造、如何扩充并维持预算。层间稳定性、translation、structural edges、pricing、pruning 和 sparsification 沿这两条流程出现，不再各自占据平行的技术标题。前文已介绍整体循环和 PDUOT，本节不逐步复述求解与停止流程。

### 单元 1：Active-support initialization

对于共享一侧的 KL-UOT 问题，共享侧最优 marginal response 的归一化形状变化受到 cost interaction 与该侧 marginal penalty 的相对大小控制；当这一比例较小时，response shape 的变化有限（引用 shared-side response stability 命题）。这种稳定性鼓励我们在层间初始化时利用共享侧的信息。它为具体设计提供动机，完整界与证明见附录；正文不将它扩大为 coupling 支持重合或初始化必然加速的保证。

基于上述性质，我们 following HELLO（引用 `xia2026dual`）采用 shared-side hierarchy：通过 nested random subsampling 构造层级，相邻层只改变一侧，从而继承共享侧的势，再用 $c$-transform 补全另一侧。以 target 为共享侧为例，继承 $\mathbf g^{\mathrm c}$ 后令 $f_i=\min_j(C_{ij}-g_j^{\mathrm c})$，得到细层 dual-feasible potentials。这样，较小 UOT 问题的解为细层的支持选择和受限求解提供初始化。

传播得到的势虽然 dual feasible，但两侧 marginal responses 的总量可能不同。首次受限求解前，我们做 score-preserving potential translation：

$$ (\mathbf f,\mathbf g)\leftarrow(\mathbf f+t^\star\mathbf1_m,\mathbf g-t^\star\mathbf1_n). $$

其中 $t^\star$ 最大化该平移方向上的 dual objective，使两侧 response totals 相等，并保持所有 dual scores 和初始支持的选择不变。该操作沿用现有 KL-UOT 的 optimal translation（引用 `sejourne2022faster`）；闭式解与数值计算见附录。正文聚焦层间初始化，不在这里介绍求解器终止时可选的 output translation。

得到的 scores $\boldsymbol\sigma^0$ 用于 dual assignment。将逐行和逐列选择最高分边后的并集记为 $\operatorname{Top}_k(\boldsymbol\sigma)$，用每个方向的预算 $\kappa$ 构造初始支持：

$$\mathcal N_0=\operatorname{Top}_{\kappa}(\boldsymbol\sigma^0)\cup\mathcal B.$$

初始化允许非正分数，因为传播势是 dual feasible。双向 top-$k$ 在这里定义一次，后续更新直接复用，不为统一介绍两个操作而单独增加一个 paragraph 或提前跳到 refinement。

初始支持还包含由 reference weights 构造的 northwest-corner structural edges $\mathcal B=\operatorname{NW}(\mathcal P)$。Following HELLO，我们在每轮维护中保留这些边。当 reference totals 相等时，它们使支持能够容纳匹配 reference marginals 的 coupling，避免支持结构本身强迫边际偏离；这种限制在 marginal penalties 较大时尤其昂贵。具体构造及 Hall deficit、迭代下界留附录。

### 单元 2：Active-support updates

受限求解后，dual-violation detection 在更新后的 scores 上复用双向 top-$k$ 规则，以每个方向的预算 $\gamma$ 选择正分数候选：

$$\mathcal V=\operatorname{Top}_{\gamma}(\boldsymbol\sigma)\cap\{(i,j):\sigma_{ij}>0\}.$$

Pricing 通过 tiled scan 评估 scores，不显式存储完整 cost matrix；$\eta$ 的归一化与扫描细节继续留附录。支持维护需要在 $\lceil\beta(m+n)\rceil$ 的预算内容纳当前正流量边、结构边以及新候选，由此引出 sparsification 和 pruning 的组合。

近似受限解的 positive support 可能过大，仅删除零流量边不足以满足预算。为结构边和新候选预留空间，我们先在必要时对 positive support 做 sparsification，同时保留 transported marginals 和 transport cost，因此 UOT primal objective 不变。具体采用 HELLO 的 cycle cancellation，两次分别给出成本不高于和不低于原值的稀疏 coupling，再通过凸组合恢复原成本。插入候选后，budgeted pruning 保护当前正流量边、$\mathcal B$ 和 $\mathcal V$，按 dual slack 从大到小删除其余零流量边直至满足预算。现有 coupling 仍可表示，新候选也可用于下一次求解；具体构造、容量与支持界留附录。

### 正文与附录的分工

- 正文只设 initialization 和 updates 两个 paragraph 标题。初始化沿“层间性质 → hierarchy → 势与 response totals 的协调 → 初始支持”展开；更新沿“遗漏变量发现 → 支持预算需求 → 保持目标的稀疏化与 pruning”展开。
- 双向 top-$k$ 在初始化中首次定义，更新中直接复用；两处分别给集合公式，避免独立的共性段打断流程。
- 支持维护先说明候选和预算之间的需求，再介绍具体操作。实际执行仍按总伪代码，在成功受限求解后先按需 sparsify，再做完整检查、候选发现和 pruning，不改变算法顺序。
- 正文保留统一的 top-$k$ 定义及初始化和更新集合式、必要的 $c$-transform 和 translation 公式，以及 $\kappa,\gamma,\beta$ 的职责。完整层级构建、算子伪代码和逐项参数依赖放附录。
- Dual propagation、dual assignment、potential translation、pricing、budgeted pruning 和 support sparsification 使用已有术语，不另造新的同义名称，也不将 HELLO 的机制宣称为新的独立贡献。
- 层间稳定性是有条件的初始化依据；NW 的 reference-marginal 可表示性限于 reference totals 相等的情形。完整的 Hall-deficit 命题及条件留附录。
- Sparsification 保留 transported marginals、transport cost 和 potentials，但不直接宣称所有有限容差残差不变。Restricted certificates 的刷新与适用条件在附录交代。
- 本节说明维持稀疏支持的机制；正式线性存储结论统一在 Convergence and Complexity 给出，不暗示完整 pricing 具有线性时间复杂度。
- Safeguard 属于 PDUOT 的 Stop 定义，继续放附录；本节不再引入一个额外的 safeguard 流程。

## 6. 后续小节的中文大纲（暂供全局衔接）

### 收敛与复杂度：对应内层、外层和存储

分别说明 PDUOT 的全局收敛与局部线性收敛，以及带规定输出条件的 inexact refinement 有限终止。保留 exact arithmetic、proximal evaluation、restricted calls 有限返回、pricing 和支持维护等定理前提，区分算法条件与实测行为。完整证明和辅助结论继续留在附录。

最后说明支持预算与稀疏状态如何给出线性存储，并明确输入维数、支持预算和 tile size 的依赖以及完整 pricing 的二次点对计算。贡献列表可简洁写 linear memory，复杂度节需要给出完整口径。

### Extensions：沿用独立章节

Entropic UOT 主要解释用最终 dual information 重建支持后执行 sparse Sinkhorn；UFGW 主要解释其 block 与 UOT 的关系及如何调用 hier_uot。两者通过核心方法的支持和求解能力引出，不重新建立长篇问题背景；完整目标及协议留附录。

## 7. 执行顺序与当前状态

1. Overall Framework 的叙事与总伪代码基本完成；最终清稿时移除算法标题中的 `loop variant`，并补齐或替换最粗层完整边集 $\mathcal E^{(L)}$ 的定义。
2. 第 4 节 PDUOT 中文正文大意已同步到英文；继续逐段审核与打磨，完整伪代码保留。
3. Active-Support Initialization and Updates 的中文大纲和英文已同步：由层间稳定性引出 shared-side hierarchy，统一介绍 dual assignment 与 dual-violation detection 的双向 top-$k$ 规则，再说明支持规模控制。
4. 核对两项保证、总伪代码与实现接口的一致性，最后统一主图和章节标题。

Overall Framework 的三个单元已同步到英文正文，总伪代码按作者最新版本保留 loop、KKT 停止条件及显式支持操作；safeguard 由 PDUOT 的返回检查说明。第 4 节 PDUOT 的中文正文大意已同步到 `.tex`：补充稀疏 GPU 操作结构，连接非线性 proximal、迭代控制及 mapped-point 返回接口，保留核心公式和完整伪代码。本轮没有启动实验。引言已在此前讨论中完成主要叙事调整；[STORYLINE_INTRO.md](STORYLINE_INTRO.md) 保留此前讨论记录，个别历史状态说明不应据此推断正文尚未修改。

## 8. 附录补充算法比较计划（2026-11-14）

补充正文未覆盖的公开实现，考察其他 UOT 求解路线的耗时、精度与适用规模。候选要求：代码可实际获取，支持一般点云而非仅规则网格，能返回或由状态恢复 coupling。允许 entropic、coupling-regularized 和低秩方法，统一用原 UOT objective 和独立下界评价 shared gap；不要求候选原生优化同一目标，也不预设候选性能弱于 hier_uot。当前仅记录计划和源码审查，不实现 adapter、不启动实验，也不改变正文主比较。

### 候选与代码可用性

| 优先级 | 候选 | 公开实现及本次核查 | 纳入方式 |
|---|---|---|---|
| 1 | ETM 官方 UOT demo | [官方 ETM 仓库](https://github.com/XeniaLLL/ETM)，`Demo_for_UOT.ipynb` 接收任意 dense cost 和两侧权重；`uot_helper` 实现 Approx 型迭代，后续通过 POT 构造 coupling，未见 Refine/L-BFGS 阶段 | 首批候选，但不能直接标为 ETM-Refine。优先复用实际公开版本；补写论文 Refine 属于额外复现，另行决定 |
| 2（备选） | FRLC | [官方仓库](https://github.com/raphael-group/FRLC)，本地已有 `third_party/FRLC/`；公开代码包含 unbalanced 路径 | 作为正文 ULOT 之外的低秩补充；先复查既有 adapter 的审计记录、free-mass 表示与 penalty 映射，再决定恢复比较，不把历史 adapter 限制当作论文限制 |
| 新增候选 | GeomLoss online / annealed Sinkhorn | [官方代码](https://github.com/jeanfeydy/geomloss)，已核查高维点云、KL marginal relaxation、PyTorch/KeOps 与 coupling 恢复路径 | 与现有 OTT 的 annealing 和实现路径对照；先固定版本、关闭 debias、对齐成本/epsilon/rho 单位。公开 scalar rho 接口先考虑对称配置，不把高维 online 与低维 multiscale 混为一谈 |
| 小规模备选 | POT L-BFGS-B | [官方源码](https://pythonot.github.io/_modules/ot/unbalanced/_lbfgs.html)，支持任意 cost、两侧 penalty、KL/L2 marginal 与 `reg=0`，返回 coupling | 可作为 CPU 直接优化对照；内部转 NumPy 并使用 SciPy，不能当作 GPU solver。方法身份是通用优化器，不包装成新的 UOT 专用算法 |
| 不新增 | Translation-invariant Sinkhorn | [官方 fast_uot](https://github.com/thibsej/fast_uot) 可获取，但现有 OTT 基线已设置 `recenter_potentials: true`；OTT 文档明确对应 Séjourné et al. 2022 的 UOT 加速更新 | 已由现有基线覆盖该机制，不为更换库重复增加算法曲线；下文保留源码审查记录 |
| 排除本组比较 | Schmitzer MultiScaleOT sparse scaling | [官方 MultiScaleOT](https://github.com/bernhard-schmitzer/MultiScaleOT)，有一般点云、KL marginal solver、稀疏 coupling 接口，并非仅网格 | 默认层级枚举 $2^d$ 子盒，不能直接接入 TOME PCA30；作者决定不为本组比较另行构建 manual hierarchy，也不增加低维专属比较 |
| L2 附录备选 | Regularization path | [Chapel 官方代码](https://github.com/lchapel/UOT-though-penalized-linear-regression) 和 [POT `ot.regpath`](https://pythonot.github.io/gen_modules/ot.regpath.html) 已确认可访问 | 仅用于平方 L2 marginal penalty，不混入 KL 主比较。先对齐路径参数与本文 rho；注明路径计算与单个固定参数求解的任务区别 |
| 暂缓 | Adapted network simplex / AdNS-UOT | [论文](https://arxiv.org/html/2610.13847) 给出 `https://github.com/gagazzotti/AdNS-UOT`，但本次访问仓库页面及 GitHub API 均返回 404，作者公开仓库列表也无该名称 | 目前不能算已获取公开实现；代码可访问后再评估。论文中提供链接不等于仓库当前可访问 |
| 暂缓 | GEM-UOT、safe screening | 本次尚未确认可获取的作者实现；论文及既有调研记录不足以确认代码已公开 | 满足代码可获取条件后再纳入。Safe screening 须与具体底层 solver 配对，不能当作独立求解器；GEM 的 coupling 正则须与 L2 marginal penalty 区分 |

### 比较形式与待定设置

优先采用附录 runtime–accuracy Pareto 图，沿用主实验的数据处理、原始 UOT objective、独立 reference 和 shared gap；保留各方法扫描得到的实际精度与耗时，不要求先达到同一个 gap 才能比较。可从 TOME 的小规模输入开始，再根据公开实现的资源需求扩展；规模、扫描参数与时间上限在接入时确定。

ETM 须报告包含边际估计和 coupling 构造的完整耗时，不能只计其中一阶段。若采用作者主实验的 ETM-Refine + MROT，明确额外正则与最终返回解，并用原 UOT objective 统一评价；不将修改目标下的最优性当作原目标的精确性。若另用 balanced OT solver 恢复原目标 coupling，应明确标为组合实现。

2026-11-14：ETM-Approx+HELLO 已完成 PyTorch/CUDA 等价实现和 n=4096 的四组 KL rho pilot。沿用公开 notebook 的固定 1000 轮，FP64，扫描 epsilon=1e-2/1e-3/1e-4/1e-5；完整计时含边际估计与 HELLO coupling 构造，共同目标仍为原 KL-UOT。16 档 ETM 与 12 档 hier_uot 全部有效，21 项 CUDA/数值对照通过。只计边际估计时，相对官方 NumPy 的加速约为 n=1024 的 95.2 倍、n=4096 的 109.8 倍。结果与正式网格入口见 `EXPERIMENT_PROGRESS.md` 的 E02 补充记录；当前仍是单 seed RTX 4090 pilot。

保留作者实现的 CPU/GPU 执行方式并注明，报告实现层面的端到端结果与资源限制。超时、OOM 和不支持的配置如实记录。新增比较的意义是补充算法覆盖面，不预先承诺取代正文基线。

### 点云与实现范围源码审查（2026-11-14）

本轮为静态源码审查，尚未验证安装、数值收敛或计时。临时 checkout 位于 `/tmp/uot_baseline_{multiscaleot,domdec,fastuot,lcn}`，ETM notebook 位于 `/tmp/etm_uot_demo.ipynb`；FRLC 审查本地 `third_party/FRLC/`。这些路径只用于本轮审查，不作为未来正式实验依赖。

- **ETM：保留，但修正版本身份。** `Demo_for_UOT.ipynb` 的 `uot_helper(cost_mat, src_weight, trg_weight, tau_a, tau_b, ...)` 无点云维数或规则网格假设，支持两侧不同 penalty。内部使用 NumPy dense 指数数组、固定轮数和全局 `eps`；slack 构造还引用外部 `cost`，接入时必须显式化参数。Coupling 示例调用 `ot.sinkhorn` 和 `ot.smooth.smooth_ot_dual`，包括加 slack cost 的 MROT 与不加 slack cost 的版本。未发现准牛顿精修，不能把 demo 性能写成 ETM-Refine 的性能；原先“优先跑 Refine”的计划据此修正。
- **FRLC：保留为待考虑候选。** `src/FRLC.py::FRLC_opt` 接受 dense cost 或其因子表示，`unbalanced=True` 分支不依赖网格，`returnFull` 可返回 coupling，也可返回因子并恢复。两侧外边际更新共用 `tau_out`，因此官方接口不能直接表达两侧不同 penalty；对称配置先审查，非对称适配另外标注。点云适用性通过，但 free-mass 输出与 penalty 映射仍需小算例验证。本地审查版本 `a49338c697591513eca9fe58955d43b9b741736d`。
- **MultiScaleOT：并非仅网格，但默认高维层级不适合直接复用。** `TMultiScaleSetup(pos, mu, ...)` 与 `TMultiScaleSetupGrid` 是不同接口；`TSinkhornSolverKLMarginals` 和 `getKernelPosData`/CSR 输出可组合用于点云 UOT。官方 `plot_0012_2d-HK-interpolation.py` 已展示点云加 KL solver，但示例采用 HK cost，比较平方欧氏 UOT 时须关闭 HK cost 模式。`src/Common/THierarchyBuilder.cpp::getChildrenPosCodes/getChildrenLeaves` 显式分配并遍历 $2^d$ 子盒，`childModeTree` 也经过该逻辑；PCA30 不可直接照搬。库有 manual hierarchy 接口，但构造替代高维层级属于额外开发。源码还提供带 `kappaX,kappaY` 的通用 soft-marginal solver，可在接入时核查非对称配置。版本 `48a47aaf76e04af11c6892a3204d57caaef42967`。
- **fast_uot：保留对称 H-Sinkhorn 候选。** `fastuot/torch_sinkhorn.py::h_sinkhorn_loop` 使用任意 dense cost、两侧正权重与 PyTorch 运算，返回势；可按其 $a\otimes b$ 熵参考恢复 coupling，无网格或一维限制。PyTorch H 接口仅支持对称 rho，G 接口有作者 `TODO: Wrong version of g-sinkhorn` 注释；NumPy H 的非对称分支存在与 `softmin(a,f,rho)` 签名不一致的调用，未运行，不直接采用。`uot1d.py` 的 FW 是另一条一维专用路线，不纳入高维点云比较。版本 `c519a10287ea1f5e23448197db0fc0920bbebf70`。
- **DomainDecomposition GPU-UOT：排除直接比较。** [官方仓库](https://github.com/OTGroupGoe/DomainDecomposition) 的 `examples/example-domdec-gpu-unbalanced.py` 和 `2024-04-23_script-DomDec-unbalanced.py` 依赖 `shapeX`、规则网格层级、二维 cell reshape、padding 及图像式局部求解。不能把 TOME 点云重排成图像后当作同一问题；此结论针对当前发布的 GPU-UOT 执行路径，不扩大为论文方法理论上不可能处理点云。版本 `13f02ea946c6d66ae430be485a9526d6784448fa`。
- **LCN：暂不作为直接 KL-UOT 候选。** [官方仓库](https://github.com/gasteigerjo/lcn) 支持高维点云和 GPU，但快速 LCN/sparse/Nystrom 的 unbalanced 路线使用 BP 扩展与删除/插入代价，不能把该参数直接解释为本文 KL marginal rho。另有 `lcn/sinkhorn_unbalanced.py::entropyRegLogSinkhorn` 实现标准 KL-UOT，但采用 uniform masses、共同 marginal penalty，公开函数返回标量而非 coupling，且为 dense full Sinkhorn，与已有基线重复；恢复其内部 coupling 可行，但不是新增 LCN-KL-UOT 加速路线。故暂不纳入，而非以正则化或点云维数排除。

GEM-UOT、safe screening 仍处于“未确认可获取作者实现”，不能表述为确定未开源。Genans 的 entropic semi-dual/adaptive-gradient 论文也纳入检索，但论文页和作者研究页本次未发现代码链接，暂不列为可执行候选。

### 系统补查后的更新

详细版图、检索记录、源码证据和排除理由见 [RELATED_WORK_ALGORITHM_MAP.md 第 10 节](RELATED_WORK_ALGORITHM_MAP.md#10-系统补查离散-uot-求解路线公开实现与比较资格2026-11-14)。候选并非只有 ETM 和 FRLC：新增 GeomLoss online 和可选的 POT L-BFGS-B；Spar-Sink 还可复用已有 adapter 补原 UOT gap 评价。LCN/BP 按作者决定排除，不因其可产生矩阵而恢复；MultiScaleOT 和 GPU 网格 DomDec 不进入当前 PCA30 比较。

另补文献：Chen et al. 的 IBPUOT/AIBPUOT（原 KL-UOT 上不精确 Bregman proximal point 与加速），Su–Kasai 的 dynamic-penalty BPD/MM（针对大 penalty 的加速），以及 NFFT-UOT。前两条尚未找到可获取的作者代码，保留相关工作资格；NFFT-UOT 官方实现显式限于 1–3 维，排除 PCA30。它们提醒最终 related work 不能把所有已有直接方法简化为 vanilla MM。此处只是后续写作与接入依据，未改 `.tex`/`.bib`，未启动实验。
