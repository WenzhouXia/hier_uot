from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import sys

PROJECT = Path(__file__).resolve().parents[3]
PAPER = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))


def capture(snapshot):
    """
    CN: 固定三个已完成 pilot 的绘图输入，保留未完成状态和原始来源指纹。
    EN: Freeze three pilot plot inputs, retaining pending states and source fingerprints.
    """
    root = PROJECT / 'paper_experiments_uot/accuracy_runtime_pareto/results'
    groups = []
    for title, batch, baseline, dimension in (
        ('ETM-Approx+HELLO', '20261114_etm_pilot_v7_my4090', 'etm', 30),
        ('POT L-BFGS-B', '20261115_pot_lbfgsb_pilot_v2_my4090', 'pot_lbfgsb', 30),
        ('MultiScaleOT', '20261115_lowdim_my4090', 'multiscale_torch', 3),
    ):
        source = root / batch / ('lowdim_baselines/summary.json' if baseline == 'multiscale_torch' else 'summary.csv')
        raw = json.loads(source.read_text()) if source.suffix == '.json' else list(csv.DictReader(source.open()))
        rows = []
        for row in raw:
            method = 'shuttle' if row['method'] == 'salut' else row['method']
            if method not in {'shuttle', baseline}:
                continue
            rows.append(dict(method=method, rho=row.get('rho', [float(row.get('rho_source', 0)), float(row.get('rho_target', 0))]),
                             status=row['status'], runtime_sec=float(row.get('runtime_sec') or 0),
                             shared_gap=float(row.get('shared_gap') or 0),
                             parameter=float(row.get('epsilon', row.get('parameter_value') or 0))))
        groups.append(dict(title=title, baseline=baseline, n=4096, d=dimension, rows=rows,
                           source=str(source.relative_to(PROJECT)), sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
    snapshot.parent.mkdir(parents=True, exist_ok=True)
    snapshot.write_text(json.dumps(dict(status='provisional_pilot', seed=42, groups=groups), indent=2))


def plot(snapshot):
    """
    CN: 三组双行双列 Pareto 横向并排；未测面板不补造曲线。
    EN: Arrange three two-by-two Pareto groups in one row without inventing unmeasured curves.
    """
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    from matplotlib.ticker import LogLocator, LogFormatterMathtext, NullFormatter
    from paper_experiments_uot.common.plot_style import apply_paper_style

    colors = apply_paper_style()['roles']
    groups = json.loads(snapshot.read_text())['groups']
    fig = plt.figure(figsize=(7.1, 2.85))
    outer = fig.add_gridspec(1, 3, left=.055, right=.99, bottom=.15, top=.75, wspace=.36)
    penalties = [(0.1, 0.1), (1., 1.), (10., 10.), (.045, 99.995)]
    for k, group in enumerate(groups):
        grid = outer[k].subgridspec(2, 2, wspace=.28, hspace=.65)
        box = outer[k].get_position(fig)
        center = (box.x0 + box.x1) / 2
        fig.text(center, .965, f'({chr(97+k)}) {group["title"]}', ha='center', fontsize=7, weight='bold')
        fig.text(center, .915, rf'$n={group["n"]:,},\ d={group["d"]}$', ha='center', fontsize=6)
        labels = [('Salut', colors['proposed'], 'o'),
                  (group['title'], colors['primary_comparison'], 's')]
        handles = [Line2D([], [], color=color, marker=marker, markersize=2.5, linewidth=.8, label=label)
                   for label, color, marker in labels]
        fig.legend(handles=handles, loc='center', bbox_to_anchor=(center, .855), ncol=1,
                   frameon=False, fontsize=5.5, handlelength=1.3, labelspacing=.15)
        for i, rho in enumerate(penalties):
            ax = fig.add_subplot(grid[i // 2, i % 2])
            for method, (_, color, marker) in zip(('shuttle', group['baseline']), labels):
                rows = [r for r in group['rows'] if r['method'] == method and tuple(r['rho']) == rho
                        and r['status'] == 'success' and r['shared_gap'] > 0]
                rows.sort(key=lambda r: r['parameter'], reverse=True)
                if rows:
                    ax.plot([r['runtime_sec'] for r in rows], [r['shared_gap'] for r in rows], color=color, alpha=.6, linewidth=.75)
                    ax.scatter([r['runtime_sec'] for r in rows], [r['shared_gap'] for r in rows],
                               color=color, marker=marker, s=[7+5*j for j in range(len(rows))], zorder=3, linewidths=0)
            measured = any(r['method'] == group['baseline'] and tuple(r['rho']) == rho and r['status'] == 'success' for r in group['rows'])
            if not measured:
                ax.text(.5, .5, 'Pending', transform=ax.transAxes, ha='center', va='center', fontsize=6, color='.5')
                ax.set_xlim(.1, 1000)
            ax.set(xscale='log', yscale='log', ylim=(2e-11, 2))
            ax.set_title(rf'$\rho=({rho[0]:g},{rho[1]:g})$', fontsize=5.8, pad=3)
            ax.xaxis.set_major_locator(LogLocator(base=10, numticks=3))
            ax.xaxis.set_major_formatter(LogFormatterMathtext())
            ax.xaxis.set_minor_formatter(NullFormatter())
            ax.set_yticks([1e-1, 1e-5, 1e-9])
            ax.tick_params(axis='both', labelsize=4.8, pad=1, length=2)
            ax.grid(True, alpha=.15)
            if i % 2:
                ax.set_yticklabels([])
            else:
                ax.set_ylabel('Shared gap', fontsize=5.5, labelpad=1)
        fig.text(center, .025, 'Runtime (seconds)', ha='center', fontsize=6)
    output = PAPER / 'figures/uot_supplementary_baselines_pilot'
    for suffix in ('.pdf', '.png'):
        fig.savefig(output.with_suffix(suffix), dpi=300, bbox_inches='tight', pad_inches=.03)
    plt.close(fig)
    print(output.with_suffix('.pdf'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='store_true')
    args = parser.parse_args()
    snapshot = PAPER / 'figures/plot_sources/supplementary_baselines_pilot.json'
    if args.capture:
        capture(snapshot)
    plot(snapshot)
