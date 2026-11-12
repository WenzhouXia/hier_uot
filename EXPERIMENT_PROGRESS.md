# hier_uot 论文实验进展

更新时间：2026-11-12。范围：当前正文、附录引用的实验，以及已明确提出的补实验。本文件记录实测结果、数据来源和待办，不代表已启动重跑。

项目根目录：`/home/xiawenzhou/project/hierarchical_ot`。论文位置用 LaTeX label 标识，避免图表编号变化后失效。

## 当前协议与状态含义

- 生产默认：`refinement_forcing_check=True`；该开关同时启用充分进展检查，即使 `refinement_progress_check=False`。
- primal-weight 预算：`primal_weight_budget=64`，固定 $p=1.01$；`None` 表示关闭预算。计数按每次 restricted solve 内的权重更新次数，不是 PDHG 迭代次数。
- 默认 restricted backend 为 `original_plus`，固定基础步长、degree-based preconditioning。成本精度遵循各实验已声明的协议，不统一改写历史成本精度。
- 旧批次没有显式设置新选项时，不能按当前默认值重新解释旧结果。保留其配置、源码指纹和原始指标。
- “预算不触发”只证明迭代轨迹不受裁剪影响，不证明新增保护的耗时严格为零；refinement safeguard 与权重预算分别审计。

状态：**可保留**＝本次算法变更不要求重跑该项；**待重跑**＝已有明确重跑要求；**待核对**＝来源、图表版本或记录不足；**待补实验**＝正式证据尚未完成；**已移除**＝当前编译稿不展示。

## 2026-11-12 正文实验缩页

- 正文八个实验 caption 已按 `papers/EXPERIMENT_WRITING_GUIDE.md` 与 paper-writing 规范整理：通用单位和表格标记集中到 Setup，扫描范围、seed 编号、快照规则与完整计时边界移入 `appendix_extension_protocols.tex`（标题现为 Additional Experiment Protocols）。保留 panel/特殊参数、统计次数与计时例外；主 Pareto 明示当前五 seed 覆盖未完成，entropic 叉号仍按当前 PNG 解释为 direct reuse。此轮未重绘图或改实验结果。
- 理论正文现集中保留 PDUOT 收敛命题与带 safeguard 的 inexact refinement 终止定理。restricted-to-full recovery、exact refinement 及 coordinate gain/fidelity/显式输出条件移入 `theory/refinement_convergence.tex`；完整 shared-side response stability 命题合并到 `theory/inter_level_response_stability.tex` 的原 interaction-bound 命题。原条件和证明保留，正文通过精确定义的局部 safeguard 引用条件，仍假设受限调用有限时间返回。相关实验位置、结果和重跑要求不变。
- E01 固定规模 UOT 主表及其说明已移到 `appendix_uot_comparison.tex`（`app:uot-fixed-size`）；原始来源待找回和协议重跑要求保留，不因移入附录而视为已核验。
- 正文不再包含 `experiments_hello_uot.tex` 的两规模对称 penalty 子表；该文件保留为历史来源。正文 Pareto 已含 HELLO-UOT，独立原生停止比较统一引用附录 `app:hello-uot-comparison`，其现有全表和轨迹已覆盖 $n=32768,65536,131072$。这些原生停止结果不是三种规模的容差扫描 Pareto；未新增或重标实验结果。
- PDUOT 内部组件 CDF、权重预算干预、safeguard on/off、epsilon 扫描和 UFGW 轨迹继续留在附录。正文 Method 在 PDUOT 收敛命题和 inexact refinement 定理后分别引用预算干预与 safeguard overhead；实验章节不再重复引出 safeguard。
- 两项扩展的算法比较及 temporal/spatial 下游图表均保留正文，包括 MOSTA 逐时间对表。entropic gap/reference/完整计时协议及应用参数细节移至 `appendix_extension_protocols.tex`；删减重复数值说明，历史 provenance 与既有重跑待办不变。

## 正式结果的五 seed 补充计划

2026-11-11 核对并标记。作者要求文中正式实验默认使用五个 seed；E21 附录维度扩展是作者明确指定的单 seed 例外。本节登记已核实的覆盖情况、补跑建议及配置/续跑实现状态，不表示已启动补跑；正在运行的批次不会因修改 YAML 而自动扩展。上文及下表的“可保留”只针对算法变更，**不代表已经满足五 seed 协议或新的 GPU 监控协议**。

- 独立采样/初始化 seed 与同一输入的计时 repeat 分开计数。通常采用五个 seed、每个 seed 一次；已有有效 seed 可保留，不为统一编号而丢弃历史结果。
- 各方法、各消融变体在同一 seed 上配对，使用相同输入和问题参数；每个新输入独立构造并审计 reference，不能跨 seed 复用下界。相同输入且已审计的 reference 可以继续复用。
- 已有方法不因控制器变更而重跑，不等于不用补 seed。新增 seed 必须补齐所有参评方法；旧 seed 只有在配置、实现身份和测量协议仍有效时才复用。历史计时没有监控记录，不能追溯标为未受 GPU 共享影响。
- CDF 以父问题 seed 作为独立采样单位；同一父问题的不同层/轮快照相关，不能将其当作独立 seed，也不应将同一快照重复五次冒充五个实例。
- 目标调度顺序为 seed → 规模 → penalty/其他问题参数 → reference/各方法扫描；按 FIFO 派发，不设跨 seed 等待屏障。Pareto 已实现 `run.py --resume-batch BATCH` 的扩展式续跑，配置已设为 42–46；当前旧批次只有在用户停止并执行续跑后才扩展。其他实验的扩展式续跑仍需分别接入；`rerun.py` 仍只补监控失效任务。
- Pareto 默认在同一配置的某个较早 seed 发生干净计时的超时/OOM 后，跳过尚未启动的后续 seed，保留 `skipped_after_time_limit` / `skipped_after_oom` 状态、触发来源和计划分母；不把未测项记为实测失败，不完整组不进入五 seed 均值曲线。共享污染、监控失效和普通程序错误不触发该规则。
- 正式汇总报告计划/成功数及实际有效 seed 数。不同 seed 的目标函数可能对应不同输入，UFGW 轨迹不直接混合原始 objective；先保存逐 seed 轨迹，再确定图的汇总方式。

| ID | 核实的 seed / repeat 状态 | 五 seed 标记 | 需补内容 |
|---|---|---|---|
| E01 主比较表 | 原始批次尚未找回，无法核实 | **待核对；正式重跑按五 seed** | 各方法在同一规模、penalty、五个输入上配对；不能把缺来源的旧表当一个有效 seed |
| E02 完整 UOT Pareto | 当前 `20261111_202336` 快照只有 seed 42，HELLO-UOT 已是五档阈值 | **需补四个 seed** | 保留当前有效测量，扩至 42–46；四组 penalty、五方法全部配对，不能只给 hier_uot 补 seed |
| E03 百万点 scaling | 20 个实例来自 seed 42 | **需补四个 seed＋重跑要求仍在** | 每个规模、penalty 扩至五 seed；先统一数据版本，再按最终控制器/监控协议测量 |
| E04 HELLO-UOT 直接比较 | 12 个实例均为 seed 42 | **需补四个 seed** | 新 seed 同时跑 HELLO-UOT 和 hier_uot；旧 seed 的 hier_uot 仍需 safeguard 重跑，HELLO 旧结果能否正式复用另核计时监控协议 |
| E05 受限 solver runtime CDF（替换正文 Pareto） | 旧 Pareto 的四组固定快照均来自父 seed 42；E07 另有多 seed 语料 | **拟复用 E07 至少五个父 seed 的语料；新求解待补** | 四组 penalty 各一个子图，共同 shared gap 目标固定为 $10^{-6}$；先冻结共同问题清单及独立受限 reference，不把旧四个快照当作足够的 CDF 语料 |
| E06 系统组件 A–E | 当前为单次 pilot/集成结果；各 panel 的完整 seed 集尚未逐项复核 | **正式重跑统一五 seed** | 每个 panel 的完整算法与变体按 seed 配对；C 的 warm-start 实现待办不因扩 seed 而消失 |
| E07 PDUOT 内部 CDF | 每组 penalty 的父 seed 数依次为 8、7、5、8；共 28 个父问题、433 个快照 | **已覆盖至少五个父 seed** | 不机械乘五；保留实际 seed/父问题列表及父内相关性说明。旧计时是否需监控重测与 seed 数分开判断 |
| E08 safeguard on/off | seed 42 的四组开关配对 | **需补四个 seed** | 每个 seed 重新做完整 on/off 配对；继续记录耗时比、额外迭代、拒绝次数和最终精度 |
| E09 权重预算干预 CDF | 正式 CDF 尚未完成；E07 语料已覆盖至少五个父 seed | **语料覆盖足够；正式求解待补** | 使用同一语料运行最终 $p=1.01$ 的各预算配置；无需再把语料或每个快照复制五遍 |
| E10 层间响应诊断 | `forward_results.json` 覆盖 seed 101、211、307 | **按统一正式协议再补两个 seed** | 保留三组有效数据，为相同 geometry/penalty/规模网格补独立父问题；1080 个转换不能代替五个独立 seed |
| E11 独立层间证书 | `full_certificate_results.json` 覆盖 seed 601、709 | **按统一正式协议再补三个 seed** | 保持“先冻结预测，再求细层 reference”的验证顺序；120 个区间不是 120 个独立 seed |
| E12 参数敏感性 | $n=262144$，seed 42，36 次历史运行 | **需补四个 seed＋最终协议重跑** | 所有参数候选使用相同五 seed，baseline 在每个 seed/penalty 内配对共享；粗层阈值 pilot 若只用于选择方案，另记为 pilot |
| E13 support sparsification | 五次 repeat 0–4，复用同一组点云/支持；基础 seed 随维度固定生成 | **五 repeat 不等于五 seed；需补独立输入** | 每个规模/维度/成本设置采用五个独立点云 seed，记录实际 seed。现有结果可保留为单输入重复计时，不能重标为五 seed |
| E14 entropic Pareto | 四组 penalty、两种 epsilon 均只有 seed 42 | **需补四个 seed** | 新 seed 补齐各方法及各 epsilon 的独立 entropic reference；保留 hier_uot 协议重跑待办 |
| E15 epsilon 扫描 | 七个 epsilon、四组 penalty，均为 seed 42 | **需补四个 seed** | 每个 seed 扫完整七点并构造对应 reference；28 个 epsilon/penalty 组合不是 28 个 seed |
| E16 UFGW solver/轨迹 | 两种 epsilon 均为 seed 0 | **需补四个 seed** | 保留 seed 0，追加四个独立 STARmap 采样；两方法配对、每次固定 10 sweeps，不按 seed 重新调参 |
| E17 temporal transport | 19 个时间对、114 个方法配置，seed 42 | **需补四个求解/初始化 seed** | 每个时间对固定数据和已选 penalty，所有参评方法配对扩 seed；时间对数量不替代 seed，固定数据下不能称新增独立采样输入 |
| E18 MOSTA alignment | 七个时间对、14 个方法配置，seed 0 | **需补四个求解/初始化 seed** | 固定已选参数后配对测量，不随新 seed 重新搜索最佳参数；文献公布的单值只能作外部参考，不能伪造为五 seed 测量 |
| E19 runtime breakdown | 当前未展示 | **恢复为正式结果时五 seed** | 与所属主实验配对，先统一互不重叠的计时分解 |
| E20 额外 entropic baselines | 当前未展示/未完成 | **正式启用时五 seed** | 对相同输入、目标和精度统一比较，不提前记为完成 |
| E21 附录维度扩展 Pareto | 新增计划，尚无指定正式结果 | **作者明确指定单 seed 例外** | 四个维度 × 四组 penalty，16 个 Pareto 面板；只比较 hier_uot 与 Sinkhorn，具体维度待确定 |

审计依据：E02–E05、E08、E12、E14–E18 的 `config.json`/`config.yaml` 和 `manifest.json`；E07 的 `manifest.parents`（不能只读仍写 seed 42 的采集起点配置）；E10/E11 的逐项 JSON；E13 的 `records.jsonl` 及 `run_scaling.py`、`benchmark.py` 中输入生成和 repeat 循环。具体路径见下文各项来源。

建议优先补齐正文 E01–E04、E06 及正式敏感性 E12，然后补 E05、E08、E14–E18；E07 不因五 seed 要求增加重复求解，E09 直接复用其多 seed 语料。E10/E11/E13 虽不是端到端求解器比较，但仍是论文正式实验，按作者统一要求登记补 seed，不能仅因“理论诊断/算子测试”而默认为豁免。

## 总览

| ID | 实验 / 论文锚点 | 现有结果 | 是否需要重跑或补做 | 主要原因 / 下一步 |
|---|---|---|---|---|
| E01 | UOT 时间、显存、精度主表 `tab:uot-comparison` | 论文保留 12 个历史数值 | **待重跑＋待核对** | 原批次未找到；旧协议未启用 safeguard；确认共同下界及计时来源 |
| E02 | 完整 UOT runtime–accuracy `fig:uot-runtime-accuracy` | 当前新批次 `20261111_202336` 为 $n=32768$、seed 42、五方法；旧图尚未替换 | **正在重跑；需补至五 seed** | 新批次显式启用 safeguard 和 GPU 监控；需补四个 seed，并保留全部成功/失败分母 |
| E03 | 百万点 scaling 与精度表 `fig:uot-large-scale`、`tab:uot-scaling-accuracy` | 找到图像实际匹配的新归档：20/20 求解与 gap 有效 | **待重跑＋需先统一数据版本** | 当前图、正文统计和精度表混用了不同批次；新归档仍关闭 safeguard |
| E04 | HELLO-UOT 对比 `tab:hello-uot-direct`、`tab:hello-uot-complete`、`fig:hello-uot-trajectories` | 12 个实例，24 次原生求解；12 个独立 reference 通过审计 | **重跑 hier_uot 部分** | hier_uot 旧批次关闭 safeguard；HELLO-UOT 无需仅因该开关重跑 |
| E05 | 受限求解器 runtime CDF，替换现有 `fig:restricted-runtime-accuracy`（最终 label 待定） | 历史 Pareto 80/80 点成功，保留归档；CDF 尚未运行 | **待补 CDF 并替换正文图** | 四个 penalty 子图，统一 shared gap $10^{-6}$，比较各方法达到共同精度的时间；不增加第二套精度面板 |
| E06 | 系统组件消融 A–E `tab:component-settings-mock` | A/B/D/E 实测 pilot；C 为后端集成 pilot | **待重跑；C 先补实现** | A/B/D 对齐 safeguard；E 正式重跑；C 先补 PDCS warm-start mapping |
| E07 | PDUOT 内部组件 CDF `fig:pduot-component-ablation-cdf` | 433 个快照 × 6 变体，2598/2598 成功 | **可保留当前迭代 CDF** | 所有运行均有重启记录，最多 25 次，$J=64$ 不触发 |
| E08 | safeguard on/off `tab:refinement-safeguard` | 4 对、8 次完整求解；零拒绝、零额外迭代 | **本次变更不要求重跑** | 130 次受限调用均有步数；可推出单次重启最多 55 次，$J=64$ 不触发 |
| E09 | primal-weight 预算干预 `tab:pduot-weight-budget` | $J=1,4,100$ 各 8 对；现有 pilot 使用 $p=1.1$ | **待重跑为 CDF** | 固定最终 $p=1.01$，包含默认 $J=64$、小 $J$ 和关闭预算的自适应基线 |
| E10 | 层间响应诊断 `fig:hierarchy-stability-validation`、`tab:stability-diagnostics` | 1080 个转换，全量重算统计 | **可保留** | 独立理论诊断，不是生产层次求解器的性能实验 |
| E11 | 独立层间证书验证 | 120/120 区间覆盖参考误差 | **可保留** | 预测先冻结再计算细层 reference，与本次控制器变更无关 |
| E12 | 超参数敏感性 `tab:uot-parameter-sensitivity` | 36/36 历史运行成功 | **待重跑** | 旧批次关闭两个 refinement 检查，已有明确重跑注释 |
| E13 | support sparsification `fig:uot-sparsification-scaling` | 360 条独立压缩测试记录 | **可保留** | 直接测试压缩操作，不受 PDUOT 控制器开关影响 |
| E14 | sparse entropic UOT Pareto `fig:entropic-runtime-accuracy` | 有历史测量和图像 | **重跑 hier_uot 相关配置** | 缺完整内层重启/权重记录，无法确认新预算不触发 |
| E15 | entropic epsilon 扫描 `fig:entropic-epsilon-accuracy` | 28/28 sparse readout 有效 | **重跑 hier_uot 相关配置** | 同 E14；保持 entropic 目标和独立 reference 定义 |
| E16 | UFGW solver 与轨迹 `tab:ufgw-solvers`、`fig:ufgw-objective-time` | 4/4 配置完成规定的 10 sweeps | **重跑 hier_uot 两行及轨迹** | 缺完整内层控制器记录；另有 POT 精度核对待办 |
| E17 | temporal transport 与 timing breakdown `fig:temporal-runtime`、`fig:temporal-timing-breakdown` | 汇总记录 114/114 配置；原始记录并不完整 | **重跑 hier_uot 相关配置＋核对图源** | 缺完整内层记录；timing 旧目录缺失，当前图与可用归档 PDF 字节不同 |
| E18 | MOSTA spatial alignment `tab:ufgw-application` | 7 个时间对、两方法，14/14 成功 | **重跑 hier_uot+BCD** | 缺完整内层记录；保留已选配置，moscot low-rank 基线不因预算变更重跑 |
| E19 | 通用 runtime breakdown `tab:uot-runtime-breakdown` | 历史布局数据，当前整节注释掉 | **已移除；恢复前重跑** | 混合源码版本，计时项需核对为互不重叠口径 |
| E20 | Schmitzer/LCN 等额外 entropic baselines | 尚无用于该节的正式结果 | **已移除 / 待补实验** | 不将占位或计划写成已完成；full Sinkhorn warm-start 对比也尚待补做 |
| E21 | 附录不同维度 runtime–accuracy Pareto，label 待定 | 新增计划 | **待补实验；单 seed** | 四个维度 × 四组 penalty 的 $4\times4$ 大图；仅比较 hier_uot 与 Sinkhorn |

## 结果路径与具体待办

### E01–E02：主比较表与完整问题 Pareto

**E01** 的论文注释来源为 `paper_experiments_uot/main_scaling/results/20261025_170426/summary_table.csv`。本次核对该目录在当前 checkout 及检查的 managed worktrees 中均不存在，因此现有表格数值只能视为待恢复来源的历史数据。下一步恢复归档；无法恢复则重跑正式比较。

**E02** 的论文注释仍写 `paper_experiments_uot/accuracy_runtime_pareto/results/20261025_201833/`，该路径不存在。现有归档为 [20261025_201833_没有pduot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/accuracy_runtime_pareto/results/20261025_201833_没有pduot)。旧批次使用 `normalize_subproblem_masses=True`，未记录 `pduot_mode`，且归档 PDF 与论文图的身份尚未确认。不能仅改目录名就宣称与当前算法一致。

这两项已有 safeguard 重跑要求；新的正式批次应保存源码版本、显式开关、独立下界和统一计时口径。

**E02 当前新批次**：[20261111_202336](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/accuracy_runtime_pareto/results/20261111_202336)。快照为 $n=m=32768$、四组 penalty、seed 42、一次运行；方法为 hier_uot、HELLO-UOT、Sinkhorn、MM、ULOT，HELLO-UOT 扫五档联动阈值。该批次不代表五 seed 已完成，也尚未替换论文旧图。下一步通过保留旧观测的扩展式续跑增加四个 seed；当前运行中的队列不会随 YAML 修改而扩展。

### E03：百万点 scaling —— 当前存在数据版本混用

- 论文注释指向 `paper_experiments_uot/main_scaling/results/20261102_150232_shuttle_zhuang_large/`，该目录本次未找到。
- 实际可用归档：[20261103_181943_paper_data](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/main_scaling/results/20261103_181943_paper_data)。包含 `summary.json`、`summary.csv`、`scaling_statistics.json`、`scaling_accuracy.csv`、`scaling_accuracy.tex` 和逐次 `cases/*/shuttle_repeat0/metrics.json`。
- 已逐字节确认：论文 [uot_zhuang_scaling.pdf](/home/xiawenzhou/project/hierarchical_ot/papers/hier_uot/figures/uot_zhuang_scaling.pdf) 与该归档的 `scaling.pdf` 完全相同。
- 新归档的 `summary.json` 有 20/20 成功求解、20/20 有效 shared gap；百万点四组耗时约 135.66、144.99、204.39、137.29 秒。
- 正文仍写 147.7–762.2 秒、19/20 个 reference 可用；论文 [精度表源码](/home/xiawenzhou/project/hierarchical_ot/papers/hier_uot/figures/uot_zhuang_scaling_accuracy.tex) 也与新归档数值不同，并保留百万点 $(10,10)$ 的缺失项。
- **下一步**：先选定同一批次，统一正文数值、斜率、精度表、图注和来源注释。不能继续把“缺失 reference 仍在计算”当作已经核实的实时状态。
- 新归档明确 `refinement_forcing_check=False`，所以统一版本后仍需按最终 safeguard 协议重跑 hier_uot。

### E04：HELLO-UOT 直接对比

- 实测批次：[20261111_formal_four_rho](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/hello_uot_comparison/results/20261111_formal_four_rho)。入口为 `summary.json`、`manifest.json`；原始测量在 `cases/*/*/metrics.json`，HELLO-UOT 轨迹在 `cases/*/hello_uot_repeat0/trajectory.json`。
- 独立下界：[20261111_reference_four_rho](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/hello_uot_comparison/results/20261111_reference_four_rho)，含 `cases/*/reference/{reference.json,potentials.npz}`。比较批次的 `reference_link.json` 保存关联。
- 当前协议比较最终原生解与完整求解时间，不再使用历史 first-crossing hier_uot 时间。
- 需重跑 hier_uot 的 safeguard-enabled 版本，更新正文子表、附录全表和三组 trajectory 图；不因该变更重跑 HELLO-UOT。已独立审计的 reference 不因控制器实现变化自动失效。

### E05：受限 solver runtime CDF —— 替换正文 Pareto

- 新测量：[20261110_paper_data](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/restricted_solver_accuracy_runtime_pareto/results/20261110_paper_data)，重点文件为 `summary.json`、`pareto_aggregate.json`、`manifest.json` 和 `cases/*/*/metrics.json`。
- 既有快照及固定 reference：[20261026_000140_reuse](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/restricted_solver_accuracy_runtime_pareto/results/20261026_000140_reuse)，含 `capture/problem.npz`、`capture/metrics.json` 和 `reference/reference.json`。
- 80 个扫描点是重新测量的结果。该项仍沿用历史 lower-middle 快照，不能将其改称当前 upper-middle 选择。
- PDUOT 的 20 个点均可审计，最多 17 次重启，因而 $J=64$ 不裁剪。当前无需仅因新预算重跑，也不把外层 refinement safeguard 强加到独立受限问题比较中。

**2026-11-11 新的正文替换计划（作者已确定）**：为避免与完整 UOT Pareto 重复，正文 restricted solver 比较改为 runtime CDF。只使用一个共同精度目标 **shared gap $10^{-6}$**，保留四个子图，分别对应 $(0.1,0.1)$、$(1,1)$、$(10,10)$、$(0.045,99.995)$；不再按两个精度目标增加面板。历史 Pareto 的上述数据与图保留归档，不重标为新 CDF 的实测数据。

- 方法为 PDUOT、PDCS、MM、Sinkhorn。各方法在完全相同的受限 support、cost、边缘质量上求解，记录第一次经共同检查达到目标精度的累计求解耗时；横轴用 log 时间，纵轴为达到目标的算例比例。
- 统一评价原始无熵受限 UOT 目标，不能用各方法原生 tolerance 或 Sinkhorn 的熵正则停止指标代替。每个快照使用独立受限 reference 的可行对偶下界 $D_{\mathrm{ref}}$，共同指标为：

$$G(t)=\frac{P(t)-D_{\mathrm{ref}}}{\max\{|P(t)|,|D_{\mathrm{ref}}|,10^{-15}\}}.$$

- reference 必须对应同一个受限问题，核验该 support 上的对偶可行性及足以区分 $10^{-6}$ 目标的精度；不能直接借用完整 UOT 的下界。若 reference 不够紧，记录 reference 不足，不能误判参评方法无法达到目标。
- Sinkhorn 的输出也按原始无熵目标计算 gap；其 epsilon/continuation 策略在实验前固定，不逐算例根据结果挑选最佳设置。统一初始化协议、计时边界和检查频率，原生求解及共同停止检查计入耗时，编译/预热按既有协议排除；实验层实现，不要求修改生产代码。
- 建议复用 E07 的多 seed、多层/轮快照语料。各 penalty 已分别覆盖 8、7、5、8 个父 seed，满足至少五个父 seed 的要求；冻结各方法共同的问题清单并记录实际规模、父 seed、层和轮次。任何筛选在比较前按与方法表现无关的规则确定，不因求解失败删题。
- 各 penalty 的 CDF 分母保留全部计划算例，超时、OOM、未达到目标的算例不能从分母删除，曲线可以低于 100%。GPU 污染/监控失效保留为需补测状态，不称为算法失败；同一父问题的多层/轮快照不能视为独立 seed。
- 仍需实现共同 gap 检查与首次达标计时、核查 reference、冻结语料及运行协议，然后重新测量并替换正文图。旧精度扫描的最终点不能直接冒充首次达标时间。**当前只是更新计划，未启动 CDF 实验，未修改论文图或实验代码。**

### E06：系统组件消融 A–E

| Panel | 当前数据路径 | 下一步 |
|---|---|---|
| A hierarchy | [hierarchy_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/hierarchy_20261109_hier_ot)，`summary.csv` | 按当前 safeguard 和预算默认值正式重跑 |
| B active support | [active_support_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/active_support_20261109_hier_ot)，`summary.csv` | 同上；保留较小共同规模以容纳 full-graph 对照 |
| C restricted backend | [torch_pdcs_shuttle_n16384_formal_20261109](/home/xiawenzhou/project/hierarchical_ot/experiments/restricted_kl_uot/results/torch_pdcs_shuttle_n16384_formal_20261109)，`pduot.json`、`torch_fused.json` | PDCS 目前 cold start，PDUOT warm start；先实现并验证 PDCS primal/dual warm-start mapping，再重跑两者；现有 0.77 s / 43.09 s 不代表匹配初始化比较 |
| D translation | [translation_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/translation_20261109_hier_ot)，`summary.csv` | 按当前协议重跑；区分 inter-level translation 与 restricted output translation |
| E structural edges | [structural_rho1e5_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/structural_rho1e5_20261109_hier_ot)，`summary.csv` | 共享 GPU 的 pilot，需正式重跑；保留当前 $(10^5,10^5)$ 惩罚设置 |

### E07–E09：PDUOT 控制器与 safeguard

**E07：内部组件 CDF。** [pduot_cdf_n65536_seeds_20261110_gpu6](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/pduot_ablation/results/pduot_cdf_n65536_seeds_20261110_gpu6) 中保存 `summary.json`、`cdf_data.json`、`cdf_components_iterations.pdf` 和原始 metrics；快照来自同实验的 [corpus_n65536_seeds_20261110](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/pduot_ablation/results/corpus_n65536_seeds_20261110)。四组分别为 108、106、119、100 个受限问题，共 433 个；6 变体共 2598 次运行均收敛。完整重启计数最大 25，可保留迭代 CDF，保留其历史来源。

**E08：safeguard on/off。** [20261111_refinement_safeguard](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/20261111_refinement_safeguard) 保存 `summary_table.json`、`summary.json`、`config.json`、`manifest.json` 和逐次 metrics。四组在原精度下通过，启用 safeguard 后没有拒绝检查点，也没有额外迭代。这验证常规运行中的开销，不是“实际拒绝检查点后仍能返回”的实验。全部 130 次内层调用步数完整，最大 11000；每 200 步至多重启一次，故 $J=64$ 不裁剪。不能由此断言新增预算耗时为零。

**E09：预算干预。** 原始结果和后续验证均在 [primal_weight_budget_20261111](/home/xiawenzhou/project/hierarchical_ot/experiments/primal_weight_budget_20261111)：

- `results/audit_native_20261111/`：12/12 个完整求解，208 次受限调用、1253 次权重更新；原控制器的有限轨迹审计。
- `results/J1_iterations_20261111/`、`results/J4_iterations_20261111/`、`results/J100_iterations_20261111/`：各 8 对基线/裁剪运行，使用 **$p=1.1$**；分别共裁剪 19、2、0 次。$J=1$ 最大迭代增幅约 86%；$J=4$ 没有实例增加迭代；$J=100$ 全部与基线相同。
- [SMALL_J_ITERATIONS.md](/home/xiawenzhou/project/hierarchical_ot/experiments/primal_weight_budget_20261111/report/SMALL_J_ITERATIONS.md)、`small_J_iterations.json`、`small_J_validation.json`：完整计数、停止精度和完整性验证。
- `results/production_J64_p101_20261111/`：最终默认 $J=64,p=1.01$ 的两组完整求解验证，分别 16980 和 13780 次内层迭代，零裁剪。仅属接入验证，不是正式 CDF。
- **明确待办**：复用 E07 固定快照和消融基础设施，固定 $p=1.01$，比较 $J=64$、能真正触发裁剪的小 $J$、以及 `primal_weight_budget=None` 的原自适应控制器；冻结权重是另一种消融，不能代替关闭预算基线。CDF 分母保留全部计划问题，并记录裁剪数、失败和停止精度。
- 旧 `safe512_20261111/`、`tight32_20261111/` 是前期 $B/j^p$ 研究批次，含中断或未完成记录，不是当前论文表格来源；不按文件夹名宣称全部成功。

历史数据审计的机器可读依据：[history_J64_audit.json](/home/xiawenzhou/project/hierarchical_ot/experiments/primal_weight_budget_20261111/report/history_J64_audit.json)。复现入口为同目录上层的 `audit_history.py`。

### E10–E11：层间响应理论诊断

- 原始数据：[uot_hierarchy_paper_candidate_20261019](/home/xiawenzhou/project/hierarchical_ot/results/uot_hierarchy_paper_candidate_20261019)。`forward_results.json` 提供全部 1080 个转换；`summary.json` 提供汇总；`full_certificate_results.json` 提供独立的 120-transition 证书测试。
- 图表全量重算统计：[hierarchy_stability_validation.json](/home/xiawenzhou/project/hierarchical_ot/papers/hier_uot/figures/hierarchy_stability_validation.json)；绘图脚本为 [plot_hierarchy_stability.py](/home/xiawenzhou/project/hierarchical_ot/papers/hier_uot/scripts/plot_hierarchy_stability.py)。
- 不因生产权重预算或 safeguard 默认值改变而重跑。该实验不等价于层次 warm-start 的运行时间加速实验。

### E12–E13：参数敏感性与 support sparsification

**E12**：[20261110_v2_paper_data](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/parameter_sensitivity/results/20261110_v2_paper_data) 的 `summary_table.json`、`cases/*/*/metrics.json` 提供当前 36/36 成功结果。旧批次两个 refinement 开关均关闭，已有重跑注释。需在最终协议下重新测量，保留按 penalty 共享 baseline 的统计方式。

**E13**：[support_sparsification_uot/results](/home/xiawenzhou/project/hierarchical_ot/paper_experiments/support_sparsification_uot/results) 的 `records.jsonl`、`summary.json` 和 `support_sparsification_uot_scaling.pdf`。360 条记录全部满足输出支持上界；这是独立压缩测试，可保留。它不说明真实层次轨迹中触发压缩的频率。

### E14–E15：sparse entropic UOT

- **2026-11-12 作者确定的展示方案**：方法正文以 support reconstruction 为主；保留无正则解的正流边，再按最终 dual scores 做双向 top-$b_{\mathrm e}$ 选择。Pareto 连线继续展示手动预算 $b_{\mathrm e}\in\{2,4,8,16,32\}$；叉号（X）改为**自动预算 reconstruction**，不再表示 direct reuse。
- **自动预算口径**：令 $s$ 为 hier_uot 最终 active support 大小，$s_+$ 为其正流支持大小，取 $b_{\mathrm e}=\min\{32,\lfloor(s-s_+)/(m+n)\rfloor\}$；正流边受保护，重建后支持不超过 $s$。若预算为零，实现退回最终 active support，须记录实际 fallback，不能记为执行了 reconstruction scan。该规则选择支持预算，不是按测试精度搜索最佳参数。
- **待接入 E14**：按最终协议测量或核验自动预算点，保存 `support_topk="rebuild"`、resolved top-$k$、实际支持大小/策略、含重构 scan 的完整耗时及对应独立 entropic reference；新图只给自动预算点使用叉号。旧 direct-reuse 记录保留为历史对照，若另行展示需采用不同标记。重绘后同步正文比较句、自动预算结果、图注与来源记录。
- **当前图文状态**：方法正文与支持构造附录已改为 reconstruction 为主；当前 E14 PNG、数值比较和图注仍是旧结果，叉号仍表示 direct reuse。尚未重绘或替换自动预算结果，不能只改图注而沿用旧叉号坐标。E15 已采用自动 reconstruction，其其他 epsilon/输入的点不能直接充当 E14 自动预算点。
- **E14 当前来源**：[20261026_225628_结果出来了_1e-3结果就很好了_后续使用rebuild会更好](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/entropic_uot/results/20261026_225628_结果出来了_1e-3结果就很好了_后续使用rebuild会更好)，`summary.csv`、`config.json`、`plot_selection.json` 和 Pareto 图。
- **E15 当前来源**：[epsilon_sparse_log7_n16384_20261110_gpu267](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/entropic_epsilon_accuracy/results/epsilon_sparse_log7_n16384_20261110_gpu267)，`summary.json`、`config.json`、逐次 metrics。论文使用其中 28 个 sparse readout；不得把其他 readout 当作同一统计口径。
- 两项都需重跑 hier_uot 相关配置，使用最终预算和适用的 safeguard 设置；历史记录不足以确认每次内层调用都不触发预算。OTT/Spar-Sink 基线及已独立审计的固定 entropic 下界不因预算变化自动要求重跑。
- 保留每个 epsilon 对应的 entropic 目标、共同 reference、重构支持预算和误差定义；不将不同 epsilon 的问题混作同一个目标。

### E16：UFGW solver 与目标轨迹

- 数据：[20261110_ufgw_starmap_n16384](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/ufgw_solver_comparison/results/20261110_ufgw_starmap_n16384)。入口为 `summary.json`、`summary.csv`、`config.json` 和 `manifest.json`；每种 epsilon 的 `cases/*/{shuttle,pot}_repeat0/metrics.json`、`trajectory.json` 保存原始记录。
- 轨迹绘图数据为 `trajectory_plot_data.json`；两个 objective-time 图与主表应同步更新。
- 现有 4/4 配置完成规定的 10 个完整 sweeps，**不代表已经验证 outer convergence**。
- 因缺少完整内层控制器记录，重跑 hier_uot 两种 epsilon 的配置。另有独立待办：POT 原论文/软件默认 `tol_ot=1e-7`，当前批次显式用了 `1e-6`；先补 `1e-7`、`1e-8` pilot，再决定是否更新 POT 比较。不要声称两类原生停止指标等价。

### E17：temporal transport 与计时分解

- 可用归档：[20261102_005354_paper_data](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/moscot_time/results/20261102_005354_paper_data)，有 `summary.json`、`summary.csv`、`summary_table.csv`、`manifest.json`、`temporal_runtime_accuracy.pdf` 和 `extended_data_fig1a_runtime.pdf`。
- 汇总记载 19 个时间对、114/114 配置；当前归档并非每项都有完整原始 metrics，不能把汇总行数当作原始日志完整性证明。
- 主文图使用上述归档；附录 timing 来源注释仍指向不存在的 `results/20261102_005354/`。当前论文 `figures/moscot_time_runtime.pdf` 与可用归档的 `extended_data_fig1a_runtime.pdf` 不同，需核对是合法重画还是数据版本不一致。
- 需重跑 hier_uot–Sinkhorn 相关配置，保留作者逐时间对校准的 penalty，并更新主图及 timing breakdown。Full-rank、low-rank 基线不因权重预算变更重跑。不要把 coupling 计算时间与 downstream evaluation 时间混作一个指标。

### E18：MOSTA spatiotemporal alignment

- 正式选择后测量：[20261101_213655_selected_compare_im2](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/moscot_spatiotemporal/results/20261101_213655_selected_compare_im2)，含 `summary.csv`、`summary.json`、`config.yaml`、`manifest.json` 及逐次 metrics。
- 历史 BCD 配置选择来源为同实验 `results/20261031_203031_my4090/selection.json`；选择结果也应随新批次保存。
- 保留每个时间对已选参数，重跑 hier_uot+BCD；不因本次控制器变更重做 moscot low-rank 基线或自动重新搜索全部参数。

### E19–E20：未展示或尚未完成的实验

- **通用 runtime breakdown**：旧路径 `paper_experiments_uot/accuracy_runtime_pareto/results/20261025_222731/` 与 `paper_experiments_uot/component_ablation/results/20261102_193809/` 仅作为历史线索，未在本轮确认为正式来源。恢复前需用共同源码和正式 GPU 协议重跑，核对初始化、restricted solve、scan、update 和其他时间不重叠。
- **Schmitzer/LCN 额外基线**：当前整节注释掉，没有正式可引用结果，保持移除直到适配和测量完成。
- **full Sinkhorn warm-start 加速**：若要作为中心结论，需要补 cold-start 与 hier_uot 初始化 full Sinkhorn 的端到端比较，计入初始化成本；现有 sparse refinement 对比不能代替它。
- **general marginal penalty 附录**：当前暂时移除，不作为已完成的正文实验或理论贡献登记。

### E21：附录维度扩展 Pareto

- **作者已确定**：放附录，采用 $4\times4$ 面板；每个面板是一个 runtime–shared-gap Pareto 图。只比较 hier_uot 与 Sinkhorn，使用一个 seed，以控制实验量；这是五 seed 默认规则的明确例外，不改变其他正式比较的要求。
- **建议布局**：行对应既有四组 penalty $(0.1,0.1)$、$(1,1)$、$(10,10)$、$(0.045,99.995)$；列对应四个维度。采用共享方法图例，并让跨维度的坐标范围尽量可比较。
- **待确定**：四个维度的具体取值。先核查原始表达矩阵/预处理可提供的 PCA 维度，不能把现有 30 维输入补零当作更高维实验。
- **建议固定的控制条件**：沿用主 Pareto 的数据集、$n=32768$、seed 42、penalty、代价归一化、原生精度扫描、1200 s 时限和最终 safeguard/GPU 监控协议；这些属于建议，实际运行前写入独立配置。各维度保持同一批采样对象，记录 PCA 构造方式；每个维度/penalty 独立构造并审计 reference，不能跨维度借用下界。
- 若沿用两方法各五档扫描，共为 16 个实例、160 个方法任务和 16 个 reference；这是计划数量，不是已完成测量。
- 图注明确为单 seed 维度扩展，只展示不同维度下的观测趋势，不提供跨 seed 误差条或稳定性结论。当前未创建配置、未运行、未接入论文图。

## 下一轮工作顺序

1. 先修复 E03 图、正文和精度表的数据版本混用，并恢复/确认 E01、E02、E17 的来源关系。
2. 对齐最终协议，重跑主表、完整问题 Pareto、scaling、HELLO-UOT 中的 hier_uot、组件消融及敏感性；复用仍然有效且已审计的独立 reference。
3. 用现有 PDUOT 快照补 E09 的 $J$ 敏感性 CDF；PDCS matched warm start 则先完成实现验证，再跑 E06-C。
4. 更新 entropic、UFGW 和下游 hier_uot 相关结果，最后统一正文统计、图表、caption 与 provenance。
5. 确定 E21 四个维度后，补单 seed 的附录维度扩展图；与五 seed 主 Pareto 分开登记来源和统计范围。

这些是待办顺序，不表示已经申请 GPU 或启动任务。本会话禁止使用 7 号卡；正式计时按项目实验规范安排资源。

## 如何维护这份清单

- 每个新批次保存 config、manifest、源码/输入指纹、逐次 metrics，以及全部计划任务的成功/失败分母。
- 每项更新同时记录：新批次路径、实际开关和精度、成功/计划数、reference 状态、是否已替换论文图表。
- 结果已算完但图文未更新时，状态写“完成测量，待接入”，不要直接写“完成”。
- 重跑原因消除后，再同步清理对应的 `\xwz{}` 注释；保留旧批次为历史记录，不覆盖或重标旧配置。
