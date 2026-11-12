# 固定精度坐标步的相对分辨率

日期：2026-10-20。

本笔记补充 [固定精度 refinement](fixed_accuracy_original_objective_refinement.md) 的数值尺度分析。
主要结论是：统一目标下降界中的绝对阈值很小，不自动意味着已有正 flow 的坐标更新无法表示。
以下界控制单条 flow 的相对变化，不构成整个算法的浮点收敛定理。

## 1. 加流步

设当前边 flow 为 $x_e>0$，两个端点 transported marginals 为 $r_i,q_j$。
由于 coupling 非负，$x_e\leq r_i,q_j$。
取 $U_a=\max\{r_i,\delta\}$、$U_b=\max\{q_j,\delta\}$，正 score 为 $\sigma_e$，$R=\rho_a+\rho_b$。
原方案步长满足

$$t_e=\frac{\sigma_e}{L_e},\qquad L_e=\rho_a/U_a+\rho_b/U_b,\qquad L_ex_e\leq R.$$

因此有与绝对 flow 和 floor 均无关的相对界

$$\frac{t_e}{x_e}\geq\frac{\sigma_e}{R}.$$

在正常数范围、round-to-nearest、unit roundoff 为 $u$ 时，$\sigma_e/R>2u$ 是保证最终一次加法不会舍入回 $x_e$ 的保守充分条件。
这句话暂将步长视为已经正确计算出的实数；实际步长求值误差、score误差和上溢另行控制。
若已有步长计算的相对误差上界为 $\epsilon_t<1$，可使用更明确的条件 $(1-\epsilon_t)\sigma_e/R>2u$。

## 2. 减流步

对 $x_e>\delta$ 且原坐标梯度 $g_e=-\sigma_e>0$，取

$$L_e^-=2\rho_a/r_i+2\rho_b/q_j,\qquad s_e=\min\{x_e/2,g_e/L_e^-\}.$$

同样由 $x_e\leq r_i,q_j$ 得

$$\frac{s_e}{x_e}\geq\min\left\{\frac12,\frac{g_e}{2R}\right\}.$$

在正常数范围内，右侧显著大于 $u$ 时，最终减法能够改变该 flow；$s_e\leq x_e/2$ 还保证了正性余量。
严格浮点充分条件可以同样纳入步长求值的相对误差预算。

## 3. 与 refinement 门槛的关系

设 full scan 未通过的门槛给出 $\sigma_e>\tau D/\sqrt{mn}$，局部方向门槛满足 $\eta\geq\eta_*$。
令

$$\nu=\min\{\tau D/\sqrt{mn},\eta_*\}>0.$$

则任意非终止坐标步，在已有正 flow 上的相对大小至少可用

$$\min\left\{\frac12,\frac{\nu}{2R}\right\}$$

统一控制。
这比只使用 $\delta$ 推导的绝对步长下界更适合判断实际坐标更新是否会被舍入掉。
它仍依赖目标 tolerance、penalty 和问题归一化，不能对任意小 tolerance 宣称可实施。

## 4. 新零边与剩余限制

当 $x_e=0$ 时，无需跨过已有 flow 的相对舍入间隔；只需新步长能够表示。
由 $L_e\leq R/\delta$ 得 $t_e\geq\sigma_e\delta/R$。
若该绝对值落入 underflow 区域，仍可能得到零步长，需要显式报数值失败或另行设计算法。

上述分析不保证两个 endpoint marginals 的直接求和均能感知该变化，也不保证朴素总objective相减能检测下降。
已有稳定objective差计算从 $\mathbf A(\mathbf x^{\mathrm{new}}-\mathbf x)$ 累加变化，避免先对两个大marginals作差，但这也不能替代完整的误差分析。
当参考质量与 transported marginal 很接近而绝对值极端时，分别计算两个log再相减还可能损失score精度，亦需单独核验。

## 5. 实验范围

`experiments/refinement_forcing_uot/test_coordinate_representability.py` 的110项标量测试通过。
覆盖flow从 $10^{-250}$ 至 $10^{250}$、三组penalties和三档正score，验证相对界与实际FP64 flow变化。
两项边界测试明确记录极小score可导致舍入停滞、新零边在subnormal尺度可出现underflow。
这些测试使用给定score核验坐标运算，没有证明实际potential求值同样准确，也不是完整hier_uot轨迹测试。

## 6. 对候选方案的影响

无需仅因floor很小就改用额外的一维求解器，原解析坐标步已经具有上述相对尺度保证。
这保留了每轮一个显式坐标步的简洁性。
它消除了“绝对下降界小就必然更新不可表示”这一推断；完整有限精度保证与任意数据尺度下的性能界仍未建立。

## 7. 实际求值的补充修正

后续38项测试用高精度Decimal对照验证了近等质量的log比值，并记录了中间倒数溢出可将可表示步长误算为零的反例。
实验原型对近等质量使用log1p((r-a)/a)，对其他质量使用log差；曲率步长按端点最小质量缩放后计算。
这两项改动与原数学公式等价，保持单个解析坐标步，没有额外的一维求解或补精循环。
结合已有三组测试，共204项通过。

实际触发配置n=4096、rho=(10,10)、tol=1e-6通过原判停，9次坐标步逐一验证了flow变化与原目标下降。
完整数据和范围见[数值核验记录](../../../../experiments/refinement_forcing_uot/ORIGINAL_OBJECTIVE_ROUNDING_RESULTS.md)。
有限样本结果尚不能代替score误差和underflow的全范围分析。
