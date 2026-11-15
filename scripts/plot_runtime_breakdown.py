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
    CN: 合并两个非重叠规模的预览批次，固定输入后生成附录双栏分解图。
    EN: Combine two previews with disjoint sizes, freezing inputs for the appendix-wide breakdown.
    """
    from paper_experiments_uot.runtime_breakdown.collect import draw
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='store_true')
    args = parser.parse_args()
    snapshot = PAPER / 'figures/plot_sources/runtime_breakdown_pilot.json'
    if args.capture:
        groups, sources = [], []
        for batch in ('20261114_runtime_breakdown_preview_my4090', '20261114_runtime_breakdown_n262144_my4090'):
            source = PROJECT / 'paper_experiments_uot/runtime_breakdown/results' / batch / 'summary_table.json'
            groups.extend(json.loads(source.read_text()))
            sources.append(dict(path=str(source.relative_to(PROJECT)), sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
        rhos = [[.1, .1], [1., 1.], [10., 10.], [.045, 99.995]]
        groups.sort(key=lambda g: (rhos.index(g['rho']), g['n']))
        assert len(groups) == 16 and all(g['valid'] == g['planned'] == 1 for g in groups)
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(json.dumps(dict(status='profiling_preview', sources=sources, groups=groups), indent=2))
    data = json.loads(snapshot.read_text())
    with tempfile.TemporaryDirectory() as temporary:
        folder = Path(temporary)
        draw(data['groups'], folder, wide=True)
        for suffix in ('.pdf', '.png'):
            target = PAPER / ('figures/uot_runtime_breakdown_pilot' + suffix)
            shutil.copyfile(folder / ('runtime_breakdown_wide' + suffix), target)
            print(target)


if __name__ == '__main__':
    main()
