# 附录分布与精简规划

进度更新日期：2026-11-21。章节页码按 2026-11-21 编译的本地 `main.pdf` 和 `main.aux` 核对。附录采用 A–G 七个一级章节：A–F 为 KL 主线及其扩展，平方 L2 边际惩罚独立为末尾的 G。B.1 分为全局与局部收敛，B.2 分为有限终止与停止条件有限可达性。

## 逐节整理进度

每章一张表，列出当前源码中的全部 subsection（含载入的理论文件）。✓ 表示本轮已确认整理完成；空白表示本轮尚未确认，历史整理记录仍保留在下文。

### A. Algorithm Details

| 小节 | 完成 |
|---|:---:|
| A.1 Restricted Formulation | |
| A.2 PDUOT Component Details | |
| A.3 Stopping Criterion | |
| A.4 Active-Support Operations | |

### B. Convergence Guarantees

| 小节 | 完成 |
|---|:---:|
| B.1 PDUOT Convergence | |
| B.2 Finite Refinement | |

### C. Extensions

| 小节 | 完成 |
|---|:---:|
| C.1 Sparse Entropic Refinement | |
| C.2 Two-Coupling UFGW Updates | |

### D. Experimental Setup

| 小节 | 完成 |
|---|:---:|
| D.1 Benchmark Data | ✓ |
| D.2 Metrics and Measurements | ✓ |
| D.3 Solver Implementations | ✓ |
| D.4 Experiment Protocols | ✓ |

### E. Additional Performance and Applications

| 小节 | 完成 |
|---|:---:|
| E.1 Supplementary UOT Baselines | ✓ |
| E.2 Generality of KL-UOT | ✓ |
| E.3 Direct Comparison with HELLO-UOT | ✓ |
| E.4 Million-Scale Baselines across Penalty Settings | ✓ |
| E.5 Accuracy across Entropic Strengths | ✓ |
| E.6 UFGW Solver Trajectories | ✓ |
| E.7 Temporal Transport Timing | ✓ |

### F. Component and Mechanism Analysis

| 小节 | 完成 |
|---|:---:|
| F.1 Hyperparameter Sensitivity | |
| F.2 Runtime Breakdown | |
| F.3 Convergence Safeguards | |
| F.4 Support Sparsification | |
| F.5 Inter-Level Response Stability | |

### G. $\ell_2^2$ Marginal Penalties

| 小节 | 完成 |
|---|:---:|
| G.1 Model and Solver Adaptation | |
| G.2 Convergence Guarantees | |
| G.3 Experiments | |

## 当前分布

2026-11-21 核对稿共 36 页，附录从第 11 页开始，共 26 页。F 整理前为 40 页，D 整理前为 41 页，B.1 整理前为 42 页，更早的停止准则精简前为 44 页。图表浮动会影响总页数，后续仍需做内容取舍。E、F 之间不再使用 `\clearpage`，E.5、E.6 的两张图落在 F 章首页顶部。

下表为当前编译稿的章节起始页，不代表各组独占页数。

| 章节 | 起始页 | 内容与内部顺序 |
|---|---|---|
| A. Algorithm Details | 11 | A.1 受限模型；A.2 PDUOT Component Details（Preconditioning、Adaptive restart、Adaptive weight、Dual proximal step 四段；末段为 KL prox 的 FP32 预测 + FP64 精修与稳定回代）；A.3 完整 Stop；A.4 Active-Support Operations（初始化、pricing、Spar/pruning） |
| B. Convergence Guarantees | 15 | B.1.1 PDUOT 全局收敛；B.1.2 局部线性收敛；B.2.1 非精确 refinement 有限终止；B.2.2 停止条件有限可达与 Spar 相容性 |
| C. Extensions | 21 | C.1 sparse entropic UOT；C.2 UFGW |
| D. Experimental Setup | 23 | D.1 数据；D.2 共同指标与测量；D.3 Solver Implementations（含 Sinkhorn 与 Sinkhorn-Online）；D.4 Experiment Protocols（24 页起，跨 24–26 页；D.4.1–D.4.6 分别对应正文 Pareto、Million-Point Baseline Comparison、Restricted、Component、Extensions、Downstream） |
| E. Additional Performance and Applications | 26 | E.1 额外 baseline；E.2 KL-UOT generality；E.3 HELLO-UOT；E.4 百万规模全 penalty 对比（待 `exp-9aa596626e` 补测 HELLO-UOT 后三组）；E.5 epsilon 扫描；E.6 UFGW 轨迹；E.7 temporal timing |
| F. Component and Mechanism Analysis | 30 | F.1 Salut 参数；F.2 耗时分解；F.3 Adaptive-Weight Budget；F.4 Spar；F.5 层间响应稳定性 |
| G. Squared-L2 Marginal Penalties | 33 | G.1 模型、proximal、readout 与停止规则；G.2 PDUOT 收敛与有限 refinement；G.3 实验（当前为 pilot 状态说明，正式曲线待补） |

F.5 从第 31 页开始，只保留正文引用的 shared-side response stability 命题、证明及 weighted potential stability 推论。辅助 inheritance bound、预测器、证书与相应实验已成套归档，不再形成第二条方法叙事。

正文的系统消融表保留原位，附录不重复复制。PDUOT runtime CDF 的正式结果尚未替换正文旧 Pareto，本轮不新增对应附录实验。

## 文件与查找方式

- `main_appendix.tex`：七组内容的主体及组织入口，平方 L2 仍写在本文件中，不额外拆出小文件。
- `theory/pduot_convergence.tex`：B.1 的长理论。
- `theory/refinement_convergence.tex`：B.2 的长理论。
- `theory/inter_level_response_stability.tex`：F.6 的理论。
- 使用中的 labels 保留或同步更新，正文和附录通过交叉引用自动取得新编号。

A.3 按“残差 → 完整停止规则 → gap 选择说明”排列。A.3.2 保留上下文、首次调用约定、下降下界、接受条件和最优 anchor 读出；A.3.3 以一条恒等式和简短说明区分 split gap 与原目标 gap。有限可达性及 Spar 相容性证明位于 B.2.2，实验实现信息集中在 D.3。


## 待讨论的精简

已完成：删除 A.1 中 Lambert W、log-domain 变量替换和标量求根的实现说明；正文删除对应的稳定求值句子与附录引用，保留 proximal 更新公式。A.1 改名为 Restricted Formulation。

已完成 A.4 第一轮整理：改名 Active-Support Operations，按 Initialization、Full-Space Pricing、Sparsification and Budgeted Pruning 排列；删除势平移的导数推导、求值和扫描复用优化，压缩 structural edges 论证及重复 Spar 描述。两段伪代码、支持预算与存储上界保留；输出 translation 和层间质量约定移至 D。Spar 的边际统一为 $(\mathbf r,\mathbf q)$、运输代价为 $t$，最大支持大小直接写为集合基数上界。

Init 与 Pricing 伪代码已改为赋值和算子表达。Init 复用正文的双向 Top 记号；Pricing 仅展示分块计算 score、更新行/列候选缓冲区、筛选正 score 和返回候选边。范数选择 $p$、累加规则与 $\eta$ 定义集中在 A.3，A.4 只说明实现共享扫描。

已与正文接口对齐：hierarchy 作为输入，不再引入 BuildHier 算子；Init 使用初始化分数 $\boldsymbol\sigma^0$。Pricing 仅返回候选边 $\mathcal V$；同一扫描计算的 $\eta$ 供 KKT 检查复用，不作为额外返回值。Entropic support reconstruction 统一使用正文的双向 Top 记号。

Structural edges 的 marginal-mismatch 论证已从 Initialization 移至 A.4.3 的 pruning 规则之后，标题改为 Preservation of structural edges，保留原引用标签。初始化只定义 NW 构造的 $\mathcal B$；后文统一解释为何在更新中持续保护它。

### 1. B.1 收敛结构与 Hall-deficit 下界（已整理）

Hall 下界已完整移至 `theory/notes/support_induced_iteration_lower_bound.md`，不再编入论文。它针对固定 map/步长，不属于自适应 PDUOT 收敛的必要证明链。

B.1 仅保留两个小节，各给正式定理及证明，与正文 informal theorem 的两个结论对应。全局部分明确节点覆盖、正参考质量、步长、权重预算与 mapped-point restart 条件，证明迭代点、映射点和投影乘子收敛；局部部分将 KKT 误差界纳入证明，通过每轮收缩和有界轮长得到按 PDHG 调用次数计的 R-linear rate。正文只补充正式定理的位置，B.2 与平方 L2 扩展改为引用附录正式结果。

B.2 已由四块合并为两块：B.2.1 给出非精确 refinement 的正式有限容差终止定理，uniform coordinate gain 作为证明引理，精确 oracle 的有限终止压为一段；B.2.2 以正式命题连接 PDUOT 全局收敛、完整 Stop 的有限可达性与 Spar 的证书保留。证明明确区分正 gain、suboptimal anchor 和 optimal-anchor 初始读出，并说明 Spar 在原活跃图上刷新证书，pruning 后的支持由下一次受限求解重新检查。原四块全文保存在 `theory/notes/finite_refinement_original.md`。此轮总页数仍为 37 页。

### 2. 组件分析与层间响应理论（已完成第一轮）

F.1–F.5 保留现有实验和数值，压缩参数、快照采集与消融定义的重复说明；F.4 标题对齐 adaptive weight。未编译的历史耗时表移出主源码。现有 profiling preview 和待重跑标记保留。

F.6 只保留共享侧响应稳定性及其势传播推论，删除不再需要的 mass–shape 引理。可计算 inheritance bound、component predictor、误差展开、证书区间、采样反例和 synthetic diagnostics 图表整体移入 `notes/component_mechanism_analysis_record.md`；原理论与 F 源码均完整保留，数据及绘图文件未删除。正文相关引用改为指向保留的稳定性分析，实验清单 A06 标记为研究归档。

### 3. Stop 的 gap 解释与规则（已精简）

已删除局部二阶展开、重复 split formulation、单边算例和 balanced-limit 的展开公式；保留 gap 的关键关系、证书边界及共同实验评价口径。完整停止规则删除重复符号定义和求值优化细节，有限可达性、最优 anchor 情况和 Spar 相容性均保留。

### 4. 实现与协议（D.3、D.4 已整理）

D 保留数据、共同测量、求解器实现、任务协议四块。共同计时、内存与 reference 构造集中在 D.2。D.3 于 2026-11-18 完成逐项整理，按上方进度清单的四组实现组织；保留必要的 pilot 加速或精度验证，省略工程过程、默认停止规则与重复算法描述。具体初始化及计时安排仍归任务协议。

UFGW 的共同初始化与十轮 sweep 由表格 caption 与正文交代，D.4.4 的 UFGW 段只保留跨方法的 cost、penalty 与质量重缩放口径、原生内层停止说明及独立目标评价。快照协议只描述所展示数据的实际选择规则；图形解读留在 caption。Temporal 的精度结果移至 E.6，HELLO-UOT 的共同 reference 说明改为引用 D.2，保留历史 JAX 输入上传计时例外。原 D 完整内容保存在 `notes/experimental_setup_implementation_record.md`，供查阅移出的工程细节、测速与历史来源。实验数据和待重跑标记保留。

D.4 于 2026-11-19 完成第二轮整理，定位收缩为“只记录随实验变化的输入选择、目标与参照、扫描或停止预算、以及相对 D.2/D.3 的口径差异”，并在节首用一句话声明该分工。具体改动：`\entropicgap` 公式与 $D_{\varepsilon,\mathrm{ref}}$ 构造移入 D.2 的 Primal accuracy，`\transitionacc` 定义移入 D.2 新增的 Application accuracy，E.4 原有 `\eqref` 自动继续指向新位置；原 D.4.4 的 entropic 段与原 D.4.5 的 UFGW 段合并为 D.4.4（当时名为 Extension Experiments，后随标题对齐改为 Extensions），标题下用 \paragraph{Sparse entropic UOT.} 与 \paragraph{UFGW solver comparison.} 两段承载原 D.4.4、D.4.5 的全部内容，`app:entropic-evaluation` 标签删除，新增 `\label{app:extension-protocols}`；entropic 段删除与正文重复的“同一 entropic 问题”说明，UFGW 段删除与表格 caption 重复的产品初始化、十轮 sweep、$\alpha$ 与 $\rho$、A100 硬件声明及 \ufgwobj 重复定义。原 D.4.6 Temporal Transport 与 D.4.7 Spatial Alignment 合并为 D.4.5 Downstream Applications 下的两个 paragraph，新增 `\label{app:downstream-protocol}`，Spatial alignment 的残缺句 “following the  procedure” 一度改成 BCD 按 20 组配置逐对选择的说明，后按作者意见改为 “Both methods use parameters selected by a grid search over $\alpha$ and the marginal penalties, following the benchmarking practice of \citet{klein2025mapping}.”，并补上“BCD 双耦合 vs moscot 低秩单耦合”的模型差异与 seed 0 的单次运行口径；20 组配置与 selection.json 只留在注释中。D.4.2、D.4.3 删除与 D.2 重复的计时边界与 caption 已交代的容差、维度、\refineiters 释义和 per-seed 数据保留声明，保留消融变体定义。新增 `\label{app:task-protocols}` 挂在 D.4 上，正文暂不引用；D.4.4、D.4.5 的 label 已接入正文：entropic 段与 UFGW 段引用 `app:extension-protocols`，temporal 段与 MOSTA 段引用 `app:downstream-protocol`，并删除 UFGW 段重复的 `Table~\ref{tab:ufgw-solvers} compares ...` 一句。至此 D.4 的七个实验协议在正文均有指针。第二轮后续：D.4 各小节标题改为与正文 4.1–4.5 同名（UOT Solver Comparison、Restricted UOT Solvers、Component Analysis、Extensions、Downstream Applications）；D.4.1 删除已失效的 ULOT 秩扫描说明，补上两条扫描网格与 itemize 形式的选取规则；F.3 PDUOT Component Ablations 的协议整体移入 D.4.3，原节删除，`app:pduot-component-ablation` 标签随之迁移，正文 4.3 的引用自动打印为 D.4.3，F 章因此由六个小节变为五个（F.3–F.5 前移）。快照语料的生成方式改由 D.4.2 首段交代（所有受限于问题都收集；按惩罚对从 seed 42 收集，直到某次完成的父运行使语料达到至少 100 个问题），D.4.3 只保留一句回指 D.4.2，避免两处重复。各惩罚对的快照数 108/106/119/100 与父运行数 8/7/5/8 已从正文删除，只在被注释的覆盖表与数据记录中保留。D.4.3 的变体定义改为 itemize：PDUOT 四个 leave-one-out 变体列四项，ours 组件的 A–E 五个面板各列一项并就地标注 $n$，共享设置与后端差异仍用句子交代。编译通过，总页数仍为 37 页；D.4 跨 24–26 页，E 从 26 页起。页表已按本次编译的 `main.aux` 更新。

### 5. 实验图表

- 层间诊断图与分组统计表已随对应预测理论移入研究记录。
- Generality 占位图及 provisional pilot 等正式结果后再定最终尺寸和布局。
- 其余现有图表与数值保留，不通过缩小字体或随意缩图来减少页数。

### 6. 全文冗余句清理（2026-11-19）

子 agent 全文扫描加人工逐条复核后，删除五句：A.3 的三小节编排说明（“The following subsections define ...”）；C.1 中从未被任何实验使用的 direct-reuse 变体说明；E.5 中与图 caption 逐字重复的面板描述、以及只复述表 4 两个终点的观察句；F.4 中对“trigger 频率”这一未报告量的免责声明。正文 4.3 结尾的 “Potential translation and structural edges further reduce runtime.” 改为带数字的结论：去掉层间平移、输出平移与结构边分别使平均耗时升至 $1.16\times$、$1.61\times$、$2.9\times$（由表 3 的 28.34/24.43、39.41/24.43、16.17/5.61 换算）。E.5 首句压成 “The trajectories use the same runs as Table~\ref{tab:ufgw-solvers}.”，十轮 sweep 信息留给 D.4.4 与 caption。正文 `objective--time trajectories` 首字母错误与 D.2 的 Reporting 段由作者直接修正/删除。D.4.5 删除“所有方法使用相同特征/结构代价与惩罚系数”这类对齐声明（同一优化问题下属隐含前提），以及“每次耦合更新后做质量重缩放”——后者已在 C.2 的块迭代里定义。开头改为 “On STARmap inputs with physical spatial coordinates, all methods complete ten full sweeps with native inner stopping tolerance $10^{-6}$.”，并删除三处冗余：与 ten full sweeps 重复的 outer early stopping、对未被声称的内层等精度问题的免责句、以及 D.2 已覆盖的计时边界与 warmup 细节。参数经 `paper_experiments_uot/ufgw_solver_comparison/results/20261110_ufgw_starmap_n16384/config.json` 核对：sweeps=10、outer_stopping=disabled、shuttle 与 pot 的 inner_tolerance 均为 1e-6。D.4.1 的扫描网格改为逐方法并列句（ours 与 MM 扫停止容差，HELLO-UOT 扫内层容差，Sinkhorn 扫熵强度），与 D.4.4 的写法一致，也纠正了原句把 HELLO-UOT 的扫描项笼统称为 native stopping tolerance。

保留的存疑项：D.4 开头的分工声明（指向 D.2/D.3）、`theory/pduot_convergence.tex` 中实现所用两个触发器与定理允许额外触发器的对应句，以及正文 215、314、395、711--712 和附录 60、382、865、theory 47/68/103 等承担范围声明或导航功能的句子。编译通过，总页数仍为 37 页。

### 7. ULOT 命名统一（2026-11-20）

正文与图例原先用 “low-rank UOT”，附录 D.3.2 用 `\ulot`，D.4.5 又用了新加的 `\lowrank`，同一个基线有三种叫法。核对后确认：原 D.3.2 的 ULOT 条目描述的是已移除的 Pareto 比较所用的 FP64、精确低秩平方欧氏代价配置；时间传输实际使用的是 moscot 的 `SinkhornSolver(rank=...)`，经 OTT 后端以 FP32 运行。处理：删除 `\lowrank` 宏，统一用 `\ulot`；D.3.2 条目改为 “We use the low-rank solver of \citet{scetbon2023unbalanced} through the OTT backend of moscot in FP32.”；正文 temporal 段、D.4.5 与两处图 caption 的 low-rank 表述改为 `\ulot` / “\ulot ranks”；`paper_experiments_uot/moscot_time/collect.py` 的图例前缀由 “Low-rank:” 改为 “ULOT:”，并按固定输入 `figures/plot_sources/experiment_figures_20261114.json` 重画 `moscot_time_runtime_accuracy.pdf` 与 `moscot_time_runtime.pdf`，正文第 8 页与 E.6 的图例现在都显示 ULOT。旧 FP64 配置的说明保留在注释中，若恢复该 Pareto 比较可再加回条目。时间传输协议段按作者意见改写为：先说本节遵循 \citet{klein2025mapping} 的低秩比较，再给秩与设置；删除复述方法本身的“reconstructs support within the final active-support budget”一句，以及“full-rank Sinkhorn is a computational reference …, not biological ground truth”的免责句（正文已称其为 reference，没有结论依赖该声明）。经 Nature 版 Methods 核对，该比较的秩为 10/100/1000/2000、全秩 $\varepsilon=0.005$、低秩 $\varepsilon=10^{-4}$、$\gamma=500$、固定 1000 次迭代、逐时间对 $\tau_a$ 按凋亡率区间调，与现有配置一致；Methods 里另出现的 {50,200,500,2000} 属于对比 WOT 的内存与耗时扩展实验，不是这一比较，故未采用。

### 8. 附录浮动体与页数（2026-11-20）

按“单栏浮动体用 `[tb]`、通栏用 `[tp]`”调整了附录 11 处浮动体，并把 E、F 之间的 `\clearpage` 删除。结果是 37 页降到 36 页，原先第 29、30、36 页底部各 8%–12% 的空白消失，只剩末页因仅放 Figure 19 留 34% 空白；`Underfull \vbox` 由 6 处降到 5 处。

需要记录的两点经验：其一，`[tb]` 本身没有产生任何版面变化。附录是 `\onecolumn`，且这些图的高度超过 `\bottomfraction`（0.3）允许的底部浮动上限，`b` 位置根本不可用，所以前后 PDF 的页面构成相同。其二，真正造成“整页只有图”的是 E、F 之间的 `\clearpage`：它把 E.5、E.6 的两张图冲成一页纯图页，并让前一页留白。删除后这两张图落在 F 章首页顶部、F.1 续文之前，图的 caption 自足，读者不会误认归属；若要维持 E/F 严格分离，恢复那行 `\clearpage` 即可回到 37 页的旧版式。

曾试过在 `\onecolumn` 后放宽 `\textfraction` 与 `\floatpagefraction`，对页数与空白均无影响，已撤销，未留在源码中。E.2 原先只有图与 caption、没有正文，现补一句结论：“Across all 28 panels, \ours retains the runtime--accuracy advantage for every cost type, dimension, feature set, and reference mass.”

## 下一步

平方 L2 已从原 C.1 移至 G，保留 `app:l2-penalty` 标签，正文引用自动指向新章节。G.1 集中算法调整，G.2 保留两个理论结果及证明，G.3 仅说明已有单 seed L2-MM pilot 和正式结果待补，不把开发测量作为正式曲线。E.2 改名 Generality of KL-UOT，七行图仅涉及 KL 目标下的 cost、数据、维度与 reference masses，避免与 G 重复。

后续可检查 C、E 的重复说明，并在正式实验替换后确定图表尺寸与最终统计口径。核心 PDUOT 收敛、完整 Stop、inexact refinement 有限终止及实验可复现协议优先保留。
