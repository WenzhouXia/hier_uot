# Sparse entropic KL-UOT：基线调研与实验取舍

本文档服务于 `entropic_uot` 的基线选择及 SHUTTLE sparse entropic refinement 的贡献讨论，写法参照论文目录的 `RELATED_WORK_ALGORITHM_MAP.md`。记录保留、待适配和排除的方法；不把工程判断当作论文结论，不把未运行的方法写成已完成实验。

核对日期：2026-10-18。检查了本项目调用链、`cuda118_all` 中已安装的 OTT-JAX 0.4.6，以及下列官方仓库源码快照：

- MultiScaleOT：`48a47aaf76e04af11c6892a3204d57caaef42967`。
- LCN：`51d9bf6eb98911d5a908c3202aabc7c5733128c3`。
- Spar-Sink：本实验固定的 `7e5511e22d0b174d4a83b6b9e3ca0981fe461349`。

外部源码快照用于调研。后续已增加 OTT TI sweep、LCN clustering 适配基线和官方 CPU MultiScaleOT 0.3.8，并安装后者；未修改论文 tex。第 12 节记录最终实现与验证口径，前面各节的源码分析与最终选择应结合阅读。本文在实验目录保存唯一源文件，论文目录的同名文件为软链接。

## 1. 比较范围和当前决定

目标是高维点云上的同一个 entropic KL-UOT 问题，而非不同几何、不同边际惩罚或不同 coupling 约束之间的比较：

$$P_\varepsilon(\pi)=\langle C,\pi\rangle+\rho_a\operatorname{KL}(\pi\mathbf1\mid a)+\rho_b\operatorname{KL}(\pi^\top\mathbf1\mid b)+\varepsilon\operatorname{KL}(\pi\mid a\otimes b).$$

| 候选 | 当前决定 | 回答的问题 | 主要限制 |
|---|---|---|---|
| 完整 OTT-JAX LSE Sinkhorn | 已增加 TI on/off sweep；continuation 待做 | SHUTTLE 相对加强后的完整问题 solver 是否仍有优势？ | 尚未启用 ε-scaling |
| 双向几何 kNN + sparse Sinkhorn | 作者决定暂不实施，保留消融设计 | dual-guided active support 是否优于相同边数的几何邻域？ | 是构造的机制对照，不是另一个独立论文 solver |
| Schmitzer sparse scaling / MultiScaleOT | 已接官方 CPU 0.3.8；不做 GPU 移植 | 相对已有自适应截断和多尺度方法的价值 | 高维使用独立二分层级接 explicit API；CPU 硬件单独标明 |
| LCN clustering support + KL-UOT sparse Sinkhorn | 已接入，目标邻居数 8/32/128 sweep | 高维聚类近似产生的 support 是否足够好？ | 纯稀疏适配基线，非完整 LCN-Sinkhorn；不是官方现成 KL-UOT sparse 接口 |
| LCN-Sinkhorn 完整方法 | 暂不作为可直接接入的主基线 | 低秩 kernel + sparse correction 的另一条近似路线 | 官方主路径非标准 KL-UOT；目标、评测和旧依赖均需适配 |
| Spar-Sink | 保留 | importance sampling 的精度—成本权衡 | 当前 PyTorch GPU 适配的速度不代表官方 CPU 实现速度 |
| GeomLoss multiscale | 本轮排除，保留相关工作 | 低维几何的 block-sparse 加速 | 作者选择聚焦高维；低维不在本轮实验范围 |
| Entropic UOT domain decomposition | 本轮排除，保留相关工作 | 空间分解与局部 Sinkhorn | 作者选择排除当前几何/网格导向的实验路线 |
| Screenkhorn / Greenkhorn | 不优先 | screening / 坐标更新 | 不是现成的相同目标 KL-UOT edge-sparse 主基线 |
| Nyström KL-UOT | 作者决定本轮不实施，保留调研 | 近似完整 kernel 的低秩路线 | coupling 通常不稀疏，与本轮 sparse 方法比较的论点不直接对应 |
| FlashSinkhorn dense GPU | 作者决定暂缓；必要时再补 | 相对现代 GPU 完整问题 solver 的表现 | 本轮完整问题主基线为 OTT；不是新增 sparse solver |

排除 GeomLoss 和 domain decomposition 是本轮实验范围的决定，不表示它们性能差或不支持 UOT。不能因为一个方法在其擅长的低维场景很强而推断其高维性能，也不能仅凭本轮实验宣称覆盖所有空间维度。

## 2. 本项目当前到底用了什么 Sinkhorn？

### 2.1 OTT-JAX：已增加 TI on/off sweep，未启用 ε-scaling

初次调研时，`ott_worker.py` 的 `solve_ott` 没有传 `recenter_potentials`，因此原始实验未启用 TI。后续按作者要求，`config.yaml` 的 OTT 现已展开 `ti_off` / `ti_on`，通过 `run_case.py` 的 NPZ payload 把开关传给 worker，并实际设置 solver 的 `recenter_potentials`。`PointCloud` 的 ε 仍是固定值。当前环境包版本为 **ott-jax 0.4.6**。

该版本 `Sinkhorn.__init__` 的 `recenter_potentials` 默认为 `False`。开启后，LSE 更新中的 unbalanced 分支采用 Séjourné et al. 的平移不变加速。`lse_mode=True` 只说明用 log-sum-exp 稳定计算，不等于启用了 TI。[OTT 0.4.6 Sinkhorn 源码](https://github.com/ott-jax/ott/blob/0.4.6/src/ott/solvers/linear/sinkhorn.py)

当前 `reference` 也走 `solve_ott`，仍默认关闭 TI，保留原有参考解配置。新 metrics 保存 `recenter_potentials` 和 `ott_version`，图中圆形为 `ti_off`、六边形为 `ti_on`，实心/空心依然表示内部收敛。历史结果文件没有保存 TI 开关，不能仅由 metrics 独立恢复过去任意代码版本的配置。

### 2.2 SHUTTLE sparse Sinkhorn：TI 入口存在，但当前 wrapper 未调用

本地调用链：

1. `run_case.py` 的 SHUTTLE 分支调用 `hier_uot.solve(..., entropic_refinement=...)`。
2. `src/hier_uot/entropic_refinement/solver.py::solve_sparse_sinkhorn` 调用 `load_extension().solve(...)`，并传入 SHUTTLE 的 warm-start potentials。
3. `src/hier_uot/_native/sparse_sinkhorn/bindings.cpp` 将 `solve` 绑定到 `solve_sparse_sinkhorn_cuda`；这是普通 generalized Sinkhorn 更新。
4. 同一个 binding 还暴露 `solve_translation_invariant`，绑定 `solve_sparse_ti_sinkhorn_cuda`，但当前实验上述调用链没有调用这个入口。

因此，**本地存在 TI 内核不等于当前实验已经使用 TI**。另外，SHUTTLE 的 inter-level dual-potential calibration、最终评测的势规范化，与在 entropic 迭代中使用 TI 是不同的用途，不能混称。

### 2.3 Spar-Sink：普通 generalized scaling

`spar_sink.py::solve_sampled` 使用固定 ε 和 `rho/(rho+epsilon)` 的交替更新；没有 TI，也没有 continuation。现有结果的这些设置应保留说明，新增加速变体要另行命名，避免改写历史实验的含义。

## 3. TI-Sinkhorn 与 ε-scaling

### 3.1 TI 在加速什么？

TI-Sinkhorn 优化全局势平移方向。变换 `(f+t,g-t)` 保持 pairwise sums，从而保持 kernel coupling 的指数项；KL 边际项却随平移变化，所以需要选取合适的平移并在迭代更新中处理它。它减少普通 UOT scaling 在全局质量方向上的慢收敛，不负责稀疏 support 的构造。

- **原始来源：** [Séjourné et al., AISTATS 2022](https://proceedings.mlr.press/v151/sejourne22a.html)。
- **作者代码：** [fast_uot](https://github.com/thibsej/fast_uot)。
- **当前最方便的接入点：** 已安装 OTT 的 `Sinkhorn(lse_mode=True, recenter_potentials=True)`；另有 [POT 官方 TI 示例](https://pythonot.github.io/master/auto_examples/unbalanced-partial/plot_conv_sinkhorn_ti.html)。

工程建议：先在当前 OTT adapter 上增加明确的 TI 变体，验证相同最终目标和完整证书，再与固定 support 的 TI 变体比较；不把所有方法统称为“Sinkhorn”而隐藏具体加速设置。

### 3.2 ε-scaling 是否有官方实现？

有。已安装 OTT 0.4.6 包含 `ott.geometry.epsilon_scheduler.Epsilon(target, init, decay)`。它从目标 ε 的较大倍数开始几何衰减，到达 target 后保持不变；不是本项目自造的算法。[OTT 0.4.6 scheduler 源码](https://github.com/ott-jax/ott/blob/0.4.6/src/ott/geometry/epsilon_scheduler.py)

ε-scaling 是从较平滑的问题向最终目标做 continuation；TI 是处理每一步中的势平移方向；两者可以组合，也可以分别消融。

**本项目的适配细节：**

- 当前 adapter 用 `C'=C-ε log(a)-ε log(b)` 对齐 coupling KL，且用 `tau=rho/(rho+ε)` 表示边际惩罚。若希望每一个 continuation 阶段都是固定 `rho_a,rho_b`、只改变 ε 的同一问题族，就必须在阶段间同时更新这两个映射。
- OTT 的内置 scheduler 改变 geometry 更新时使用的 ε；当前 solver 的 `tau` 不是随阶段自动重建的。直接只换 scheduler，不应未经核对就声称所有中间阶段保持了相同物理 rho 和 coupling KL reference。
- 这不意味着内置 scheduler 不能作为抵达最终 target 的数值启发式；应核对最终目标下的残差，以及 TI、cost offset 与 scheduling 的组合。
- 最容易审计的方案是外层显式分阶段：构造每阶段的固定-ε problem、更新 `tau` 和 cost offset、以上一阶段的物理势 `(f,g)` warm-start。不要把 log scaling 不经换算直接跨 ε 复制。
- 最终 ε 必须有足够迭代并通过统一完整证书；整个 continuation 的计算量计入端到端时间，不能只报最后一阶段。

**组合状态：**普通固定 ε、TI 固定 ε 已进入 sweep；TI + continuation 尚未实现。继续保留当前普通 OTT 的历史结果，以区分收益来自何处。

## 4. Schmitzer stabilized sparse scaling / MultiScaleOT

### 4.1 是否有官方 GPU 实现？

在本次核对的 **MultiScaleOT 官方源码快照中，Sinkhorn 核心是 CPU C++/Eigen，没有发现可直接调用的 CUDA/PyTorch GPU backend**。这不是“所有相关代码都没有 GPU 实现”的全局断言。

源码证据：`src/Sinkhorn/TSinkhornKernel.h` 的 `TKernelMatrix` 是 Eigen row-major sparse matrix；`TSinkhornSolver.cpp` 用稀疏乘法做更新；`src/Sinkhorn/CMakeLists.txt` 构建 C++ 静态库。仓库附带的 pybind11 中出现 CUDA 编译兼容代码，不表示 solver 有 CUDA backend。[kernel 类型](https://github.com/bernhard-schmitzer/MultiScaleOT/blob/48a47aaf76e04af11c6892a3204d57caaef42967/src/Sinkhorn/TSinkhornKernel.h)；[solver](https://github.com/bernhard-schmitzer/MultiScaleOT/blob/48a47aaf76e04af11c6892a3204d57caaef42967/src/Sinkhorn/TSinkhornSolver.cpp)；[构建文件](https://github.com/bernhard-schmitzer/MultiScaleOT/blob/48a47aaf76e04af11c6892a3204d57caaef42967/src/Sinkhorn/CMakeLists.txt)。

`TSinkhornSolverKLMarginals` 和 soft-marginal 更新提供 KL 边际求解，相关基类还包含分别设置两侧权重的接口。因此“支持 UOT”不是主要障碍；需要核对 Python 暴露接口、kernel reference、参数和返回势的约定。

### 4.2 用 PyTorch 移植的难度

以下为基于源码结构的工程判断，不是已经完成的移植或性能结论。

| 移植范围 | 难度判断 | 主要工作 | 可以怎样标注 |
|---|---|---|---|
| 固定 support 上的稳定 KL scaling | 低到中 | edge-list/CSR 运算、稳定归约、误差检查 | sparse KL-UOT solver，不能单独叫完整 Schmitzer 算法 |
| 分块完整扫描 + 动态截断 + ε-scaling | 中 | kernel 重建、势变化后的重新选边、双向布局、空行列处理 | 受 Schmitzer 启发的 GPU adaptive truncation 适配 |
| 原方法的完整 coarse-to-fine 和层级 kernel 搜索 | 高 | 层级 cost 下界、候选块展开、非规则 frontier、势吸收及安全重建流程 | 经对照验证后的 multiscale GPU 移植 |

真正难移植的是 **support 的构造和维护**，不是 Sinkhorn 两行更新。原代码从 coarse cells 递归搜索 kernel entries，并有 safe-mode、势吸收和 kernel invalidation 逻辑；不能删掉这些机制后用一个固定阈值图代表原算法。[kernel generator](https://github.com/bernhard-schmitzer/MultiScaleOT/blob/48a47aaf76e04af11c6892a3204d57caaef42967/src/Sinkhorn/TSinkhornKernel.cpp)

对 30 维点云，空间树可以构造，但 block cost 下界可能变松，导致保留很多候选块；实际高维加速必须测量。算法不限于 1–3 维，不能与 GeomLoss 当前特化实现的范围混为一谈。[原论文](https://arxiv.org/abs/1610.06519)

**当前建议：**先实现可审计的 GPU full-scan adaptive truncation 基线，报告扫描成本和实际峰值边数，明确它没有原方法的多尺度搜索加速。若该基线有竞争力，再决定是否完整移植；完整复现应先在小例子与官方 CPU 输出对齐。不要以简化版较慢为依据否定原方法。

## 5. 双向几何 kNN support + sparse Sinkhorn

### 5.1 算法和与 SHUTTLE 的关系

对每个 source，选原始代价最小的 k 个 target；对每个 target，反向选 k 个 source；合并去重：

$$\mathcal A_k^{\mathrm{geom}}=\{(i,j):j\in\operatorname{RowTopK}(-C)_i\}\cup\{(i,j):i\in\operatorname{ColTopK}(-C)_j\}.$$

在该 support 上求同一个 entropic KL-UOT restricted problem，support 外的 coupling 为零；不做 Spar-Sink 的随机采样逆概率重加权。双向选择且 `k>=1` 时，每个正质量节点至少有一条边；UOT 不要求这个图满足 balanced OT 的固定边际可行性条件。

几何 kNN 按 `-c_ij` 选边。SHUTTLE 按论文口径的 dual score `sigma_ij=f_i+g_j-c_ij` 选边，并能合并非正则解的正流 support。固定行内 `f_i` 是常数，差别来自 target 势 `g_j`；反向则来自 source 势 `f_i`。这正好检验几何近邻是否足以替代 dual-guided localization。

### 5.2 适用于高维吗？

**算法定义适用于任意维度，实用性取决于找邻居的成本和邻域是否包含重要 transport edges。**

- 首版建议在 GPU 上分块精确计算 squared-L2 cost，并维护双向 top-k；不依赖低维 KD-tree，也不修改输入维度。点对代价计算为 `O(m n d)`，另有 top-k 选择开销；scratch 随块大小而非完整矩阵增长，输出 support 不超过 `k(m+n)` 条边。
- 更大规模可用近似近邻，但要额外记录索引构建、query 时间和邻居 recall。近似构图的误差与 restricted solve 的误差应分别处理。
- 高维距离集中、群体比例差异、密度差异和非局部匹配都可能让纯几何 kNN 漏掉重要边；不能预设结果会好，也不能预设一定输给 SHUTTLE。

### 5.3 公平比较

- 与 SHUTTLE 使用相同 sparse solver、dtype、TI 开关和最终完整证书。
- 报告实际去重后的边数；相同 k 不保证不同 support 策略的边数相同。另做近似相同边数的曲线。
- 首轮都从零势开始，单独比较 support；第二轮再做 SHUTTLE warm-start 消融。不能只给 SHUTTLE 好的初始化，却把收益都归因于 support。
- 几何构图计入时间，SHUTTLE 的完整无熵求解和额外 dual assignment 也计入时间。复用 support 的多 ε 场景另报摊销成本。
- 可把“双向 kNN + 非正则正流 support”作为消融，但它已经使用 SHUTTLE 的输出，不能再称独立几何基线。

**决定：按作者最新要求，暂不实施。** 这是对 support 定位机制的消融基线，不作为找到的独立文献方法。上述实现设计留作备忘；尚未运行，不能把“预计 SHUTTLE 会更好”当作实测结论。

## 6. LCN 官方代码逐项核对

### 6.1 三条路径必须分开

官方 [README](https://github.com/gasteigerjo/lcn/tree/51d9bf6eb98911d5a908c3202aabc7c5733128c3) 列出 CPU/GPU PyTorch 实现，也说明 marginals 限于均匀形式。但“仓库有 unbalanced Sinkhorn”不等于“每一种 sparse 近似都有相同 KL-UOT solver”。

| 源码路径 | 实际接口和行为 | 与本项目是否直接匹配 |
|---|---|---|
| `sinkhorn_unbalanced.py::entropyRegLogSinkhorn` | dense `cost_mat`，有 `reg_marginal`，固定迭代次数；文档注明均匀测度约定 | 含普通 KL-UOT 更新，但不是 sparse/LCN 路径；单个边际权重接口也不覆盖当前全部非对称 rho 网格 |
| `sparse_sinkhorn.py::arg_log_sparse_sinkhorn` | sparse edge list；更新为完整归一化，无 `rho`、`reg_marginal` 或两侧 `tau` 参数 | balanced sparse scaling，不能直接当 KL-UOT |
| `lcn_sinkhorn.py::arg_log_lcn_sinkhorn` | Nyström kernel 与 sparse local correction 组合；无 KL marginal 参数 | balanced 路径；coupling 通常仍含全局低秩项，不是纯稀疏 coupling |
| `LogSparseSinkhornBP` / `LogLCNSinkhornBP` | 使用 BP 扩展矩阵，带删除/插入相关的 norms 等参数 | learnable unbalanced matching，不等于给定两侧 rho 的 KL marginal penalty |

证据：[dense unbalanced](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/lcn/sinkhorn_unbalanced.py)，[sparse](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/lcn/sparse_sinkhorn.py)，[LCN](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/lcn/lcn_sinkhorn.py)，[transport plan dispatcher](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/lcn/transport_plan.py)。

### 6.2 哪部分值得复用？

其 `cost/cost_matrix.py` 和 `cost/landmarks.py` 提供 clustering/LSH 和 multiscale 的候选点对生成机制，适合高维邻域近似。可以保留它的 support 构造，再接本项目统一的 KL-UOT sparse solver，命名为 **LCN-style clustering/LSH support + KL-UOT sparse Sinkhorn**；这是适配实验，不是原论文方法的原样复现。[cost/support 构造](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/lcn/cost/cost_matrix.py)

完整 LCN 还含全局 Nyström 项；不能只保留 local correction edges 后继续叫 LCN-Sinkhorn。要适配完整方法，需要核对近似 kernel 的非负性、signed log-sum-exp 数值行为、KL 更新及非均匀/非对称参数，并让统一评测实际使用“低秩 + correction”的 coupling。不能直接沿用当前 `explicit_edge_list` 评测入口，也不能把势代回原始 kernel 重建后，宣称评估的是原算法输出的近似 coupling。

### 6.3 工程限制和决定

`setup.py` 固定 `torch==1.4`，依赖 `torch_scatter`；多个 helper 注释明确记录 PyTorch 1.8/1.9 的 TorchScript 问题。当前环境不是一个可以直接安装旧依赖运行的干净复现环境。此处是静态兼容性风险判断，尚未实际安装或测试现代 PyTorch 兼容性。[安装约束](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/setup.py)，[helper 源码](https://github.com/gasteigerjo/lcn/blob/51d9bf6eb98911d5a908c3202aabc7c5733128c3/lcn/utils.py)。

**决定：不直接把官方 sparse/LCN solver 加进当前 KL-UOT 主表。** 优先考虑复用 support 生成机制；完整 LCN 留待独立适配和验证。论文仍应引用其高维 sparse/low-rank kernel 近似路线。[ICML 2021 论文](https://proceedings.mlr.press/v139/gasteiger21a.html)

## 7. 本轮排除但保留记录的方法

### 7.1 GeomLoss multiscale

- **机制：** GPU block-sparse kernel truncation、ε-scaling、log-domain stabilization，支持 unbalanced OT。
- **实现范围：** 官方 multiscale 特化主要面向 1–3 维；不要把 GeomLoss online backend 与 multiscale backend 混称，也不要写成所有 GeomLoss 功能只支持低维。
- **决定：** 按作者选择，不纳入本轮高维点云实验；不通过降维改变 TOME 问题来加入比较。
- **写作边界：** 不据此宣称 SHUTTLE 胜过低维 multiscale solver，也不宣称现有方法没有小 ε 加速。
- **来源：** [官方说明](https://www.kernel-operations.io/geomloss/)，[kernel truncation 示例](https://www.kernel-operations.io/geomloss/_auto_examples/sinkhorn_multiscale/plot_kernel_truncation.html)。

### 7.2 Entropic UOT domain decomposition

- **机制：** 空间分解为局部 entropic UOT 子问题，并在整体上更新；已有 KL-UOT 研究和实现。
- **适配边界：** 当前公开数值路线重视空间局部结构及 bounding-box 数据结构；不能因为这一点就断言数学方法只适用于 1–3 维。
- **决定：** 按作者选择，本轮不投入该几何/网格导向路线的适配，保留相关工作记录。
- **来源：** [论文](https://link.springer.com/article/10.1007/s10589-025-00748-y)，[作者代码](https://github.com/OTGroupGoe/DomainDecomposition/tree/main/unbalanced-domdec-paper)。

### 7.3 其他候选的优先级

Screenkhorn 以 screening 降低优化规模，Greenkhorn 用坐标选择加速更新；二者不能仅凭名字归为当前目标下的现成 edge-sparse KL-UOT 实现。本轮优先级低于已有直接接口的 TI 和统一后端的 kNN 对照。[Screenkhorn 原论文](https://proceedings.neurips.cc/paper/2019/file/95688ba636a4720a85b3634acfec8cdd-Paper.pdf)

Nyström 是 kernel 近似；非负低秩 coupling 则约束 transport plan 的表示，有限秩下改变优化可行域。两者均可研究，但不应混成“同一个 sparse Sinkhorn baseline”，也不能用因子存储量冒充正流边数。Nyström KL-UOT 的具体实现候选在引用链复查后补入第 11 节；非负低秩 coupling 本轮仍不优先。

## 8. Spar-Sink 结果和贡献讨论的边界

已有批次 `results/20261018_204352` 显示，`n=4096, ε=0.001, rho_a=rho_b=0.1` 时，q8/q32/q128 均内部收敛，相对参考目标值差异分别约为 43.6%、22.4%、6.81%。因此误差不能全部解释为 iteration limit。另有较大 rho 的算例未收敛，不能把所有误差都归于采样。

当前实现是 PyTorch log-domain edge-list 适配；每轮 sparse segment reductions 的性能不等于作者 CPU sparse-matrix 版本。当前统一目标、TOME 代价和论文主要 WFR 设置也不同，不称为原论文整套性能结论的复现。[Spar-Sink 论文](https://jmlr.org/papers/v24/22-1311.html)

已有小规模同-mask、FP64 coupling 对照验证通过；它只支持该测试范围内的更新一致性，不保证小 ε、FP32 或大规模条件下的准确性与性能。`validate_official.py` 可重跑这个检查。

SHUTTLE 的潜在贡献应围绕 **dual-guided localization 得到的 active support 能否有效支持小 ε 的完整 entropic KL-UOT 近似**。固定 support 上内部收敛不自动构成完整问题证书；非正则正流 support 也不自动覆盖近退化情况下的所有重要 entropic edges。

## 9. 下一轮实验建议和完成标准

1. **先补强完整 solver：**OTT-TI on/off sweep 已实现；明确固定 rho 的 TI + continuation 待实现。新结果记录 `ott_version`、TI 开关、ε schedule 和最终目标误差。
2. **双向 kNN 暂缓：**保留第 5 节的设计，本轮不实现。优先考虑第 11 节的 FlashSinkhorn 完整 GPU solver 和 Nyström KL-UOT 候选。
3. **分离 support 与求解器收益：**在同一 support 上比较普通/TI、零势/SHUTTLE 势初始化；然后用共同设置比较 SHUTTLE、kNN、importance sampling 和可选 clustering support。
4. **再决定 Schmitzer 适配范围：**简化 full-scan adaptive truncation 与完整 multiscale 移植分开标注；前者不能替后者承受所有方法比较结论。
5. **LCN 先做机制对照：**如增加 clustering/LSH support，明确适配来源；完整 LCN 的 KL-UOT 和 coupling 评测准备完成后再加入。

共同完成标准：相同 cost normalization、原始质量和两侧 rho；相同最终 ε；完整原目标 primal 与 dual；达到同精度的时间曲线；全部 support 构造、continuation、CPU/GPU 数据搬运按口径计时；统一 dtype 对照；多个 seed；规模和维度扫描；单次求解与多 ε support 复用分别报告。

当前结果中存在 `nonfinite_certificate`，需在高精度/稳定评测下检查势和指数项，并明确区分“可用但很松的 dual 下界”“数值溢出”和“primal 非有限”。没有证书的结果不能混入同精度到达时间统计；参考解也须通过其自身完整 gap 检查。

## 10. 本次核对状态

| 项目 | 状态 |
|---|---|
| 本项目 OTT / sparse native / wrapper 调用链 | 已静态核对 |
| 本地 OTT 版本、TI 默认值、ε scheduler 接口 | 已通过环境导入与源码核对 |
| MultiScaleOT CPU/GPU 路径及 sparse kernel/search 结构 | 已对固定 commit 做源码核对 |
| LCN dense KL / sparse / BP / LCN 的目标与接口 | 已对固定 commit 做源码核对 |
| OTT TI on/off sweep | 已实现，并通过 CPU 对称/非对称 rho 的完整目标校验；未跑完整 GPU 批次 |
| 外部新基线运行、移植正确性及 GPU 性能 | 未实施，不能由调研结论代替 |
| 本文涉及的新命名 | 为实验变体描述，未新增项目规范术语；`TERMINOLOGY.md` 无需更新 |

## 11. 沿 Spar-Sink 引用链复查：独立算法候选

### 11.1 检索路线与筛选标准

从 Spar-Sink §5 的实际比较对象和参考文献出发，复查 Nys-Sink、Robust-NysSink、Fast Sinkhorn、Screenkhorn、LCN；再检查引用它的 SNS/SSNS 工作、原作者参与的 2026 稀疏化综述，以及 2026 SinkSLOT 的比较对象。综述用于发现原始论文，不把综述分类代替方法目标的核对。

- [Spar-Sink 原文](https://jmlr.org/papers/v24/22-1311.html)。
- [Ouyang et al., Sparsification Techniques for Large-Scale Optimal Transport Problems, 2026](https://mengyu8042.github.io/files/WIREs_sparOT.pdf)：涵盖 kernel sparsification 和 Hessian sparsification 两类路线。
- [SinkSLOT 原文](https://arxiv.org/html/2608.28262v1)：直接比较 Spar-Sink、FlashSinkhorn 和 SROT。

筛选时分别问：是否固定当前 KL-UOT 目标，是否有两侧独立 rho，是否支持跨点云和高维特征，是否有作者代码，GPU 是否为真实可调用实现。已有论文算法不等于可以零修改接入；反过来，暂无即用接口也不表示不存在适合讨论的算法。

### 11.2 Nys-Sink：有实际 UOT 参考代码，可适配

**发现路径：**它是 Spar-Sink 实验中的直接比较对象。原始 Nyström-Sinkhorn 工作是 [Altschuler et al., Massively scalable Sinkhorn distances via the Nyström method, 2019](https://arxiv.org/abs/1812.05189)。

**本次补充的源码事实：**Spar-Sink 官方仓库的 `code/all_funcs.py` 已提供 `nys_sinkhorn_unbalanced` 与 `nys_sinkhorn_unbalanced2`，不是需要从零构想的 kNN 消融。前者用 `R A R^T` 做 kernel 乘法，并使用 `reg_kl/(reg_kl+reg)` 的 UOT scaling；后者接受完整近似 kernel。两者都不是 GPU 实现，也不能称为原始 Nyström 论文作者提供的通用 KL-UOT GPU API。[Spar-Sink 官方 UOT baseline 代码](https://github.com/Mengyu8042/Spar-Sink/blob/7e5511e22d0b174d4a83b6b9e3ca0981fe461349/code/all_funcs.py)

**对当前实验的适配问题：**

- 现有 `R A R^T` 实现针对共同 support 上的对称 kernel；TOME 的 source/target 是不同点集，不能只因为两侧样本数相同就直接代入。
- 对 squared-L2 Gaussian kernel，可在两侧点云的 union 上取 landmarks Z，构造跨点云近似 `K(X,Z) K(Z,Z)^{-1} K(Z,Y)`。这是一条标准 kernel 近似路线，不限制到 1–3 维。
- 两侧分别使用 `rho_a/(rho_a+epsilon)` 与 `rho_b/(rho_b+epsilon)`，并对齐 `a⊗b` reference；原 UOT 参考接口只有单个 `reg_kl`，非对称扩展要明确标注。
- 近似 kernel 的 entrywise 非负性、病态 landmark 系统、小 ε 下的下溢，以及源码的负值裁剪都需要处理和记录。不能默认 PSD 近似就保证每个跨点云条目非负。
- coupling 通常是全局低秩表示，不是 sparse edge list；完整 coupling KL 和完整 primal 评测需分块处理。不能使用近似 kernel 的优化值代替原始目标值。

**最终决定：本轮不实施。** coupling 通常仍是全局低秩而非稀疏表示，与本轮要验证的稀疏 support 精度—时间论点不直接对应。保留上述可适配性分析；小 ε 下所需 rank 可能很大，性能不能预先断言。

### 11.3 Robust-NysSink：有论文，但不能偷换成当前 free-mass UOT

**发现路径：**Spar-Sink 引用并比较 [Le et al., On Robust Optimal Transport: Computational Complexity and Barycenter Computation, NeurIPS 2021](https://proceedings.neurips.cc/paper/2021/file/b80ba73857eed2a36dc7640e2310055a-Paper.pdf)。

该论文的 ROT/RSOT 与一般 UOT 要分开：其公式 (3) 的 relaxed marginals 仍属于概率单纯形，故 coupling 总质量为 1；RSOT 还有一侧固定边际。当前问题的 transported mass 是自由变量。因此，不能把公式 (3)/(4) 的算法直接作为相同 KL-UOT 目标的另一实现。Nyström approximation 思路可借鉴，但若改为 free-mass KL-UOT，须标注适配；更直接的起点是上节已有的 UOT reference scaling。

### 11.4 FlashSinkhorn：目前最直接的高维 GPU 完整问题候选

**发现路径：**引用 Spar-Sink 的 SinkSLOT 将其列为完整 GPU 基线。FlashSinkhorn 本身不是 sparse-support solver，它以 fused Triton kernels 流式计算完整点对更新；加入比较是为了检验 SHUTTLE 相对现代完整 GPU solver 的价值。

**官方实现：**[ot-triton-lab/flash-sinkhorn](https://github.com/ot-triton-lab/flash-sinkhorn)，本次静态核对 commit `bb2bf5aeaf2eacbbf291b767e14d97a6702dc9e1`；[论文](https://arxiv.org/abs/2602.03067)。这里只考虑 dense streaming backend，不重新纳入作者已排除的 3D multiscale backend。

官方 [API](https://github.com/ot-triton-lab/flash-sinkhorn/blob/bb2bf5aeaf2eacbbf291b767e14d97a6702dc9e1/API.md) 和 `torch-ext/flash_sinkhorn/sinkhorn_solvers.py` 提供独立 `rho_x/rho_y` 或 `reach_x/reach_y`、weighted marginals、fixed ε 和 potentials；源码默认势约定为 `a_i b_j exp((f_i+g_j-c_ij)/epsilon)`，与当前评测有直接对齐路径。高维 dense kernel 不受 1–3 维 multiscale 特化范围限制。

接入时应选择原始 OT 而非 debiased divergence，核对 squared-L2 的 full/half cost、ε、rho、TF32 开关和 coordinate scaling。默认 `normalize=True` 不能静默改变非单位质量问题；当前 TOME 为两侧单位质量仍需明确权重。UOT 下不能误开仅支持 balanced 的 `ott_convention=True`。最终用公共完整评测验证势，不能直接照搬库返回的标量或 potential-change 停机阈值。

依赖要求为 `torch>=2.5`、`triton>=3.1`；本地 `cuda118_all` 为 torch `2.5.1.post303`、Triton `3.7.1`，版本条件表面满足，但尚未编译或运行其 kernels，不能据此宣称 CUDA/GPU 实测兼容。

**最终决定：暂缓接入。** 作者选择优先与 OTT-JAX 比较；FlashSinkhorn 较新且定位重叠，必要时或审稿人要求时再补。保留技术调研，不列为当前实现计划。

### 11.5 SinkSLOT / SROT：新的 sparse 方法，但改变了目标

SinkSLOT（2026-08 预印本）把随机投影下的一维 OT plans 提升回高维，形成 sparse reference coupling，再做 sparse Sinkhorn；有 [作者 GPU 代码](https://github.com/cai4cai/SinkSLOT)。它是独立论文方法，不是 kNN 消融。

但它的原始目标为 balanced `KL(P|P_SOT)`，并非当前 free-mass `KL(P|a⊗b)`；SROT 则使用平滑后的 sliced reference。移除 reference weights、只保留 support，再接 KL-UOT solver，会得到适配方法，不能继续宣称原算法的 divergence 或原目标保证。[原文公式 (5)–(8)](https://arxiv.org/html/2608.28262v1)

**决定：保留相关工作，不直接放进相同 ε-KL-UOT 精度主表。** 如后续研究非独立 reference 的 UOT 或 sparse prior，这条路线很相关；本轮不改目标以强行加入。

### 11.6 SNS、SSNS、SPLR、cuRegOT、PINS：稀疏对象和目标不同

| 方法 | 稀疏/加速对象 | 原始目标与当前差别 | 本轮决定 |
|---|---|---|---|
| SNS，ICLR 2024 | Sinkhorn warm-up 后稀疏化 dual Hessian 做 Newton 更新 | 原始算法为 balanced entropic OT；仍有完整点对工作 | 相关工作保留，不能直接称 KL-UOT sparse coupling solver |
| SSNS，NeurIPS 2024 | 带安全结构的 sparse Hessian | 作者实现基于 balanced EROT 的 RegOT | 不直接接入当前 UOT 主表 |
| SPLR，ICML 2025 | sparse-plus-low-rank Hessian approximation | balanced entropic OT；不是 coupling 低秩或固定 support | 不直接接入当前 UOT 主表 |
| cuRegOT，2026 | SPLR 的 CUDA 实现，优化稀疏求解与完整梯度 | 有官方 GPU，但原文约束为固定两侧边际 | 有 GPU 不等于有 KL-UOT API，暂不适配 |
| PINS，2025/2026 | proximal outer loop + sparse Newton/Sinkhorn | 外层最终求无熵 balanced OT，不是固定 ε 的当前问题 | 不作为本轮 entropic KL-UOT 基线 |

来源：[SNS](https://arxiv.org/abs/2401.12253)，[SSNS 论文](https://papers.nips.cc/paper_files/paper/2024/file/ea8620683340facbd5f754dd169e0980-Paper-Conference.pdf)及[作者实验代码](https://github.com/TangZihao1997/SSNS)，[SPLR](https://proceedings.mlr.press/v267/wang25ck.html)及[RegOT](https://github.com/yixuan/regot-python)，[cuRegOT 公式 (1)–(4)](https://arxiv.org/html/2605.08793)，[PINS v2](https://arxiv.org/abs/2502.03749)。

将 Newton 路线改为 UOT 需要改变 dual gradient、Hessian 对角项与步长/线搜索等，不只是替换一个 Sinkhorn damping 系数；原 balanced 理论也不能直接沿用。因此不把这些都包装成已经有适配接口的候选。

### 11.7 其他原始比较对象和最终取舍

Fast Sinkhorn I/II 依赖特定的一维/结构化 kernel 快速乘法，不能把其线性复杂度直接搬到当前任意高维 squared-L2 点云；本轮排除。[Fast Sinkhorn I](https://arxiv.org/abs/2202.10042)，[Fast Sinkhorn II](https://arxiv.org/abs/2206.09049)

Rand-Sink 在 Spar-Sink 官方函数中有 `method='rand-sink'` 分支，确有 UOT scaling，但本质上是同一采样框架中的均匀采样对照，不作为本轮要找的新增独立算法。Screenkhorn、Greenkhorn、Schmitzer、LCN 的决定沿用前述各节。

**本轮行动：**已实现 OTT TI sweep、LCN clustering 适配基线和 Schmitzer CPU 基线；不实施 kNN、Nyström、FlashSinkhorn。尚未确认到另一个同时满足“官方即用 GPU、free-mass 两侧 KL、相同 independent reference、高维 sparse support”全部条件的独立方法；这只是本次核对范围的结果，不是不存在此类算法的断言。

## 12. 已确认的实现方案与验证边界

LCN 采用共享 Euclidean k-means++、十次 Lloyd 更新、同簇全部跨侧边。以目标邻居数 `8/32/128` 选择 `ceil(n_target / neighbors)` 个簇，实际边数由簇分布决定；仅孤立节点补一条跨侧最近邻边，补边数量单独记录。现代 Torch 归约替换旧 TorchScript/torch_scatter；保留上游 commit、原许可证与修改说明。求解复用 generalized sparse Sinkhorn，使用原始 cost 和 `a⊗b` reference，无低秩项、无 SHUTTLE warm-start。图例明确标注为适配的 LCN clustering + sparse Sinkhorn。

Schmitzer 调用原版 PyPI MultiScaleOT **0.3.8** CPU C++/Eigen 核心，使用两侧独立权重的 `TSinkhornSolverSoftMarginal` 与 KL marginal functions。源码调研 commit 与安装的发布版本分别记录，不声称两者相同。为避免默认网格树枚举高维子格，使用独立最大跨度轴中位数二分层级，接官方 explicit API，保持原始最细层点序。ε 从 `max(1,epsilon)` 到目标值逐层几何下降，每层三个值。原生稳定化、截断、参数默认值不变；API 必填的 `errorGoal` 由适配器设为 `1e-4`，不是库默认值。使用原始权重 reference，并将吸收势与残余 scaling 合并输出。

端到端时间包含 LCN 构图/补边/求解，以及 CPU 层级/求解/输出提取；公共完整评测单独计时。GPU 方法预热后测量，CPU 无 JIT 预热。LCN 几何 FP32、sparse Sinkhorn FP64；Schmitzer CPU FP64。CPU 以独立单 worker 队列运行，CPU 评测，单独记录 RSS 高水位；图例保留 CPU 标记，不把显存零值当 CPU 内存，也不将跨硬件 wall time 解释为纯算法加速。

共享进程监督放在 `paper_experiments/common`，同时用于公共 runner 与本实验 runner。控制管道 EOF 与 Linux subreaper 处理正常退出、超时、Ctrl-C、SIGTERM 和父进程 SIGKILL；清理自有 CPU/GPU 后代，覆盖组长提前退出、后代另建 session、忽略 SIGTERM 的情况。只管理自己启动的实验树。

验证包括聚类机制/补边/随机种子测试、二分层级覆盖测试、原生 CPU 对称及非对称 KL-UOT 完整证书测试、CPU/GPU 调度与进程树生命周期测试，以及 30 维 TOME 的小规模 CPU/GPU smoke。内部停止指标与完整 gap 分别保存；不能根据 smoke 或内部收敛预判完整 real-world sweep 的胜负。完整 300-case 网格尚未运行。

**默认行为的实测限制：**128 点 TOME、ε=0.001、两侧 rho=0.1 时，MultiScaleOT 默认截断会产生孤立节点。源码 `TSoftMarginalFunctionKL::PDGapContribution` 仅对 `muEff[x]>0` 累积，因此内部 gap 可很小而公共完整 gap 仍约 `1e-2`。检查输出 coupling 与物理势的 kernel 关系及缺边质量后，差异定位到孤立节点对应的边际 dual 项；不是删除公共评测常数来解决。保留用户要求的原生默认表现，记录两侧孤立节点数，不静默开启 safe mode。该观察限于小规模 smoke，不代表所有规模表现。
