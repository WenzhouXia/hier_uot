# Support-induced iteration lower bound

Archived from manuscript Appendix B.1 on 2026-11-15.
This fixed-map result is not part of the adaptive global/local convergence proof.
The TeX fragment below is retained verbatim; equation references use the manuscript definitions of the PDHG map, Halpern iteration, metric, and stopping criterion.
It is a research record and is not loaded by `main.tex`.

```
\subsubsection{Support-Induced Iteration Lower Bound}
\label{app:hall-iteration-bound}

The following result connects a support restriction to the number of PDHG-map evaluations needed to pass the marginal-consistency test.
It applies to fixed steps and to restarts that reset the anchor without changing the map.

\begin{proposition}[Iteration lower bound from a weighted Hall deficit]
\label{prop:hall-iteration-lower-bound}
Fix an active support $\mathcal N$, positive reference masses $\mathbf a,\mathbf b$, finite costs, and $\rho_a=\rho_b=\rho$.
Suppose a source set $S$ and its active neighbors $J=\{j:(i,j)\in\mathcal N\text{ for some }i\in S\}$ satisfy
\begin{equation*}
A_S:=\sum_{i\in S}a_i>B_J:=\sum_{j\in J}b_j>0.
\end{equation*}
The same result holds with the source and target sides exchanged.
Choose fixed positive diagonal steps satisfying $\|\mathbf D_y^{1/2}\mathbf A_{\mathcal N}\mathbf D_x^{1/2}\|_2<1$, and let $T_\rho$ be~\eqref{eq:pduot-map} with metric $\mathbf P$ defined above.
Starting at $\mathbf z^0=(\mathbf x^0,-\mathbf f^0,-\mathbf g^0)$, use either ordinary PDHG or reflected Halpern~\eqref{eq:halpern}, optionally restarting at any iterate or mapped point computed in the current epoch.
Each new epoch starts at its new anchor, with the same map and coefficients.
Write $d_\rho=\|T_\rho\mathbf z^0-\mathbf z^0\|_{\mathbf P}>0$ and $M_0=\max\{\|\mathbf f^0\|_\infty,\|\mathbf g^0\|_\infty\}$.
For a fixed $\delta\geq0$, define
\begin{equation*}
\eta_\delta=\sqrt{|S|+|J|}\,\delta<A_S-B_J,\qquad \ell_\delta=\log\frac{2A_S}{\sqrt{\eta_\delta^2+4A_SB_J}+\eta_\delta}>0.
\end{equation*}
Any mapped output $(\mathbf x,\mathbf f,\mathbf g)$ satisfying
\begin{equation}
\label{eq:hall-marginal-target}
\left\|\mathbf A_{\mathcal N}\mathbf x-\begin{pmatrix}\mathbf a\odot e^{-\mathbf f/\rho}\\\mathbf b\odot e^{-\mathbf g/\rho}\end{pmatrix}\right\|_2\leq\delta
\end{equation}
requires at least
\begin{equation}
\label{eq:hall-iteration-lower-bound}
N\geq\frac{\sqrt{\lambda_{\min}(\mathbf P)}}{d_\rho}\,[\rho\ell_\delta-M_0]_+
\end{equation}
evaluations of $T_\rho$.
Consequently, for fixed support, data, steps, and threshold, initial states uniformly bounded as $\rho\to\infty$ require $N=\Omega(\rho)$.
\end{proposition}

\begin{proof}
Let $\mathbf r,\mathbf q$ be the output marginals and $\widehat{\mathbf r}=\mathbf a\odot e^{-\mathbf f/\rho}$, $\widehat{\mathbf q}=\mathbf b\odot e^{-\mathbf g/\rho}$ their responses.
The mapped coupling is nonnegative, so the support restriction gives $\sum_{i\in S}r_i\leq\sum_{j\in J}q_j$.
Writing $M=\max\{\|\mathbf f\|_\infty,\|\mathbf g\|_\infty\}$, Cauchy--Schwarz and~\eqref{eq:hall-marginal-target} imply
\begin{equation*}
A_Se^{-M/\rho}-B_Je^{M/\rho}\leq\sum_{i\in S}\widehat r_i-\sum_{j\in J}\widehat q_j\leq\eta_\delta.
\end{equation*}
Solving this quadratic inequality in $e^{M/\rho}$ gives $M\geq\rho\ell_\delta$.
Hence every qualifying output satisfies
\begin{equation}
\label{eq:hall-required-travel}
\|\mathbf z-\mathbf z^0\|_{\mathbf P}\geq\sqrt{\lambda_{\min}(\mathbf P)}\,[\rho\ell_\delta-M_0]_+.
\end{equation}

By~\eqref{eq:pduot-resolvent}, $T_\rho$ is firmly nonexpansive in the $\mathbf P$ norm.
For ordinary PDHG, successive displacements are therefore at most $d_\rho$, giving $\|\mathbf z-\mathbf z^0\|_{\mathbf P}\leq Nd_\rho$ after $N$ evaluations.
Restarting at an already computed iterate has the same bound, since its map displacement cannot exceed that of the epoch anchor.
To obtain the same bound for reflected Halpern and its restarts, set $R=2T_\rho-\mathbf I$ and consider an epoch with anchor $\mathbf u$, iterates $\mathbf h^0=\mathbf u$, and $e=\|T_\rho\mathbf u-\mathbf u\|_{\mathbf P}$.
Nonexpansiveness of $R$ and the coefficients in~\eqref{eq:halpern} give, by induction,
\begin{equation*}
\|\mathbf h^k-\mathbf u\|_{\mathbf P}\leq ke,\qquad \|\mathbf h^{k+1}-\mathbf h^k\|_{\mathbf P}\leq e.
\end{equation*}
Indeed, the first bound follows from $D_{k+1}\leq\frac{k+1}{k+2}(D_k+2e)$ with $D_k=\|\mathbf h^k-\mathbf u\|_{\mathbf P}$.
For the second, $\Delta_1\leq e$ and comparison of consecutive updates yields
\begin{equation*}
\Delta_{k+1}\leq\frac{k+1}{k+2}\Delta_k+\frac{\|R\mathbf h^{k-1}-\mathbf u\|_{\mathbf P}}{(k+1)(k+2)}\leq\frac{k+1}{k+2}e+\frac{e}{k+2}=e.
\end{equation*}
The identity $(k+1)(R\mathbf h^k-\mathbf h^k)=(k+2)(\mathbf h^{k+1}-\mathbf h^k)+(\mathbf h^k-\mathbf u)$ then gives $\|T_\rho\mathbf h^k-\mathbf h^k\|_{\mathbf P}\leq e$.
Thus the mapped output from the epoch's $(k+1)$st evaluation satisfies
\begin{equation*}
\|T_\rho\mathbf h^k-\mathbf u\|_{\mathbf P}\leq(k+1)e,\qquad \|T_\rho(T_\rho\mathbf h^k)-T_\rho\mathbf h^k\|_{\mathbf P}\leq e.
\end{equation*}
Restarting at either an iterate or a mapped point therefore cannot increase the anchor's initial map displacement.
Summing the displacement bounds over epochs gives $\|\mathbf z-\mathbf z^0\|_{\mathbf P}\leq Nd_\rho$, regardless of the restart times.
Combining this bound with~\eqref{eq:hall-required-travel} proves~\eqref{eq:hall-iteration-lower-bound}.

Finally, bounded initial states yield uniformly bounded first primal updates and dual proximal inputs for fixed steps and costs.
For $\rho\geq\rho_{\min}>0$, the scalar equation $v-u+s h e^{v/\rho}=0$ implies $u-s h e^{\max\{u,0\}/\rho_{\min}}\leq v\leq u$.
Thus $d_\rho$ is uniformly bounded, proving the stated asymptotic lower bound.
\end{proof}

For the relative $\ell_2$ marginal criterion in Appendix~\ref{app:stopping-criterion}, take $\delta=(1+\|(\mathbf a,\mathbf b)\|_2)\varepsilon$; the threshold condition requires this test to resolve the Hall deficit.
The result concerns a fixed support and metric: it does not cover adaptive primal-weight updates or initial potentials that already grow with $\rho$.
When the reference totals agree, retaining $\mathcal B$ excludes a weighted Hall deficit and removes this particular obstruction, without implying a penalty-independent convergence rate.
```
