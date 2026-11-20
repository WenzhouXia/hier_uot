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
    CN: 合并三个正式批次，固定五 seed 的分阶段计时及扫描次数，生成附录横排图。
    EN: Combine three formal batches, freezing five-seed phase timings and scan counts for an appendix-wide plot.
    """
    from paper_experiments_uot.runtime_breakdown.collect import aggregate, draw
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='store_true')
    args = parser.parse_args()
    snapshot = PAPER / 'figures/plot_sources/runtime_breakdown_20261119.json'
    if args.capture:
        groups, sources, observations = [], [], []
        for name in ('20261117_paper_data_runtime_breakdown',
                     '20261118_paper_data_runtime_breakdown_n65536', '20261119_005838_427739_infra'):
            batch = PROJECT / 'paper_experiments_uot/runtime_breakdown/results' / name
            rows, local_groups = aggregate(batch)
            groups.extend(local_groups)
            for row in rows:
                if not (row['status'] == 'success' and row['result']['converged']
                        and row.get('measurement_quality') == 'clean' and row['control_result']['converged']):
                    raise ValueError(f'Incomplete or unaccepted measurement: {name}/{row["directory"]}')
                source = batch / row['directory'] / 'metrics.json'
                sources.append(dict(path=str(source.relative_to(PROJECT)), sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
                finest = next(level for level in row['result']['levels']
                              if level['n_source'] == row['n'] and level['n_target'] == row['n'])
                observations.append(dict(n=row['n'], rho=row['rho'], seed=row['seed'],
                    runtime_sec=row['runtime_sec'], phases_sec=row['phases_sec'], phase_calls=row['phase_calls'],
                    kkt_error=row['result']['kkt_error'], measurement_quality=row['measurement_quality'],
                    finest_pricing_scans=sum(item.get('full_scan_time', 0) > 0 for item in finest['iterations']),
                    control_runtime_sec=row['control_runtime_sec'], profiling_time_ratio=row['profiling_time_ratio']))
        rhos = [[.1, .1], [1., 1.], [10., 10.], [.045, 99.995]]
        groups.sort(key=lambda g: (rhos.index(g['rho']), g['n']))
        assert len(groups) == 16 and all(g['valid'] == g['planned'] == 5 for g in groups)
        assert len({(r['n'], tuple(r['rho']), r['seed']) for r in observations}) == 80
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(json.dumps(dict(status='formal_complete', sources=sources, groups=groups,
                                           observations=observations), indent=2)+'\n')
    data = json.loads(snapshot.read_text())
    with tempfile.TemporaryDirectory() as temporary:
        folder = Path(temporary)
        draw(data['groups'], folder, wide=True)
        for suffix in ('.pdf', '.png'):
            target = PAPER / ('figures/uot_runtime_breakdown' + suffix)
            shutil.copyfile(folder / ('runtime_breakdown_wide' + suffix), target)
            print(target)


if __name__ == '__main__':
    main()
