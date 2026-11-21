# hier_uot 论文实验重新梳理

更新日期：2026-11-21（同步百万规模基线对比 Table 3 / E.4 实测合入状态；保留 S02/S03/S05/A02/Epsilon sweep/UFGW/L01 的五-seed 正式记录及 Temporal transport GPU BCSR 评估待合入提醒）。

## 统计约定与当前论文的 seed 覆盖

全文默认每个配置在五个独立随机种子上各测量一次并取均值；当前图表的例外集中展示在附录 Reporting 的 `tab:experiment-seed-coverage`。下表登记的是**当前嵌入论文的图表**，不是最新批次已经产生但尚未替换的结果。源码在相应图表旁用 `% \xwz{SEED COVERAGE: ...}` 保留补跑提醒与统计口径，已有数据来源注释继续保留。

| 实验／图表 | 当前论文的实际覆盖 | 后续工作 |
|---|---|---|
| S01 默认 Pareto，`fig:uot-runtime-accuracy` | 四个展示方法共 373/400 次测量有效；75 个绘制点中 74 个为五 seed 均值，一个 HELLO-UOT 点为三 seed 均值 | 队列已结束，最新耗时、gap、显存均已固定并替换论文图；失败、超时和策略跳过保留记录 |
| S02 scaling，`fig:uot-large-scale` | seeds 42--46，100/100 求解及 reference 有效（`scaling_final_20261119.json`） | 2026-11-21：百万规模主表和附录已用实测快照替换占位值（`tables/million_comparison.json`）。现已取消旧单点补测 `exp-9aa596626e`，提交 seed 42 三档调参扫描 `exp-e5d2c15d43`（`20261121_zhuang_million_baselines_sweep_seed42`，24 项新测）；完成后与已有 seed 42 中间档复用合并（见下文 S02 说明）并按最小 Gap 选优更新 Table 3 / Table 8 / D.4.2 |
| S03 generality，`fig:uot-generality` | seeds 42--46，2,339/2,500 有效测量（`generality_final_20261120.json`） | 已完成两轮 timing repair 并替换论文图与 E.2 几何平均加速统计 |
| S04 补充 baseline，`fig:uot-supplementary-baselines` | seed 42；中间组已换为 n=32768 的 AdNS-UOT/Salut，各 20/20 个点；另两组保留 pilot | 待按需补跑五 seed；不同组规模、硬件已分别标注 |
| S05 HELLO-UOT 专项表和轨迹 | seeds 42--46；正文 Table 2 与附录 E.3 轨迹均已统一至同一批次 `20261119_hello_tolerance_table`（`hello_tolerance_table_20261120.json` / `hello_comparison_final_20261120.json`） | 已完成并严格对齐 |
| P01 restricted runtime CDF，`fig:restricted-runtime-cdf` | 四组 penalty 分别为 108/106/119/100 个固定快照，来自 8/7/5/8 个父 seed；每方法每快照一次 | 正式测量已补齐，433/433 个 reference 有效，1,724 项达标、8 项 MM 正常超时；图和统计已更新；统计单位为相关快照，不是五 seed 均值 |
| A01 system components，`tab:component-settings-mock` | seeds 42--46，五组消融（含 2026-11-20 重跑的 Panel D）正式均值（`component_ablation_20261120.json`） | 已完成 |
| A02 sensitivity，`tab:uot-parameter-sensitivity` | n=262144、seeds 42--46，180/180 成功，含 `J=64` 与 refinement safeguard（`parameter_sensitivity_20261120.json`） | 已更新为五 seed 正式表 |
| A03 runtime breakdown，`fig:uot-runtime-breakdown` | 四规模、四组 penalty、五 seed，80/80 clean profile 及配对对照完成 | 已替换为正式 A100 图及结果 |
| A04 PDUOT CDF，`fig:pduot-component-ablation-cdf` | 四个 penalty 分别为 108/106/119/100 个快照，来自 8/7/5/8 个父 seed；每变体每快照一次 | 已完成固定 corpus 设计；统计单位是相关快照，不改写为五 seed 均值，不因默认声明增加重复 |
| A05 weight budget / safeguard，`fig:pduot-weight-budget` | seeds 42–46，180/180 收敛 | 五 seed 已完整；保留均值与样本标准差，属于迭代数诊断，不作为耗时证据 |
| A07 sparsification，`fig:uot-sparsification-scaling` | 每个固定输入五次计时取中位数，360 条记录 | 当前保留 repeated-timing 例外；若改成独立 seed 均值，须重新采样并测量，不能重标旧数据 |
| Entropic Pareto，`fig:entropic-runtime-accuracy` | seeds 42--46；20 个 reference、320 次方法测量全部成功，64 个点均为五 seed 均值 | 正式图、caption、正文与附录协议已更新；圆点 fixed、叉号 auto，替换历史 direct-reuse 图 |
| Epsilon sweep，`fig:entropic-epsilon-accuracy` | seeds 42--46，四个 penalty × 七个 epsilon，140/140 成功（`entropic_epsilon_sparse_20261120.json`） | 已更新为五 seed 正式图与 E.4 正文统计 |
| UFGW solver 表和轨迹 | seeds 0--4，两个 epsilon × 两个算法，20/20 成功（`ufgw_solver_comparison_20261120.json`） | 已更新正文 Table 5 与附录 E.5 五-seed 均值轨迹图 |
| Temporal accuracy / timing | 当前论文已切换至 `20261117_paper_data_moscot_time`（seed 42，19 对，含 `J=64` 与 safeguard，评估为 CPU SciPy CSR，`moscot_time_20261120.json`） | **待更新（已入队）**：`worker.py` 已改用 GPU JAX BCSR 评估（`moscot_API_jax_BCSR_GPU`，`E3.5` 验证 `max transition diff = 0.0`）；已提交 `exp-38bf672bbd`（`20261120_paper_data_moscot_time_seeds43_46`，380 任务，含 `Salut-Sinkhorn` 与 4 个 `ULOT` rank 的 seeds 43--46）和 `exp-31fb1de861`（`20261120_paper_data_moscot_time_seed42_gpueval`，19 任务，seed 42 的 `Salut-Sinkhorn` GPU 评估）。**两批跑完后，需合并确定性 full-rank `Sinkhorn`（seed 42）与 5-seed 随机方法（seeds 42--46），重画正文 Fig. 6 和附录 E.6，同步更新加速比/评估描述及去掉 D.4.5 的单 seed 说明** |
| MOSTA，`tab:ufgw-application` | seed 0，七个 time pairs | 五 seed 批次 `exp-ac67241785`（`20261120_moscot_hierot`）当前 `needs_attention`（66 accept / 4 needs_repair），修复完成后替换 Table 6 |
| L01 squared-L2 | 正式 Pareto（`l2_pareto_20261120.json`）、generality（`l2_generality_20261118.json`）、scaling（`l2_scaling_20261120.json`）均为五 seed 正式图 | 已全部合入附录 G |

主文只保留一次默认统计声明，并指向附录 Reporting；正文 caption 不重复列举缺失 seed。附录 Reporting 保留当前实际覆盖，源码注释保留待补任务。补跑完成后，先替换实际图表，再更新覆盖表及本清单；不将超时、OOM、失败或跳过的 seed 计为有效均值样本。

本文按论文论证职责重新组织实验，目前已整理 Salut、PDUOT 和 Analysis，并将平方 L2 边际惩罚独立为第五板块。原始清单 [EXPERIMENT_PROGRESS.md](EXPERIMENT_PROGRESS.md) 保持不变；运行状态及详细来源沿用旧清单，本轮不启动实验。

## 总体分类

| 板块 | 主要问题 | 本轮范围 |
|---|---|---|
| Salut | KL-UOT 下完整方法的精度、效率、规模与适用范围如何？ | 本轮整理 |
| PDUOT | KL-UOT 固定受限问题上的核心求解器性能如何？ | 本轮初稿，展示安排待讨论 |
| Analysis | KL-UOT 组件、参数及理论保护如何影响算法？ | 本轮初稿，展示安排待讨论 |
| Extensions and Applications | 如何扩展到 entropic UOT、UFGW，并获得下游效果？ | 后续整理 |
| Squared-L2 Marginal Penalties | 平方 L2 边际惩罚下，整体方法、受限求解器、分析及应用分别如何表现？ | 独立板块，先迁入已有记录 |

新编号按板块独立设置，Salut 使用 S01–S05，PDUOT 使用 P01 等，平方 L2 板块使用 L01、L02 等；旧 E 编号只作为追溯标识。2026-11-15 将 Salut 保留实验连续编号：原 S05 → S04，原 S06 → S05；原 S04 已迁为 L01，原 S07 已移除。正文／附录是展示安排，与实验是否完成分开记录。

## Salut：KL-UOT 整体性能

### 论证顺序与展示安排

先用默认设置的 runtime–accuracy 比较建立整体性能，再用 scaling 展示大规模求解能力，最后检查这些观察是否适用于其他问题设置。补充 baseline 和 HELLO-UOT 专项比较用于展开正文无法容纳的证据。

| 新编号 | 实验 | 旧编号 | 展示安排 | 当前定位 |
|---|---|---|---|---|
| S01 | 默认问题的 runtime–accuracy Pareto 与显存比较 | E02 | 正文 | 核心方法比较 |
| S02 | 样本规模、耗时、显存与解精度 | E03 | 正文 scaling 与 gap 范围；移除详细精度表 | 核心规模证据 |
| S03 | 跨 cost、数据、维度和 reference masses 的比较 | E22，合并 E21 | 正文简述；附录完整曲线 | KL-UOT 适用范围 |
| S04 | 更多 UOT baseline 的补充比较 | E23；E02 中的 ETM pilot | 附录；ETM 是否进入正文另议 | 按方法分别选合适规模和维度 |
| S05 | HELLO-UOT 原生停止与轨迹专项比较 | E04 | 附录 | 补充 S01，区别于容差扫描 |

### S01：默认问题的 runtime–accuracy Pareto

**问题**：在同一个原始 KL-UOT 目标下，Salut 相对于主要求解路线的精度与端到端耗时如何？

- **正文内容**：四组 marginal penalty 设置的 Pareto 图，顶部显存柱状图兼作方法图例。当前正文选择 Salut、HELLO-UOT、Sinkhorn、MM；ULOT 移至 S04，原始测量与完整汇总保留。
- **比较口径**：扫描各方法的原生容差、熵系数或 rank，以原始 UOT 目标及独立可行 dual reference 计算 shared gap；同一 native tolerance 不代表同一精度。完整计入各方法必要的初始化和求解工作。
- **已有记录**：`paper_experiments_uot/accuracy_runtime_pareto/results/20261111_202336/`。旧清单最新详细记录称，2026-11-14 固定图源的 93 个有效曲线点各有 3–5 个有效 seed，尚非全部完成的五 seed 汇总。旧清单早期表格中的“只有 seed 42”是较早快照，不能当作当前批次状态。
- **最新完成（2026-11-19）**：`exp-25638bff6e` 已结束；批次 `accuracy_runtime_pareto/results/20261115_222712_hello_memory_replay/` 中，Salut、MM、Sinkhorn、HELLO-UOT 分别有 100/100、90/100、95/100、88/100 次有效时间/gap 测量。四个展示方法共 75 个均值点，其中 74 个为完整五 seed，一个 HELLO-UOT 点为三 seed；其余测量的失败、未收敛、超时或策略跳过均保留。ULOT 原始记录保留，继续不绘制。
- **论文更新**：重新 collect 后固定为 `figures/plot_sources/pareto_complete_20261119.json`，替换 `fig:uot-runtime-accuracy`；HELLO-UOT 的曲线与显存统一采用阶段完整补测。正文 HELLO-UOT 的 penalty 耗时波动由 $16.5\times$ 更新为 $16.6\times$，其他主要定量结论不变；逐项计算见 `pareto_comparison_analysis_20261119.json`。ETM 等额外 baseline 仍归 S04。
- **追溯**：旧 E02；正文 `fig:uot-runtime-accuracy`。
- **HELLO-UOT 显存**：最新图采用全部 18 个已绘制配置的有效 seed 均值之最大值，得到 0.53376 GiB，图中显示 `0.53`，不加星号；附录 Reporting 已同步。此前只更新显存、保留旧曲线的过渡图源 `pareto_memory_20261119.json` 保留归档。
- **单项异常退出补测（2026-11-19）**：原批次 $\rho=(0.1,0.1)$、seed 42、inner tolerance $10^{-8}$ 的 `SIGTERM` 退出已写入带原指标 SHA256 的重跑审阅。旧队列清单只覆盖历史显存补测范围，未包含该点；现另建精确单项补测批次 `accuracy_runtime_pareto/results/20261119_hello_uot_seed42_tol1e8_repair/`，任务 `exp-bf87ce2389`，活动队列最高优先级。原生 dry-run 验证保留 24 项、仅排入该 1 项方法测量、不重跑 reference；输入、算法参数及 reference 均沿用原记录。完成后核验并回填原图源，目前论文仍使用上一份固定汇总。

### S02：样本规模、耗时、显存与解精度

**问题**：完整 Salut 能否在单 GPU 上扩展到每侧两百万点以上，时间和峰值显存如何随规模变化，同时是否保持求解精度？

- **正文内容**：runtime 和 peak memory 随规模变化的图，以及多百万点的实际求解能力。
- **新增待跑（2026-11-16）**：扩展至每侧 $m=n>2{,}000{,}000$（至少加入 $2^{21}=2{,}097{,}152$），覆盖现有四组 penalty，沿用最终 safeguard、五 seed、计时与显存统计协议，并保存逐项 shared gap。完成后更新 `fig:uot-large-scale`、scaling 拟合及正文最大规模、耗时、显存和精度范围，支撑 “Scaling to millions with linear memory”。
- **精度呈现**：移除 `tab:uot-scaling-accuracy` 及相应附录小节，在正文简述 20 个实例的 shared gap 范围 $5.44\times10^{-7}$–$7.01\times10^{-5}$；逐项数值继续保留在原始归档。
- **已有记录**：`paper_experiments_uot/main_scaling/results/20261103_181943_paper_data/`。当前图文已统一到此归档；20/20 求解及 reference-based gap 有效，但仅一个 seed，且关闭 refinement safeguard。
- **下一步**：按最终 safeguard 和正式计时协议重跑，补齐五 seed。保留旧数据为历史测量，不把完成图源对齐等同于完成协议更新。
- **补测恢复（2026-11-19）**：`exp-b4f4878adb` 保留已验收的 198 项调度结果，仅恢复两个因旧控制计划直接创建已有目录而失败的方法任务：百万点、seed 46、$\rho=(0.1,0.1)$ 与 $(1,1)$。恢复回调已更新为先归档旧输出再启动；现已入队，优先级第 3，待完成后更新五 seed scaling 图。
- **解释边界**：线性存储保证与实测 runtime scaling 分开陈述；完整 pricing 每次仍有平方级点对工作。
- **百万规模基线对比（2026-11-21）**：正文 `tab:million-scale-baselines`（$\rho=(0.1,0.1)$）与附录 E.4 `tab:million-scale-baselines-appendix`（四组 penalty）已合入实测结果，来源固定于 `tables/million_comparison.json`（含 `scaling_final_20261119.json` 及三批基线）。已取消旧 `exp-9aa596626e`，新提交 seed 42 三档全参扫描 `exp-e5d2c15d43`（配置 `config_zhuang_million_baselines_sweep_seed42.yaml`，批次 `20261121_zhuang_million_baselines_sweep_seed42`，24 项任务，`hello_uot` 开启 `memory_diagnostics=True`，关闭 `skip_stricter_after_timeout`）。跑完后按如下映射合并复用，再按各组最小 `shared_gap` 选优并更新 Table 3 / Table 8 / D.4.2：
  - **`ott_online`**（`[1e-2, 1e-3, 1e-4]`）：`1e-2, 1e-4` 取自 `20261121_zhuang_million_baselines_sweep_seed42`；复用 `1e-3`（$\rho=(0.1,0.1)$ 取自 `20261120_180336_881185_infra`，其余三组取自 `20261120_212454_277339_infra`）。
  - **`ulot`**（`[128, 256, 512]`）：`256, 512` 取自 `20261121_zhuang_million_baselines_sweep_seed42`；复用 `128`（$\rho=(0.1,0.1)$ 取自 `20261120_180336_881185_infra`，其余三组取自 `20261120_212454_277339_infra`）。
  - **`hello_uot`**（`[1e-4, 1e-6, 1e-8]`）：`1e-4, 1e-8` 取自 `20261121_zhuang_million_baselines_sweep_seed42`（带实测峰值显存）；复用 `1e-6`（$\rho=(0.1,0.1)$ 取自 `20261120_180336_881185_infra`，其余三组取自 `20261121_143431_900071_infra`）。
  - **`hier_uot`**：直接复用 `figures/plot_sources/scaling_final_20261119.json`（seeds 42--46）。
- **追溯**：旧 E03；正文 `fig:uot-large-scale`，逐项精度来源为归档 `scaling_accuracy.csv`。

### S03：KL-UOT 的跨问题设置比较

**问题**：S01 的性能观察是否依赖默认的 TOME、30 维特征、平方欧氏 cost 和均匀质量？

- **正文内容**：简洁概括各设置下的观察，引用附录；是否挑选代表性面板待结果和篇幅确定。
- **附录内容**：七行、四组 penalty 的完整 Pareto 图。默认设置沿用 S01，不重复绘制。

| 改变因素 | 已记录的设计 | 计划方法 |
|---|---|---|
| Ground cost | L2、L1、L-infinity 三行 | Salut、Sinkhorn、MM |
| Dataset / geometry | Gaussian → ImageNet latent features，d=30 | Salut、Sinkhorn、MM、HELLO-UOT |
| Low dimension | TOME，d=4 | 同上 |
| High dimension | TOME，d=2048 | 同上 |
| Reference masses | 两侧独立采样正的非均匀质量，分别归一化到 1 | 同上 |

- **已有协议**：旧 E22 已记录 n=16384、seed 42、单次测量、1200 秒时限的七行设计，共 28 个 reference 和 500 次方法测量。已确认保留其单 seed 覆盖协议，作为附录 Reporting 中的明确例外，不自动改成五 seed。
- **已有验证**：`paper_experiments_uot/generality/results/20261114_generality_smoke_final_my4090/` 完成 25 次方法测量和 7 个 reference，仅为流程验证。随后 reference 恢复 `finest_fp64` 配置，该恢复后的配置尚需验证；此前全层 FP64 smoke 成功不能替代它。
- **当前结果（2026-11-16）**：`paper_experiments_uot/generality/results/20261116_045442/` 共 500 个计划方法测量；当前嵌入论文的汇总含 440 个有效 runtime-gap 配对，全部 28 个面板均有有效点。两个先前被 GPU 干扰拒收的 reference 已补跑；恢复记录按实例的 `reference_source_digest` 校验，原失败及监控记录保留。
- **更新（2026-11-18）**：论文图采用 `20261117_paper_data_generality_hello_ot_5seeds` 的固定部分汇总；排除六条审核计时后为 1,654/2,500 个有效测量、468 个均值点，28 个面板都有结果。图源 `figures/plot_sources/generality_20261118_reviewed.json`。六条原始记录保留，通过 `measurement_review.json` 标为待补测；`paper_experiments_uot/generality/diagnostics/reviewed_retry_20261118.json` 记录当前轮结束后的自动 infra 续跑。
- **补测恢复（2026-11-19）**：去重并检查当前原始指标后，旧队列的 12 条待修复状态中，仅有两项仍实际失败；其余对应记录已成功或正常超时。`exp-26b026c0a6` 已重新入队，优先级第 4；原生计划保留 2,498 项方法终态及全部 140 个 reference，仅补测 nonuniform、$\rho=(0.1,0.1)$、seed 42、HELLO-UOT inner tolerance $10^{-8}$，以及 ImageNet、$\rho=(0.1,0.1)$、seed 44、inner tolerance $10^{-4}$。前者系数优化耗尽 200 轮时明确记为未收敛；后者最多四次逐档收紧 oracle 精度，仍保留原验收阈值并记录实际额外调用。成功结果与正常超时不因旧失败队列项而作废。完成后再汇总更新图源。
- **下一步**：继续核查被干扰的计时、超时、OOM 和 HELLO-UOT oracle 失败；保留单 seed 覆盖设计，不将被拒收记录或先前 smoke 重标为有效正式结果。
- **解释边界**：高维行与默认行的 HVG 选择不同，不称为严格只改变维度的消融。当前 HELLO-UOT adapter 不支持三种 norm cost，这限制当前比较覆盖，不代表理论上无法扩展。
- **追溯**：旧 E22；E21 已并入此项，不再作为独立实验重复安排。

### S04：更多 UOT baselines

**问题**：除 S01 主要方法之外，与其他直接或稀疏 UOT 路线的比较如何？

- **展示安排**：附录三组各自的 2×2 penalty Pareto 图。各组内输入和 reference 一致，组间规模或维度可以不同，不跨组直接比较时间。

| Baseline | 已有记录 | 后续安排 |
|---|---|---|
| ETM-Approx+HELLO | n=4096、四组 penalty 的 CUDA FP64 pilot 已完成 | 优先 n=16384；是否进入正文待正式结果确定 |
| AdNS-UOT | n=32768、d=30、seed42、四组 penalty × 五档 tolerance，20/20 成功；匹配 Salut 20/20 点 | 已替换原 POT L-BFGS-B 中间组；固定单线程 CPU 与 A100 GPU 对比，保留单 seed 口径 |
| MultiScaleOT | d=3、n=4096 的 GPU 移植 pilot；12/12 配置完成 | 正式规模待定，标明 CPU 结构操作与 GPU 移植范围 |
| ULOT | S01 原始批次保留四组 penalty 的 rank 扫描与显存记录 | 移至本项，后续确定附录布局；不删除或停止其运行记录 |

- **现有图**：`fig:uot-supplementary-baselines` 的中间组已替换为 AdNS-UOT；`paper_experiments/adns_uot/results/tome_appendix_n32768_seed42_cpu2_20261116_v2/salut_comparison.json` 提供 40 个有效时间/gap 点，固定图源记录 SHA256。AdNS 扫描 $10^{-1},\ldots,10^{-5}$，9 项原始结果从 v1 复用，不改耗时；原 POT 图源另存 `supplementary_baselines_before_adns.json`。ETM/MultiScaleOT 两组冻结数据不变。
- **内存**：当前 AdNS 实现存储完整 FP64 成本，n=32768 时矩阵为 8 GiB；公共评价前进程峰值约 8.10 GiB，包含加载及求解，不是净工作区，不与 GPU allocator 峰值混用。
- **下一步**：本次附录单 seed 扫描已完成；ETM/MultiScaleOT 的后续范围另行确定，不将不同规模或硬件的组间耗时作直接速度比较。
- **追溯**：旧 E23；ETM 的早期记录另见 E02。完整来源继续查旧清单。

### S05：HELLO-UOT 专项比较

**问题**：直接受限 UOT 求解与反复 balanced-OT oracle 路线，在最终原生解、完整耗时及优化轨迹上有什么差别？

- **展示安排**：附录保留三个规模的完整表；轨迹只展示 n=131072 的四组 penalty，按附录单栏正文宽度横排。S01 已包含其 Pareto，不在正文重复展示专项子表。
- **Calls 指标**：HELLO-UOT 统计完整 balanced HELLO 求解次数（含初始化），Salut 记一次完整 UOT 求解，不计其内部 PDUOT 调用。按四组 penalty 顺序，n=32768 为 46/3/3/61，n=65536 为 40/3/3/61，n=131072 为 36/2/2/59。数据来自 summary 的 `hello_oracle_calls`，与原始 metrics 的 `oracle_calls` 对齐。
- **已有记录**：`paper_experiments_uot/hello_uot_comparison/results/20261111_formal_four_rho/`，配套 reference 为 `20261111_reference_four_rho/`。12 个实例、24 次原生求解，reference 已审计；旧 Salut 关闭 safeguard。
- **下一步**：更新 Salut 的最终协议结果，并补齐正式 seed。HELLO-UOT 和 reference 不仅因 Salut 控制器改变而自动失效，但旧计时能否正式复用仍需核对监控协议。
- **正式重跑已提交（2026-11-19）**：配置 `hello_uot_comparison/config_paper_data.yaml`；任务 `exp-5a724f2cd7`，批次 `hello_uot_comparison/results/20261119_014027_846890_infra`。三个规模、四组 penalty、五 seed，共 60 个实例、120 次方法求解及 60 个独立 reference；使用完整 safeguard、最终原生解和受监控正式计时。活动队列第二优先级，仅次于主 Pareto 补测；完成后同步更新正文 `tab:hello-uot-main`、附录完整表与轨迹。
- **修复与恢复（2026-11-19）**：120 次方法测量已验收；此前 60 个 reference 因请求缺少 `metadata` 退出。已修正新请求构造，并为旧控制检查点重建带完整 metadata 的恢复回调，原始失败输出移入独立尝试目录。已恢复全部 60 个 reference，优先级第 2；不重跑已成功的方法测量。
- **比较口径**：使用最终原生解和完整时间，不恢复历史 first-crossing 时间，也不将本项重标为完整容差扫描。
- **追溯**：旧 E04；附录 `tab:hello-uot-complete`、`fig:hello-uot-trajectories`。

### 已移除：固定规模比较表（原 S07）

2026-11-15 决定移除 S07（旧 E01），不再编译 Fixed-Size UOT Comparison 部分；原 `appendix_uot_comparison.tex` 已合入 `main_appendix.tex`，其中 supplementary baselines 和 generality 章节继续保留。S01 的 Pareto 与显存面板、S02 的 scaling 已承担对应论证职责。历史源码和来源核验记录保留，不安排该表的专门补测。

### 本轮暂不放入 Salut 性能板块的实验

- E05 固定支持上的 solver 比较归 PDUOT。
- E06 系统组件消融（含替换 PDUOT 后端）归 Analysis：它回答设计的作用，不是独立方法性能排名。
- E07–E13 的内部消融、理论保护、参数和 Spar 测试，以及 E19 通用耗时分解归 Analysis。
- E14–E18、E20 归 Extensions and Applications；应用内的专属 timing breakdown 随应用保留。

### 下一步需要逐项确定的安排

1. S01/S02 保持正文核心；确认 S03 正文是否需要代表性图，还是只给简述与附录引用。
2. 明确 S03 的单 seed 例外是否继续保留；平方 L2 路线在第五板块独立确定范围。
3. 确认 S04 各方法的正式规模，以及 ETM 是否值得加入正文主比较。
4. 原 S07 已移除，不再投入该表的恢复与重跑工作。

## PDUOT：KL-UOT 受限求解器性能

### P01：受限求解器 runtime CDF（旧 E05）

- **正文**：四组 penalty 的 runtime CDF，比较 PDUOT、PDCS、MM、Sinkhorn 达到 shared gap $10^{-4}$ 的耗时和比例；附录说明协议。
- **设计**：复用旧 E07 的 433 个受限快照，各方法标准 cold start，共用独立受限 reference；未达标问题保留 CDF 分母。
- **状态**：正式测量已补齐，433/433 个 reference 有效，1,724/1,732 项达标；PDUOT、PDCS、Sinkhorn 各 433 项达标，MM 为 425 项达标、8 项正常超时。所有快照保留 CDF 分母。2026-11-17 在 GPU 6 手动补算唯一失败的 reference，self-gap 为 $1.20\times10^{-8}$，仅作正确性证书；随后恢复 infra 实验 `exp-ab05b15e3c` 并置于 generality 前，四个缺失方法均在监控下成功补测，质量为 `clean`，未重跑已有成功或正常超时项。
- **结论**：同快照且双方达标的配对中，PDUOT 相对 PDCS/MM/Sinkhorn 的几何平均加速为 153.20/39.54/16.23 倍，配对数为 433/425/433；正文取整为 153/40/16 倍。四组 penalty 的成功项平均耗时最大/最小比分别为 PDUOT 1.69、PDCS 2.16、MM 324.67、Sinkhorn 78.15，正文为 1.7/2.2/325/78 倍。
- **入口与图源**：`paper_experiments_uot/restricted_solver_runtime_cdf/results/20261116_135140/`；论文副本为 `figures/restricted_solver_runtime_cdf.pdf`，标签为 `fig:restricted-runtime-cdf`。完整数据、CDF、配对统计、补测审计及文件哈希固定在 `figures/plot_sources/restricted_solver_cdf_20261117.json`；补测前版本保留为 `restricted_solver_cdf_20261117_before_reference_repair.json`，原预览记录和旧 Pareto 仍保留。
- **剩余工作**：无；八项 MM 正常超时保留，不作为故障补跑。手动 reference 审计见其目录的 `manual_rerun.json`；四项干净测量的 infra 任务为 `exp-ab05b15e3c/2/77`--`80`。旧失败尝试保留在原批次 `attempts/`。

## Analysis：组件、参数与机制分析（讨论初稿）

正文 Component Analysis 依次展示 PDUOT 内部组件消融图和 Salut 系统组件消融表，各配一个 paragraph；详细协议及其余分析放附录。编号按论证内容组织，运行状态沿用旧清单，未启动新实验。

| 新编号 | 实验 | 旧编号 | 建议展示 |
|---|---|---|---|
| A01 | Salut 系统组件消融 | E06 | 正文 |
| A02 | 超参数敏感性 | E12 | 附录 |
| A03 | 完整求解耗时分解 | E19 | 附录 |
| A04 | PDUOT 内部组件消融 | E07 | 正文图，附录保留协议 |
| A05 | Primal-weight 预算干预，safeguard干预 | E09 | 附录，理论处引用 |
| A06 | 层间响应与证书验证 | E10、E11 | 研究归档，不编入论文 |
| A07 | Support sparsification | E13 | 附录 |

### A01：Salut 系统组件消融

- **内容**：Hierarchy、active support、PDUOT 后端、potential translation、structural edges 五组对照；展示耗时、最细层 refinement 轮数和显存。
- **后端消融重跑（2026-11-19）**：已取消尚未执行的 Gaussian 新规模任务 `exp-fc1402e045`，改为 TOME E11.5--E12.5、$d=30$、unit-mean cost；保留 $n=8{,}192$、$\rho=(1,1)$、seeds 42--46 及求解协议。新任务 `exp-e4eb0e242f`，批次 `component_ablation/results/component_restricted_solver_tome_n8192_paper_data_5seeds_20261119/`，队列位置仍在 active-support 消融之后、translation 消融之前。计划为 10 次方法测量及 5 次 reference；完成后替换 Panel C，当前论文与历史 Gaussian 结果暂保留。
- **状态**：正文表已采用 seeds 42--46 的正式结果，固定输入见 `figures/plot_sources/component_ablation_20261117.json`。Panel C 的 Gaussian 受限后端比较对 PDUOT 和 PDCS 均传入传播的 primal--dual warm start；五次 PDCS 测量均记录 `backend_protocol.warm_start=True`，36 次受限调用全部记录 `warm_start_used=True`。旧 43.09 秒 cold-start PDCS 对 0.77 秒 warm-start PDUOT 的结果已被替换，不能继续用于描述当前表。
- **来源**：`component_ablation/results/component_restricted_solver_paper_data_5seeds_v2/` 的当前原始指标及上述固定图源；`experiments/restricted_kl_uot/results/pdcs_warm_tome_20261114_my4090/` 仅为历史单 seed 诊断。
- **与 CDF 的区别**：`fig:restricted-runtime-cdf` 的 433 次 PDCS 测量全部记录 `initialization="standard_cold_start"`；该实验所有方法均不继承快照的 primal/dual 初值。系统 warm-start 消融与 fixed-snapshot cold-start 比较是两种独立协议。

### A02：超参数敏感性

- **内容**：Hierarchy split factor、dual-assignment budget、pricing budget、support budget factor；每次改变一项。
- **状态**：已有 36/36 成功的单 seed 历史运行，旧协议关闭 refinement 检查，需按最终协议重跑并补 seed。Coarse threshold 另有 pilot，是否加入正式展示待讨论。
- **来源**：`paper_experiments_uot/parameter_sensitivity/results/20261110_v2_paper_data/`；`tab:uot-parameter-sensitivity`。

### A03：完整求解耗时分解

- **内容**：初始化、PDUOT、pricing、Other 的百分比堆叠柱；按各阶段平均耗时除以平均总耗时计算，柱顶标平均总秒数。support maintenance 并入 Other，原始分项及标准差保留。
- **正式结果（2026-11-19）**：MERFISH，$n=16384/65536/262144/1048576$，四组 penalty、五 seed，80/80 个 profile 和 paired control 均完成并收敛，测量质量均为 clean。已替换论文 `fig:uot-runtime-breakdown` 的历史 RTX 4090 preview。
- **结果摘要**：百万点各组平均耗时 126--169 秒，标准差 2.1--3.6 秒；初始化占 41%--56%、pricing 占 27%--36%，最细层均一次完整 pricing 扫描。全部层级的 pricing 次数单独保留，不与最细层扫描混同。
- **来源**：`runtime_breakdown/results/20261117_paper_data_runtime_breakdown`（40 项）、`20261118_paper_data_runtime_breakdown_n65536`（20 项）、`20261119_005838_427739_infra`（20 项）。固定输入、逐项 SHA256、阶段耗时及扫描统计见 `figures/plot_sources/runtime_breakdown_20261119.json`；重绘入口为 `scripts/plot_runtime_breakdown.py`，重新固定来源使用 `--capture`。

### A04：PDUOT 内部组件消融

- **内容**：完整 PDUOT 与四个 leave-one-out 变体：去除 reflected Halpern（同时去除 anchoring 和 reflection）、diagonal preconditioning、adaptive weight、adaptive restart。各变体使用相同冻结快照和初值，比较达到 KKT $10^{-6}$ 的迭代 CDF。无重启变体沿用 PDLP 的 no-restart 设置，在全局迭代 $2,4,8,\ldots$ 更新权重，保留 PDUOT 自身的 controller 和预算，不重置 Halpern anchor 或计数。
- **状态**：433 个快照 × 5 变体，2,165/2,165 收敛；433 项无重启权重调度审计全部通过。一次外部显存占用造成的 OOM 已单独补跑成功，旧尝试归档。正文采用 $2\times2$ 单栏图，caption、正文和附录协议已同步；并发运行的耗时仅作诊断。
- **来源**：`paper_experiments_uot/pduot_ablation/results/pduot_four_components_20261117_gpu5/`；`fig:pduot-component-ablation-cdf`；图源与哈希固定于 `figures/plot_sources/pduot_component_ablation_20261117.json`。旧六变体批次保留。

### A05：Primal-weight 预算干预，safeguard 干预

- **内容**：完整 Salut 求解，固定 $p=1.01$、$n=65,536$，比较 $J=1,2,4,8,16,32,64$ 与关闭预算的自适应基线；最后增加固定 $J=64$ 的 safeguard 开关柱组，共用已有的开启观测。每个 seed 汇总四种 penalty 的全部内层迭代数，再展示均值与样本标准差；保留逐 penalty 数据，裁剪次数放图注。
- **状态**：RTX 4090 上 seeds 42--46 的 180/180 次测量收敛，复用原 160 次预算测量，仅新增 20 次关闭 safeguard 的测量。$J=1,2$ 分别裁剪四次、三次，平均总迭代数分别增加约 2.72%、0.62%；$J\ge4$ 无裁剪且全部迭代数与对照一致。关闭 safeguard 后 19/20 对迭代数不变，唯一变化为 22,040 降至 21,450；开启 safeguard 的平均总迭代数增加约 0.077%。图例改为单行。完整轨迹用于迭代诊断，不作耗时比较。旧 $p=1.1$ pilot 保留为历史记录。
- **来源**：`paper_experiments_uot/primal_weight_budget/results/20261115_224339_safeguard_my4090/`（原 160 次测量的来源与校验值保留在 manifest）；`fig:pduot-weight-budget`；固定图源 `figures/plot_sources/convergence_safeguards_20261115.json`。

### A06：层间响应与证书验证

- **内容**：层间 response inheritance bound、response predictor 的误差诊断，以及独立证书覆盖验证。
- **状态**：2026-11-15 随辅助预测理论成套移出论文，保留已有 1,080 个转换和 120 个独立证书区间的记录，暂不为论文补 seed。F.6 只保留正文引用的稳定性命题及势传播推论；完整层次求解的加速消融仍为 A01。
- **来源**：`results/uot_hierarchy_paper_candidate_20261019/`；原理论、`fig:hierarchy-stability-validation` 与 `tab:stability-diagnostics` 的源码及来源见 `notes/component_mechanism_analysis_record.md`，图文件与原始数据保留。

### A07：Support sparsification

- **内容**：Spar 的耗时、支持压缩效果及输出支持上界，作为独立操作测试。
- **状态**：360 条记录满足输出支持上界，可保留；现有五 repeat 复用相同输入，正式五 seed 需补独立输入。
- **来源**：`paper_experiments/support_sparsification_uot/results/`；`fig:uot-sparsification-scaling`。Spar 继续放在 PDUOT 迭代之外。

## Extensions and Applications：已有实验记录

### Entropic Pareto：稀疏熵正则 UOT 的 runtime–accuracy 比较

- **设置**：TOME E11.5--E12.5，$m=n=16{,}384$、$d=30$、$\varepsilon=10^{-3}$，四组默认 KL penalty，seeds 42--46。每个 seed、方法和参数测量一次，耗时包括前置 Salut 求解、支持构造和稀疏 Sinkhorn refinement，不含公共评价。
- **状态**：infra 实验 `exp-b2d5132b7d` 完成，20/20 个独立 reference、320/320 次方法测量成功且质量为 `clean`；64/64 个曲线点各有五个有效 seed，无 pending 或失败点。reference 使用独立 Salut-Sinkhorn 初始化的 FP64 OTT-online，原参数和精度不变。
- **图示**：圆点为 `Salut-Sinkhorn (fixed)`，指定重建预算 $b_{\mathrm e}=2,4,8,16,32$；叉号为 `Salut-Sinkhorn (auto)`，在最终活跃支持预算内自动重建，20 个实例均解析为 $b_{\mathrm e}=9$，输出支持未超过原预算。比较 Sinkhorn-online 的五档停止阈值和 Spar-Sink 的五档采样预算。新图不再展示历史 direct reuse。
- **结论**：$b_{\mathrm e}=8$ 时四组平均 gap 均低于 $5\times10^{-7}$，平均耗时为 1.19--11.52 秒，正文概括为 1--12 秒；$b_{\mathrm e}=32$ 时四组平均 gap 均低于 $10^{-10}$。自动预算的平均 gap 为 $2.26\times10^{-7}$--$2.41\times10^{-7}$。
- **入口与图源**：`paper_experiments_uot/entropic_uot/results/20261117_paper_data_entropic_uot/`；运行 `micromamba run -n cuda118_all python paper_experiments_uot/entropic_uot/collect.py --batch-id 20261117_paper_data_entropic_uot` 汇总和绘图。论文副本为 `figures/entropic_uot_accuracy_runtime_pareto_eps0.001.{pdf,png}`；固定数据、逐项哈希、图示配置和支持预算检查见 `figures/plot_sources/entropic_uot_20261117.json`。论文目录的 `scripts/refresh_additional_method_figures.py` 优先读取这份正式记录。
- **剩余工作**：本图无；epsilon sweep 属于独立实验，仍按其当前图源和覆盖记录跟踪。历史单 seed direct-reuse 批次及 `method_style_figures_20261115.json` 保留归档。

## Squared-L2 Marginal Penalties：独立实验板块

本板块研究平方 L2 边际惩罚下的 UOT，可能分别需要整体性能、PDUOT、分析、extensions 与 applications 的证据，因此独立于前四个以 KL-UOT 为基础的板块。按实际论证需要安排对应实验，不预先要求完整复制 KL 网格；baseline、系数、reference、停止准则和下游目标均需按平方 L2 模型独立确认。

### 内部分类（待逐项梳理）

| 子类 | 需要讨论的内容 | 当前状态 |
|---|---|---|
| 整体 Salut 性能 | Pareto、规模、cost/维度/质量适用范围 | L01 已有小规模 pilot；其余范围待定 |
| PDUOT 性能 | 平方 L2 受限问题的求解器比较 | 待梳理正式实验 |
| Analysis | 组件、参数、safe screening、零边际与停止规则 | 开发验证与论文实验分开登记，正式范围待定 |
| Extensions and Applications | entropic/UFGW 扩展及下游任务是否需要、如何定义 | 待讨论，不默认照搬 KL 目标 |

### L01：平方 L2 边际惩罚的整体求解比较（原 S04）

**问题**：完整 Salut 在平方 L2 边际惩罚下的精度与端到端效率如何？

- **模型定义**：令 $\mathbf r=\mathbf X\mathbf1$、$\mathbf q=\mathbf X^\top\mathbf1$，目标为

$$\min_{\mathbf X\geq0}\;\langle\mathbf C,\mathbf X\rangle+\frac{\rho_a}{2}\|\mathbf r-\mathbf a\|_2^2+\frac{\rho_b}{2}\|\mathbf q-\mathbf b\|_2^2.$$

- **术语**：论文称 squared-$\ell_2$ marginal penalties（平方 L2 边际惩罚）；代码为 `marginal_penalty="l2^2"`。这里不是未平方的 L2 范数，也不是 coupling 的平方范数正则或点对 ground cost。
- **展示安排**：独立附录 G（Squared-L2 Marginal Penalties），先方法与理论，再实验；G.3 已插入正式五 seed Pareto 图 `fig:l2-runtime-accuracy`。KL-UOT 的七行 generality 图不包含此模型。
- **比较方法**：当前可落实的路线为 Salut 与 L2-MM。Sinkhorn 和 HELLO-UOT 是否加入取决于对应目标的实现与验证，不能直接复用 KL 版本。
- **已有记录**：`experiments/l2_mm_pilot/results/20261114_l2_mm_n4096_my4090/`，28/28 任务完成，含四组系数下的容差扫描和独立 reference；单 seed RTX 4090 pilot，尚非正式多 seed 比较。
- **正式结果（2026-11-18）**：`accuracy_runtime_pareto/results/20261117_173919_927385_infra`，$m=n=32768$，四组有效系数、五 seed；200/240 个方法测量有效，对应 40 个五 seed 均值点，另有 4 项正常超时、36 项按策略跳过。成本归一化到均值 1，实际系数为 $m\bar\rho_a,n\bar\rho_b$。图源 `figures/plot_sources/l2_pareto_20261118.json`，论文图 `fig:l2-runtime-accuracy`。 当前论文 Pareto 图已按附录宽度改为 1×4，数据及方法选择不变；绘图入口支持 `--plot-only --layout 1x4 --no-memory-legend`，不展示显存柱状图，保留普通算法图例及全部原始显存记录。
- **耗时审核（2026-11-18）**：Pareto 四条较慢候选均为 $(10,10)$、seed 42，受限迭代数和边数加权工作量增加，暂不剔除。`generality/results/20261117_173921_740351_infra` 的三种 ground cost 比较已结束，150/180 个方法测量有效，同配置跨 seed 未筛出明显耗时离群点。
- **Generality 正式结果（2026-11-18）**：`generality/results/20261117_173921_740351_infra` 已结束，150/180 次方法测量有效，4 项正常超时、26 项策略跳过；30 个均值点均为完整五 seed。三个 ground cost 为 $\ell_1$、$\ell_2$、$\ell_\infty$，$m=n=16384$。全部 reference 通过，无耗时超过同配置其他 seed 中位数两倍的记录。已以 1×3 排布加入附录 G.3（`fig:l2-generality`）；来源为 `figures/plot_sources/l2_generality_20261118.json`。
- **Scaling 正式结果与补测完成（2026-11-18）**：`main_scaling/results/20261117_173920_880071_infra` 已完成 100/100 次方法测量和 100/100 个 reference，20 个规模/系数组各有五 seed。作者批准的八项初始化异常及一项目录冲突补测共九项全部成功，GPU 监控无干扰；旧记录完整保留在 `retry_history/`。百万点四组的平均耗时为 145--887 秒，平均峰值显存不超过 6.80 GiB，平均 shared gap 不超过 $4.9\times10^{-5}$（全部单次 gap 最大 $1.004\times10^{-4}$）。已重新 collect 并加入附录 G.3 的 `fig:l2-scaling`，图源及校验和为 `figures/plot_sources/l2_scaling_20261118.json`。审核记录：`paper_experiments_uot/main_scaling/diagnostics/l2_runtime_review_20261118.{json,md}`；完成核验：`l2_reviewed_retry_20261118.json`。
- **追溯**：旧 E22 的 L2 独立路线；相关内容位于 `main_appendix.tex` 末尾的附录 G，标签为 `app:l2-penalty`，实验为 `app:l2-experiments`。

本轮同步修改论文的 seed 统计声明、附录 Reporting 例外表和图表源码补跑注释；不修改测量数据、实验脚本或运行配置，不启动实验。
