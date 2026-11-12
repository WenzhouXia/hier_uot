# 原目标进展驱动的精度控制：一个更简单的候选

日期：2026-10-20。状态：理论工作推导与 experiments 验证；生产代码、主论文和 bibliography 未修改。

## 1. 与上一轮的区别

稳定化路线暂不采用，原因见 [历史记录](dual_stabilization_exploration_record.md)。
本候选保持原 restricted KL-UOT objective、PDUOT 迭代、返回 potentials、full scan、candidate selection 与 budgeted pruning。
只在 hierarchy orchestration 中更新下一次 restricted solve 的 tolerance。
没有稳定化模型、中心、模式切换、历史 residual 窗口、回滚、本轮补精或重复 scan。
不启用旧的 `refinement_progress_check`，不计算 $L_k$ 或 $G_k$。

本候选放宽“始终固定 inner tolerance”这一设计偏好，换取算法表述简单。
它没有证明原版固定 tolerance 的 hier_uot 自动有限终止，也不保证异常算例不会付出补精成本。

## 2. 算法：只控制下一轮精度

固定一个 hierarchy level，初始 inner tolerance 为 $\kappa_0>0$，full tolerance 为 $\tau>0$。
每轮以当前 $\kappa_k$ 求解，获得非负 coupling $\mathbf x^k$、potentials 与原始目标值 $\Phi_k=\Phi(\mathbf x^k)$，然后照常 full scan。
若原 full stopping 通过，立即退出，不再检验目标进展。
否则，与上一轮同层目标值比较：

$$\kappa_{k+1}=\begin{cases}\kappa_k/2,&\Phi_{k-1}-\Phi_k<\kappa_k^2(1+|\Phi_{k-1}|),\\\kappa_k,&\text{otherwise}.\end{cases}$$

每层第一次非终止扫描只保存目标值，不修改精度。
无论是否收紧，本轮解和 support 更新全部保留，下一轮仍从当前结果 warm start。
进入下一层重置为名义 tolerance。

```text
for each level:
    kappa <- nominal tolerance; previous_objective <- unset
    repeat:
        x, f, g, objective <- PDUOT(active support, kappa)
        candidates, full_residual <- FullScan(f, g)
        if full stopping passes: finish this level
        if previous_objective is set and objective progress < forcing(kappa):
            kappa <- kappa / 2
        previous_objective <- objective
        update and prune the active support as before
```

两个状态标量是当前 tolerance 与上一轮目标值。
目标值使用已有 restricted certificate 的结果，不额外计算距离、coupling objective 或 GPU reduction。
算法控制状态不增加 coupling-sized 存储；实验中保留的逐轮诊断历史属于额外观测日志，严格 working-memory 实现应流式写出这些日志。

## 3. 门槛的作用与设计自由度

这里的平方函数是一个简单的固定 forcing function，不是从 native KKT 推出的 objective-error 等式，也未证明它是最优选择。
证明对任何连续正函数 $\psi(\kappa)$ 都成立，只需在 tolerance 固定为正数时，非收紧轮要求至少 $\psi(\kappa)>0$ 的目标下降。
选择 $\psi(\kappa)=\kappa^2$，并用 $(1+|\Phi|)$ 做常规目标尺度归一化，避免再暴露一个可调参数。
把 forcing function 取得很小会延迟精度调整；有限终止结论本身不提供好的 worst-case runtime。

这里没有要求每轮目标下降。
一次目标上升只会触发下一轮 tolerance 减半，不会拒绝本轮结果或撤销此前迭代。
Full dual violation 可任意短期波动，因为控制规则不使用其变化比例。

## 4. 无限非终止轨迹必然使 inner tolerance 趋零

假设一个 level 无限运行且始终未通过 full stopping。
若只有有限次 tolerance 减半，则某轮以后 $\kappa_k=\bar\kappa>0$。
每个足够晚的非终止轮都必须满足

$$\Phi_{k-1}-\Phi_k\ge\bar\kappa^2(1+|\Phi_{k-1}|)\ge\bar\kappa^2>0.$$

对这些轮求和，目标值会趋向负无穷，与非负成本 KL-UOT 的 $\Phi\ge0$ 矛盾。
因此无限轨迹必有无限次减半，即 $\kappa_k\to0$。
这一论证不要求减半轮的 objective 单调，也不要求 full residual 单调。

## 5. 条件有限终止定理

沿用 [delayed accuracy 理论](../../../experiments/refinement_forcing_uot/DELAYED_ACCURACY_THEORY.md) 的有限图假设与 compactness 论证：

1. 固定有限问题，参考质量与 KL penalties 严格为正，成本有限且非负，scan 与 restricted 使用相同数学成本。
2. 每个 active support 覆盖所有 source/target 节点；positive-flow 图允许有孤立节点。这里的覆盖指 active graph，不是正流图。
3. Native marginal-response 与 stationarity 残差满足本轮 $\kappa_k$；投影 slack 非负并与 primal 互补。
4. Exact bidirectional top-$b$ pricing，$b\ge1$；新候选在下一次 solve 前保留。
5. 保留当前 coupling 的可行表示；support sparsification 保持两个 transported marginals 和 transport cost，后续 budgeted pruning 只删除零流。
6. 对每个请求的正 tolerance，restricted solver 在有限迭代内达到该 tolerance。无硬性 iteration/time cutoff；浮点可达性不包含在此假设内。

**定理（工作推导，exact arithmetic）。** 在上述条件下，第2节精度控制器经过有限次 restricted solve 和 full scan，返回满足名义 restricted KKT 与固定 full tolerance 的结果。每个 restricted 子问题均可近似求解。

**证明。** 假设存在无限非终止轨迹。第4节给出 $\kappa_k\to0$。
Native 残差、active graph 覆盖与互补性给出统一有界的 primal/dual 状态；这一步不依赖 computed objective 单调。
有限 support 家族中每个固定 support 的 cluster point 满足精确 restricted KKT，故

$$\delta_k:=\Phi(\mathbf x^k)-F(\mathcal N_k)\to0,$$

其中 $F(\mathcal N)$ 为精确 restricted 最优值，仅用于分析。
Full scan 始终失败时，其正的固定门槛、vanishing active residual 与 exact top-$b$ 共同保证：足够晚的轮中，新候选含一个 primal coordinate gain 至少为固定 $\gamma>0$ 的边。
否则可取固定 support 与固定候选子序列，使极限为 restricted 精确最优点，同时具有超出 full 门槛的缺失边，却没有正 coordinate gain，矛盾。
Active 覆盖使该极限中所有 transported marginals 为正，原势与 marginal-induced potentials 相同；有限 support、有限边和 compactness 使上述 $\gamma$ 可统一选取。
Support/cost 保持给出

$$F(\mathcal N_{k+1})\le\Phi(\mathbf x^k)-G_k=F(\mathcal N_k)+\delta_k-G_k\le F(\mathcal N_k)-\gamma/2$$

对所有足够大的 $k$ 成立。
精确 restricted 最优值非负，不能无限作这样的下降，矛盾。
每次 inner solve 有限，故总迭代有限；终止时 $\kappa_k\le\kappa_0$ 保证名义 restricted KKT，full scan 保证原外层判停。证毕。

该证明追踪的是分析中的 restricted 最优值，不要求保存 support 历史，也不依赖 computed objectives 构成严格下降序列。
定理不声称 native KKT 数值与 objective error 线性等价，不依赖已知的 minimum mass 或 curvature 常数来选择算法参数。

### Compactness 与新边增益的具体依据

设 active 边数上界为 $E_{\max}$，$R=\rho_a+\rho_b$，$D=1+\|\mathbf C\|_F$，$M_a=1+\|(\mathbf a,\mathbf b)\|_2$。
所有 inner tolerance 不超过 $\kappa_0$，因此绝对误差上界可固定为 $e_m=\kappa_0M_a$ 与 $e_d=\kappa_0D$。
若总 flow 为 $T>0$，存在一条正流边 $x_{ij}\ge T/E_{\max}$。
这条边的投影 slack 为零，故 $f_i+g_j\ge c_{ij}-e_d\ge-e_d$。
另一方面两个 response 均至少为 $T/E_{\max}-e_m$，所以

$$T\le E_{\max}\left[e_m+K\exp(e_d/R)\right],\qquad K=\max_{ij}a_i^{\rho_a/R}b_j^{\rho_b/R}.$$

当 $T/E_{\max}\le e_m$ 时该界直接成立，否则由上述两条 potential-sum 界推出。
所有 responses 因此有共同上界，从指数表达得到每个 potential 的共同下界。
每个节点至少有一条 active incident edge，而该边满足 $f_i+g_j\le c_{ij}+e_d$，所以 potentials 也有共同上界。
由此得到响应的某个统一正下界 $h_*>0$；它仅用于证明，可能非常小。
Slacks 同样有界。

在 $\kappa_k\to0$ 时，所有实际 marginals 最终至少为 $h_*/2$，raw 与 marginal-induced potentials 的差一致趋零。
Full scan 失败意味着最大 raw score 至少为 $\tau D/\sqrt{mn}$；active positive scores 趋零，故该最大值最终位于缺失边，exact top-$b$ 将其返回。
其真实 primal score 最终至少为 $\varepsilon=\tau D/(2\sqrt{mn})$。
沿这条边加流，KL 二阶导数不超过 $2R/h_*$，因此其可行 coordinate gain 至少为

$$G_k\ge\frac{h_*\varepsilon^2}{4R}>0.$$

这是第5节 $\gamma$ 的一个保守取值，不是实现中的门槛，也不要求实际估算它。
该推导明确区分：误差趋零的理论极限与实际每次调用的非零 stopping tolerance。

## 6. 适用边界

- 与原稳定化方案相比，代码变化局限于 hierarchy 的下一轮 options，不改 node prox 或 scan。
- 这是 adaptive-accuracy refinement，不是固定 inner tolerance 定理；其控制原理也不专属于 UOT，UOT-specific 部分在 native 残差与 support/optimality 的分析连接。
- Exact top-$b$、同一数学成本、保 marginals/cost 的 sparsification、active graph 节点覆盖是实质假设，需要与拟发表版本逐项对齐。
- 不给出 tolerance 减半次数的实用上界，也不保证所有数据和精度下不存在性能退化。
- FP64 目标相减可能在极小门槛下消减，误触发会增加计算；不能据此把不满足原 KKT 的点当成成功。
- 模型代码在 forcing threshold 下溢时显式报错，不伪造零阈值或理论收敛。

## 7. 本轮另一条被否定的简化路线

尝试单侧下调 PDUOT potentials，使其不超过 marginal-induced potentials，再做 active feasibility 修复。
这种 readout 能保证 pricing 分数不高估真实 primal 下降方向，也能优雅处理零 marginals。
但修正会破坏 positive-edge stationarity；原 KKT 必须重算，不能仅因 full violation 变小就接受。
TOME $n=4096$、五组 penalties、$10^{-6}$ 的46个真实 restricted 输出中，单侧修正后仅3个通过，进一步 active feasibility 修复后仅1个通过。
因此该版本不符合低补精成本目标，不继续默认接入测试。
数据：`experiments/refinement_forcing_uot/results/one_sided_readout_audit_n4096.json`；8项代数回归测试通过，不代表一般 KKT 保持。

## 8. 实验记录

实现：`experiments/refinement_forcing_uot/objective_accuracy_refinement.py`。
回归测试覆盖 raw residual 波动、objective 上升后的下一轮补精、terminal scan 跳过 forcing、逐轮收紧与数值下溢。
先对既有45条真实轨迹做离线检查：205次同层转移中，三次目标进展不足都发生在已经通过 full stopping 的终止轮；按实际算法无需补精。
该离线检查不改变轨迹，不能代替新控制器的真实运行。

### 实际普通路径

Artifact：`experiments/refinement_forcing_uot/results/objective_accuracy_normal.json`。
TOME 两侧规模 $4096,16384$，五组对称/非对称 penalties，tolerance $10^{-4},10^{-6},10^{-8}$，共30组实际运行。
30/30达到原 KKT，全部 inner/outer 次数与既有同配置无 progress guard 基线一致，267次 full scan，没有补精；36次有效非终止目标比较。
生产源码指纹不变。
这里比较的是工作量和最终 objective，不把跨批次 wall time 当成严谨的开销测试。
各组最大 objective 差不超过浮点舍入尺度，未保存 coupling 数组，因此不声称输出逐位相同。

### Thin-support 压力路径

Artifact：`experiments/refinement_forcing_uot/results/objective_accuracy_thin.json`。
$n=4096$、五组 penalties、tolerance $10^{-6}$、assignment/pricing 均为1、support budget factor为4。
5/5达到原 KKT；17、23、34、44、23轮，141次 full scan、101次有效比较，无补精。
这说明薄 support 路径也未触发额外精度要求，不证明触发后一定高效。

### 构造平台的真实集成测试

Artifact：`experiments/refinement_forcing_uot/results/objective_accuracy_constructed_witness.json`。
在真实 $n=128$ hierarchy 中注入两次构造的合法近似 restricted 输出，它们保持同一个 primal objective，但 raw full scan 均失败。
两次注入的原 restricted KKT 均约 $1.62\times10^{-37}$，不是以错误 KKT 绕过检查。
控制器在目标平台上触发一次减半；下一次真实 native PDUOT 确实使用 $5\times10^{-5}$，而不是原 $10^{-4}$。
随后通过原 fixed full stopping 与原名义 restricted KKT，最终 reported KKT 约 $2.88\times10^{-6}$。
本实验未修改 full scan、候选或目标，也没有重新求解已完成的那一轮。
这是人为 oracle 平台，用来验证传参与继续求解，不是自然 PDUOT 轨迹或实际无限循环的证据。

### 验证命令

```bash
CUDA_VISIBLE_DEVICES=2 micromamba run -n cuda118_all python experiments/refinement_forcing_uot/objective_accuracy_refinement.py paper_experiments/uot/results/20261019_171146 --sizes 4096,16384 --tolerances 1e-4,1e-6,1e-8 --baseline-runs experiments/refinement_forcing_uot/results/residual_accuracy_20261019_212137/runs.jsonl --output experiments/refinement_forcing_uot/results/objective_accuracy_normal.json
CUDA_VISIBLE_DEVICES=2 micromamba run -n cuda118_all python experiments/refinement_forcing_uot/objective_accuracy_refinement.py paper_experiments/uot/results/20261019_171146 --sizes 4096 --tolerances 1e-6 --thin-support --output experiments/refinement_forcing_uot/results/objective_accuracy_thin.json
CUDA_VISIBLE_DEVICES=2 micromamba run -n cuda118_all python experiments/refinement_forcing_uot/run_objective_accuracy_witness.py --output experiments/refinement_forcing_uot/results/objective_accuracy_constructed_witness.json
micromamba run -n cuda118_all python -m pytest -q experiments/refinement_forcing_uot/test_objective_accuracy_refinement.py experiments/refinement_forcing_uot/test_one_sided_potential_readout.py
```

每个 GPU job 前检查 GPU2空闲，按顺序串行运行；复现前同样应检查当前占用。

## 9. 本轮判断

相比稳定化分支，本方案在论文和代码上都更简单；主要实质让步是允许下一轮 inner tolerance 自适应收紧。
正常路径和 thin-support 样本没有改变任何 inner/outer 计数；构造平台验证了实际收紧路径。
它提供了符合明确假设的 exact-arithmetic 有限终止路线，未闭合所有 FP64 和异常性能问题。
后续应先与作者讨论是否接受这一个精度更新规则，再考虑生产接入；本轮不修改生产默认算法。
