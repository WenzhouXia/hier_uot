# hier_uot Introduction 叙事与修改提纲

更新日期：2026-11-12。本文记录作者已认可的叙事方向，以及供继续审核的 Introduction 中文逐段提纲；不代表下列英文正文修改已完成。

## 1. 整体定位

论文标题确定为 **Scalable Active-Support Optimization for Unbalanced Optimal Transport**，不加算法名前缀。
算法展示名确定为 **Salut**（大小写固定），正文通过 `\ours` 统一渲染，派生算法名复用主宏。
缩写来自 **S**calable **A**ctive-support optimization for **L**arge-scale **U**nbalanced optimal **T**ransport。
注释和 Markdown 叙述统一使用稳定小名 `hier_uot`；历史数据路径、配置键、命令和 provenance 中的 `shuttle` 保留其技术标识含义。

论文以 scalable active-support optimization for KL-UOT 为主线：直接在维护的支持上求解 restricted UOT，通过支持初始化与更新组织计算，在支持预算内达到完整问题的停止条件。

PDUOT、active-support initialization 和 active-support update 是整体方法的组件。介绍技术贡献时优先强调高效的 restricted-UOT 求解与两项收敛保证；hierarchy 用于改善初始化，dual-guided hierarchy 是采用的具体实现方式，来源在相应位置明确交代。

不再以“将 HELLO 的 dual-guided hierarchy 适配到 UOT”作为摘要和贡献列表的首要陈述。算法继承关系仍须清楚，不因改变叙事顺序而淡化归属。

## 2. 四层贡献

| 层级 | 要回答的问题 | 内容与边界 |
|---|---|---|
| hier_uot 整体方法 | 如何组织大规模 KL-UOT 的计算？ | 直接 restricted-UOT 求解与支持 refinement；初始化、pricing、budgeted pruning 与必要的 support sparsification；固定维数和预算参数下的线性存储。完整 pricing 仍有二次点对工作。 |
| 高效 PDUOT | 如何高效执行反复出现的非线性受限求解？ | 利用边更新与节点 proximal 的结构，实现 GPU primal--dual solver；不将标准 PDHG 或预条件本身视为原创。 |
| 两项理论保证 | 内层与外层各保证什么？ | 所述条件下的 PDUOT 收敛及局部线性结果；带 safeguard 的 inexact refinement 有限容差终止。保留受限调用有限时间返回、精确 pricing 和数值范围等前提。 |
| Extensions 与 applications | 核心求解能力带来什么用途？ | sparse entropic refinement 与 UFGW；真实任务中的效率、内存和任务质量由最终实验支持。 |

以上是内容层级，不强制最终 contribution bullets 的数量。Motivation 按问题逻辑引出需求，贡献介绍按本文技术分量排序，两种顺序不必相同。

## 3. Introduction 中文逐段大纲（供审核）

### 第 1 段：UOT 为什么重要

OT 的严格边际约束难以描述质量变化。UOT 允许 transported marginals 偏离 reference masses，因而适用于细胞增殖与死亡、类别比例差异和遮挡等场景。用一个主要应用带出问题，不展开应用清单。

承接：应用规模增长，需要高效计算 UOT。

### 第 2 段：本文求什么，瓶颈是什么

本文关注 KL-UOT：联合决定输运流量与两侧 transported marginals。每个点对对应一个变量，完整离散问题有二次规模；目标是在可控存储下获得原问题的高精度数值解。正文保留理解目标所需的 primal 定义，完整 dual 的放置待逐段审核。

承接：已有方法通过不同方式缓解计算、存储瓶颈。

### 第 3 段：Coupling-regularized methods

额外 coupling 正则化使优化更易处理（引用 GEM-UOT），尤其熵正则（引用 sinkhorn 那一堆论文）带来 generalized Sinkhorn 迭代。但有限正则强度改变了本文的目标；且熵正则下实例化 coupling 需要平方存储（这句话现有的表述就行）。

承接：紧凑表示是另一种规模控制方式。

### 第 4 段：Low-rank coupling methods

低秩方法用紧凑因子表示 coupling，降低时间与存储，但有限 rank 限制了可表示的解，引入误差。它们提供重要的可扩展路线，仍需考察相对原始 UOT 目标的精度与成本（这句用现有表述就行）。

承接：也有直接针对原目标的算法。

### 第 5 段：Direct updates 与 OT-oracle reductions

MM 直接更新 coupling；marginal-first 与 balanced-OT oracle 方法（引用 1-D Frank-Wolfe 和 HELLO的 HELLO-UOT）将 UOT 转化或分解为其他计算任务。介绍这些方法保留原目标的优势，再具体指出相应实现中的存储或反复 oracle 工作。

承接：利用最优解的稀疏结构还提供了另一条路线。

### 第 6 段：Sparsity-exploiting UOT methods

介绍利用 UOT 稀疏性缩减优化状态或候选变量的工作：
- quadratic-penalty regularization path 不适配最常见的 KL penalty 且无线性 memory 保证
- 适配 UOT 的 network simplex 在 gpu 上适配是相当 non-trivial 的
- Safe screening 通过逐步排除变量减少计算，但剩余支持规模取决于筛除进展，并未提供求解全过程的线性存储保证。

承接：This leaves open how to solve the large scale UOT problem with linear memory and efficient GPU parallelism.

### 第 7 段：从结构机会推出 hier_uot 的总体路线

UOT 存在稀疏最优耦合，这给如下思路提供机会：可以只维护少量候选边，在该支持上直接求解，再用返回的势发现遗漏边。
可用的整体算法需要合理初始化支持、有效更新并控制支持规模，以及高效求解反复出现的非线性受限问题。
hier_uot 将这些环节连接起来，目标是给出线性内存、并行友好、理论收敛的高精度大规模 UOT 算法。

承接：首先说明反复受限求解这一核心环节如何实现。

### 第 8 段：优先突出 PDUOT

边际惩罚使 restricted UOT 成为非线性凸问题。
为高效执行反复的 restricted 子问题求解，开发利用问题结构的 GPU-friendly first-order primal--dual solver PDUOT；
它既更新流量，也输出后续 pricing 所需的势。

承接：整体效率还依赖有用的初始支持与受控的支持更新。

### 第 9 段：初始化与支持管理，明确已有机制的来源

- hier_uot 利用较小问题的对偶势初始化 active support
- 并依据当前受限解的对偶违约发现需要加入的边
- 通过活跃集 budget pruning 以及针对 UOT 的 sparsification 确保线性存储


承接：简洁归纳本文能力、技术和验证。

### 第 10 段：贡献归纳与扩展价值

按四层贡献收口：
- hier_uot 整体求解方法；
- 高效 PDUOT；
- 两项收敛保证；
- 两项扩展与真实下游验证。Extensions 用于说明这套求解能力的用途，不在引言展开推导，也不挤占核心算法的位置。

上述编号表示论证单元，不是最终固定的排版段数。第 3--6 段应当短写；第 7--9 段的段界及是否合并，在逐段措辞时再审核，避免引言因分类和组件枚举而膨胀。

## 4. HELLO 与术语出现的位置

- Related work 首次明确出现 HELLO-UOT，介绍其 balanced-OT oracle 路线。
- Our approach 在提出整体 active-support 路线、解释层级初始化的职责后，引入 HELLO 的 dual-guided hierarchy；不拖到 Method 才交代来源。
- 支持初始化的具体选边操作叫 dual assignment；pricing / dual-violation detection 用于支持更新。Hierarchy 提供初始化信息，两者不是同一个操作。
- 正文沿用 `TERMINOLOGY.md` 的 active support 等术语；讨论文献时尊重其 active-set、PFW、network simplex 等原有名称。

## 5. 新颖性表述的边界

- 正面强调面向 KL-UOT 的 scalable active-support 方法、高效 restricted reoptimization，以及内层和外层的具体保证。
- 直接用 KL-UOT 称呼本文目标，不反复以 unregularized 或“无正则化”作为方法标签；介绍 Sinkhorn、GEM-UOT 等路线时说明其额外 coupling 正则项，仅在比较目标差异与正则化误差时明确区分原目标和正则化目标。
- 不将通用 column generation、PDHG、Pock--Chambolle preconditioning、dual-guided hierarchy 或 score-preserving translation 本身写成首次提出。
- 不声称首次在 UOT 中使用 active set、稀疏支持或 dual 选边；不能以未找到完全相同的方法证明不存在先例。
- 与稀疏相关工作比较优化操作、目标/近似来源、存储控制和保证对象；性能优势由实验支持，不由分类推出。
- 新预印本及其他最近邻工作的具体记录见 [RELATED_WORK_ALGORITHM_MAP.md](RELATED_WORK_ALGORITHM_MAP.md)。

## 6. 与现稿的差别和迭代方式

现稿已经包含稀疏性、restricted solves 和 pricing 等材料，但摘要第二句和第一条 contribution 仍以框架迁移为中心。正式 Introduction、摘要和贡献列表尚未按本提纲改写；此前已实施的方法压缩和理论重组不代表引言叙事已完成。

先审核本提纲的完整论证链，再按论证单元给出小范围 location/revision，确认后落入 `.tex`。每轮说明当前段落的职责和与前后段的连接。先处理 Our approach，再回看 related work 如何引出它，随后统一贡献列表；摘要最后写。

本轮仅新增叙事文档、更新相关工作备忘，不修改论文正文。后续执行时同步记录已完成与仍待讨论的决定。

## 7. 稀疏相关 UOT 方法对比（2026-11-12 更新）

此表用于讨论 related work 和 motivation 的文献缺口，不表示这些方法都属于同一种 active-support 算法，也不表示已决定新增相应运行实验。第四类 sparsity-exploiting methods 仅包含 regularization path、network simplex 和 safe screening。GEM-UOT 属于第一类 coupling-regularized methods，在表中仅保留为跨类别参照，不计入第四类。MM 不属于本表关注的稀疏路线，MMD-UOT 上额外施加稀疏约束的 submodular 方法不纳入，未提供数值实验的 cost-truncation/PFW 预印本也不纳入。

表中将是否额外加入 coupling 正则项与边际惩罚的选择分开比较。“GPU 实证”只记录论文实际报告，“GPU 推广难度”是根据更新操作作出的实现判断，不是文献已证明的性能结论。“未展示”不等于不能实现。存储区分优化状态、cost 与输出，稀疏输出不自动给出线性存储保证；规模只记录已确认的算例，不将未报告更大规模写成算法上限。

| 比较项 | Regularization path：Chapel et al., NeurIPS 2021 | Network simplex：Agazzotti et al., 2026 | Safe screening：Su et al., Neurocomputing 2026；预印本 2023 | GEM-UOT：Nguyen et al., JMLR 2023 |
|---|---|---|---|---|
| 叙事分类 | 第四类：利用稀疏性的方法 | 第四类：利用稀疏性的方法 | 第四类：利用稀疏性的方法 | 第一类：coupling regularization；仅作跨类别参照 |
| 如何与稀疏性关联 | 按参数断点添加或移除 active-set 变量，跟踪解路径 | 以 forest support 存储 coupling，逐边 pivot 和 flow push | 用包含最优 dual 的 safe region 证明部分边的最优流量为零，随后排除这些变量；可叠加于不同 solver | coupling 平方正则带来 positive-part 恢复公式，可得到精确零项；主要是稀疏输出，不是动态支持上的完整再优化 |
| 适用目标与额外正则化 | 不增加 coupling 正则，但 path 算法只覆盖平方边际惩罚，不能直接用于本文的 KL-UOT | 不增加 coupling 正则，显式覆盖 KL、平方边际惩罚及 semi-UOT | 不增加 coupling 正则，覆盖平方和 KL 边际惩罚；公开预印本 KL 公式含 transported marginal 的 epsilon 平移，与本文未平移目标是否完全一致须核对期刊版 | 额外加入 coupling 平方范数项；通过参数选择控制对 KL-UOT 目标的近似误差 |
| GPU：论文内是否展示 | 未展示 path 的 GPU 实验；同篇论文 MM 的 GPU 结果不归于此算法 | 未展示；报告 Python/C++ 实现，在 M4 MacBook 上运行 | 公开预印本报告 Matlab 实现，未展示 GPU 实验；期刊版实现待核查 | 论文未报告 GPU 实验或 GPU 硬件设置 |
| GPU：能否较简单直接地推广（实现判断） | 部分操作容易：全边事件搜索、矩阵向量运算可并行；但逐事件增删和逆矩阵维护具有串行依赖，整体高效移植不算直接 | 不算直接：pricing 扫描易并行，但树遍历、逐边 pivot、拓扑变化和 flow push 不规则且有依赖，需要专门设计 | 较可行但取决于底层 solver：逐边筛选、归约及 MM 更新可并行；动态压缩和部分复杂 safe-region 规则仍需实现，不保证加速 | 较直接：逐点对 positive-part 计算、行列归约、指数及向量更新适合 GPU；仍需处理完整点对计算及存储 |
| 是否线性 memory | 一般不保证；维护大小为支持数平方的逆矩阵，仅此项即为二次于支持数的存储，另有 cost 与路径输出 | forest 边数至多为节点总数减一，优化状态线性；现有实现是否避免完整 cost 存储尚未确认，不能直接标为端到端线性 | 从完整候选变量和 mask 开始筛除，未给出固定线性存储保证；剩余支持大小取决于筛除进展 | dual 向量为线性规模，但梯度聚合完整点对项；未建立端到端线性存储方案。分块在线计算在原则上可降低工作内存，不能因稀疏输出就认定已有线性存储 |
| 实际展示规模 | 原论文 path 时间实验为每侧 100--1,000 点 | 每侧 25,000 点的平方边际惩罚算例；KL 主比较表到每侧 1,000 点，不混用这两个规模 | 有筛除率、solver 加速比实验；已核对的公开版正文未明确给出可确认的最大点数，暂记待核查 | 合成实验包含每侧 200 点，以及 CIFAR-10/Fashion-MNIST 图像直方图、颜色迁移；未从已核对文字确认整篇最大离散支持数，暂不填最大值；原图像素数也不能当作量化后的颜色支持数 |
| cost 与点云维度的适用性 | 接受一般离散 cost matrix；展示二维示例、十维 Gaussian 和 MNIST/Fashion-MNIST 任务，主要采用平方欧氏 cost | 接受一般离散 cost matrix；展示随机 cost、平方欧氏 cost、重心及 JKO 应用，未系统比较不同点云维度 | 接受离散 cost；公开版展示 100 维 Gaussian、MNIST，未系统比较不同 cost 家族 | 接受一般离散 cost matrix；展示随机 cost、图像像素位置的 L1 cost 和三维 RGB 颜色任务，未系统验证跨点云维度的效率 |

### 来源与核查范围

- **Regularization path**：[原论文](https://proceedings.neurips.cc/paper_files/paper/2021/file/c3c617a9b80b3ae1ebd868b0017cc349-Paper.pdf)，Sections 3.2、4；Algorithm 1 显式维护支持上的逆矩阵。区分 path 和同文 MM。
- **Network simplex**：[原论文](https://arxiv.org/html/2610.13847v1)，Sections 3、4、6，特别是 Table 1 和 Section 6.2。优化状态的稀疏界不等于完整 cost 的存储界；作者给出的代码链接本次返回 404，尚未完成实现核对。
- **Safe screening**：[公开预印本](https://arxiv.org/html/2307.00247v1)，Sections 3.4、4、Table 2 与 Appendix B.2；[期刊版](https://doi.org/10.1016/j.neucom.2025.132308)。期刊卷期为 Neurocomputing 668（2026），DOI/online-first 年份含 2025；期刊全文此次访问受限，算法及实现细节主要根据预印本记录，不能将其 epsilon 平移或实验设置未经核对地归于最终版。
- GEM-UOT：[期刊原文](https://jmlr.org/papers/volume24/22-1158/22-1158.pdf)，Section 2.2，Eqs. (5)--(7)，Algorithm 1 与 Section 5。保留为稀疏输出的参照，其算法并未利用动态稀疏支持缩减完整点对梯度计算；不作为稀疏计算算法突出。GPU 推广判断依据其逐点对运算与行列聚合结构，不是原文实测结果。

### 对 motivation 的约束

第四类工作已经展示了稀疏支持维护和安全筛除，不能再声称 UOT 中没有利用稀疏性的算法。第一类中的 GEM-UOT 展示稀疏输出，相关讨论留在 coupling regularization 段落。GPU 也不能作为统一的不可实现性缺点：safe screening 可与 GPU solver 结合，跨类别参照 GEM-UOT 的主要运算也适合直接并行。

当前核心 gap 的建议表述：在已核查的稀疏 UOT 方法中，尚未看到同时具备线性存储保证并展示高效 GPU 实现的方案。这为兼顾计算效率与存储可扩展性的算法留下了探索空间。此处不限定 marginal penalty，也不以是否额外正则化 coupling 限定比较范围；本文具体处理的目标与相应理论、实验支持在方法介绍中交代。此判断限于已核查文献及其报告的能力，不能扩大为所有现有方法在理论上都无法同时做到；safe screening 期刊版与 network simplex 实现仍有待核查项。

高效 GPU 实现与线性存储是大规模求解的两个关键条件，但不能单凭这两项推出运行时间可扩展性。hier_uot 的完整 pricing 仍有二次点对工作，因此实际 scalability 需用规模实验和达到目标精度的时间验证。此处先陈述需求及现有证据的不足，下一论证单元再引出 hier_uot 的 active-support 路线。跨 cost、跨维度的优势由实验建立，不能把这些方法未展示的实验写成数学适用性限制。
