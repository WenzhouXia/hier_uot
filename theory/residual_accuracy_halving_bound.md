# 残差驱动 inner tolerance：减半次数上界

日期：2026-10-19。

本文记录残差驱动精度控制器的减半次数分析，作为后续理论推导的独立工作笔记。
当前结论包括有限次减半的定性保证，以及依赖统一精度门槛的条件性次数上界。
尚未给出可直接用于设置生产参数的显式精度门槛。
本文不修改主论文、生产实现或已有实验。

## 1. 问题与记号

固定一个 hierarchy level，考虑非负有限成本矩阵 $\mathbf C$、正参考质量 $\mathbf a,\mathbf b$ 与正惩罚系数 $\rho_a,\rho_b$。
KL-UOT 目标为

$$\Phi(\mathbf X)=\langle\mathbf C,\mathbf X\rangle+\rho_a\operatorname{KL}(\mathbf X\mathbf1\mid\mathbf a)+\rho_b\operatorname{KL}(\mathbf X^\top\mathbf1\mid\mathbf b),\qquad\mathbf X\geq0.$$

这里使用 generalized KL，约定 $0\log0=0$。
第 $k$ 次 restricted solve 使用 active support $\mathcal N_k$ 和 inner tolerance $\kappa_k$，返回 $\mathbf X^k,\mathbf f^k,\mathbf g^k$。
定义理论分析量

$$F(\mathcal N)=\min_{\mathbf X\geq0,\ \operatorname{supp}(\mathbf X)\subseteq\mathcal N}\Phi(\mathbf X),\qquad\delta_k=\Phi(\mathbf X^k)-F(\mathcal N_k).$$

FullScan 使用固定外层容差 $\tau>0$，其归一化 dual violation 为

$$v_k=\frac{\|\bigl(\mathbf f^k\mathbf1^\top+\mathbf1(\mathbf g^k)^\top-\mathbf C\bigr)_+\|_F}{D},\qquad D=1+\|\mathbf C\|_F.$$

当 $v_k\leq\tau$ 时结束当前 level。
记 $\mathcal B_k$ 为本轮 pricing 返回且不在 $\mathcal N_k$ 中的新候选边，定义最大一维可行增益

$$G_k=\max_{e\in\mathcal B_k}\left\{\Phi(\mathbf X^k)-\min_{t\geq0}\Phi(\mathbf X^k+t\mathbf E_e)\right\},$$

其中 $\mathbf E_e$ 仅在边 $e$ 处为一；若 $\mathcal B_k$ 为空，令 $G_k=0$。
$F,\delta_k,G_k$ 均为证明量，残差控制器无需计算它们。
此前 objective-progress check 中的下降下界 $L_k$ 不参与本方案。

## 2. 控制器与已有定性结论

每个新 level 将 inner tolerance 重置为 $\kappa_0$，同时清空参考 residual 与块计数。
第一轮未通过外层判停的 scan 保存 $v_{\mathrm{ref}}$。
此后每完成两轮未终止的 refinement，执行

$$\text{若 }v_k>v_{\mathrm{ref}}/2,\quad\kappa_{\mathrm{next}}=\kappa_k/2;\qquad\text{随后令 }v_{\mathrm{ref}}=v_k.$$

没有触发减半时保持当前 inner tolerance。
通过外层判停时立即返回，不再执行精度更新。
每轮仍只有一次 restricted solve 和一次 full scan。

若假设某个 level 永不终止，而精度只减半有限次，则最后一次减半之后，每个完整块的 residual 都必须至少减半。
因此块端点 residual 几何趋于零，最终低于固定 $\tau$，产生矛盾。
所以任何假想的无限未终止轨迹都必须满足 $\kappa_k\to0$。

结合 native residual 的有界性、有限 support 家族、精确 top-$b$ pricing 和保留可行表示的 support update，已有紧致性论证进一步排除了这种无限轨迹。
这给出有限 refinement 与有限次 tolerance 减半，但尚未给出数值次数上限。

## 3. 将次数上界化为统一精度门槛

需要建立如下统一性质，而非仅沿某条假想轨迹证明最终成立：存在 $\kappa_*>0$ 和 $\gamma>0$，使所有符合假设的 restricted 返回点，在

$$0<\kappa_k\leq\kappa_*,\qquad v_k>\tau$$

时均满足

$$G_k\geq\gamma,\qquad\delta_k\leq\gamma/2.$$

统一性覆盖固定问题下的全部允许 active supports、返回状态和精确 pricing 候选选择。
它要求采用已有理论中的共同有界状态集合及统一 native residual 归一化，不能仅从实验观察推出。

### 3.1 统一性质的存在性路线

先考虑上述共同有界集合中的全部精确 restricted KKT 点，其 full residual 至少为 $\tau$。
由于 support 家族有限，这些点构成有限个紧集的并。
在每个这样的点，所有节点的 transported marginal 为正，raw potentials 等于 marginal-induced potentials，active dual scores 非正。
全局最大 dual score 至少为 $\tau D/\sqrt{mn}>0$，对应边位于 support 外，并被精确 top-$b$ pricing 捕获。
沿此边的 primal 方向导数严格为负，因此最大候选增益严格为正。
通过紧致性与连续性，可以先为这些精确点建立一个统一正增益下界。

随后用反证和子列提取，将该下界以适当余量扩展到足够小的非零 native residual，并同时控制 $\delta_k$。
候选边发生切换时，应提取固定最大-score 边的子列处理，不能直接假设 top-$b$ 索引连续。
这条路线支持 $\kappa_*,\gamma$ 的存在性；完整定量版本仍需给出具体模量或误差界。

若不存在 full residual 至少为 $\tau$ 的精确 restricted KKT 点，则可通过相同紧致性论证直接证明：足够小的 inner tolerance 下所有返回点均通过外层判停。
此时无需引入正增益常数，次数上界可直接由相应精度门槛给出。

## 4. 条件性减半次数上界

假设第 3 节的统一性质成立，并且 support update 保留当前 coupling 的 marginals、transport cost 和所需候选边。
则每个使用 $\kappa_k\leq\kappa_*$ 的未终止迭代满足

$$F(\mathcal N_{k+1})\leq\Phi(\mathbf X^k)-G_k=F(\mathcal N_k)+\delta_k-G_k\leq F(\mathcal N_k)-\gamma/2.$$

由于零 coupling 在任意 restricted support 上都可行，且成本与 KL 均非负，

$$0\leq F(\mathcal N)\leq\Phi(\mathbf0)=\rho_a\|\mathbf a\|_1+\rho_b\|\mathbf b\|_1=:B.$$

初始 tolerance 为 $\kappa_0$，达到统一精度区域最多需要

$$J_*:=\max\left\{0,\left\lceil\log_2\frac{\kappa_0}{\kappa_*}\right\rceil\right\}$$

次减半。
若在此之前结束，实际减半次数更少。
若发生第 $J_*$ 次减半，则从下一次 restricted solve 起，其 tolerance 不超过 $\kappa_*$。
随后每个未终止 support update 都消耗至少 $\gamma/2$ 的 restricted 最优值，因此这类更新数至多为 $\lfloor2B/\gamma\rfloor$。

每次后续减半都发生在一个未终止迭代之后，所以一个不依赖块计数细节的保守结论为

$$J_{\mathrm{total}}\leq J_*+\left\lceil\frac{2B}{\gamma}\right\rceil+1.$$

这里保留一个索引余量，避免将“减半决定之后的下一次 solve”与当前更新混淆。
利用每两轮才允许一次减半的规则，可以进一步改善第二项的常数；核心难点仍是定量估计 $\kappa_*$ 与 $\gamma$。
一旦有了次数上界，还能得到最小请求 tolerance 的下界

$$\kappa_{\min}\geq\kappa_0\,2^{-J_{\max}},\qquad J_{\max}:=J_*+\left\lceil2B/\gamma\right\rceil+1.$$

这个正下界属于精确算术理论，并不自动保证其高于实际浮点精度限制。

## 5. residual 几何下降能提供什么额外信息

若某个阶段的参考 residual 为 $v_{\mathrm{ref}}>\tau$，且连续若干块均不减半 tolerance，则最多经过

$$q=\left\lceil\log_2\frac{v_{\mathrm{ref}}}{\tau}\right\rceil$$

个这样的块就必须终止，每块包含两轮。
因此控制器限制了连续“不收紧但仍不结束”的块数。
该结论不能单独限制总减半次数：发生减半的块不承诺 residual 收缩，新的参考 residual 还可能增大。
要把它用于总轮数的显式上界，还需要 residual 的统一上界以及前述减半次数界。

## 6. 显式常数仍需补充的工作

1. 建立 native restricted KKT residual 到 restricted 目标误差 $\delta_k$ 的统一定量估计。
2. 将 raw potentials 与 marginal-induced potentials 的差异定量控制到足以保护 pricing 改进的程度。
3. 从固定正 outer tolerance 推出候选边的一维增益下界，并尽量避免过小的最小边际常数。
4. 合并这些估计，给出可计算的 $\kappa_*$ 与 $\gamma$，评估维度、成本尺度及 $\rho$ 对其影响。

例如，若在相关有界区域内能证明 $\delta_k\leq\omega(\kappa_k)$，其中 $\omega(t)\to0$，同时候选增益在 $\kappa_k\leq\kappa_{\mathrm{gain}}$ 时至少为 $\gamma$，即可选取满足下式的精度门槛：

$$0<\kappa_*\leq\kappa_{\mathrm{gain}},\qquad\omega(\kappa_*)\leq\gamma/2.$$

这给出计算次数界的明确接口；目前没有声称上述模量已经显式求出。

## 7. 结论边界与实现状态

- 理论范围为固定层 KL-UOT、正参考质量、非负有限成本、node-covering supports、数学意义上的 native complementarity、精确 pricing，以及保留可行表示的 budgeted pruning / support sparsification。
- 假设 inner solver 对每个请求的正 tolerance 都能在有限步达到相应 native residual 条件。
- inner solve 可以有非零误差，无需每轮返回精确解；实际计算的 $\Phi(\mathbf X^k)$ 也无需逐轮下降。
- 全部次数结论为精确算术结论，时间或迭代上限、有限精度停滞和 tolerance 下溢应报告未收敛。
- 不能直接将上界写成 $\lceil\log_2(\kappa_0/\tau)\rceil$，因为 inner residual 与 full violation 不同。
- 每层重置控制器；有限 hierarchy 的总减半次数可以逐层求和。
- 新残差控制器目前经过实验脚本测试，尚未接入生产实现；原 objective-progress check 是另一项可选机制。
- 该笔记不构成实用 runtime 上界，也不构成固定 inner tolerance 足以保证有限 refinement 的证明。

## 8. 相关推导与实验记录

- [残差驱动控制器及有限终止证明](../../../../experiments/refinement_forcing_uot/RESIDUAL_ACCURACY_THEORY.md)
- [有界性、restricted KKT 极限与候选增益论证](../../../../experiments/refinement_forcing_uot/DELAYED_ACCURACY_THEORY.md)
- [控制器实验结果](../../../../experiments/refinement_forcing_uot/RESIDUAL_ACCURACY_RESULTS.md)
