# PDUOT 内部停止：充分进展或相对 pricing 可靠性

日期：2026-10-20。本文整合早期探索、当前生产实现和论文的两种有限 refinement 结论。
生产实现已在主仓库提交 `bbb6d0c`；开关默认关闭，bibliography 未修改。

## 1. 目标与结论范围

作者希望在同一次 PDUOT 调用中处理进展不足，不重复 full scan，也不收紧后续调用的名义 tolerance。
当前方案在已有 $L/G$ 检查上增加一个 disjunctive stopping gate，已作为默认关闭选项接入生产。
论文区分两种结论：精确 restricted oracle 下有限轮达到原 KL-UOT 的最优解；非精确 oracle 满足受控输出条件时，有限轮达到给定 restricted/full-space KKT stopping tolerances。
精确版本的有限步指外层轮数，并不声称数值 PDUOT 有限个内迭代即可求出精确解。
两种证明均在精确算术下成立；普通浮点实现可能出现极小质量下的数值停滞。

## 2. 先测试并否定的缓存 envelope 路线

此前全节点 log-response 门槛过于严格。
本轮先尝试忽略不可能承载大 positive score 的节点。
令 $R_i^0=\max_j(\sigma_{ij}^0)_+$、$S_j^0=\max_i(\sigma_{ij}^0)_+$ 为上轮 scan 的逐节点 maxima。
当前 potentials 改变量为 $\Delta f,\Delta g$，则无需读取任何缺失边成本即可计算保守上界

$$U_i=(R_i^0+\Delta f_i+\max_j\Delta g_j)_+,\qquad W_j=(S_j^0+\Delta g_j+\max_i\Delta f_i)_+.$$

每条当前 positive raw score 都不超过其两个 endpoint 上界。
若某节点的上界已经很小，就无需要求其 log-response 误差很小。
这在数学上严格放宽全节点条件，但实际仍偏紧。

TOME $n=4096$、五组 penalties、tol $10^{-6}$：41次原扫描中，旧全节点条件0次通过；即使用本轮精确逐节点 maxima 做不可事前使用的乐观审计，弱化条件也只有2次通过。
21个同层存在上轮缓存的输出中，缓存条件与保守 full-feasibility bound 的联合出口0次通过。
因此没有为这条路线进行高成本 native continuation。
Artifact：`experiments/refinement_forcing_uot/results/pricing_envelope_gate_n4096.json`。
实现：`pricing_envelope_gate.py`；三个小规模代数测试检查 envelope、弱化关系与 score margin。

## 3. 新的内部条件

设每次调用的原 inner tolerance 固定为 $\kappa_0>0$，外层 tolerance 为 $\tau>0$。
记上一轮 full scan 的最大 positive raw score 为 $v_{k-1}>0$，这是已有诊断量，不是额外扫描。
当前调用的 warm primal anchor 为 $\mathbf x^{k-1}$，上一批新边的最大可行 coordinate gain 为 $G_{k-1}\ge0$。
继续使用生产实现的 positive-part 下降下界 $L_{k-1}\le\Phi(\mathbf x^{k-1})-\Phi(\mathbf x^k)$。
当前 actual marginals 为 $r_i,q_j$，定义

$$\Omega(\mathbf x,\mathbf f,\mathbf g)=\max_i[f_i+\rho_a\log(r_i/a_i)]_++\max_j[g_j+\rho_b\log(q_j/b_j)]_+,$$

零 actual marginal 贡献零 one-sided error，不使用人为 floor。
记当前 active raw violation 最大值为 $a_k=\max_{(i,j)\in\mathcal N_k}(f_i+g_j-c_{ij})_+$，并设

$$d_k=\kappa_0^2(1+|\Phi(\mathbf x^{k-1})|).$$

PDUOT 原 KKT 达标之后，额外要求

$$L_{k-1}\ge G_{k-1}/2,\qquad L_{k-1}\ge d_k\quad\text{or}\quad\max\{a_k,\Omega_k\}\le v_{k-1}/2.$$

这里后半部分是逻辑“或”：本轮已有足够原目标进展，就不计算昂贵的 log-response gate；只有低进展时才计算。
若门槛失败，就继续同一次原始 PDUOT 迭代，不重新启动 solver、不做 full scan、不改变下一次调用的 tolerance。
检查的适用范围统一见论文附录 Local Stopping Implementation。

与旧全节点条件不同，可靠性门槛是上轮 raw maximum 的一半，不是一开始就压到最终外层 tolerance 对应的尺度。
半因子是固定 proof constant；下面的四分之三只用于证明中的分类，不是运行时额外阈值或 residual 窗口。
平方 forcing function 是简单的固定正函数，未证明为最优选择，也不是 native KKT 推出的 objective-error 等式。

## 4. 零增益时的局部 attainability 处理

单独要求 $L\ge0$ 并不自动由迭代渐近收敛推出有限步通过：anchor 已精确最优时，后续 primal iterates 可能仅从较高 objective 逼近它。
为此，在 $G_{k-1}=0$ 时，先检查未修改的 anchor 与 marginal-induced potentials

$$f_i^X=-\rho_a\log(r_i/a_i),\qquad g_j^X=-\rho_b\log(q_j/b_j).$$

只有所有 marginals 为正、该点通过原三项 KKT、active violation 不超过 $v_{k-1}/2$ 时才返回它。
否则仍继续正常 PDUOT，并使用同一个内部 gate。
这只是本次 solver 的一个局部初始 readout，不调用另一个算法、不做全空间检查，也不修改 primal objective。
若 anchor 是 node-covering restricted 问题的精确最优解，其 marginals 必为正，该 readout 精确满足 restricted KKT，因而能返回。
若 anchor 非最优，restricted 最优值严格较低；在收敛的 inner sequence 上，$L$ 最终具有正余量，且 $\Omega,a_k\to0$，所以额外条件可在有限迭代内达到。
当 $G_{k-1}>0$，restricted 最优改善至少为 $G_{k-1}$，因此严格的半增益要求同样可达。

这是 exact-arithmetic 可达性论证；不是每种 FP64 controller/restart 都能达到的保证。

## 5. 条件有限 refinement 论证

假设固定有限 KL-UOT 数据、正参考质量和 penalties、有限非负成本、active graph 节点覆盖、同一数学成本、exact bidirectional top-$b$、保留新候选、保 marginals/cost 的 sparsification 和零流 pruning。
假设 continued PDUOT 对各 restricted 问题收敛至 finite primal--dual optimum。
理论中的 $G$ 应为有效的可行 coordinate gain，并在固定正 score margin 下具有统一正下界；native 固定次数标量搜索和 FP64 求值并非 interval-certified oracle，数值误差另行记录。
发生 $G=0$ 或没有 genuinely new candidates 时，按第4节处理；没有新候选不立即报错，而是保留原图并执行下一次局部受控 solve。

### 5.1 目标 nonincrease 与有限的大进展轮

每个受控 solve 都满足实际原目标不增；$G=0$ 的 anchor readout 也不改变目标。
若 $L\ge d_k$，则本轮实际下降至少为 $\kappa_0^2>0$。
由于原目标非负，这类大进展轮只能有有限个。
因此假设存在无限非终止轨迹，足够晚的输出必全部满足相对可靠性门槛。

### 5.2 小进展轮：violation 收缩或真实增益

令 $v_k$ 是本轮 full scan 的最大 positive raw score。
对于相对可靠的输出，分两种情况：

1. $v_k<3v_{k-1}/4$：raw maximum 本轮有固定比例收缩。实现不强制这个条件，也不根据它决定重试。
2. $v_k\ge3v_{k-1}/4$：因为 active violation 不超过 $v_{k-1}/2$，global maximizer 必在缺失边上，被 exact top-$b$ 返回。其真实 primal score 至少为

$$\widehat\sigma_{ij}\ge v_k-\Omega_k\ge v_{k-1}/4.$$

固定 full L2 stopping 失败时，$v_{k-1}>\tau(1+\|\mathbf C\|_F)/\sqrt{mn}$。
因此第二类轮有统一正的 primal-score margin。
原目标 level set 给出 bounded transported marginals；之前的 compact coordinate-gain lemma 允许零 actual marginals，给出某个统一 $\gamma>0$ 的新增边增益。
下一次 solve 的 $L\ge G/2$ 便产生至少 $\gamma/2$ 的实际目标下降。

若第二类轮只有有限个，后续 raw maximum 持续几何收缩，最终 full residual 必达标。
若第二类轮无限多，则后续目标会发生无限多次至少 $\gamma/2$ 的下降，矛盾。
结合每次 inner solve 的可达性，得到有限次 inner iterations、restricted solves 和 full scans 达到原始 restricted/full tolerances。

该结论不要求每轮 full violation 单调，也不要求每轮有统一正的 primal 下降；它使用“收缩或真实增益”的组合。
它不需要逐轮减小名义 $\kappa_0$，但必要时同一次 PDUOT 确实可能求得远高于名义 KKT 的精度。

## 6. 实现

### 6.1 当前生产实现

- `src/hier_uot/config.py`：`refinement_forcing_check=False`，开启时同时启用已有 progress check。
- `src/hier_uot/hierarchy/algorithm.py`：同层传递上一次 scan 的 raw maximum 与候选 coordinate gain；进入下一层重置，不重复 scan。
- `src/hier_uot/restricted_uot/refinement_progress.py`：coordinate gain 与零增益 anchor readout。
- `src/hier_uot/_native/pdhg/kl_uot/solver.cu`：原 KKT 达标后检查正部下界及双出口；失败后继续同一次 PDUOT。
- `paper_experiments/uot/config_refinement_forcing_compare.yaml`：原始、L/G-only、新双出口三组配置。
- `paper_experiments/uot/REFINEMENT_FORCING_RESULTS.md`：生产对照的设置与结果。

生产条件与第3节一致；目前限制为 KL、FP64 cost 和 L2 stationarity stopping。
不修改本次或后续调用的 nominal tolerance，不增加 full scan，不增加重启求解的 retry 循环。
资源上限内仍未满足门槛时报告失败，不将原 KKT 达标当作额外门槛达标。

### 6.2 早期实验实现（历史）

- `internal_forcing_probe.py`：从生产 CUDA 源码生成独立扩展副本；只修改 acceptance gate，保持原迭代与 controller。
- `internal_forcing.py`：同次 solver 条件、零 gain 的 anchor readout，以及 hierarchy 实验接入。
- `run_internal_forcing.py`：真实 hierarchy 集成实验。
- `stress_internal_forcing.py`：人工构造的低进展/低质量压力问题。

这些早期副本位于 `experiments/refinement_forcing_uot/`，当时实验前后的生产源码指纹一致。
其中生成式插桩依赖当时的源代码结构；当前生产测试优先使用第6.1节的原生接口与配置。
局部计算为 $O(|\mathcal N|+m+n)$，log gate 只在原 KKT 与原半增益 gate 通过、但 $L<d_k$ 时执行。
不需要 inner full dual feasibility，不改变原扫描结果。
研究日志保存完整 traces，不计入严格的算法 working-memory 声明；生产应流式处理。

## 7. 实验结果

### 当前生产完整对照

TOME E11.5→E12.5、PCA30、seed42，物理 GPU2（A100 80GB）串行执行。
规模4096、16384、65536；五组 rho 为 (0.01,0.01)、(0.1,0.1)、(1,1)、(10,10)、(0.045,99.995)；内外 tolerance 同取 1e-4、1e-6、1e-8。
三组模式共135次求解，全部达到原始停止准则。
新双出口相对 L/G-only 的45组 outer、inner 完全一致；对应耗时比的规模内中位数为1.0039、1.0079、1.0010，均为单次计时的描述统计。
205次受控 restricted solve 全部使用充分下降出口，未在这些真实轨迹中触发 fidelity 出口。
相对原始模式，有两组小 rho 配置因原有 L/G 检查增加 inner；其中 n=65536、rho=(0.01,0.01)、tol=1e-6 从25550步增至36810步，耗时约4.89秒增至6.43秒。
这支持新双出口在当前样本中不增加额外迭代，不支持整套保障机制在所有问题上无开销的结论。
原始数据与合并摘要位于 `paper_experiments/uot/results/20261020_refinement_forcing_production/`。
119项相关测试通过，另含人工 fidelity 触发和数值失败分支。

### 早期普通真实算例（历史）

TOME $n=4096$、五组 penalties、tol $10^{-6}$：21个带上轮 gain 的真实输出全部满足新的 disjunction；每组选择一个真实 restricted 问题，从相同 warm start 重放 native 新条件，五组迭代数均与原样本相同。
重放分别为2,100、710、2,300、6,100、1,200步，无新增迭代。
这些代表样本都走“大进展”出口，不能用来证明可靠性分支的实际代价。
Artifact：`internal_relative_forcing_n4096.json`。

$n=65536,\rho=(0.01,0.01)$ 在 $10^{-6}$ 与 $10^{-8}$ 各完成一次 trajectory audit 与一个真实 restricted replay；代表 replay 分别580、1,200步，与基线相同。
Artifact：`internal_forcing_probe_n65536_rho001.json`（较早 absolute gate 对照）与 `internal_relative_forcing_n65536_tol1e8.json`。

实际接入 hierarchy 的五组 $n=4096$ 算例全部达到原 KKT。
inner 总数为19,760、21,120、30,670、68,000、35,990，outer分别8、7、9、10、7，与既有 progress-on 基线完全一致。
所有实际 inner tolerance 都仍为 $10^{-6}$，没有通过修改后续 tolerance 绕过检查。
小 $\rho$ 中记录的590个 first-KKT 后额外迭代是原有 $L/G$ guard 的开销，不是本轮增加；新增总迭代为零。
Artifact：`internal_forcing_integrated_n4096.json`。

### 人工数值压力问题

单边问题，$a=b=1,c=2,\rho_a=\rho_b=0.01$，精确最优 flow 为 $e^{-100}\approx3.72\times10^{-44}$。
使用两倍最优 flow 的 anchor 和 $(f,g)=(1.15,0.85)$。
原三项 KKT 极小，原 PDUOT 10步便返回，KKT约 $1.03\times10^{-37}$。
新增条件在5,000步后仍未通过：名义 tolerance 未改变，但 potentials 在报告输出上仍为1.15、0.85，最后 $L$ 约 $-4.57\times10^{-46}$。
该 checkpoint 在非增 gate 就被拒绝，尚未进入 native fidelity 分支；不能把这个 trace 错解为仅由 log gate 拒绝。
Anchor 的真实 suboptimality 仅约 $2.87\times10^{-46}$，远低于 FP64 对完整 objective 相减可分辨的尺度。
该结果说明 exact-arithmetic 可达性不足以保证新增内部 gate 在浮点上实用。
这是构造的 restricted warm start，不是自然 hier_uot 轨迹、无限循环反例或普遍失败率。
对照 $\rho=1,c=2$、同类 warm start，新旧条件均410步通过。
另一个适中质量、接近最优的压力问题使用 $\rho=1,c=2$，anchor 为 $(1-10^{-7})e^{-1}$，初始 potentials 为 $1\pm10^{-6}$，可靠性门槛 $5\times10^{-8}$。
原 PDUOT 10步达标；新条件在第10步拒绝，继续同一次迭代至20步后通过，名义 tolerance 仍为 $10^{-6}$。
其 fidelity 从约 $9.13\times10^{-8}$ 降至 $4.56\times10^{-8}$，而 $L$ 始终远小于 forcing target，因此确实走了可靠性分支，不是再次由“大下降”绕过。
这验证了内部及时继续迭代的成功分支，同时保留了极小质量失败分支；两个都是构造的 restricted warm starts。
Artifact：`internal_forcing_low_mass_stress.json`。

## 8. 当前判断

新的 relative/disjunctive 条件在理论上比旧的“所有节点一开始对齐外层 tolerance”更有用，也符合“同次 PDUOT 内部检查、无频繁 full scan、固定后续 tolerance”的结构要求。
它依然有实际风险：极小质量使 dual 更新接近不可分辨，或者正部下降下界在近零进展处难以通过。
当前不应声称已经获得不会明显拖慢求解器的普适充分条件；正常轨迹样本未触发严格分支，压力问题则出现失败。
可以继续研究低质量下的局部 potential readout/translation 或更合适的可表示进展条件，但不能直接放松 gate 后沿用本定理。
当前已作为默认关闭选项接入生产；普通默认路径仍不启用该条件。

## 9. 精确 oracle 的有限轮最优性

固定一层，令 $F(\mathcal N)$ 为 active support $\mathcal N$ 上的 restricted 最优值。
假设每次调用返回精确 primal–dual 解，pricing 精确选取至少一条 positive violator，并以全空间 dual feasibility 为终止条件。
另假设 sparsification 保持两侧 transported marginals 和 cost，pruning 保留当前全部正流边与新候选。

精确 restricted 最优解的 transported marginals 为正；否则沿覆盖零边际节点的边增加微量 flow，会因 KL 的负无穷单侧导数降低目标。
因此其 dual potentials 等于 marginal-gradient potentials，positive raw score 就是真实的下降方向。
沿新增边存在正步长 $t$，满足 $\Phi(\mathbf X+t\mathbf E_e)<F(\mathcal N)$。
该 trial 在 pruning 后的新 support 上仍可行，故下一个精确 restricted 最优值严格更小。
固定有限边集只有有限种 supports，每个 support 对应唯一的最优目标值；严格下降使 support 不可重访。
因此 refinement 在有限轮终止，且返回原 KL-UOT 的全局 primal–dual 最优解。
这不依赖非精确版的 forcing gate，也不把近似 objective 的严格下降等同于 restricted 最优值的严格下降。

## 10. 论文的理论接口与证明文件

正文 `main.tex` 的 convergence subsection 分为 exact refinement 与 inexact refinement 两个定理。
精确版本使用第9节的 finite-support argument。
非精确版本把以下内容列为 restricted oracle 的输出假设，不扩展 PDUOT 主伪代码：

1. 每次 restricted call 有限时间返回满足原 restricted KKT tolerance 的解。
2. 实际下降 $\Delta_k=\Phi(\mathbf X^k)-\Phi(\mathbf X^{k+1})$ 满足 $\Delta_k\ge G_k/2$。
3. $\Delta_k\ge\kappa_0^2(1+|\Phi(\mathbf X^k)|)$ 或 $\max\{a_{k+1},\Omega_{k+1}\}\le v_k/2$。

正文使用实际下降来表述输出性质；附录解释如何通过更保守的可计算下界 $L_k\le\Delta_k$ 实现这些性质。
附录 `theory/refinement_convergence.tex` 给出两种定理的完整证明、允许零边际的 uniform coordinate-gain lemma、正部下界公式、同次调用停止机制、零 gain readout 和可达性论证。
非精确版本的可达性依赖 continued inner iterates 及其 projection multipliers 收敛到有限 restricted KKT 点；固定 metric 的 PDUOT 理论支持相应核心情形，自适应 controller 仍需要单独假设。
正文内外 tolerance 分别写为 $\varepsilon_{\mathrm r}$ 和 $\tau$，避免与 hierarchy assignment budget $\kappa$ 混淆；代码实验中两者相等。
所有关于有限步的结论都保留其 oracle、pricing、support 保持和精确算术前提，不扩展成无条件的浮点成功保证。
