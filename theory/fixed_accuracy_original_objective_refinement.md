# 固定 inner tolerance 的 SHUTTLE refinement：原目标下降与终止 rounding

日期：2026-10-20。

本候选替代先前需要辅助 marginal objective 和 projected-gradient correction 的版本。
整个进展证明只使用原始 KL-UOT objective；不要求 PDUOT 精确求解，不要求 inner tolerance 趋零，也不要求重复 restricted solve 或 full scan。
额外操作是一次安全坐标步，以及仅在退出时使用的误差预算内 flow rounding。
生产实现未修改。
下文为工作推导，不构成独立理论审查或 novelty 判断。

## 方案本身：停滞后切换到固定精度保障流程

### 改什么

保持正常SHUTTLE流程：每轮以原容差调用PDUOT，随后full scan、dual-violation insertion和budgeted pruning。
每层记录已有full residual，每完成两轮检查它是否相对上一个块端点收缩到固定比例$q$以内。
若没有收缩，该层从下一轮开始永久进入保障模式；进入下一level时重新使用正常模式。
实验中$q=0.9$用于正常路径核验，$q=0.5$用于更容易触发保障模式的压力测试；该选择与PDUOT tolerance无关。

保障模式保留上一轮coupling作为anchor，PDUOT继续按同一个原始容差求解。
新解只有在原KL-UOT目标不增加时才替换anchor，随后执行保marginals、保transport cost的support sparsification。
从选中的coupling构造第2节的有限trial potentials，用它们定位原目标的下降方向。
每轮至多沿一条边增流或减流；无需再次调用PDUOT，也无需重新full scan。
当没有需要修正的方向且full scan通过时，在既定误差预算内删除微小flow，返回通过原KKT判停的rounding点。

### 每轮具体做什么

```text
每层开始：mode = normal，固定PDUOT容差kappa，清空停滞计数

每轮：
    Y, f_raw, g_raw = PDUOT(active support, kappa)

    若mode == normal：
        用(f_raw, g_raw)执行原FullScan
        若原restricted KKT及full判停均通过：返回Y及raw势
        按原流程插入候选边并budgeted pruning
        若两轮块的residual未按比例q收缩：从下一轮切换到safe
        继续下一轮

    若mode == safe：
        在anchor和Y中保留原目标更低的点Z
        对Z执行保marginals和transport cost的sparsification
        从Z构造trial势(f, g)
        FullScan返回trial候选与full residual
        若使用双势实现：同次cost traversal还返回raw full residual
        若raw点或Z满足各自完整的原判停：返回对应点与势

        若trial full residual未通过：
            沿最大正score候选执行一次安全加流，得到Z_new
        否则若active support中存在第3节的修正方向：
            执行一次安全加流或减流，得到Z_new
        否则：
            返回第6节通过原KKT的terminal rounding点

        anchor = Z_new
        保留anchor的正flow，插入候选并budgeted pruning
```

FullScan与PDUOT保持独立步骤，PDUOT内部没有pricing回调或额外判敛循环。
Raw提前出口用于减少保障模式中的额外轮数；双势实现共享成本计算，不做两次距离扫描。
仅扫描trial势也保留下降证明，但失去raw提前出口；这是第14节待测试的代码简化版本，不能混作已完成实验的版本。

### 坐标修正与终止条件

对端点marginals为$r_i,q_j$的正score边，令$U_a=\max\{r_i,\delta\}$、$U_b=\max\{q_j,\delta\}$，执行

$$t=\frac{f_i+g_j-c_{ij}}{\rho_a/U_a+\rho_b/U_b},\qquad x_{ij}\leftarrow x_{ij}+t.$$

对$x_{ij}>\delta$且负score足够大的active边，令$h=c_{ij}-f_i-g_j>0$，执行

$$s=\min\left\{x_{ij}/2,\frac{h}{2\rho_a/r_i+2\rho_b/q_j}\right\},\qquad x_{ij}\leftarrow x_{ij}-s.$$

修正方向的门槛$\eta$、固定绝对阈值$\delta$及完整误差预算见第2—3节。
它们由数据、support上界与目标KKT tolerance确定；$\delta$不作为PDUOT精度要求。
没有修正方向时，将$x_e\leq\delta$的边置零，保留同一组trial势并重建complementary slack。
第6节证明该点通过原marginal、stationarity和split-gap三项判停；full violation不因flow rounding改变。
最终rounding允许原目标略增，因为此时直接返回已满足原判停的点；所有未终止轮仍要求原目标下降。

### 为什么有限步结束

正常模式若一直不切换，块端点full residual几何下降，有限轮内通过外层判停。
切换后，候选接受与sparsification不增加原目标；每个未终止轮的单坐标修正又使其至少降低一个固定正数$\gamma$。
原目标非负，因此未终止更新次数至多$\lfloor S/\gamma\rfloor$，其中$S$为进入保障模式时的原目标。
无法再执行这样的修正且full scan通过时，terminal rounding给出合法退出点。
完整假设与证明见第4—8节和第12节；原PDUOT只需有限时间返回候选，无需精确解或不断收紧inner tolerance。

### 代码改动与实验证据

生产实现尚未修改。
实验原型由`original_objective_rounding.py`提供预算、稳定目标差、trial势及坐标步；`capped_correction_trajectory.py`串联solve、scan、support update，双势扫描使用独立实验CUDA副本。
一般路径只增加基于已有residual的标量停滞检测；目标比较、trial势和坐标修正在切换后才启用。
这种布局仍需优化代码局部性，不能声称目前仅修改一个scan函数即可完成接入。

已有正常路径45配置与基线inner/outer一致；稳定版本15个压力配置全部通过，59次实际坐标步逐一验证了flow变化与原目标下降。
这些结果支持方案可行性；一般性能是否无退化仍需受控计时与更多数据集核验。
全部实验版本、文件与局限见第10节和结果文档；以下各节给出上述方案的具体数学定义。

## 阅读范围

### 作者确认的“优雅”标准（2026-10-20）

1. **论文写作方面：不会显得很复杂。**
2. **代码修改方面：尽量局部一些。**
3. **求解器性能方面：不会造成一般情况下的性能下降。**
4. **理论方面：能支持 refinement 有限步收敛满足 KKT tolerance。**

这四点是后续方案比较的标准。
固定inner tolerance、无重试、每轮单次scan等是候选方案的设计选择；不将它们额外提升为作者的硬性要求。
性能判断关注一般使用路径，也需要如实报告触发保障机制后的代价。
有限终止的证明、可实施性与实测效率分别核验。

本笔记保存最新的固定精度候选方案，供后续讨论和论文理论整理使用。
它与 [tolerance 减半次数分析](residual_accuracy_halving_bound.md) 是两条不同路线：减半控制器通过提高 restricted solve 精度排除停滞；本方案保持 inner tolerance 固定，在停滞后用原目标上的安全坐标步保证进展。
本文中的 $\delta$ 是一次选定的绝对 mass/flow 阈值，不是先前 restricted suboptimality $\delta_k$，也不是 PDUOT 的停止容差。
证明直接跟踪原目标 $\Phi$ 的下降，无需计算此前的 $L_k$、$G_k$ 或 restricted 最优值。

本笔记只整理现有推导，不将候选方案视为已经接入生产代码，也不把实验成功率视为一般性证明。

## 1. 固定层设置

考虑正参考质量 $\mathbf a,\mathbf b$，正 penalties $\rho_a,\rho_b$，非负有限成本和固定层的原始 objective

$$\Phi(\mathbf X)=\langle\mathbf C,\mathbf X\rangle+\rho_a\operatorname{KL}(\mathbf X\mathbf1\mid\mathbf a)+\rho_b\operatorname{KL}(\mathbf X^\top\mathbf1\mid\mathbf b),\qquad\mathbf X\geq0.$$

目标是原 native restricted KKT tolerance $\kappa>0$ 和 full normalized dual-violation tolerance $\tau>0$。
Active support size 至多 $E_{\max}$，记 $V=m+n$、$A=\|\mathbf a\|_1$、$M_a=1+\|(\mathbf a,\mathbf b)\|_2$。
进入 safeguard 时的 objective 为 $S$；之后只接受原 objective 不增的 PDUOT 候选，并使用下文的原 objective 下降步。
因此在最终 rounding 之前，始终有 $\Phi(\mathbf X)\leq S$。

由非负成本和 KL log-sum inequality，可取 transported mass 上界

$$\|\mathbf X\|_1\leq M:=\max\{e^2 A,S/\rho_a\}.$$

PDUOT 仍使用原固定 tolerance；理论只需它在有限时间给出非负有限候选。
候选质量不够时可以保留旧点，不继续补精该次求解。

## 2. 固定的绝对 rounding 阈值

选择一个固定 $\delta>0$，同时作为 marginal floor 和终止时的 flow 删除阈值。
它不随 refinement 缩小。
令

$$P(\delta)=\max\{\rho_a\max_i|\log a_i|,\rho_b\max_j|\log b_j|\}+\rho_{\max}|\log M|+\rho_{\max}\log(1/\delta),\qquad\rho_{\max}=\max\{\rho_a,\rho_b\}.$$

选取 $\delta\leq\min\{e^{-2},M/2\}$，满足

$$\delta\bigl(\sqrt V+\sqrt2 E_{\max}\bigr)\leq\kappa M_a/4,\qquad\delta P(\delta)(V+2E_{\max})\leq\kappa/4.$$

该标量预算由已知数据和 tolerance 自动求出；左侧在所选区间内可用单调标量方程控制。
参考质量只通过其 logarithms 进入预算，不需要 exponentially small transported-mass 下界，也不使用 $\theta a_i$ 型相对 floor。
阈值是有量纲的 mass/flow 数值，不是要求 PDUOT 达到的 relative solver tolerance。

对当前 $\mathbf r=\mathbf X\mathbf1$、$\mathbf q=\mathbf X^\top\mathbf1$，构造 trial potentials

$$f_i=-\rho_a\log\frac{\max\{r_i,\delta\}}{a_i},\qquad g_j=-\rho_b\log\frac{\max\{q_j,\delta\}}{b_j}.$$

此处只定义候选势和安全方向界，不引入新的优化 objective。
上述 sublevel 和 floor 条件给出 $\max\{\|\mathbf f\|_\infty,\|\mathbf g\|_\infty\}\leq P(\delta)$。

## 3. 局部三选一条件

在当前 active graph $\mathcal N$ 上记 $E=|\mathcal N|$、$D_{\mathcal N}=1+\|\mathbf c_{\mathcal N}\|_2$、$T=\|\mathbf X\|_1$，令

$$\eta(\mathbf X,\mathcal N)=\min\left\{\frac{\kappa D_{\mathcal N}}{4\sqrt E},\frac{\kappa}{4T}\right\},$$

其中 $T=0$ 时忽略第二项。
Dual score 仍为 $\sigma_{ij}=f_i+g_j-c_{ij}$。

局部检查只有三种结果：

1. 存在 active edge 满足 $\sigma_e>\eta$：执行第4节的安全加流步。
2. 没有上述边，但存在 $x_e>\delta$ 且 $\sigma_e<-\eta$：执行第5节的安全减流步。
3. 两种方向均不存在：构造第6节的 terminal rounding 候选，等待 full scan 验证。

只执行一个局部坐标步，不进行循环 polishing。
实际流程优先处理 full scan 失败；只有 full scan 通过但 restricted KKT 未通过时，才需要这项局部检查。
阈值有统一下界

$$\eta\geq\eta_*:=\min\left\{\frac{\kappa}{4\sqrt{E_{\max}}},\frac{\kappa}{4M}\right\}>0.$$

## 4. 加流方向严格降低原 objective

对任意 $\sigma_e>0$，记 $U_a=\max\{r_i,\delta\}$、$U_b=\max\{q_j,\delta\}$。
沿该边加流的原 objective 一维导数满足

$$h'_e(t)=c_e+\rho_a\log\frac{r_i+t}{a_i}+\rho_b\log\frac{q_j+t}{b_j}\leq-\sigma_e+L_e t,\qquad L_e=\rho_a/U_a+\rho_b/U_b.$$

不等式来自 $r_i\leq U_a$、$q_j\leq U_b$ 与 $\log(1+z)\leq z$，在零 marginal 处以右导数和连续性理解。
取 $t_e=\sigma_e/L_e>0$，即可得到

$$\Phi(\mathbf X)-\Phi(\mathbf X+t_e\mathbf E_e)\geq\sigma_e^2/(2L_e).$$

因此 floor 势虽然不是所有节点上的精确 primal-induced potentials，却仍能给出原 objective 的严格下降加流方向。
不需要用辅助 objective 证明这一步。

## 5. 大 flow 上的减流方向严格降低原 objective

若 $x_e>\delta$ 且 $\sigma_e<-\eta$，则 $r_i,q_j\geq x_e>\delta$。
两个端点处的 trial potentials 正好等于原 marginal gradients，所以原 coordinate derivative 为 $g_e=-\sigma_e>\eta$。
在减流不超过 $x_e/2$ 的线段内，两个 marginals 不低于原值的一半，可使用

$$L_e^-=2\rho_a/r_i+2\rho_b/q_j,\qquad s_e=\min\{x_e/2,g_e/L_e^-\}>0.$$

由原 KL curvature bound，

$$\Phi(\mathbf X)-\Phi(\mathbf X-s_e\mathbf E_e)\geq g_e s_e/2>0.$$

该步不将 marginal 推到零，也不需要进行一维数值求解。

## 6. 没有局部方向时的原 KKT rounding

若第3节两类方向均不存在，取

$$\widehat x_e=x_e\mathbf1_{\{x_e>\delta\}}.$$

这里只在最终退出时使用 $\widehat{\mathbf X}$；如果 full scan 不通过，就保留原点而不应用这次删除。
删除总 flow 至多 $E_{\max}\delta$。
固定 trial potentials 的原 KL responses 为 $\widehat r_i^{\mathrm{resp}}=\max\{r_i,\delta\}$，target 同理。
Stacked original marginal residual 因此满足

$$\|\mathbf A\widehat{\mathbf x}-(\widehat{\mathbf r}^{\mathrm{resp}},\widehat{\mathbf q}^{\mathrm{resp}})\|_2\leq\delta\sqrt V+\sqrt2 E_{\max}\delta\leq\kappa M_a/4.$$

保留的正 flow 边满足 $|\sigma_e|\leq\eta$，而全部 active edges 的 positive score 不超过 $\eta$。
为零 flow 重建最小范数 complementary slack 后，original relative stationarity residual 不超过 $\kappa/4$。

Split gap 的 transport/actual-marginal 部分至多为 $\eta\|\widehat{\mathbf X}\|_1\leq\kappa/4$。
Response-pairing 部分至多为 $P(\delta)\delta(V+2E_{\max})\leq\kappa/4$。
由于原 split-gap denominator 至少为1，原 relative split gap 不超过 $\kappa/2$。
因此原 native certificate 的三项条件都通过，且非负性成立。

Full dual violation 与 flow rounding 无关：势与成本不变。
所以 full scan 同时通过时，返回点满足原始 KL-UOT 的全部规定判停条件。
最终 rounding 可以略微提高 objective；它已是经过原 KKT 验证的退出点，不参与未终止迭代的下降链。

## 7. 固定精度 refinement 的有限终止

每轮进入 safeguard 后：

```text
Y = PDUOT(current support, fixed tolerance)
X = lower-original-objective point among X and Y
X = cost-and-marginal-preserving sparsification(X)
FullScan(trial potentials of X)
if the raw or current point passes original stopping: return it
if full stopping fails: apply one safe priced addition
else if a local safe direction exists: apply that one coordinate step
else: return the verified terminal rounding point
update support and budgeted pruning as before
```

Sparsification 必须在 full scan 和局部方向检查之前。
如果放在局部步之后，它可能把一个低 flow 的大 slack 边重新分配成较大 flow，从而破坏“没有局部方向就可 rounding”的当前轮逻辑。

设 $D=1+\|\mathbf C\|_F$，full violation 未通过时，精确双向 top-$b$ 至少返回一个 $\sigma_e>\tau D/\sqrt{mn}$ 的最大边。
该边可以已经属于 active graph；proof 不要求它是 graph 外新边。
取

$$\nu=\min\{\eta_*,\tau D/\sqrt{mn}\},\qquad R=\rho_a+\rho_b.$$

每个加流步至少使原 objective 降低 $\gamma_+=\nu^2\delta/(2R)>0$。
每个减流步至少使其降低

$$\gamma_-=\frac{\eta_*}{2}\min\{\delta/2,\eta_*\delta/(2R)\}>0.$$

任一未终止轮要么因 full scan 失败而执行一个 priced addition，要么在 full scan 通过后执行一个局部步。
否则该轮没有局部方向且 full stopping 通过，第6节已经给出合法退出点。
因此每个未终止轮至少使原非负 $\Phi$ 降低 $\min\{\gamma_+,\gamma_-\}>0$。
固定层必在有限轮内结束；无需精确 restricted solve、vanishing inner error、symbolic perturbation 或辅助 objective。
这些 worst-case 常数可能保守；它们用于有限性，不是实际 runtime 预测。

## 8. 硬预算与 normal path

设 $V=m+n$，sparsification 将正 flow 限为 $2(V-1)$。
每轮只执行一个坐标步，最多增加一条正边，因此下一轮之前正 flow 至多 $2V-1$。
连同最多 $V-1$ 条 structural edges 和最多 $bV$ 条当轮 pricing candidates，受保护边数至多 $(b+3)V-2$。
故 $\beta\geq b+3$ 时，原只删零 flow 的 budgeted pruning 仍可实施。

Normal path 可保持原 SHUTTLE 不变，在一个固定收缩率 $q\in(0,1)$ 的停滞检测后只切换一次到上述 safeguard。
无限未终止但不切换的 normal path 会有几何趋零的 full residual，矛盾。
切换后由第7节有限结束，故整个 level 有限结束。
每层重置；inner tolerance 始终不变。

## 9. 数值和实现状态

所有有限终止结论仍是 exact-arithmetic 理论，需要 consistent costs、exact pricing 和 cost-preserving sparsification。
有限精度与资源上限可以如实报告未收敛。
为避免大背景 objective 隐藏微小质量上的变化，PDUOT候选接受使用按节点稳定计算的原 objective difference，先消去不变常数并直接归约 flow differences。
该操作不是高精度求解，也不是新的 objective。

核心为 `original_objective_rounding.py`，轨迹开关为 `--original-objective-rounding`。
融合 raw/candidate-potential scan 复用已验证的实验 CUDA module。
测试与结果仍在补充，不能将有限终止推导等同于性能达标。

## 10. 假设、证据与后续核验

有限终止论证采用以下明确假设：

- 固定层的参考质量严格为正，惩罚系数严格为正，成本有限且非负。
- Restricted solver 每次调用在有限时间返回非负有限候选；启用资源上限时，超限按未收敛处理。
- 每轮候选比较使用相同原目标，sparsification 保持 transported marginals 与 transport cost，budgeted pruning 保留全部正 flow 及本轮需要的坐标方向。
- FullScan 使用与 restricted 问题一致的成本，并返回全局最大正 score 对应的候选；允许对已经 active 的边继续加流。
- Rounding 后采用本文明确分配预算的原 marginal、stationarity 和 split-gap 判停定义；若生产归一化改变，预算必须重新核对。
- 证明在精确算术下成立；固定正下降常数可能很小，不保证对应更新在浮点中始终可分辨。

已有实验记录中，15 个 thin-support 配置均通过原判停，较早操作顺序下的 63 次局部更新均降低原目标；这仅支持该实验版本的可行性。
它不能直接作为第7节最新“scan 后只做一次坐标步”版本的完整验证结果。
最新操作顺序已完成15个压力配置测试，全部通过原判停，inner tolerance保持不变，每轮一次cost traversal。
正常路径45个配置的inner/outer工作量均与基线一致；相关三组测试共62项通过。
压力配置的总inner次数比单次基线增加约1.12%，该结果不构成受控计时对比。
最新版本的55次实际坐标步没有逐步保存objective差，不能据此声明每步均已独立数值核验。
完整记录见[固定精度方案核验](../../../../experiments/refinement_forcing_uot/ORIGINAL_OBJECTIVE_ROUNDING_RESULTS.md)。
后续[坐标步相对分辨率分析](fixed_accuracy_coordinate_resolution.md)给出了不依赖floor的相对步长下界，110项标量测试通过。
因此绝对步长很小不足以判断已有正flow上的更新会被舍入掉；score计算、underflow和完整轨迹的有限精度行为仍需审计。
理论保证有限终止，不保证触发 safeguard 后 runtime 或迭代次数不增加。

后续重点是核对原生 certificate 的逐项对应、最新流程的真实轨迹、极小 $\delta$ 时的可实现性，以及最简正文伪代码与附录证明的分工。

## 11. 对应文件

- [实验侧原始工作笔记](../../../../experiments/refinement_forcing_uot/ORIGINAL_OBJECTIVE_ROUNDING_THEORY.md)
- [固定预算、坐标步与稳定目标差实现](../../../../experiments/refinement_forcing_uot/original_objective_rounding.py)
- [轨迹实验 wrapper](../../../../experiments/refinement_forcing_uot/capped_correction_trajectory.py)
- [单元测试](../../../../experiments/refinement_forcing_uot/test_original_objective_rounding.py)
- [固定精度 oracle 循环反例与修复实验](../../../../experiments/refinement_forcing_uot/fixed_accuracy_cycle_witness.py)
- [此前的 tolerance 减半次数分析](residual_accuracy_halving_bound.md)

本文为独立工作笔记；后续更新实验结果时，应注明具体实现顺序和结果目录，避免将不同候选版本的证据混用。

## 12. 整体定理与简洁接口

固定一个level、原restricted tolerance $\kappa>0$、full tolerance $\tau>0$，将收缩因子$q\in(0,1)$固定为内部常数。
在第10节的精确算术和support保留假设下，再假设每次PDUOT调用在有限时间结束，正常模式返回满足原restricted判停的点。
Safe模式使用第2节的一次性固定预算，并执行第7节的候选保留、sparsification和单坐标更新/terminal rounding。

**命题。** 每层至多切换一次模式，在不收紧PDUOT停止容差、不重试restricted solve、不重复full cost traversal的条件下，算法有限步返回满足原restricted KKT与full dual-violation判停的点。

证明的正常模式部分还可以显式计数。
设首个非终止full residual为$v_0>\tau$，每个两轮块若不触发切换，就满足$v_{\mathrm{next}}\leq qv_{\mathrm{ref}}$。
令

$$B_0=\left\lceil\frac{\log(v_0/\tau)}{\log(1/q)}\right\rceil.$$

若一直不切换，至多$B_0$个完整收缩块就必须退出；第一次失败的收缩块则立即切换。
因此正常模式持续时间有保守上界$1+2(B_0+1)$，无需等待无限轨迹才作反证。
切换后令$\gamma=\min\{\gamma_+,\gamma_-\}>0$，每个非终止坐标更新降低原目标至少$\gamma$，而原目标位于$[0,S]$。
Safe模式至多经历$\lfloor S/\gamma\rfloor$次非终止更新，再加一个终止检查轮。
这给出有限外层次数；每次inner调用有限，故整体有限。
该上界可能保守，但所请求的inner tolerance始终就是初始$\kappa$，不会因最坏情况分析而继续缩小。

正文可使用以下接口，具体修正与rounding放在独立定义或附录：

```text
mode = normal
repeat:
    Y, raw_potentials = RestrictedSolve(N, fixed_tolerance)
    X, scan_potentials = Prepare(mode, X, Y, raw_potentials)
    candidates, residuals = FullScan(scan_potentials, raw_potentials)
    if OriginalStoppingPasses: return the passing point
    if mode == safe:
        X = AdvanceOrReturn(X, candidates, residuals)
    N = BudgetedUpdate(N, X, candidates)
    mode = SwitchOnceOnStagnation(mode, residuals)
```

Prepare在正常模式不改变原流程，safe模式进行原目标比较和保目标sparsification。
AdvanceOrReturn只做第7节的一次坐标步，或返回已验证的rounding点。
RestrictedSolve与FullScan之间无回调、无补精、无循环重试；两组势的统计量可共享同一次cost traversal。
把该机制定义为独立模块能够压缩主伪代码，但论文仍需明确它包含原目标比较、trial potentials和坐标修正。

## 13. 按作者四点标准评估

**论文写作。** 正文可以用一个一次性停滞开关及一个保障模块概括，但现有Prepare、双势FullScan和AdvanceOrReturn三个接口仍偏重。
后续优先研究能否保留原FullScan接口，将全部异常处理收在一个控制器模块；附录完整陈述floor、方向选择和rounding，不用函数名隐藏理论依赖。

**局部改动。** 当前研究wrapper改动了restricted solve、scan和prune三处，并使用融合双势CUDA副本。
它证明了原型可行，尚不等于已经达成最小改动。
优先测试单势scan的异常路径，从而避免新CUDA接口；生产代码暂不修改。

**一般性能。** 历史45配置未触发，inner/outer与基线一致；触发路径15配置全部通过且59次实际更新逐一审计下降。
不过工作量相同不等于wall time严格不变，也不能据此声称所有普通数据集均无退化。
需要区分未触发的标量controller开销、误触发频率和触发后成本，避免把额外评测插桩时间计入solver性能。

**有限步理论。** 第12节给出固定inner精度下的有限终止论证，终止包含原restricted KKT和full判停。
明确假设包括每次inner调用有限、cost一致、精确pricing和保目标support update；这不是unchanged SHUTTLE的定理。
第8节同时保留原$\beta\geq b+3$硬预算。

稳定求值版本的完整结果目录为`experiments/refinement_forcing_uot/results/original_rounding_20261020_003138/`。
独立核验器为`audit_original_rounding.py`，记录见第10节链接的结果文档。
相关204项代数与数值测试通过；完整任意尺度浮点收敛及普遍runtime不变不在已证明范围内。

作者已澄清四点标准，本轮无需继续等待“是否允许坐标修正”的二选一回答。
当前探索重点是减少接口与代码改动，并验证一般路径性能，而非追加未要求的任意尺度浮点保证。

## 14. 下一候选：单势异常路径

保留正常模式原PDUOT与原FullScan；停滞后使用保留primal点的trial potentials调用同一个原FullScan。
沿用原目标候选保留、单坐标下降与terminal rounding；停止时要求该点同时通过原restricted KKT和full判停。
原始PDUOT势不另做全空间统计，因此无需融合双势CUDA实现。
第7节的原目标下降证明完全使用trial potentials，故去掉raw提前出口不影响该精确算术证明。

潜在代价是异常路径会失去“raw解已经足够好就立即退出”的机会，可能增加rounds。
此前辅助目标且全程强制校正的失败不能直接断言本候选也失败；需要实际测试原目标版本的一次性切换。
若显著变慢或触及资源上限，应保留双势方案作为性能较好的候选，并如实记录单势方案的局限。

### 实测结果：直接删除raw出口失败

运行`experiments/refinement_forcing_uot/results/original_rounding_20261020_012410/`测试了n=4096、rho=(10,10)、tol=1e-6、thin support和q=0.5的原目标单势版本。
结果达到原refinement轮数上限，未收敛：218次outer、155070次inner，最终KKT约3.46e-6。
其中194次调用处于保障模式；171次非终止检查没有新的候选边。
相比之下，相同配置的双势版本约44次outer即通过原判停。
这不否定单势版本在精确算术下的有限终止推导，但否定了该直接删减在此配置上的实用性，暂不推荐替换。

### 用节点势差替代raw统计的尝试

设$d_i=f_i^{\mathrm{raw}}-f_i$、$e_j=g_j^{\mathrm{raw}}-g_j$，trial full residual为$v$，$D=1+\|\mathbf C\|_F$。
由正部映射的Lipschitz性与逐项支配，可得到仅需节点向量的上界

$$v_{\mathrm{raw}}\leq v+\frac{1}{D}\min\left\{\|d\mathbf1^\top+\mathbf1e^\top\|_F,\sqrt n\|(d+\max_j e_j)_+\|_2,\sqrt m\|(e+\max_i d_i)_+\|_2\right\}.$$

第一项可用均值与中心化平方和在O(m+n)计算，无需构造完整矩阵。
20个随机小矩阵与1个score-preserving translation测试通过。
该界在精确算术下可作为raw出口的充分条件，但失败时不能断言raw本身未收敛。

运行`experiments/refinement_forcing_uot/results/original_rounding_20261020_012548/`在双势扫描中旁路记录这个上界，保持原轨迹。
实际两个raw出口的full residual分别约9.08e-7和2.63e-7，均满足1e-6门槛；节点上界却约2.96e-4和4.81e-4。
因此本次运行中0/2个有效raw出口能被这个上界接替，暂不能据此移除双势统计。
这些新增测试核验上界代数，不证明浮点区间意义上的严格包络。

## 15. 当前优先方向：保留双势出口，收拢改动边界

按作者四点标准，优先保留已有性能证据的双势保障版本，不为追求更少公式而采用已测明显变慢的单势版本。
“尽量局部”可以通过把改动集中在层内orchestration与scan模块实现，无需修改PDUOT数学更新或停止条件。
以下为待验证的接入设计，生产实现尚未修改。

- **PDUOT保持原样。** 同样的API、warm start与原停止容差；无新增内部收敛门槛。
- **保障控制器单独成模块。** 保存每层mode、块端点residual、anchor和固定预算，提供Prepare与Advance两个阶段；mode未开启时直接沿用原结果。
- **沿用独立FullScan步骤。** 在现有成本tile上可选增加第二组势的sum/max归约，不再次选raw top-b、不再次计算成本；默认关闭时不执行额外归约。
- **复用现有support更新。** 仅在候选插入后、budgeted pruning前应用至多一个pending坐标步；positive support仍满足第8节预算。
- **每层重置。** 下一层回到正常模式，避免前一层一次异常把后续全部层都变成保障路径。

实验wrapper分别拦截solve、scan、prune，且生成整份CUDA实验副本；这种实验结构不是最终代码局部性的证据。
后续应检查实际所需production改动是否能限于上述控制器与scan适配，不触及restricted solver内部。
未经授权不直接进行production接入。

论文中可以保留RestrictedSolve与FullScan两个清晰步骤，在其前后各加一个保障接口；把标量预算、方向分类、raw提前出口和rounding的实现细节放在附录。
正文仍应明确有限步定理针对配备保障模块的refinement，不能仅通过省略细节宣称原流程已自动具有该保证。
目前最需要补充的性能证据是普通未触发路径的受控计时，以及保障模式在一般数据上的误触发频率；已有inner/outer一致性尚不足以替代它们。

## 16. 一般路径计时与论文呈现

进一步完成了同进程stock/guarded交替计时，取消候选边诊断插桩，数据加载与预热置于计时区外。
五组rho、n=4096、tol=1e-6各做三次stock与三次guarded，共30次solve。
关闭未触发时逐轮写盘和raw对象复制后，guarded相对stock的分组中位耗时增加约0.09%—0.87%；所有inner/outer次数相同，没有触发保障模式。
结果目录为`experiments/refinement_forcing_uot/results/normal_timing_20261020_013051/`；明细和命令见结果文档。
这提供了此前缺少的实际时间证据，但三次重复和单组数据不能证明普遍零开销或亚百分比差异的统计显著性。

论文正文可将机制概括为：正常refinement停滞时，启用原目标上的单步下降保障，保持restricted求解容差固定。
主流程仍明确保留RestrictedSolve、FullScan和BudgetedPrune，只增加点准备与单步保障两个局部接口：

```text
Y = RestrictedSolve(N, fixed tolerance)
X, potentials = Prepare(X, Y, mode)
B, residuals = FullScan(potentials, optional raw statistics)
if original stopping passes: return the passing point
X = SafeguardStepOrReturn(X, B, residuals, mode)
N = BudgetedPrune(N union B, protect positive flow of X)
mode = SwitchOnceOnStagnation(mode, residuals)
```

Prepare和SafeguardStepOrReturn在正常模式下分别沿用原结果和不作修正。
附录完整展开原目标接受、固定floor、加/减流及terminal rounding，避免主流程出现补精或反复scan循环。
Raw统计出口是性能优化；有限终止的下降证明仍由trial势和原目标更新承担。

可用于正文的定理范围是：在每次restricted调用有限、成本一致、pricing精确且support update保留规定coupling与方向的假设下，配备本保障机制的每层refinement有限步返回满足给定restricted KKT与full dual-violation容差的点，支持线性working memory，无需restricted精确解。
固定内层容差与显式误差预算写入附录算法定义；不把定理归给完全不变的原SHUTTLE。

按作者四点，当前方案已有紧凑的正文呈现、明确的局部接入边界、一般路径的小开销计时证据，以及固定精度有限终止推导。
候选仍有具体代价：异常路径需原目标比较与修正，双势出口需局部scan适配，且不能保证所有异常实例上的runtime不增加。
这些代价应随方案一起交代，不以“保障模块”这个名称省略。

## 17. 独立控制器的实际验证

当前已将原目标保障流程收进独立实验模块[fixed_accuracy_controller.py](../../../../experiments/refinement_forcing_uot/fixed_accuracy_controller.py)。
它消费restricted求解结果和scan结果，本身不调用PDUOT或FullScan，保持两者的算法边界。
实验接入文件[run_localized_fixed_accuracy.py](../../../../experiments/refinement_forcing_uot/run_localized_fixed_accuracy.py)只在solve、scan、pruning前后设置三处适配。
每次进入新level创建新controller并释放前层coupling引用；只保留标量诊断，不以历史flow累积换取终止。
底层数学更新继续复用`original_objective_rounding.py`和已验证的双势scan；这部分底层适配成本没有被省略。
生产`src/hier_uot`和`src/hello_ot`未修改。

### 实际轨迹

触发测试目录为`experiments/refinement_forcing_uot/results/localized_guard_20261020_013728_394885/`，配置为n=4096、rho=(10,10)、tol=1e-6、thin support、q=0.5。
该配置通过原判停：43次outer、138400次inner，44次restricted调用含1次coarsest调用，43次scan。
两个level触发保障，17次实际坐标步全部改变flow且稳定原目标差为负；两个level均从raw出口结束。

正常测试目录为`experiments/refinement_forcing_uot/results/localized_guard_20261020_013755_458773/`。
五组rho均通过，没有触发；inner/outer与原基线一致。
Controller的11项单元测试覆盖停滞状态机、跨层重置、anchor独立性、pending坐标应用、不可表示更新报错、raw恢复、terminal rounding和full已通过但local仍需减流的分支。
最终合并运行相关六组测试，共242项通过，包括双势CUDA扫描一致性测试。

### 重构版本计时

用`benchmark_original_normal_path.py --localized-controller`直接比较重构版与stock，保持同进程、同数据、同seed和交替顺序，数据加载及预热在计时区外。
结果目录为`experiments/refinement_forcing_uot/results/normal_timing_20261020_013910/`。
五组rho各三次stock和三次guarded，共30次solve，没有触发保障，所有inner/outer次数一致。
Guarded相对stock的分组中位耗时差依次约为-0.26%、-0.68%、+0.02%、-0.78%、+0.62%。
这支持该组一般配置没有明显性能退化；三次重复的亚百分比差异不能解释成显著加速或普遍零开销保证。

## 18. 本轮方案结论

目前推荐保留双势出口的固定精度保障方案：正常refinement不变，在停滞后仅切换一次；将原目标比较、trial势、单步修正及terminal rounding封装到单层controller。
它避免了先前路线在坏情况下不断收紧inner tolerance的问题，并以明确假设下的原目标下降证明有限步达到规定KKT与full判停。

与作者四点逐项对应：

1. **写作。** 第16节给出七行主流程，solver与scan仍分离；预算、分支和完整证明可放附录，正文明确说明存在保障机制。
2. **代码。** 已验证独立controller加三处薄适配；PDUOT数学更新和停止准则不变，scan的双势统计是局部底层依赖。
3. **性能。** 历史45配置工作量不变，重构版30次交替计时没有观察到明显一般路径退化；异常路径15配置及controller触发案例提供补充验证。
4. **理论。** 第12节列出固定精度有限终止命题、假设和轮数界；该命题针对配备保障的refinement，不要求restricted精确解，也不要求inner tolerance趋零。

本次交付范围是研究方案、推导、独立实验实现和证据记录；尚未做production接入或修改主论文。
后续若采用本方案，production接入和更广泛的论文benchmark可作为独立实施任务。
本结论没有宣称最坏情况runtime小、所有数据零退化、任意浮点尺度成功或已确定原创性。
