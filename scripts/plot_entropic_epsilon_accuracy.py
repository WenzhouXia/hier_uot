from __future__ import annotations

import argparse
import hashlib
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
    CN: 固定并重画三指标合并的 epsilon 扫描图，不启动实验或修改原始汇总。
    EN: Pin and redraw the combined three-metric epsilon sweep without running experiments or changing aggregates.
    """
    from paper_experiments_uot.entropic_epsilon_accuracy.collect import plot_sparse_summary
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='store_true')
    args = parser.parse_args()
    snapshot = PAPER/'figures/plot_sources/entropic_epsilon_sparse_20261120.json'
    if args.capture:
        batch = PROJECT/'paper_experiments_uot/entropic_epsilon_accuracy/results/20261117_paper_data_entropic_epsilon_accuracy'
        sources = {name: batch/name for name in ('epsilon_aggregate.json', 'config.json')}
        fields = ('shared_gap', 'coupling_relative_l1', 'reference_outside_support_mass_fraction')
        keep = ['n', 'rho_source', 'rho_target', 'epsilon', 'readout', 'planned']
        keep += [metric+suffix for metric in fields for suffix in ('_mean', '_count')]
        rows = [{key: row[key] for key in keep}
                for row in json.loads(sources['epsilon_aggregate.json'].read_text()) if row['readout']=='sparse']
        data = dict(rows=rows, config=json.loads(sources['config.json'].read_text()),
                    sources={str(path.relative_to(PROJECT)): hashlib.sha256(path.read_bytes()).hexdigest()
                             for path in sources.values()})
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n')
    data = json.loads(snapshot.read_text())
    with tempfile.TemporaryDirectory(prefix='uot-epsilon-summary-') as temporary:
        staging = Path(temporary)
        plot_sparse_summary(data['rows'], staging, data['config'])
        for suffix in ('.pdf', '.png'):
            shutil.copyfile(staging/('entropic_epsilon_sparse_accuracy_n16384'+suffix),
                            PAPER/'figures'/('entropic_epsilon_sparse_accuracy'+suffix))
    print(PAPER/'figures/entropic_epsilon_sparse_accuracy.pdf')


if __name__ == '__main__':
    main()
