# HierUOT 理论与 curvature-aware pricing 备忘录

## 1. 问题结构

full KL-UOT 和 restricted KL-UOT 都是凸优化问题，但一般不是 LP。restricted KL-UOT 将运输变量限制在当前 active support 上，PDUOT 是其专用 primal-dual solver。HierUOT 的外层循环由以下两步组成：

1. 用 PDUOT 求解当前 restricted KL-UOT；
2. 计算 full-space dual violation，并将选出的边加入 active support。

因此 pricing 规则直接影响每个 hierarchy level 的 refinement rounds、加入的边和后续 restricted KL-UOT 问题；它只会间接影响一次 PDUOT 调用的 inner iterations。

## 2. Curvature-aware pricing

设当前 restricted solution 为 $X$，边缘为 $r=X\mathbf 1$ 和 $q=X^\top\mathbf 1$，dual score 为 $\sigma_{ij}=f_i+g_j-c_{ij}$。沿缺失边 $(i,j)$ 增加流量 $t\geq0$ 时，

$$h_{ij}'(0)=-\sigma_{ij},\qquad h_{ij}''(t)=\frac{\rho_a}{r_i+t}+\frac{\rho_b}{q_j+t}\leq L_{ij}:=\frac{\rho_a}{r_i}+\frac{\rho_b}{q_j}.$$

由此得到单边 guaranteed-decrease lower bound：

$$F(X)-F(X+\bar tE_{ij})\geq\frac{(\sigma_{ij})_+^2}{2\left(\rho_a/r_i+\rho_b/q_j\right)}$$

其中 $\bar t=(\sigma_{ij})_+/L_{ij}$。候选 pricing score 因而为

$$s_{ij}^{\mathrm{curv}}=\frac{(\sigma_{ij})_+^2}{2\left(\rho_a/r_i+\rho_b/q_j\right)}.$$

该分数在 dual violation 的一阶信息之外考虑 KL marginal curvature。它主要用于比较正 dual-score 边，而 full-space dual violation 的停机证书仍应由原始 $\sigma_{ij}$ 计算。

### Batch extension

对任意非负候选增量 $\Delta$，令 $p_i=\sum_j\Delta_{ij}$、$s_j=\sum_i\Delta_{ij}$，则

$$F(X+\Delta)\leq F(X)-\sum_{ij}\sigma_{ij}\Delta_{ij}+\frac12\sum_i\frac{\rho_a}{r_i}p_i^2+\frac12\sum_j\frac{\rho_b}{q_j}s_j^2.$$

因此可最大化 joint guaranteed-decrease surrogate：

$$\mathcal B(\Delta)=\sum_{ij}\sigma_{ij}\Delta_{ij}-\frac12\sum_i\frac{\rho_a}{r_i}\left(\sum_j\Delta_{ij}\right)^2-\frac12\sum_j\frac{\rho_b}{q_j}\left(\sum_i\Delta_{ij}\right)^2.$$

它会惩罚共享端点的候选边，适合进一步发展为 batch pricing。当前优先验证单边 score；只有出现稳定收益后再实现 batch 版本。

## 3. PDUOT 收敛理论

rHPDHG 已经分析 fixed restart、基于 fixed-point residual 的 adaptive restart 和 reflected Halpern PDHG。其算子层结论可以较自然地用于固定 metric 的 PDUOT；仅重述这些结论的创新性有限。

更有价值的问题是为 restricted KL-UOT 建立 KL-specific error bound。设正 support 为 $S$，其局部 Hessian 为

$$\nabla^2F_S(X)=K_S^\top D K_S,\qquad D=\operatorname{diag}\left(\rho_a/r_i,\rho_b/q_j\right).$$

若 inactive edges 满足 strict complementarity，并且 $K_S$ 满列秩，例如正 support 是 forest，则 $K_S^\top D K_S$ 正定。这可能导出 active-support identification、局部 error bound 和 restarted PDUOT 的局部线性收敛。PID primal-weight controller、adaptive common step 和全部工程 restart triggers 暂不纳入第一版理论。

## 4. 统一理论主线

KL marginal curvature 矩阵 $D$ 同时控制：

- 外层中单边或 batch support expansion 的 guaranteed decrease；
- 内层 restricted KL-UOT 的局部 conditioning 和 PDUOT convergence。

可将理论主线概括为：KL marginal curvature controls both edge insertion and restricted optimization。

HELLO 风格的相邻经验测度 Wasserstein warm-start bound 暂不作为主要理论，因为该界较宽，在 KL-UOT 中还可能依赖边缘质量下界或指数响应。hierarchy 部分优先使用 inherited-point KKT residual、初始 full-space dual violation、support recall 和 calibration 改善等可观测量。

## 5. 已有困难算例

已有结果包含适合测试 pricing 的算例，无需先人为构造差初始化。

- TOME embryogenesis，$\rho_a=\rho_b=10$，$n=8192$，`restricted_tolerance=full_dual_tolerance=1e-6`：五个 level 的累计 PDUOT inner iterations 分别为 12,000、20,000、26,300、37,900、146,200；各 level 的 refinement rounds 为 0、2、3、3、3。finest level 三次 PDUOT 调用分别为 8,200、94,000、44,000 次。
- TOME embryogenesis，$\rho_a=\rho_b=100$，$n=8192$，tolerance $10^{-6}$ 的旧结果：七个 level 共 22 次 PDUOT 调用，累计 1,007,800 次 inner iterations，中位数 29,000，最大 160,000；refinement rounds 为 0、1、2、4、5、4、5。
- 同一 $\rho_a=\rho_b=100$ 系列在 $n=16{,}384$、$65{,}536$、$131{,}072$ 上也持续出现多 refinement rounds 和较高累计 inner iterations，不是单一随机异常。

这些正式 HierUOT 结果使用 uniform reference masses。它们证明困难 refinement 已经存在，但尚不能证明 curvature-aware score 会改变排序：若 transported marginals $r_i,q_j$ 也接近均匀，曲率分母近似常数，新 score 与原始 $\sigma_{ij}$ 的排序几乎相同。正式 A/B 前应先记录曲率分母的离散程度和两种 top-$k$ 的 overlap。

第一条结果来自：

`paper_experiments/uot/results/20260924_213345/runs/uot__method-hier_uot_constant__tol-1e-06__dataset-tome_embryogenesis__pair-E11.5_E12.5__n-8192__d-30__seed-42/hierarchy_result.json`

第二条结果来自：

`paper_experiments/uot/results/20260920_182652-100-100-也观察到首个restrictedUOT问题的full_dfeas特别差-而且iter也大/runs/uot__method-hier_uot__tol-1e-06__dataset-tome_embryogenesis__pair-E11.5_E12.5__n-8192__d-30__seed-42/hierarchy_result.json`

## 6. 下一步实验

先在已有 TOME 困难算例上做严格配对比较：

1. 固定数据、随机种子、hierarchy、初始 active support、`pricing_topk`、support budget 和 PDUOT 配置；
2. baseline 使用 $\sigma_{ij}$ 排序；variant 使用 $s_{ij}^{\mathrm{curv}}$ 排序；
3. full-space dual violation 的数值和停机规则保持不变；
4. 比较每层 refinement rounds、每轮加入边数、累计 PDUOT inner iterations、restricted solve time、full scan time、总时间和最终证书；
5. 若已有算例区分度不足，再将 `split_count=4` 提高到 8，或设计无 hierarchy 的差初始 active support 压力测试。

## 7. 2026-10-12 初步实验结果

配置为 TOME E11.5--E12.5、$n=8192$、seed 42、uniform masses、`split_count=8`、`assignment_topk=16`、`pricing_topk=2` 和 tolerance $10^{-6}$。PDUOT 调用次数按所有非 coarsest levels 的 refinement rounds 求和。

| $\rho_a=\rho_b$ | raw-$\sigma$ 调用数 | curvature-aware 调用数 | raw 收敛 | curvature 收敛 |
|---:|---:|---:|:---:|:---:|
| $1$ | 10 | 10 | 是 | 是 |
| $0.1$ | 8 | 8 | 是 | 是 |
| $0.01$ | 6 | 106 | 是 | 否，达到 100 轮上限 |

在 finest level 的第一次失败 scan 中：

| $\rho$ | 分母有限部分 CV | 零 source/target marginals | raw 与 curvature 新边 overlap | curvature/raw surrogate ratio，source |
|---:|---:|---:|---:|---:|
| $1$ | 0.107 | 0 / 0 | 99.4% | 1.006 |
| $0.1$ | 2.218 | 2 / 0 | 99.0% | 1.131 |
| $0.01$ | 6.811 | 23 / 32 | 93.1% | 1.046 |

对 `all_edges` 和统一排除 active support 的 `inactive_edges` 两种 candidate scope 均进行了配对实验。$\rho=1$ 和 $0.1$ 下，scope 和 pricing score 都没有改变 PDUOT 调用次数。$\rho=0.01$ 下，统一排除 active edges 后 raw-$\sigma$ 仍以 6 次调用收敛，而 curvature-aware 仍停滞。因此，停滞的主要原因不是 active edges 占用 top-k slot。

真正的失败模式是零 marginal。若 $r_i=0$ 或 $q_j=0$，当前实现令相应曲率为无穷大，从而将 curvature-aware gain 置零。在 finest level，curvature-aware 前两轮加入 287 和 2 条边；第三轮仍有 19 条 raw-$\sigma$ violating inactive edges，但 curvature-aware 正分候选为 0，随后重复到迭代上限。这个现象说明上述二阶 bound 只能直接用于 $r_i,q_j>0$ 的 interior regime；它不是零 marginal 边界上的有效 ranking rule。

进一步测试了两个 boundary-safe 版本：使用 dual-implied marginals $\hat r_i=a_i\exp(-f_i/\rho_a)$、$\hat q_j=b_j\exp(-g_j/\rho_b)$ 的二阶 score，以及对称 $\rho$ 下具有闭式最优插入量的一维 exact edge-insertion gain。两者都修复了 $\rho=0.01$ 的停滞，但没有带来算法收益：

| $\rho$ | 指标 | raw-$\sigma$ | dual-implied curvature | exact gain |
|---:|---|---:|---:|---:|
| $1$ | PDUOT calls / inner iterations | 10 / 46,600 | 10 / 46,600 | 10 / 46,600 |
| $0.1$ | PDUOT calls / inner iterations | 8 / 27,460 | 8 / 27,460 | 8 / 27,460 |
| $0.01$ | PDUOT calls / inner iterations | 6 / 42,190 | 6 / 42,190 | 6 / 42,190 |

在 $\rho=0.01$ 的 finest-level 首轮，三者分别加入 303、300 和 288 条边，随后都在下一次 PDUOT 调用收敛。排序差异没有转化为 refinement rounds 或 inner iterations 的改善。因此停止 curvature-aware pricing 方向，不再进行 `assignment_topk=2` 压力测试，也不将实验实现保留在正式 solver 中。raw-$\sigma$ 继续作为唯一 pricing rule。

实验产物位于 `paper_experiments/uot/results/20261012_curvature_pricing_diagnostics/`。当前 curvature scan 是额外的 PyTorch 实验实现，运行时间不适合与 fused raw scan 作公平比较；本轮结论只比较 PDUOT 调用次数、候选集合和证书。

## 8. Inexact restricted oracle 的有限容差理论

该方向可以得到一个非 exact-oracle 的结论，但定理适用于带 safeguard 的 HierUOT 变体，不直接覆盖当前 production loop。

对任意正 transported marginals 的当前 coupling $X$，使用由 primal marginals 定义的势和 dual score。若缺失边 $e$ 满足 $\sigma_e^X>0$，则解析步长 $t_e=\sigma_e^X/h_e(X)$ 给出

$$\Phi(X+t_eE_e)\leq\Phi(X)-\frac{(\sigma_e^X)^2}{2h_e(X)}.$$

这条下降式不要求 $X$ 是 restricted optimum。原因是 KL-UOT 的 marginals 是软约束，单独增加一条边始终 primal feasible；balanced OT 没有这个性质。

若每轮 inexact restricted solve 满足 restricted projected-gradient residual 不超过 $\varepsilon_r$，并且保留 one-edge trial 的固定比例下降，则当 full-space violation 超过 $\varepsilon_f$ 时，每轮都有严格目标下降。目标函数有下界，因此 refinement 在有限轮后停止，最终 full-space projected-gradient residual 不超过 $\max\{\varepsilon_r,\varepsilon_f\}$。

统一曲率上界不必单独假设。在 costs 非负、active support 覆盖所有节点且目标值处于初始子水平集时，KL 子水平集先给出 transported marginals 的上界；active-edge projected stationarity 再给出所有 marginals 的显式正下界，从而得到 $h_{ij}(X)$ 的显式上界。该常数通常很松，只用于闭合有限终止证明，不适合预测实际 refinement rounds。

固定 metric、精确 proximal map 的 PDUOT 收敛到 restricted KKT point，因此通过继续 inner iterations，最终能同时满足 restricted residual 和相对于 one-edge trial 的 objective safeguard。这说明 inexact oracle 条件原则上可实现，但当前 PID primal-weight controller、完整 restart policy、阈值 pruning 和现有 termination certificate 尚未全部被定理覆盖。

完整英文推导见 `papers/hier_uot/hieruot_inexact_refinement_theory.tex`。ETM 已有的 KL-UOT 等价变换和稀疏最优解结论只作为背景，不列为本文原创理论。

## 9. PDUOT diagonal metric 诊断

这一方向与 curvature-aware pricing 不同。pricing 改变外层加入哪些边；diagonal metric 不改变 restricted KL-UOT 问题，只改变 PDUOT 的 primal/dual 步长。

当前 production PDUOT 使用 scalar metric：

$$\tau_e=\eta\omega,\qquad \sigma_i=\eta/\omega.$$

其中 $\eta$ 是由 active-support incidence operator 决定的 common step，$\omega$ 是 primal weight。$\omega$ 只平衡整体 primal 与 dual 尺度，不能处理不同节点的 degree 或 KL curvature 差异。

PyTorch 诊断比较了四种 frozen diagonal metric：

1. `scalar`：上述 production-like scalar metric；
2. `degree`：标准 Pock--Chambolle metric，将 node degree 主要放入 dual step；
3. `edge_degree`：令 node dual step 相同，并取 $\tau_{ij}\propto1/(d_i+d_j)$；
4. `degree_curvature`：令 node dual step乘以截断后的 inverse KL curvature，并取安全的 edge step：

$$\sigma_i=\sigma_0s_i,\qquad \tau_{ij}=\frac{0.998^2}{d_i\sigma_i+d_j\sigma_j},\qquad s_i\propto\frac{\rho}{\widehat r_i}.$$

所有版本使用相同 warm start、Halpern iteration、adaptive restart、primal-weight controller、prox 配置和 $10^{-6}$ tolerance。`edge_degree` 与 `degree_curvature` 只差 $s_i$ 是否恒等于 1，因此是识别 curvature 贡献的严格 control。

### 9.1 $\rho=10$ 的极端 degree imbalance

在 `split_count=4` 的 finest-level 慢调用中，inverse KL curvature 的离散度只有约 1.52 倍，但 target degree 从 3 到 4022，约 1340 倍。最慢快照的结果为：

| metric | iterations | time (s) |
|---|---:|---:|
| scalar | 39,800 | 22.84 |
| Pock--Chambolle degree | 19,000 | 10.96 |
| edge degree | 4,800 | 2.74 |
| edge degree + curvature | 4,800 | 2.88 |

另一个原生 44,000-iteration 快照中，`edge_degree` 与 `degree_curvature` 均为 4,400 步。该 case 的主要瓶颈是 active-support degree imbalance，曲率项没有贡献。

### 9.2 $\rho=1$、`split_count=8`

真实 hierarchy 共 11 次 restricted solves，各 level refinement rounds 为 0、1、3、2、4；单次 inner iterations 的最大值为 13,000。配对快照结果如下：

| restricted shape | curvature condition | edge degree | edge degree + curvature | 变化 |
|---:|---:|---:|---:|---:|
| $128\times128$ | 11.4 | 4,500 | 4,900 | $+8.9\%$ |
| $128\times1024$ | 64.0 | 3,500 | 2,500 | $-28.6\%$ |
| $1024\times8192$ | 64.0 | 3,300 | 2,700 | $-18.2\%$ |
| $8192\times8192$ | 8.33 | 3,000 | 2,900 | $-3.3\%$ |

在 $1024\times8192$ 的 13,000-iteration 原生慢调用上，完整四方比较为 scalar 6,200、Pock--Chambolle 2,700、edge degree 3,300、edge degree + curvature 2,700 步。

### 9.3 当前判断

主要发现不是 curvature-aware preconditioning，而是 edge-degree metric：它在 extreme hub imbalance case 上将 PyTorch PDUOT 从 39,800 步降至 4,800 步。KL curvature 是第二阶修正；它在高度 rectangular、两侧 marginal-response 尺度显著不同的 level 上减少约 18--29% iterations，在 balanced levels 上基本无效。

因此暂不把 curvature-aware metric 作为独立算法贡献。下一步若继续，应优先把 diagonal preconditioning 移植到 native PDUOT，并用 production HierUOT wall time 验证；curvature factor 作为同一实现中的可选 ablation。当前实验没有修改 production solver。

诊断和 PyTorch 对照产物位于：

- `paper_experiments/uot/results/20261012_pduot_curvature_metric_diagnostics/`
- `paper_experiments/uot/results/20261012_pduot_curvature_metric_snapshot/`

### 9.4 PyTorch PDUOT 的端到端 HierUOT 结果

实验性 PyTorch hierarchy 已增加 `torch_pdhg` backend。四种 metric 使用同一数据、hierarchy、初始 active support、pricing、pruning、warm start、Halpern iteration、restart、primal-weight controller、prox 和 tolerance。`edge_degree` 与 `edge_degree_curvature` 均先运行 200 次 scalar pilot，再冻结 diagonal metric；前者将 curvature condition 固定为 1。

在 TOME E11.5--E12.5、$n=8192$、seed 42、tolerance $10^{-6}$ 上：

| $\rho$ / `split_count` | metric | restricted calls | refinement rounds | restricted iterations | restricted time (s) | total time (s) |
|---|---|---:|---:|---:|---:|---:|
| $1$ / 8 | scalar | 10 | 9 | 47,500 | 27.10 | 27.66 |
| $1$ / 8 | Pock--Chambolle | 10 | 9 | 30,500 | 16.91 | 17.44 |
| $1$ / 8 | edge degree | 10 | 9 | 34,100 | 18.85 | 19.38 |
| $1$ / 8 | edge degree + curvature | 10 | 9 | 29,300 | 16.23 | 16.78 |
| $10$ / 4 | scalar | 20 | 19 | 206,100 | 119.81 | 120.71 |
| $10$ / 4 | Pock--Chambolle | 20 | 19 | 106,500 | 61.16 | 62.06 |
| $10$ / 4 | edge degree | 20 | 19 | 100,100 | 57.52 | 58.40 |
| $10$ / 4 | edge degree + curvature | 20 | 19 | 90,000 | 51.89 | 52.78 |

所有 variant 均收敛，并且每个 case 的 restricted calls 和 refinement rounds 完全相同。因此这些结果没有显示 outer refinement 改善，收益来自相同 active-support 轨迹上的 inner PDUOT acceleration。

在 $\rho=1$ case 上，Pock--Chambolle 已获得主要收益，curvature variant 相对它只减少约 4% restricted iterations。在 $\rho=10$ case 上，edge-degree 相对 scalar 减少约 51%，curvature variant 减少约 56%；curvature variant 相对 Pock--Chambolle减少约 15%。分层结果仍显示 curvature 收益集中在 rectangular levels，balanced square levels 上通常与 Pock--Chambolle相近或更差。

端到端结果支持将 diagonal preconditioning 移植到 native PDUOT，但还不足以确定最终默认 metric。Pock--Chambolle最简单且在 $\rho=1$ 上接近最佳；edge-degree-plus-curvature 在两个 $n=8192$ cases 上总 iterations 最低，但需要 pilot 和一次 metric rebuild。production 实现前应保留三者的统一接口并做多 seed、不同 $\rho$ 的 native ablation。

端到端产物位于 `paper_experiments/uot/results/20261012_pduot_metric_hierarchy/`。
