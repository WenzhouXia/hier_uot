# Dual stabilization 探索记录：本轮暂不采用

日期：2026-10-20。

## 结论与作者决定

研究了 column generation 中的 dual stabilization 能否处理 UOT refinement 的 dual-feasibility 波动。
得到一个有条件的有限步方案，也完成了实验控制器与小规模异常分支验证。
作者认为中心、误差预算、模式切换等逻辑仍然过于复杂，因此本轮暂不采用、不接入生产。
将这些逻辑放进附录只能简化呈现，不能消除算法本身的复杂度。

生产代码、论文正文和 bibliography 均未因这项研究而修改。
实验文件保留，用作后续比较，避免重复探索。

## 探索过的三种形式

| 形式 | 作用 | 判断 |
|---|---|---|
| 对原势做简单平滑 | 用当前势与历史中心的凸组合 pricing | 会隐藏 violation；不足以推出原 KKT 或有限终止 |
| 每轮求解稳定化 restricted 模型 | 在原 dual objective 上加 Bregman proximity penalty | 有分析结构，但真实稀疏小 $\rho$ 子问题明显变慢 |
| 正常路径加按需触发的稳定化分支 | 候选边的真实 primal 下降余量不足时，切换稳定化 | 条件理论与实验支持可行；整体复杂度不符合当前写作目标 |

## 最后一个候选的算法内容

正常路径使用原 PDUOT、充分下降检查和 full scan，允许 raw dual violation 波动。
只在候选边缺乏真实 primal 下降余量时切换；没有 residual-history 窗口，也不回滚此前 primal 迭代。
稳定化分支固定一个全空间可行的中心 $\bar z$，求解

$$\max_{z\in\mathcal C_{\mathcal N}}D(z)-\mu B_{-D}(z,\bar z).$$

Pairwise dual constraints 不变，但 node response 和 restricted objective 改变。
一次 solve 和 scan 后，原 KKT 通过就结束；否则根据实际 dual objective 增益更新中心，或保留中心、扩边并收紧模型误差预算。
下一 hierarchy level 重置控制状态。
实验实现额外执行一次 terminal native scan，核验最终返回的修复后 potentials。

## 理论得到什么、没有得到什么

在 exact arithmetic 下，假设 restricted 方法能达到每次要求的模型 KKT 和任意正的模型误差预算，可证明：固定中心的拒绝阶段有限，中心更新次数也有限，最终达到原 KKT tolerance。
证明允许非精确 restricted 解、非单调 raw dual violation、保 cost 与 marginals 的 support sparsification。
它不意味着现有固定 KKT tolerance 的原版 SHUTTLE 自动有限步终止。
没有证明任意 PDUOT controller/restart 组合满足上述可达性假设，也没有给出 FP64 下预算的实用下限。

## 实验证据与范围

数据目录：`experiments/refinement_forcing_uot/results/`。

| 实验 | 结果 | 解释边界 |
|---|---|---|
| 全程稳定化、真实 captured sparse master、小 $\rho$ | 3,240 → 7,060 次迭代 | 反对全程默认启用；不是 native CUDA 速度对比 |
| 集成控制器普通路径，TOME $n=4096$ | 30/30 通过，63 次检查无触发 | 小 $\rho$ inner 增加 3.08%；wall time 存在波动 |
| 集成控制器普通路径，TOME $n=16384$ | 20/20 通过，54 次检查无触发 | inner/outer 与原版一致；未证明所有算例无开销 |
| 强制切换，$n=128$、五组 penalties | 5/5 达到原 KKT，真实 terminal native scan 通过 | 测分支可执行性，不代表自然触发频率 |
| 构造的合法近似输出 | raw missing violation 约 10，真实候选 score 约 -20；自然触发后原 KKT 约 $3.92\times10^{-5}$ | 人工 oracle witness，不是真实 PDUOT 迭代轨迹 |
| 组件与控制器回归 | 50 项通过 | 不等于大规模异常分支性能或完整浮点理论 |

对应 artifacts：`bregman_pduot_sparse_level6.json`、`hybrid_normal_timing_n4096.json`、`hybrid_normal_timing_n16384.json`、`hybrid_hierarchy_forced_n128.json`、`hybrid_margin_adversarial_witness.json`。

## 为什么暂停这条路线

1. 论文需要交代第二种 restricted 模型、中心和误差预算，实际算法定义无法省略。
2. 生产接入需要 hierarchy controller 与 node prox/certificate 两层修改，单独修改 scan 不够。
3. 异常分支的大规模自然触发性能未知；当前用 PyTorch reference engine。
4. 理论仍依赖可逐步收紧的模型求解误差，不是固定 native tolerance 的无条件结果。

## 后续探索边界

优先保留原 restricted UOT objective、PDUOT 迭代以及 solve/scan 分离的外层结构。
寻找一个局部可检查、无需模式切换的新条件；如果需要调整返回 potentials，必须重新评估原 KKT，不能只让 full scan 指标变小。
正常路径性能、条件可达性与有限步证明分别验证，不用有限样本通过率代替一般性结论。
新方案仅在 `experiments/` 中测试；未经进一步讨论不改生产实现。

详细历史推导：[dual_stabilization_uot_refinement.md](dual_stabilization_uot_refinement.md)。
上一轮候选的完整定义：[dual_stabilization_recommendation.md](dual_stabilization_recommendation.md)；其“recommendation”表示上一轮结论，本记录明确其目前暂不采用状态。
