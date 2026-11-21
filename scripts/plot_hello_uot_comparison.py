from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

PROJECT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT))

from paper_experiments_uot.common.metrics import relative_gap
from paper_experiments_uot.common.plot_style import (
    apply_paper_style,
    fit_legend_gap,
    label_panel_group,
    method_legend_font,
)
from paper_experiments_uot.common.method_styles import method_names, method_style


def main(output=None):
    """
    CN: 从 Table 2 同批固定结果重画 HELLO-UOT 轨迹图，对每个 seed 取 best-so-far 原问题候选后再取五 seed 均值。
    EN: Redraw HELLO-UOT trajectory figure from the pinned Table 2 batch using per-seed best-so-far primal candidates.
    """
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    from matplotlib.ticker import LogFormatterMathtext, LogLocator, NullFormatter
    import numpy as np

    paper = Path(__file__).resolve().parents[1]
    source_path = paper / 'figures/plot_sources/hello_comparison_final_20261120.json'
    pinned = json.loads(source_path.read_text())
    batch = PROJECT / pinned['source_batch']
    summary = json.loads((batch / 'summary.json').read_text())
    ref_by_key = {
        (r['n'], (r['rho_source'], r['rho_target']), r['seed']): r['reference_dual_objective']
        for r in summary
        if r.get('reference_dual_objective') is not None
    }

    figures = Path(output) if output is not None else paper / 'figures'
    figures.mkdir(parents=True, exist_ok=True)

    apply_paper_style()
    colors = {method: method_style(method)['color'] for method in ('shuttle', 'hello_uot')}
    markers = {method: method_style(method)['marker'] for method in colors}
    labels = method_names(colors)

    updated_panels = []
    sources_sha256 = {}
    panels = pinned['panels']
    fig, axes = plt.subplots(1, len(panels), figsize=(7.1, 2.05), squeeze=False)
    for ax, panel in zip(axes.flat, panels):
        n = int(panel['n'])
        pair = tuple(panel['rho'])
        seeds = list(panel['seeds'])
        best_curves = []
        for seed in seeds:
            d_ref = ref_by_key[(n, pair, seed)]
            traj_path = (
                batch
                / 'cases'
                / f'n{n}_rhoa{pair[0]:g}_rhob{pair[1]:g}_seed{seed}'
                / 'hello_uot_outer_tolerance_0.0001_repeat0'
                / 'trajectory.json'
            )
            raw_bytes = traj_path.read_bytes()
            sources_sha256[str(traj_path.relative_to(PROJECT))] = hashlib.sha256(raw_bytes).hexdigest()
            trajectory = json.loads(raw_bytes)
            # CN: HELLO-UOT 内部维护 best_primal_snapshot，按每个 seed 取前缀最小原问题目标。
            # EN: HELLO-UOT maintains best_primal_snapshot internally; take per-seed running minimum primal objective.
            best_obj = float('inf')
            curve = []
            for r in trajectory:
                if r['objective'] < best_obj:
                    best_obj = float(r['objective'])
                curve.append((float(r['runtime_sec']), relative_gap(best_obj, d_ref)['shared_gap']))
            best_curves.append(curve)

        # CN: 同一 oracle 调用序号取五 seed 均值；已终止的 seed 保留其最终 incumbent 候选。
        # EN: Average five seeds at each oracle index, retaining final incumbent candidates for terminated seeds.
        averaged = [
            np.mean([curve[min(k, len(curve) - 1)] for curve in best_curves], axis=0)
            for k in range(max(map(len, best_curves)))
        ]
        updated_panels.append(dict(
            rho=list(pair),
            n=n,
            seeds=seeds,
            salut_mean_runtime_sec=float(panel['salut_mean_runtime_sec']),
            salut_mean_shared_gap=float(panel['salut_mean_shared_gap']),
            hello_init_mean_runtime_sec=float(averaged[0][0]),
            hello_final_mean_runtime_sec=float(panel['hello_final_mean_runtime_sec']),
            hello_mean_trajectory=[
                dict(index=k, runtime_sec=float(pt[0]), shared_gap=float(pt[1]))
                for k, pt in enumerate(averaged)
            ],
        ))

        for method in ('hello_uot', 'shuttle'):
            records = (
                averaged
                if method == 'hello_uot'
                else [(panel['salut_mean_runtime_sec'], panel['salut_mean_shared_gap'])]
            )
            times = [r[0] for r in records]
            gaps = [r[1] for r in records]
            if any(g is None or g <= 0 for g in gaps):
                raise ValueError('Nonpositive or invalid shared gap requires an explicit plotting treatment')
            ax.plot(
                times,
                gaps,
                color=colors[method],
                marker=markers[method],
                markersize=3.2,
                linewidth=0.85,
                markeredgewidth=0.5,
                linestyle='-' if method == 'hello_uot' else 'None',
                zorder=4.5 if method == 'shuttle' else 2,
            )
        ax.set_xscale('log')
        ax.set_yscale('log')
        for axis in (ax.xaxis, ax.yaxis):
            axis.set_major_locator(LogLocator(base=10, numticks=4))
            axis.set_major_formatter(LogFormatterMathtext(base=10, labelOnlyBase=True))
            axis.set_minor_formatter(NullFormatter())
        ax.tick_params(labelsize=8)
        ax.margins(x=0.13, y=0.13)
        label_panel_group(ax, rf'$\rho=({pair[0]:g},{pair[1]:g})$')
        ax.grid(True, alpha=0.18, linewidth=0.5)

    legend = [
        Line2D(
            [], [], color=colors[m], marker=markers[m], markersize=3.5,
            linewidth=0.85, linestyle='-' if m == 'hello_uot' else 'None', label=labels[m],
        )
        for m in ('shuttle', 'hello_uot')
    ]
    fig.legend(
        handles=legend, loc='upper center', bbox_to_anchor=(0.52, 1.015),
        ncol=2, frameon=False, prop=method_legend_font(8.2),
    )
    fig.supxlabel('Time (s)', fontsize=8.5, x=0.54, y=0.015)
    fig.supylabel('Gap', fontsize=8.5, x=0.008)
    fig.subplots_adjust(left=0.075, right=0.99, bottom=0.21, top=0.76, wspace=0.40)
    fit_legend_gap(fig, list(axes.flat))
    stem = figures / 'hello_uot_gap_time_n131072'
    for suffix in ('pdf', 'png'):
        fig.savefig(stem.with_suffix('.' + suffix), dpi=300)
    plt.close(fig)

    if output is None:
        pinned_out = dict(
            date='2026-11-20',
            source_batch=pinned['source_batch'],
            trajectory_aggregation=(
                'Per-seed best-so-far (incumbent) primal objective converted to shared gap, '
                'then arithmetic mean over seeds at oracle-call index; terminal incumbents retained after each seed stops.'
            ),
            panels=updated_panels,
            sources_sha256=sources_sha256,
        )
        source_path.write_text(json.dumps(pinned_out, indent=2) + '\n')


if __name__ == '__main__':
    main()
