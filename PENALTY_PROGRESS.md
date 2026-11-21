# KL / squared-L2 penalty：论文修改进度

更新日期：2026-11-21。

本文档记录 penalty 相关的论文表述、算法设计、理论、实现与实验进度。每次只推进一个可核对的小步骤，完成后更新本文件。当前只建立计划，尚未据此修改论文 `.tex` 或生产算法。

## 纲领：在正文部分，KL和L2的地位是相同的，只有实验章节才不同

## 目标与状态约定

目标叙事：Salut 的受限求解、active-support 更新和主要收敛保证共同讨论 KL 与 squared-L2 marginal penalties；hierarchy 设计体现两类 penalty 的差别；主要应用与扩展实验可以继续以 KL 为主。

状态严格区分：**讨论已确定**、**推导待核验**、**pilot 已完成**、**已实现**、**已写入论文**、**检查通过**。讨论结论或实验现象不能直接标成已证明；原有附录含 L2 结果也不代表统一后的正文表述已经完成。

术语以 [TERMINOLOGY.md](../../TERMINOLOGY.md) 为准。这里的 L2 指 squared-L2 marginal penalty，包含 $1/2$ 系数，与 ground cost、停止残差范数和 transport entropy 分开。

## 已确定的修改方向

| 内容 | 决定 | 当前状态 |
|---|---|---|
| 统一受限问题 | 正文说明 $G$ 是两侧边缘惩罚，明确考虑 KL / squared-L2；保留共同的鞍点形式与 PDUOT 更新 | 讨论已确定，未修改 |
| 具体 penalty 公式 | $G^*$、节点 proximal、边缘响应的具体公式集中放附录 | 讨论已确定，未修改 |
| Scalar calibration | 正文保留沿 score-preserving translation 最大化对偶目标的共同定义；具体计算放附录 | 讨论已确定，未修改 |
| Hierarchy 参数 | 在 Active-support initialization 开头、势继承之前交代质量和 $\rho$ 规则 | 讨论已确定，未修改 |
| 两个主要收敛定理 | 核验后提炼共同陈述，保留各 penalty 的证明分支与必要条件 | 待逐项审查 |
| 层间 dual 稳定性 | 解释 KL 尺度关系与 L2 质量恢复、参数缩放的依据 | 已讨论推导，正式证明待核验 |
| 实验叙事 | 保留有效的既有 KL 结果；L2 新 hierarchy 先补验证再决定论文替换范围 | pilot 已完成，正式整合待做 |
| Entropic UOT / UFGW | 已验证的扩展继续明确为 KL；L2 可扩展性与已实现能力分开陈述 | L2 尚未实现、验证 |
| Contributions | 评估加入“层间稳定性指导 hierarchy 设计”，措辞与最终证据一致 | 最后处理 |

正文 scalar calibration 的共同定义为：

$$t^\star\in\arg\max_t D(f+t\mathbf1,g-t\mathbf1).$$

### Hierarchy 的具体约定

记 finest 两侧节点数为 $N_a,N_b$，总参考质量为 $A,B$，允许 $A\ne B$。

- **KL**：当前默认使用原参考质量切片，各层保持 $\rho_a,\rho_b$。讨论中的尺度等价性针对相同离散节点、代价与参数下两侧参考质量的整体缩放；其与跨层抽样稳定性是不同结论。必须核对经过势补全和校准后的等价条件，不能据此声称有限容差下迭代数或耗时完全相同。
- **L2 新方案**：各层恢复到各自 finest 的总质量 $A,B$，保留该层权重比例；按两侧各自节点数缩放参数。共享侧的质量和参数保持不变，finest 原问题保持不变。

$$\rho_{a,\ell}=\rho_{a,\mathrm{fine}}\frac{n_{a,\ell}}{N_a},\qquad \rho_{b,\ell}=\rho_{b,\mathrm{fine}}\frac{n_{b,\ell}}{N_b}.$$

这里“恢复总质量”不等于把两侧都改成总质量 1。生产默认仍为原质量切片；L2 新方案目前位于实验包装层。

## 从简单到难的执行计划

### 1. 建立 penalty 表述清单

- [ ] 检查 `main.tex`、`main_body.tex`、`main_appendix.tex` 及实际载入的理论文件。
- [ ] 将现有内容标为：KL 专用、KL/L2 共有、依赖进一步证明。
- [ ] 列出 problem definition、对偶、$G$、边缘响应、校准、hierarchy、停止条件和扩展的原文锚点。

交付：在本文件追加“原文锚点—修改方向—依据”清单。先识别依赖，不扩大现有定理的适用范围。

### 2. 先改局部公式的组织方式

位置：`main_body.tex` 的 `Restricted UOT with \subsolver` 及对应算法附录。

- [ ] 正文解释 $G$ 的含义与两类 penalty 的适用范围。
- [ ] 保留共同的受限形式、鞍点形式和 proximal 算子写法，将显式 KL 共轭移入附录。
- [ ] 附录整理 KL/L2 的惩罚、共轭、proximal、边缘响应及符号对应关系。
- [ ] 正文 calibration 使用共同的一维最优化定义，附录分别给计算方式。

验收：定义、符号和交叉引用一致；LaTeX 编译通过；这一步不提前改贡献或定理范围。

### 3. 写清 hierarchy 参数规则

位置：`Active-Support Initialization and Updates` 下的 `Active-support initialization` 开头，位于势继承、$c$-transform、potential translation 之前。

- [ ] 按“层构造 → 质量与参数规则 → 稳定性依据 → dual 传播 → 候选支撑”组织该段。
- [ ] 明确区分 KL 当前规则、L2 新规则和 finest 原问题。
- [ ] 同步层次构造附录、伪代码与实现选项说明。
- [ ] 在实现切换前，将新规则标为拟采用设计，不能把实验包装层写成生产默认。

验收：仅凭正文即可知道每层究竟求什么 UOT 问题；支持非单位、两侧不等的总参考质量。

### 4. 核验并提炼现有两个收敛定理

位置：`Convergence Analysis`、PDUOT 与 finite refinement 的证明及 L2 附录。

- [ ] 逐条对照 KL/L2 的假设、保证和实际算法调用，确认可共享的陈述。
- [ ] 保留 PDUOT 全局收敛、局部速率各自需要的 restart、adaptive weight、误差界条件。
- [ ] 核对 inexact restricted solves、gain、budgeted pruning、refinement safeguard 与有限终止的关系。
- [ ] 区分 KL 的正边缘条件与 L2 可出现零边缘、孤立节点的情形。
- [ ] 正文保留与当前两个定理相当的保证强度，附录提取共同证明及 penalty 专属引理。

验收：每项共同结论都有对应证明；不将结果泛化成任意凸 penalty，也不覆盖未经分析的非凸外层。

### 5. 完成层间稳定性的正式证明

- [ ] KL：分开证明参考质量缩放的精确关系、校准后关系，以及共享单边的跨离散层稳定性。
- [ ] L2：先完成均匀权重、共享单边、恢复总质量并缩放 $\rho$ 的命题。
- [ ] L2：推广到总质量不等；再核验非均匀权重的联合位置—权重经验分布论证。
- [ ] 明确控制对象是 dual objective、共享侧势还是 dual scores；交代势代表、范数和常数。
- [ ] 检查与 HELLO 的对应关系，不能直接沿用 balanced OT 的 gauge 或正则性结论。
- [ ] 清楚列出未证明的情形，例如两侧同时增长的统一速率、有限容差下的耗时优势。

验收：给出可独立审阅的假设、命题、完整证明与算法含义。层间稳定性解释 warm start 的依据，不等于普遍加速保证。

### 6. 落实 L2 设计并完成正式实验

- [ ] 审查 pilot 的参数传递，覆盖初始化、受限求解、safe screening、势恢复与每层停止条件。
- [ ] 在合适的实现入口纳入新规则，保留历史配置和结果的可追溯性；同步必要的术语条目。
- [ ] 确定正式配对实验：当前 raw 与新方案，覆盖不同 $\rho$、规模、权重及总质量。
- [ ] 既有 pilot 包含均匀等质量和非均匀不等质量；后续不额外补用户已取消的“非均匀但等总质量”对照。
- [ ] 增加种子或重复测量，统一计时、精度和验收条件，记录端到端及 finest 层工作量。
- [ ] 根据配置来源核对哪些现有 L2 图表需要重跑；KL 结果不因新增 L2 设计而自动重跑。

验收：参数审计、原问题精度和 GPU 监控通过；正式结论有重复测量支持。运行和修改实验脚本前遵守根目录 `PAPER_EXPERIMENTS_STANDARD.md`；GPU 实验使用用户指定的 gpu-experiments skill。

### 7. 明确扩展边界，再收束贡献与全文

- [ ] Entropic UOT：正文现有实现明确为 KL；若介绍 L2，说明需要替换 KL 幂次更新，且稀疏 entropic refinement 是支撑受限近似。
- [ ] UFGW：核验 tensorized squared-L2 惩罚的块分解；处理零质量块、外层重缩放和非凸收敛范围。
- [ ] L2 扩展是否实现、是否增补实验另行决定，不作为前面正文整理的前置任务。
- [ ] 根据已完成的理论和实验改写 contributions、摘要、引言、结论；再确定是否突出“理论指导 hierarchy 设计”。
- [ ] 全文检查 penalty 范围、图表、算法、附录和术语的一致性，编译并检查引用。

验收：贡献只陈述实际完成并有证据支撑的内容。

## 已有实验记录

L2 新 hierarchy 的代码和协议见 [pilot README](../../experiments/l2_consistent_hierarchy/README.md)。生产源码及默认值未因该 pilot 改动。

结果汇总：[comparison.csv](../../experiments/l2_consistent_hierarchy/results/20261121_l2_consistent_hierarchy_comparison_my4090/comparison.csv)，同目录有 `comparison.json`。这是 my4090 上 TOME、$n=m=65536$、seed 42、单次测量；表中 $\bar\rho$ 对应 finest 实际系数 $N\bar\rho$。

| 参考质量 | $\bar\rho$ | raw 耗时 / s | 新方案耗时 / s | 耗时变化 |
|---|---:|---:|---:|---:|
| 均匀，$A=B=1$ | 0.1 | 2.339 | 2.324 | -0.6% |
| 均匀，$A=B=1$ | 10 | 30.416 | 24.659 | -18.9% |
| 非均匀，$A=1,B=5$ | 0.1 | 11.031 | 5.080 | -53.9% |
| 非均匀，$A=1,B=5$ | 10 | 163.601 | 150.215 | -8.2% |

所有结果通过该 pilot 的 $10^{-6}$ native KKT 验收及参数、监控检查。非均匀 $\bar\rho=0.1$ 两方案的目标值相对差约 $1.78\times10^{-5}$，需保留记录；满足同一 KKT 阈值不代表目标值完全相同。非均匀 $\bar\rho=10$ 新方案 finest 层反而更慢，端到端收益来自较粗层。当前证据支持继续验证，不支持“所有情形更快”或统计显著性结论。

早期固定 $\rho$ 的简单归一化对照见 `paper_experiments_uot/l2_mass_normalization/`；应与“恢复各侧总质量 + $\rho$ 缩放”区分，不混为同一个方案。

## 修改记录

| 日期 | 动作 | 状态 / 下一步 |
|---|---|---|
| 2026-11-21 | 建立本进度文档，记录讨论决定、分阶段计划和已有 L2 pilot | 本次仅新增文档；下一步执行步骤 1，形成原文锚点清单 |

后续每次修改记录：改动位置、实际完成内容、检查结果、未解决问题和下一步。与 [APPENDIX_PROGRESS.md](APPENDIX_PROGRESS.md)、[EXPERIMENT_PROGRESS.md](EXPERIMENT_PROGRESS.md) 的既有记录保持一致，历史实验不覆盖改写。
