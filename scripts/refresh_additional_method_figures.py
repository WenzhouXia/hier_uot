from __future__ import annotations

import json
from pathlib import Path
import shutil
import sys
import tempfile

PROJECT = Path(__file__).resolve().parents[3]
PAPER = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))


def main():
    """
    CN: 从固定输入更新受限与熵正则比较图的共享方法样式，不重新汇总测量。
    EN: Refresh restricted and entropic comparison styles from pinned inputs without recollecting measurements.
    """
    from paper_experiments_uot.restricted_solver_accuracy_runtime_pareto.collect import plot as restricted_plot
    from paper_experiments_uot.accuracy_runtime_pareto.collect import plot as pareto_plot
    from paper_experiments_uot.entropic_uot.collect import NAMES, STYLES
    source = PAPER/'figures/plot_sources/method_style_figures_20261115.json'
    snapshot = json.loads(source.read_text())
    with tempfile.TemporaryDirectory(prefix='uot-shared-method-styles-') as temporary:
        staging = Path(temporary)
        restricted_plot(snapshot['restricted']['rows'], staging)
        # CN: 正式五 seed 图优先使用独立固定记录，旧记录保留供追溯。
        # EN: Prefer the independent pinned five-seed record, retaining the historical snapshot for provenance.
        entropic_source = PAPER/'figures/plot_sources/entropic_uot_20261117.json'
        entropic = json.loads(entropic_source.read_text())['entropic'] if entropic_source.exists() else snapshot['entropic']
        pareto_plot(entropic['rows'], staging, methods=entropic['methods'], names=NAMES,
                    style_roles=STYLES, filename_prefix='entropic_style',
                    ylabel='Gap')
        for original, target in (
            ('restricted_solver_accuracy_runtime_pareto_2x2_n65536', 'restricted_solver_accuracy_runtime_pareto_2x2_n65536'),
            ('entropic_style', 'entropic_uot_accuracy_runtime_pareto_eps0.001'),
        ):
            for suffix in ('.pdf', '.png'):
                shutil.copyfile(staging/(original+suffix), PAPER/'figures'/(target+suffix))
            print(PAPER/'figures'/(target+'.pdf'))


if __name__ == '__main__':
    main()
