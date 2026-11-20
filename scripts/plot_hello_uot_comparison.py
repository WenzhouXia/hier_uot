from __future__ import annotations

import json
import hashlib
from pathlib import Path
import sys

PROJECT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT))

from paper_experiments_uot.common.metrics import relative_gap
from paper_experiments_uot.common.plot_style import method_legend_font, apply_paper_style, label_panel_group, fit_legend_gap
from paper_experiments_uot.common.method_styles import method_style, method_names


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

    batch = PROJECT/'paper_experiments_uot/hello_uot_comparison/results/20261119_014027_846890_infra'
    paper = Path(__file__).resolve().parents[1]
    figures = Path(output) if output is not None else paper/'figures'
    figures.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((batch/'manifest.json').read_text())
    summaries = json.loads((batch/'summary.json').read_text())
    audit = []
    for case in manifest['cases']:
        row = next(r for r in summaries if r['case_id'] == case['case_id'] and r['repeat'] == 0)
        run = next(r for r in case['runs'] if r['method'] == 'hello_uot' and r['repeat'] == 0)
        path = batch/run['metrics']
        raw = path.read_bytes()
        count = json.loads(raw)['oracle_calls']
        if count != row['hello_oracle_calls']:
            raise ValueError('Oracle call count differs between summary and original metrics')
        audit.append(dict(n=case['num_samples'], rho=case['rho'], seed=case['seed'], hello_calls=count,
                          salut_calls=1, metrics=str(path.relative_to(PROJECT)),
                          sha256=hashlib.sha256(raw).hexdigest()))
    (figures/'hello_uot_call_counts.json').write_text(json.dumps({
        'definition': 'Complete balanced HELLO solves including initialization; one complete Salut UOT solve',
        'rows': audit,
    }, indent=2)+'\n')
    apply_paper_style()
    colors = {method: method_style(method)['color'] for method in ('shuttle', 'hello_uot')}
    markers = {method: method_style(method)['marker'] for method in colors}
    labels = method_names(colors)
    for n in (131072,):
        import numpy as np
        cases = [c for c in manifest['cases'] if c['num_samples'] == n]
        pairs = list(dict.fromkeys(tuple(c['rho']) for c in cases))
        fig, axes = plt.subplots(1, len(pairs), figsize=(7.1, 2.05), squeeze=False)
        for ax, pair in zip(axes.flat, pairs):
            local = [c for c in cases if tuple(c['rho']) == pair]
            curves, final_points = [], []
            for case in local:
                row = next(r for r in summaries if r['case_id'] == case['case_id'] and r['repeat'] == 0)
                if row['reference_status'] != 'accepted':
                    raise ValueError('Paper figures require all references to be accepted')
                run = next(r for r in case['runs'] if r['method'] == 'hello_uot' and r['repeat'] == 0)
                trajectory = json.loads(((batch/run['metrics']).parent/'trajectory.json').read_text())
                curves.append([(r['runtime_sec'], relative_gap(r['objective'], row['reference_dual_objective'])['shared_gap'])
                               for r in trajectory])
                final_points.append((row['shuttle_runtime_sec'], row['shuttle_shared_gap']))
            # CN: 同一 oracle 调用序号取五 seed 均值；已终止的 seed 保留其最终候选。
            # EN: Average five seeds at each oracle index, retaining final candidates for seeds already terminated.
            averaged = [np.mean([curve[min(k, len(curve)-1)] for curve in curves], axis=0)
                        for k in range(max(map(len, curves)))]
            for method in ('hello_uot', 'shuttle'):
                records = averaged if method == 'hello_uot' else [np.mean(final_points, axis=0)]
                times = [r[0] for r in records]
                gaps = [r[1] for r in records]
                if any(g is None or g <= 0 for g in gaps):
                    raise ValueError('Nonpositive or invalid shared gap requires an explicit plotting treatment')
                ax.plot(times, gaps, color=colors[method], marker=markers[method], markersize=3.2,
                        linewidth=.85, markeredgewidth=.5, linestyle='-' if method == 'hello_uot' else 'None', zorder=4.5 if method == 'shuttle' else 2)
            ax.set_xscale('log')
            ax.set_yscale('log')
            for axis in (ax.xaxis, ax.yaxis):
                axis.set_major_locator(LogLocator(base=10, numticks=4))
                axis.set_major_formatter(LogFormatterMathtext(base=10, labelOnlyBase=True))
                axis.set_minor_formatter(NullFormatter())
            ax.tick_params(labelsize=8)
            ax.margins(x=.13, y=.13)
            label_panel_group(ax, rf'$\rho=({pair[0]:g},{pair[1]:g})$')
            ax.grid(True, alpha=.18, linewidth=.5)
        legend = [Line2D([], [], color=colors[m], marker=markers[m], markersize=3.5,
                         linewidth=.85, linestyle='-' if m == 'hello_uot' else 'None', label=labels[m])
                  for m in ('shuttle', 'hello_uot')]
        fig.legend(handles=legend, loc='upper center', bbox_to_anchor=(.52, 1.015),
                   ncol=2, frameon=False, prop=method_legend_font(8.2))
        fig.supxlabel('Time (s)', fontsize=8.5, x=.54, y=.015)
        fig.supylabel('Gap', fontsize=8.5, x=.008)
        fig.subplots_adjust(left=.075, right=.99, bottom=.21, top=.76, wspace=.40)
        fit_legend_gap(fig, list(axes.flat))
        stem = figures/f'hello_uot_gap_time_n{n}'
        for suffix in ('pdf', 'png'):
            fig.savefig(stem.with_suffix('.'+suffix), dpi=300)
        plt.close(fig)


if __name__ == '__main__':
    main()
