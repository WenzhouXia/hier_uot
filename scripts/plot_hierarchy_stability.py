"""
CN: 从固定历史测量重画层间稳定性附录图，不启动求解。
EN: Redraw appendix hierarchy-stability figures from pinned historical measurements without solving.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np


def main():
    """
    CN: 使用全部历史转换，并核对原始文件指纹和逐例理论上界。
    EN: Use every historical transition and verify source fingerprints and per-case theoretical bounds.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-root', type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument('--results-dir', type=Path)
    args = parser.parse_args()
    root = args.project_root.resolve()
    source = args.results_dir or root / 'results/uot_hierarchy_paper_candidate_20261019'
    expected = '4be52dda8cac929ff1d9524a04d242c0e9956523302432a0d8f085558d38e5c4'
    path = source / 'forward_results.json'
    actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual_hash != expected:
        raise ValueError('Historical forward-results checksum mismatch')
    records = json.loads(path.read_text())
    points = [{**{k: v for k, v in record.items() if k != 'samples'}, **sample}
              for record in records for sample in record['samples']]
    if len(points) != 1080:
        raise ValueError('Expected all 1,080 historical transitions')
    error = np.array([p['actual_h2'] for p in points])
    bound = np.array([min(2., p['residual_bound'], p['sharp_bound']) for p in points])
    prediction = np.array([p['prediction'] for p in points])
    for values in (error, bound, prediction):
        if not np.isfinite(values).all() or not (values > 0).all():
            raise ValueError('All recorded values must be positive and finite for the log plots')
    if np.any(error > bound + 1e-12):
        raise ValueError('Recorded direct bound is violated')
    hard = np.array([p['ra'] > p['rb'] for p in points])
    fold = np.maximum(prediction / error, error / prediction)
    groups = []
    for ra, rb in ((.1, .1), (1., 1.), (10., 10.), (.1, 2.), (2., .1)):
        mask = np.array([(p['ra'], p['rb']) == (ra, rb) for p in points])
        groups.append({'rho_a': ra, 'rho_b': rb, 'n': int(mask.sum()),
                       'median_bound_ratio': float(np.median(bound[mask] / error[mask])),
                       'median_prediction_fold': float(np.median(fold[mask])),
                       'within_factor_two_percent': float(np.mean(fold[mask] <= 2) * 100)})
    stats = {'source_path': str(path.resolve()), 'source_sha256': actual_hash,
             'source_commit': '3b92f455866dc9b3432b2ebcfe3fb2086ead5c9e', 'transitions': len(points),
             'selection': 'all recorded transitions; no case filtering',
             'median_bound_ratio': float(np.median(bound / error)),
             'p90_bound_ratio': float(np.quantile(bound / error, .9)),
             'maximum_bound_ratio': float(np.max(bound / error)),
             'median_prediction_fold': float(np.median(fold)),
             'within_factor_two_percent': float(np.mean(fold <= 2) * 100), 'by_penalty': groups}
    sys.path.insert(0, str(root))
    from paper_experiments_uot.common.plot_style import apply_paper_style
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch
    apply_paper_style()
    fig, axes = plt.subplots(1, 2, figsize=(7.1, 2.45))
    fig.subplots_adjust(left=.10, right=.98, bottom=.21, top=.77, wspace=.36)
    lo, hi = min(error.min(), bound.min(), prediction.min()) * .45, 2.5
    for ax, values, title, ylabel in zip(
            axes, (bound, prediction), ('(a) Computable upper bound', '(b) Component prediction'),
            ('Computed upper bound', 'Predicted squared Hellinger')):
        ax.fill_between([lo, hi], [lo / 2, hi / 2], [2 * lo, 2 * hi], color='#E7E7E4', zorder=0)
        ax.plot([lo, hi], [lo, hi], color='#444444', linewidth=.8, zorder=1)
        for mask, color, marker in ((~hard, '#4C72B0', 'o'), (hard, '#EE6A5F', '^')):
            ax.scatter(error[mask], values[mask], s=10, color=color, marker=marker,
                       alpha=.5, linewidths=0, rasterized=True, zorder=2)
        ax.set(xscale='log', yscale='log', xlim=(lo, hi), ylim=(lo, hi),
               xlabel='Measured squared Hellinger', ylabel=ylabel)
        ax.set_title(title, fontsize=8.5, pad=7)
        ax.set_aspect('equal', adjustable='box')
        ax.grid(alpha=.3, which='major')
    handles = [Line2D([], [], linestyle='', marker='o', color='#4C72B0', markersize=4,
                      label=r'$\rho_a\leq\rho_b$'),
               Line2D([], [], linestyle='', marker='^', color='#EE6A5F', markersize=4,
                      label=r'$\rho_a>\rho_b$'),
               Line2D([], [], color='#444444', linewidth=.8, label='Equality'),
               Patch(facecolor='#E7E7E4', edgecolor='none', label='Within a factor of two')]
    fig.legend(handles=handles, loc='upper center', bbox_to_anchor=(.53, .985), ncol=4,
               frameon=False, columnspacing=1.3, handletextpad=.5)
    output = Path(__file__).resolve().parents[1] / 'figures/hierarchy_stability_validation'
    output.parent.mkdir(exist_ok=True)
    for suffix in ('.pdf', '.png'):
        destination = output.with_suffix(suffix)
        fig.savefig(destination, dpi=300)
        print(destination)
    plt.close(fig)
    output.with_suffix('.json').write_text(json.dumps(stats, indent=2) + '\n')
    print(json.dumps(stats, indent=2))


if __name__ == '__main__':
    main()
