from __future__ import annotations

import json
from pathlib import Path
import sys

PROJECT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT))

from paper_experiments_uot.common.metrics import relative_gap
from paper_experiments_uot.common.plot_style import apply_paper_style


def main(output=None):
    """
    CN: 从已完成的固定结果重画论文图，仅简化 log 刻度，不启动任何求解。
    EN: Redraw paper figures from completed pinned results, simplifying log ticks without starting any solves.
    """
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    from matplotlib.ticker import LogFormatterMathtext, LogLocator, NullFormatter

    batch = PROJECT/'paper_experiments_uot/hello_uot_comparison/results/20261111_formal_four_rho'
    paper = Path(__file__).resolve().parents[1]
    figures = Path(output) if output is not None else paper/'figures'
    figures.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((batch/'manifest.json').read_text())
    summaries = json.loads((batch/'summary.json').read_text())
    apply_paper_style()
    colors = {'shuttle': '#EE6A5F', 'hello_uot': '#4878A8'}
    markers = {'shuttle': 'o', 'hello_uot': 's'}
    labels = {'shuttle': 'Salut', 'hello_uot': 'HELLO-UOT'}
    for n in (32768, 65536, 131072):
        cases = [c for c in manifest['cases'] if c['num_samples'] == n]
        fig, axes = plt.subplots(1, len(cases), figsize=(7.1, 2.05), squeeze=False)
        for ax, case in zip(axes.flat, cases):
            row = next(r for r in summaries if r['case_id'] == case['case_id'] and r['repeat'] == 0)
            if row['reference_status'] != 'accepted':
                raise ValueError('Paper figures require all references to be accepted')
            run = next(r for r in case['runs'] if r['method'] == 'hello_uot' and r['repeat'] == 0)
            trajectory = json.loads(((batch/run['metrics']).parent/'trajectory.json').read_text())
            for method in ('hello_uot', 'shuttle'):
                records = trajectory if method == 'hello_uot' else [dict(
                    runtime_sec=row['shuttle_runtime_sec'], objective=row['shuttle_objective'])]
                times = [r['runtime_sec'] for r in records]
                gaps = [relative_gap(r['objective'], row['reference_dual_objective'])['shared_gap'] for r in records]
                if any(g is None or g <= 0 for g in gaps):
                    raise ValueError('Nonpositive or invalid shared gap requires an explicit plotting treatment')
                ax.plot(times, gaps, color=colors[method], marker=markers[method], markersize=3.2,
                        linewidth=.85, markeredgewidth=.5, linestyle='-' if method == 'hello_uot' else 'None')
            ax.set_xscale('log')
            ax.set_yscale('log')
            ax.set_xlabel('Time (s)')
            ax.set_ylabel('Shared gap')
            ax.set_title(r'$\rho_a='+f'{case["rho"][0]:g}'+r',\ \rho_b='+f'{case["rho"][1]:g}'+r'$', fontsize=8)
            for axis in (ax.xaxis, ax.yaxis):
                axis.set_major_locator(LogLocator(base=10, numticks=4))
                axis.set_major_formatter(LogFormatterMathtext(base=10, labelOnlyBase=True))
                axis.set_minor_formatter(NullFormatter())
            ax.tick_params(labelsize=7)
            ax.margins(x=.13, y=.13)
            ax.grid(True, alpha=.18, linewidth=.5)
        legend = [Line2D([], [], color=colors[m], marker=markers[m], markersize=3.5,
                         linewidth=.85, linestyle='-' if m == 'hello_uot' else 'None', label=labels[m])
                  for m in ('shuttle', 'hello_uot')]
        fig.legend(handles=legend, loc='upper center', bbox_to_anchor=(.52, 1.015),
                   ncol=2, frameon=False, fontsize=7.2)
        fig.subplots_adjust(left=.085, right=.99, bottom=.24, top=.76, wspace=.67)
        stem = figures/f'hello_uot_gap_time_n{n}'
        for suffix in ('pdf', 'png'):
            fig.savefig(stem.with_suffix('.'+suffix), dpi=300)
        plt.close(fig)


if __name__ == '__main__':
    main()
