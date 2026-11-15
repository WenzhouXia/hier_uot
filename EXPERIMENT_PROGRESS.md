# hier_uot 论文实验进展

更新时间：2026-11-15。范围：当前正文、附录引用的实验，以及已明确提出的补实验。本文件记录实测结果、数据来源和待办，不代表已启动重跑。

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
| E19 runtime breakdown | 附录已插入 16 个单 seed profile 的预览图 | **正式结果需五 seed** | 四规模、四 penalty；监控关闭，保留 profiling preview 标记 |
| E20 额外 entropic baselines | 当前未展示/未完成 | **正式启用时五 seed** | 对相同输入、目标和精度统一比较，不提前记为完成 |
| E21 附录维度扩展 Pareto | 新增计划，尚无指定正式结果 | **作者明确指定单 seed 例外** | 四个维度 × 四组 penalty，16 个 Pareto 面板；只比较 hier_uot 与 Sinkhorn，具体维度待确定 |

审计依据：E02–E05、E08、E12、E14–E18 的 `config.json`/`config.yaml` 和 `manifest.json`；E07 的 `manifest.parents`（不能只读仍写 seed 42 的采集起点配置）；E10/E11 的逐项 JSON；E13 的 `records.jsonl` 及 `run_scaling.py`、`benchmark.py` 中输入生成和 repeat 循环。具体路径见下文各项来源。

建议优先补齐正文 E01–E04、E06 及正式敏感性 E12，然后补 E05、E08、E14–E18；E07 不因五 seed 要求增加重复求解，E09 直接复用其多 seed 语料。E10/E11/E13 虽不是端到端求解器比较，但仍是论文正式实验，按作者统一要求登记补 seed，不能仅因“理论诊断/算子测试”而默认为豁免。

## 总览

| ID | 实验 / 论文锚点 | 现有结果 | 是否需要重跑或补做 | 主要原因 / 下一步 |
|---|---|---|---|---|
| E01 | UOT 时间、显存、精度主表 `tab:uot-comparison` | 论文保留 12 个历史数值 | **待重跑＋待核对** | 原批次未找到；旧协议未启用 safeguard；确认共同下界及计时来源 |
| E02 | 完整 UOT runtime–accuracy `fig:uot-runtime-accuracy` | 当前新批次 `20261111_202336` 为 $n=32768$、seed 42、五方法；旧图尚未替换 | **正在重跑；需补至五 seed** | 新批次显式启用 safeguard 和 GPU 监控；需补四个 seed，并保留全部成功/失败分母 |
| E03 | 百万点 scaling 与精度表 `fig:uot-large-scale`、`tab:uot-scaling-accuracy` | 图、正文统计、精度表及来源已统一到 `20261103_181943_paper_data` | **仍待最终协议重跑及补 seed** | 当前 20/20 求解与 gap 有效；归档仍关闭 safeguard |
| E04 | HELLO-UOT 对比 `tab:hello-uot-direct`、`tab:hello-uot-complete`、`fig:hello-uot-trajectories` | 12 个实例，24 次原生求解；12 个独立 reference 通过审计 | **重跑 hier_uot 部分** | hier_uot 旧批次关闭 safeguard；HELLO-UOT 无需仅因该开关重跑 |
| E05 | 受限求解器 runtime CDF，替换现有 `fig:restricted-runtime-accuracy`（最终 label 待定） | 独立入口已实现；433 个快照通过 dry-run；GPU smoke 和正式测量待执行 | **代码完成，待 GPU 验证和测量** | 四个 penalty 子图，统一 shared gap $10^{-4}$；额外共同检查耗时单独扣除，保留全部计划分母 |
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
| E19 | 通用 runtime breakdown `fig:uot-runtime-breakdown` | My4090 完成 16 个单 seed profile 及配对普通运行，附录预览图已接入 | **预览已展示；正式五 seed 待跑** | 四规模 4096/16384/65536/262144，四 penalty；support maintenance 并入 Other；原始五项计时与关闭监控记录保留 |
| E20 | Schmitzer/LCN 等额外 entropic baselines | 尚无用于该节的正式结果 | **已移除 / 待补实验** | 不将占位或计划写成已完成；full Sinkhorn warm-start 对比也尚待补做 |
| E21 | 附录不同维度 runtime–accuracy Pareto，label 待定 | 新增计划 | **待补实验；单 seed** | 四个维度 × 四组 penalty 的 $4\times4$ 大图；仅比较 hier_uot 与 Sinkhorn |
| E22 | 跨问题设置的 generality 比较，label 待定 | 2026-11-14 新方案；非均匀权重已有收敛 pilot | **待讨论并实现；未启动正式网格** | 8 行 × 4 列：cost、数据集、维度、reference masses 和 marginal penalty；方法覆盖及图文安排见下文，维度部分拟与 E21 合并 |
| E23 | 更多 UOT baselines，`fig:uot-supplementary-baselines` | ETM、POT L-BFGS-B、MultiScaleOT 已有独立 pilot | **附录 pilot 占位已接入；正式测量待补** | 三组 $2\times2$ 图横向并排；按方法分别选规模/维度，ETM 计划 $n=16384$，POT 保留小规模，MultiScaleOT 使用 $d=3$ |

## 结果路径与具体待办

### E01–E02：主比较表与完整问题 Pareto

**E01** 的论文注释来源为 `paper_experiments_uot/main_scaling/results/20261025_170426/summary_table.csv`。本次核对该目录在当前 checkout 及检查的 managed worktrees 中均不存在，因此现有表格数值只能视为待恢复来源的历史数据。下一步恢复归档；无法恢复则重跑正式比较。

**E02 旧批次** 的历史论文注释曾写 `paper_experiments_uot/accuracy_runtime_pareto/results/20261025_201833/`，该路径不存在。现有归档为 [20261025_201833_没有pduot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/accuracy_runtime_pareto/results/20261025_201833_没有pduot)。旧批次使用 `normalize_subproblem_masses=True`，未记录 `pduot_mode`，且归档 PDF 与论文图的身份尚未确认。不能仅改目录名就宣称与当前算法一致。

这两项已有 safeguard 重跑要求；新的正式批次应保存源码版本、显式开关、独立下界和统一计时口径。

**E02 当前新批次**：[20261111_202336](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/accuracy_runtime_pareto/results/20261111_202336)。2026-11-14 已固定当前 `pareto_aggregate.json` 并重画论文主图，方法为 hier_uot、HELLO-UOT、Sinkhorn、MM、ULOT；93 个有效曲线点分别有 3–5 个有效 seed，仍不是全部完成的五 seed 汇总。固定绘图输入及来源 SHA256 保存于 `figures/plot_sources/experiment_figures_20261114.json`，复现入口为 `scripts/refresh_experiment_figures.py`；重画不修改运行中的 batch 汇总或原始观测。

**E02 附录补充 baseline：ETM pilot 已接入并完成**。`common/etm.py` 等价实现作者公开的 ETM-Approx 递推，并用 HELLO 按原成本构造 coupling，恢复共同总质量；标为 ETM-Approx+HELLO，不标为 ETM-Refine。配置为 `accuracy_runtime_pareto/config_etm_my4090.yaml`：TOME E11.5→E12.5、PCA30、n=4096、seed=42、四组 KL rho，FP64、固定 1000 轮，epsilon 扫描 1e-2/1e-3/1e-4/1e-5，每配置时限 3600 秒。结果为 [20261114_etm_pilot_v7_my4090](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/accuracy_runtime_pareto/results/20261114_etm_pilot_v7_my4090)：16 档 ETM、12 档 hier_uot 全部有效，4 个全层 FP64 reference 验收通过；已回传原始记录、外部 reference 与路径映射，可在 im2 重汇总。四组中 hier_uot 均取得更短耗时和更低 gap。仅为 RTX 4090 单 seed pilot，不混入 A100 正式汇总，未修改论文图。

同机独立计时中，ETM-Approx 的 NumPy→CUDA 等价实现，在 n=1024/4096 时分别从 16.678/284.564 秒降至 0.175/2.592 秒，约 95.2/109.8 倍；仅比较预先给定成本后的边际估计，不包括 coupling，也不将该加速比外推到 online 大规模实现。21 项 CUDA 等价性/精确 LP 校验通过，官方递推最大绝对差 2.58e-14。原始数据见 [port_speed.json](/home/xiawenzhou/project/hierarchical_ot/experiments/etm_validation/results/20261114_etm_pilot_v7_my4090/port_speed.json)。后续 baseline 的进展和分开展示方案统一记录于 E23。

### E03：百万点 scaling —— 图、正文与精度表已统一归档

- 2026-11-14 已将正文图与精度表的来源注释统一为 `paper_experiments_uot/main_scaling/results/20261103_181943_paper_data/`，替换原先无法找到的旧来源。
- 实际可用归档：[20261103_181943_paper_data](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/main_scaling/results/20261103_181943_paper_data)。包含 `summary.json`、`summary.csv`、`scaling_statistics.json`、`scaling_accuracy.csv`、`scaling_accuracy.tex` 和逐次 `cases/*/shuttle_repeat0/metrics.json`。
- 已逐字节确认：论文 [uot_zhuang_scaling.pdf](/home/xiawenzhou/project/hierarchical_ot/papers/hier_uot/figures/uot_zhuang_scaling.pdf) 与该归档的 `scaling.pdf` 完全相同。
- 新归档的 `summary.json` 有 20/20 成功求解、20/20 有效 shared gap；百万点四组耗时约 135.66、144.99、204.39、137.29 秒。
- 正文已统一为百万点耗时 135.7–204.4 秒、峰值显存低于 6.57 GiB、runtime 拟合斜率 0.94–1.48；精度表已逐字对齐该批 `scaling_accuracy.tex`，20/20 个 reference 有效。
- **下一步**：数据版本已对齐；继续保留最终 safeguard 协议及五 seed 补测待办。
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

**2026-11-14 更新协议（作者已确定）**：为避免与完整 UOT Pareto 重复，正文 restricted solver 比较改为 runtime CDF。共同精度目标改为 **shared gap $10^{-4}$**，保留四个子图，分别对应 $(0.1,0.1)$、$(1,1)$、$(10,10)$、$(0.045,99.995)$。复用 E07 全部 433 个快照，共 1,732 次方法任务和 433 个独立受限 reference；单任务时限 1200 秒，各方法跨 penalty 固定配置。历史 Pareto 数据与图保留归档，不重标为新 CDF 实测数据。

- 方法为 PDUOT、PDCS、MM、Sinkhorn。各方法在完全相同的受限 support、cost、边缘质量上求解，记录第一次经共同检查达到目标精度的累计求解耗时；横轴用 log 时间，纵轴为达到目标的算例比例。
- 统一评价原始无熵受限 UOT 目标，不能用各方法原生 tolerance 或 Sinkhorn 的熵正则停止指标代替。每个快照使用独立受限 reference 的可行对偶下界 $D_{\mathrm{ref}}$，共同指标为：

$$G(t)=\frac{P(t)-D_{\mathrm{ref}}}{\max\{|P(t)|,|D_{\mathrm{ref}}|,10^{-15}\}}.$$

- reference 必须对应同一个受限问题，核验该 support 上的对偶可行性；固定 PDUOT KKT $10^{-8}$，另要求 reference self-gap 不超过 $10^{-6}$。不能直接借用完整 UOT 的下界。若 reference 不够紧，记录 reference 不足，不能误判参评方法无法达到目标。
- Sinkhorn 按原始无熵目标计算 gap，先固定 epsilon $10^{-4}$、不使用 continuation；若 GPU 验证表明该设置不足，先统一修改配置再正式测量，不逐快照挑选。全部方法使用各自标准 cold start，不继承快照 warm state。PDUOT/PDCS 每 200 次迭代检查，MM/Sinkhorn 每 50 次检查。额外共同评价及其记录耗时单独扣除，同时保存实际 wall time；原生检查仍计入主耗时，编译/预热排除。
- 建议复用 E07 的多 seed、多层/轮快照语料。各 penalty 已分别覆盖 8、7、5、8 个父 seed，满足至少五个父 seed 的要求；冻结各方法共同的问题清单并记录实际规模、父 seed、层和轮次。任何筛选在比较前按与方法表现无关的规则确定，不因求解失败删题。
- 各 penalty 的 CDF 分母保留全部计划算例，超时、OOM、未达到目标的算例不能从分母删除，曲线可以低于 100%。GPU 污染/监控失效保留为需补测状态，不称为算法失败；同一父问题的多层/轮快照不能视为独立 seed。
- 新建独立入口 `paper_experiments_uot/restricted_solver_runtime_cdf/`，已实现共同 gap 检查、首次达标净计时、reference 验收、全语料冻结与 CDF 汇总，复用共享 GPU 污染监控和进程回收。CUDA 检查入口使用 batch 内源码副本，生产 solver 文件保持原样。已完成 433 个快照的 dry-run 校验及 CPU 测试；GPU smoke 和正式测量仍待执行，正文图尚未替换。旧精度扫描的最终点不能冒充首次达标时间。

### E06：系统组件消融 A–E

| Panel | 当前数据路径 | 下一步 |
|---|---|---|
| A hierarchy | [hierarchy_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/hierarchy_20261109_hier_ot)，`summary.csv` | 按当前 safeguard 和预算默认值正式重跑 |
| B active support | [active_support_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/active_support_20261109_hier_ot)，`summary.csv` | 同上；保留较小共同规模以容纳 full-graph 对照 |
| C restricted backend | [torch_pdcs_shuttle_n16384_formal_20261109](/home/xiawenzhou/project/hierarchical_ot/experiments/restricted_kl_uot/results/torch_pdcs_shuttle_n16384_formal_20261109)，`pduot.json`、`torch_fused.json` | 历史 Gaussian 输入且 PDCS cold start、PDUOT warm start，0.77 s / 43.09 s 不是匹配初始化比较。新配置改为 TOME E11.5→E12.5、PCA $d=30$、$n=16384$、$\rho=(1,1)$、seed 42；双方 warm start。PDUOT 保留自身 safeguard，PDCS 仅按原 UOT KKT 停止，不接入 safeguard。正式计时待重跑 |
| D translation | [translation_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/translation_20261109_hier_ot)，`summary.csv` | 按当前协议重跑；区分 inter-level translation 与 restricted output translation |
| E structural edges | [structural_rho1e5_20261109_hier_ot](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/component_ablation/results/structural_rho1e5_20261109_hier_ot)，`summary.csv` | 共享 GPU 的 pilot，需正式重跑；保留当前 $(10^5,10^5)$ 惩罚设置 |

**E06-C warm-start 诊断（2026-11-14）**：结果为 `experiments/restricted_kl_uot/results/pdcs_warm_validation_20261114_v2_my4090/`，含 `VALIDATION.md`、`validation.json`、逐次 metrics/trace/request、GPU 与源码指纹。复用四组 penalty、seed 42、$n=1024/4096/16384$ 的 12 个真实第二轮快照，分别运行两 solver 的 cold/warm start；48/48 达到独立复算的原 UOT KKT $10^{-6}$。映射后的初始状态最大误差 $2.23\times10^{-16}$，初始 shared gap/KKT 一致到 FP64 舍入精度。PDCS 12/12 减少迭代（中位降幅 85.8%），PDUOT 11/12 减少（中位降幅 22.8%）；保留 $n=4096,\rho=(10,10)$ 上 PDUOT 从 2300 增至 3200 次的退化。RTX 4090 桌面诊断关闭 GPU 污染监控，不作为正式计时或完整层次流程结果。首个无 v2 批次因漏同步第三方 CUDA 依赖而停止，保留失败日志，不纳入统计。

**E06-C 完整 warm-backend 诊断**：`experiments/restricted_kl_uot/results/pdcs_warm_hierarchy_20261114_my4090/COMPARISON.md` 保存结果。复用上述历史 E06-C 的 Gaussian 3D 输入，$n=16384,\rho=(1,1)$、seed 42；并非新 TOME benchmark。RTX 4090、每种后端三个独立进程重复、双方启用 safeguard 和 $J=64$，排除编译/显式预热，完整计入构建、初始化、模型转换、求解、支持维护和验收。PDUOT 平均 $0.58555\pm0.01117$ 秒，warm PDCS 平均 $29.20299\pm0.02048$ 秒，平均时间比 49.87，差 28.61744 秒（标准差为样本标准差）；六次全部满足最终原问题 KKT $10^{-6}$。PDCS 每次 7/7 个内层调用接收 warm start。两者每层首次求解即通过 full-space 停止，未实际触发额外 safeguard gate；不能据此宣称已验证 gate 拒绝/接受路径。各层首次求解的流从零开始，主要传播双侧势，不同于先前第二轮已有正流的快照。关闭监控的桌面 GPU 诊断，不替换正式论文计时；保留原始结果、输入与源码指纹。

**E06-C TOME warm-backend 诊断（2026-11-14）**：新输入改为 TOME E11.5→E12.5、PCA $d=30$、$n=16384$、$\rho=(1,1)$、seed 42，复用其他 component panel 的数据加载、cost scaling 和均匀质量设置。配置为 `experiments/restricted_kl_uot/pdcs_gpu/config_panel_c_tome.json`。结果在 `experiments/restricted_kl_uot/results/pdcs_warm_tome_20261114_my4090/COMPARISON.md`，输入和 checksum plan 在相邻 `_my4090_inputs/`。双方 warm start；PDUOT 保留自身 safeguard，PDCS 不使用 safeguard，仅按原 UOT KKT 停止，已移除其额外验收实现。RTX 4090 三次独立进程重复：PDUOT $1.04596\pm0.00559$ 秒，PDCS $45.48688\pm1.03228$ 秒，平均时间比 43.49（样本标准差）。六次全部收敛，最大最终 KKT $9.50\times10^{-7}$；PDCS 每次 12/12 个受限调用接收 warm start。完整计时边界沿用上述诊断，关闭污染监控，暂不替换正文正式表格；旧 Gaussian 数据原样保留。

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
- 2026-11-14 已从该归档的固定 `summary_table.csv` 重画主文和 timing 图，更新 Salut-Sinkhorn 图例与 timing 来源注释；固定输入及 SHA256 见 `figures/plot_sources/experiment_figures_20261114.json`，未重新汇总缺失的原始运行。
- 需重跑 hier_uot–Sinkhorn 相关配置，保留作者逐时间对校准的 penalty，并更新主图及 timing breakdown。Full-rank、low-rank 基线不因权重预算变更重跑。不要把 coupling 计算时间与 downstream evaluation 时间混作一个指标。

### E18：MOSTA spatiotemporal alignment

- 正式选择后测量：[20261101_213655_selected_compare_im2](/home/xiawenzhou/project/hierarchical_ot/paper_experiments_uot/moscot_spatiotemporal/results/20261101_213655_selected_compare_im2)，含 `summary.csv`、`summary.json`、`config.yaml`、`manifest.json` 及逐次 metrics。
- 历史 BCD 配置选择来源为同实验 `results/20261031_203031_my4090/selection.json`；选择结果也应随新批次保存。
- 保留每个时间对已选参数，重跑 hier_uot+BCD；不因本次控制器变更重做 moscot low-rank 基线或自动重新搜索全部参数。

### E19–E20：耗时分解预览与待补实验

E19 附录图已确定采用双栏 $1\times4$ 布局，support maintenance 在图中并入 Other，原始分项保留。2026-11-14 已在 My4090 启动独立补充批次 `paper_experiments_uot/runtime_breakdown/results/20261114_runtime_breakdown_n262144_my4090/`：$n=262144$、四组既有 penalty、seed 42，4 个 profile 与 4 个普通配对运行，沿用预览的关闭 GPU 污染监控设置。配置为 `config_n262144_my4090.yaml`；启动时首组 $(0.1,0.1)$ 正在执行，尚无完成结论。原有小规模批次保持不变，未启动五 seed 网格。

2026-11-15 已回传并汇总该大规模批次：4/4 个 profile 及其普通对照均完成并收敛；profile 总耗时按四组 penalty 顺序为 22.74、25.36、32.22、22.09 秒。已与原先 12 个小规模 profile 合并为四规模 × 四 penalty 的附录预览图 `fig:uot-runtime-breakdown`（`app:runtime-breakdown`），support maintenance 并入 Other。固定绘图输入及来源指纹为 `figures/plot_sources/runtime_breakdown_pilot.json`，复现脚本为 `scripts/plot_runtime_breakdown.py`。原始批次各自保留，未将不同批次覆盖或重标；图注明确单 seed、RTX 4090、关闭污染监控及 profiling preview。本轮仅接入现有结果，未启动新测量。

- **通用 runtime breakdown**：旧路径 `paper_experiments_uot/accuracy_runtime_pareto/results/20261025_222731/` 与 `paper_experiments_uot/component_ablation/results/20261102_193809/` 仅作为历史线索，未在本轮确认为正式来源。恢复前需用共同源码和正式 GPU 协议重跑，核对初始化、restricted solve、scan、update 和其他时间不重叠。

  2026-11-14 新建 `paper_experiments_uot/runtime_breakdown/`。实验进程内临时包装现有函数，CUDA 同步阶段边界并扣除嵌套阶段，不修改生产求解器；受限调用中的 sparsification 单独归入 support maintenance。My4090 预览批次为 `results/20261114_runtime_breakdown_preview_my4090/`：TOME E11.5→E12.5、PCA $d=30$、$n=4096/16384/65536$、四组 penalty、seed 42，12/12 个 profile 与 12/12 个普通配对运行均达到 KKT $10^{-6}$。分解时间总和闭合，profile/control 时间比为 0.962–1.006，配对目标值最大差 $5.56\times10^{-17}$。关闭 GPU 污染监控，作为图形和计时实现预览，不替换论文正式表格。已生成单栏 $2\times2$ 和双栏 $1\times4$ 的 PDF/PNG，输入、请求、原始完整结果、环境和源码指纹均随批次保存并回传。正式配置为 $n=16384/65536/262144$、四组 penalty、五 seed，共 60 个 profile，尚未启动。
- **Schmitzer/LCN 额外基线**：当前整节注释掉，没有正式可引用结果，保持移除直到适配和测量完成。
- **full Sinkhorn warm-start 加速**：若要作为中心结论，需要补 cold-start 与 hier_uot 初始化 full Sinkhorn 的端到端比较，计入初始化成本；现有 sparse refinement 对比不能代替它。
- **general marginal penalty 附录**：当前暂时移除，不作为已完成的正文实验或理论贡献登记。

### E21：附录维度扩展 Pareto（原计划，拟并入 E22）

- **作者已确定**：放附录，采用 $4\times4$ 面板；每个面板是一个 runtime–shared-gap Pareto 图。只比较 hier_uot 与 Sinkhorn，使用一个 seed，以控制实验量；这是五 seed 默认规则的明确例外，不改变其他正式比较的要求。
- **建议布局**：行对应既有四组 penalty $(0.1,0.1)$、$(1,1)$、$(10,10)$、$(0.045,99.995)$；列对应四个维度。采用共享方法图例，并让跨维度的坐标范围尽量可比较。
- **待确定**：四个维度的具体取值。先核查原始表达矩阵/预处理可提供的 PCA 维度，不能把现有 30 维输入补零当作更高维实验。
- **建议固定的控制条件**：沿用主 Pareto 的数据集、$n=32768$、seed 42、penalty、代价归一化、原生精度扫描、1200 s 时限和最终 safeguard/GPU 监控协议；这些属于建议，实际运行前写入独立配置。各维度保持同一批采样对象，记录 PCA 构造方式；每个维度/penalty 独立构造并审计 reference，不能跨维度借用下界。
- 若沿用两方法各五档扫描，共为 16 个实例、160 个方法任务和 16 个 reference；这是计划数量，不是已完成测量。
- 图注明确为单 seed 维度扩展，只展示不同维度下的观测趋势，不提供跨 seed 误差条或稳定性结论。当前未创建配置、未运行、未接入论文图。

### E22：跨问题设置的 generality 比较与实验章节排布

2026-11-14 已确认实现协议。新入口为 `paper_experiments_uot/generality/`；正式配置已写入，小规模 smoke 在 my4090 完成。下列是实验设计，不是正式性能结论。E21 的维度计划合并到此处，不重复运行。

**章节职责与标题**：建议将正文 `Unregularized UOT` 改为 `UOT Solver Performance`，介绍默认问题上的精度与规模能力；熵正则方法在各自介绍处说明所求目标即可。其后安排 `Generality across Problem Settings`，回答性能是否依赖特定几何、维度或权重。再接 `Restricted UOT Solvers`、`Component Analysis`、两项 extensions 与 downstream applications。这里的 generality 表示求解器的适用范围与性能稳健性。

**图的总体布局**：四列固定为既有 penalty 配置 $(0.1,0.1)$、$(1,1)$、$(10,10)$、$(0.045,99.995)$，每行只改变一种问题设置。默认参考行为 TOME、$d=30$、平方欧氏 cost、均匀 unit-total masses 和 KL penalty；该行已有主 Pareto，不在完整扩展图中重复。

| 行 | 改变的因素 | 建议设置，其余沿用参考行 | 计划比较方法 | 当前需要补齐的实现 |
|---|---|---|---|---|
| 1 | Ground cost | $c(x,y)=\|x-y\|_2$ | hier_uot、Sinkhorn、MM | 为 baseline、目标评价和 reference 接入同一 norm cost；不能只改 hier_uot 的 cost 参数 |
| 2 | Ground cost | $c(x,y)=\|x-y\|_1$ | hier_uot、Sinkhorn、MM | 同上 |
| 3 | Ground cost | $c(x,y)=\|x-y\|_\infty$ | hier_uot、Sinkhorn、MM | 同上 |
| 4 | Dataset / geometry | Gaussian→ImageNet latent features，$d=30$ | hier_uot、Sinkhorn、MM、HELLO-UOT | 真实 VAE latent，沿用已有 generator，50,000 样本 PCA；不做 post-PCA standardization |
| 5 | Low dimension | TOME，$d=4$ | hier_uot、Sinkhorn、MM、HELLO-UOT | 使用实际 PCA 特征；与默认及高维行使用相同采样细胞 |
| 6 | High dimension | TOME，$d=2048$ | hier_uot、Sinkhorn、MM、HELLO-UOT | 使用已有实际 PCA2048 缓存，不由低维特征拼接或补零 |
| 7 | Reference masses | 沿用 HELLO：两侧独立 `uniform(0.01,1)`，分别归一化到 1 | hier_uot、Sinkhorn、MM、HELLO-UOT | 独立 RNG `seed+1_000_003`，依次生成源和目标质量；所有方法与 reference 使用同一数组 |

**行数与范围**：先实现七行 KL-UOT，即 28 个 Pareto 面板，默认行沿用已有主图。平方 L2 penalty 单独保留为后续扩展，本轮不实现、不运行；其前置问题见下文。维度两行固定 $n$。现有 PCA4/30 使用 2000 HVGs，PCA2048 使用 2048 HVGs，因此高维行是适用范围实验，不能称为严格仅改变维度的消融。

**正文与附录分工**：完整 $7\times4$ 图放附录。正文保留默认 Pareto 与 scaling，generality 简洁总结各设置下精度与耗时的关系，并引用完整曲线；如需要正文代表性 Pareto，再单独选择设置。不强制构造共同精度的耗时/加速比摘要。失败、OOM、超时与缺失 reference 均保留统计分母。

**HELLO-UOT 的覆盖范围核查**：

- 当前论文 adapter `paper_experiments_uot/common/hello_uot.py` 调用历史 FCFW 实现，预热和 cost validation 固定 `l2^2`；实际 FCFW 在 `src/hierarchical_ot/hello/variants/fcfw.py` 中以 `_BilinearCost.from_squared_euclidean` 构造 cost，OTT initializer 也固定 `SqEuclidean`。
- 因而保持平方欧氏 cost 和 KL penalty 时，换数据、维度和正的非均匀 masses 可以纳入 HELLO-UOT：接口已有质量参数，外层使用实际 reference masses。仍需逐类 smoke test，不能把接口支持视为已经测过新配置。
- 三个 norm-cost 行不能直接调用现有 HELLO-UOT 得到正确比较。HELLO 的 balanced solver 支持更广的 cost，不等于现有 UOT 外层、initializer、oracle 与证书已经全部支持这些 cost。理论上可研究接入通用 cost oracle，但需要实现与验证；当前不登记为可直接运行，也不宣称 HELLO-UOT 在算法上不可能处理 norm costs。
- 当前 FCFW 外层是 KL-UOT，平方 L2 penalty 需要更换外层目标、响应和校正问题，不能作为改一个参数即可纳入的原版 HELLO-UOT。

**Sinkhorn、MM 与 L2 penalty 的边界**：

- `common/ott.py`、`common/methods.py` 和 `common/reference.py` 已接入三种 norm cost；未显式指定时保持历史平方欧氏行为。成本类型进入 executable 签名、实例身份与 reference 验收，原始目标的稀疏评价也使用实际 cost。数值可运行性由独立 smoke 验证。
- 已检查当前 POT `ot.unbalanced.mm_unbalanced`：`div='l2'` 对应 half-squared L2 penalty，可以作为 L2 行 MM 的实现来源；现有自写 KL-MM 更新不能直接复用。
- 现有 OTT 的 KL-UOT `tau` 缩放不是平方 L2 penalty 的求解器。L2 行若加入 Sinkhorn，必须使用对应 marginal proximal 的 generalized Sinkhorn，并明确其 coupling 正则化与公共原目标评价；未验证前只承诺 hier_uot 与 L2-MM。
- 平方 L2 penalty 正在单独完成理论与实现：`original_plus` 已接入双侧闭式 proximal、coordinate gain 与 decrease-or-fidelity safeguard；附录 `theory/l2_penalty_extension.tex` 给出相应内外层收敛结果。GPU 正确性与 kernel 优化记录在根仓库 `experiments/l2_pduot_optimization/`；这些开发验证不替代正式 Pareto 实验。
- L2 safeguard 使用稀疏二次目标差与 primal-consistent readout，支持零 transported marginals；不关闭检查来绕过验收。正式实验的目标/对偶评价、reference 审计及 L2-MM adapter 仍待单独接入。
- 已完成单独 L2-MM pilot：根仓库 `experiments/l2_mm_pilot/results/20261114_l2_mm_n4096_my4090/`，My4090、TOME E11.5–E12.5 PCA30、$n=4096$、seed42。四组有效系数 $(0.1,0.1),(1,1),(10,10),(0.1,10)$，实际系数乘以 $n$；两种方法各三档原生容差，另有每组独立全层 FP64 reference 与对偶可行性审计，28/28 任务完成。较高精度区域 hier_uot 更快且 shared gap 更小；MM 粗精度端更快。原始测量、监控与完整 Pareto 已回传，尚未作为正式多 seed 实验或接入公共 adapter，没有替换论文图表。
- KL 和平方 L2 penalty 在相同数值 $\rho$ 下不具有相同的有效强度，尤其单位总质量下该差别随 $n$ 变化。四列可保留对应的弱、默认、强和非对称设置，但 L2 行的系数约定及校准规则须事先固定、列明实际 $\rho$，不机械照搬 KL 四组数值后声称强度匹配。

**公平比较与正式实验规模**：

- 正式固定 $n=m=16384$、单 seed 42、repeat 0。每种方法及 reference 的完整任务时限为 1200 秒；不把此前 pilot 重标为本实验。正式共 500 次方法测量、28 个独立 reference。
- 同 seed 下 TOME 各行复用相同采样细胞，非均匀权重使用独立随机流。成本单位统一为平均成本 1：平方欧氏使用精确全配对均值，其余 norm 使用 65,536 个独立随机配对估计；按成本齐次次数缩放共同坐标，保存原始均值与变换系数，所有方法和 reference 使用同一归一化输入。
- 使用每个实际问题独立构造、审计的 dual reference，所有方法通过原目标 shared gap 比较。L2 行需使用 L2 原目标及对应可行对偶，不能沿用 KL 下界。
- 曲线保留方法各自的五档 tolerance/epsilon 扫描，在相同原始目标与独立下界下比较实际取得的精度和耗时；允许一个方法同时更快、更精确，不要求先达到某个共同 gap。相同 native tolerance 不等于相同精度，不外推未测时间。
- HELLO-UOT 的端到端时间包含其 Sinkhorn 初始化和所有 balanced-oracle 调用；额外记录这两部分，便于解释路线差异。
- 对 hier_uot 记录每层与 finest-level refinement 轮数、实际 full-scan 次数、pricing 时间及占总时间比例、支持峰值和最终 shared gap。正文不用再加完整诊断大表，附录按行汇总即可。
- 小规模 smoke 保留全部七行与实际 $d=2048$，使用 $n=128$、一组 penalty、每方法一档，共 25 次方法测量和 7 个 reference。单独降低粗层阈值到 16 以覆盖层间初始化与支持更新。my4090 smoke 关闭 GPU 外来进程监控，不能作为正式性能证据；正式实验保持默认监控。本轮只运行 smoke，不启动 500 次正式测量。

**已有 pilot 的作用**：2026-11-14 的 `general_cost/results/20261114_marginals_{uniform,lognormal1,lognormal3,unequal}_my4090` 在 TOME PCA30、$n=4096/16384$、四组 KL penalty、seed 42 上共 32/32 收敛，原问题 KKT 均不超过 $10^{-6}$。这证明所测正权重配置可运行，不能替代新七行协议的正式比较。固定 epsilon 下 Sinkhorn 自身的变慢比例与跨方法 Pareto 优势是不同的统计。

**新入口的 smoke**：`paper_experiments_uot/generality/results/20261114_generality_smoke_final_my4090` 在 RTX 4090 完成 25/25 次方法测量与 7/7 个独立 reference；25 个 shared gap 均有效，最大 reference KKT 为 $9.93\times10^{-9}$ 以下。全部输入、reference、原始日志与结果已回传，并在 im2 原样重定位汇总。监控关闭，结果仅用于流程与收敛检查，正式 500 次测量尚未启动。

首次尝试的 `finest_fp64` reference 在 norm 粗层出现约 $1.4\times10^{-8}$ 的停止停滞，已保留中止日志；随后完成批次临时使用全层 FP64 reference。2026-11-14 按作者要求，后续 reference 已恢复为 `finest_fp64`，不再以全层 FP64 绕过粗层停止问题。粗层停止逻辑与最终 finest-level FP64 证书精度分开处理；恢复后的 reference 配置尚未重新完成 smoke，历史 7/7 成功不能视为该配置已验证。旧 OTT 的 infinity-norm cost 接口兼容问题已修复。

**对应审稿意见的证据分工**：

1. 新数据集、cost、维度和质量行回答“优势是否只存在于某种 30 维细胞嵌入”。定价次数和时间占比进一步回答性能对完整扫描与问题几何的敏感性；只增加 Pareto 行数不能替代这些诊断。
2. 新数据、维度和非均匀质量行包含 HELLO-UOT，用完整端到端 Pareto 曲线比较精度与耗时。只在新配置上胜过 Sinkhorn/MM，不能直接回应“相对 HELLO-UOT 的路线优势能否推广”。
3. L2 penalty 行建立更广的 penalty 适用能力，但不替代 KL-UOT 上与最近邻方法的比较。
4. 泛化图不能单独证明相对 HELLO 的原创性。它补强的是求解路线的实用价值；方法与理论的新内容仍须由正文讲清。
5. 附件中另外两项疑问仍单独保留：同 support、同 warm start、共同精度下的 PDUOT/PDCS 对照；能触发 safeguard 并改变后续行为的诊断例子。不能将泛化实验完成写成这些问题已解决。

若各设置下的精度与耗时优势成立，尤其最近邻 HELLO-UOT 的比较成立，这组设计能回应适用范围与性能可复现性的质疑；不能预先把计划当作结果，也不能据此保证模拟审稿中的某个分数。

### E23：更多 UOT baselines——按方法分开展示

2026-11-15 确定：ETM、POT L-BFGS-B 和 MultiScaleOT 放入独立附录比较，不强制使用相同规模或维度。每个方法各一组 $2\times2$ Pareto 图，对应四组既有 KL penalty；三组横向并排，形成 $1\times3$ 的组合图。每组内 hier_uot 与该 baseline 使用相同输入和独立 reference，不能跨组直接解读运行时间差异。

| Baseline | 后续计划 | 已有 pilot 与实现 | 论文安排 |
|---|---|---|---|
| ETM-Approx+HELLO | TOME PCA30，优先 $n=16384$；若 $n=32768$ 可完成且结果适合，再考虑加入正文 | PyTorch/CUDA FP64 等价实现 ETM-Approx，末尾 balanced OT 改用 HELLO；$n=4096$、四组 rho、四档 epsilon 已完成；后续大规模实现使用 online cost | 当前附录第一组使用 $n=4096$ pilot 占位，后续替换为 $n=16384$；不能把计划写成已完成 |
| POT L-BFGS-B | 保留小规模；以 $n=4096$ 为起点，必要时用 $n=1024$ 补完整四组扫描 | 官方 POT 0.9.7.post1 CPU FP64，coupling 正则为零；$n=4096$ pilot 仅完成两个 baseline 配置后按作者要求停止 | 当前附录第二组保留实际有效点，未完成的 penalty 面板明确标记；不将原生停止等同于原 UOT 小 gap |
| MultiScaleOT | TOME PCA3，$d=3$，当前 $n=4096$ 可用于布局预览；后续规模另定 | 官方 0.3.8 算法的稀疏迭代移植为 PyTorch/CUDA FP64；保留 CPU 层级、截断、吸收、epsilon schedule 和停止规则；四组 rho × 三档 epsilon，12/12 成功 | 附录第三组使用 GPU 移植版对比 hier_uot，维度单独标注；不将当前低维实现范围写成 UOT 问题定义的限制 |

**来源与实测范围**：

- ETM：`accuracy_runtime_pareto/results/20261114_etm_pilot_v7_my4090/summary.csv`；小规模边际估计阶段的 95.2–109.8 倍加速见上文 `port_speed.json`。补充 $n=32768$ 的短程测试：$\rho=(1,1)$、epsilon=0.01、5 轮，官方 NumPy 106.940 s、CUDA online 2.181 s，约 49.0 倍；两侧势最大差 $4.54\times10^{-15}$。数据为 `experiments/etm_online_profile/results/20261115_short32768_my4090/metrics.json`；NumPy 使用预建成本，CUDA 重算分块成本，未用到的 slack 输出与 HELLO 均排除。第二遍按作者要求中止，仅首遍是有效测量。论文采用“边际估计获得几十倍加速”的概括，不将其写成整个 ETM+HELLO 流程的加速比。
- POT：`accuracy_runtime_pareto/results/20261115_pot_lbfgsb_pilot_v2_my4090/{summary.csv,stop_summary.json}`；仅两个完成点，后续队列已取消，不伪造剩余曲线。
- MultiScaleOT：`accuracy_runtime_pareto/results/20261115_lowdim_my4090/lowdim_baselines/{summary.json,multiscale_equivalence.json,multiscale_torch_manifest.json}`。同机 CPU/GPU 加速 2.21–5.02 倍，包含 CPU 结构、控制和传输；12 个配置的最终支持完全一致，最大 coupling 元素差 $9.25\times10^{-16}$。该阶段已有独立 reference 与 GPU 监控，不混入 A100 主图。
- 三组均为 RTX 4090 主机上的 seed 42 pilot；正式比较的 seed/repeat 尚未追加，本轮只修改文档和图文，不启动实验。
- FRLC 修复探索、GeomLoss online 和 NFFT 尚不纳入这张三组图；保留各自验证/失败日志，不将候选调查记为正式性能结果。

**当前占位**：附录 `app:uot-supplementary-baselines` / `fig:uot-supplementary-baselines` 使用实际 pilot 数据预览三组并排布局，POT 未完成面板保留 pending 标记；图注明确为 provisional pilot。固定绘图数据与来源指纹保存在 `figures/plot_sources/supplementary_baselines_pilot.json`，复现脚本为 `scripts/plot_supplementary_baselines.py`。附录 `app:implementation-extra-baselines` 说明 ETM 和 MultiScaleOT 的移植范围及实测加速。

## 下一轮工作顺序

1. E03 图、正文和精度表的数据版本已统一，E02/E17 重画已有固定来源；继续恢复或确认 E01 的来源。
2. 对齐最终协议，重跑主表、完整问题 Pareto、scaling、HELLO-UOT 中的 hier_uot、组件消融及敏感性；复用仍然有效且已审计的独立 reference。
3. 用现有 PDUOT 快照补 E09 的 $J$ 敏感性 CDF；PDCS matched warm start 则先完成实现验证，再跑 E06-C。
4. 更新 entropic、UFGW 和下游 hier_uot 相关结果，最后统一正文统计、图表、caption 与 provenance。
5. 按 E22 七行配置完成 norm-cost adapters 和 HELLO-UOT 新输入的 smoke，再安排正式任务。L2 penalty 路径单独讨论与验证。

这些是待办顺序，不表示已经申请 GPU 或启动任务。本会话禁止使用 7 号卡；正式计时按项目实验规范安排资源。

## 如何维护这份清单

- 每个新批次保存 config、manifest、源码/输入指纹、逐次 metrics，以及全部计划任务的成功/失败分母。
- 每项更新同时记录：新批次路径、实际开关和精度、成功/计划数、reference 状态、是否已替换论文图表。
- 结果已算完但图文未更新时，状态写“完成测量，待接入”，不要直接写“完成”。
- 重跑原因消除后，再同步清理对应的 `\xwz{}` 注释；保留旧批次为历史记录，不覆盖或重标旧配置。
