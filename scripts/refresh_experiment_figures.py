from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile

PROJECT = Path(__file__).resolve().parents[3]
PAPER = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))


def refresh(snapshot: Path, output: Path) -> None:
    """
    CN: 从固定绘图输入重画论文图，不读取运行中指标或改写实验汇总。
    EN: Redraw paper figures from pinned plot inputs without reading live metrics or rewriting summaries.
    """
    import pandas as pd

    from paper_experiments_uot.accuracy_runtime_pareto.collect import plot as plot_pareto
    from paper_experiments_uot.common.plot_style import quiet_font_timestamp_warnings
    from paper_experiments_uot.moscot_time.collect import plot as plot_temporal
    from paper_experiments_uot.ufgw_solver_comparison.collect import plot_trajectories
    from papers.hier_uot.scripts.plot_hello_uot_comparison import main as plot_hello

    data = json.loads(snapshot.read_text())
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='salut-paper-plots-') as temporary:
        staging = Path(temporary)
        with quiet_font_timestamp_warnings():
            plot_pareto(data['pareto']['rows'], staging, methods=data['pareto']['methods'])
            temporal = data['temporal']
            plot_temporal(staging, temporal['manifest'],
                          pd.read_csv(io.StringIO(temporal['summary_csv'])),
                          pd.read_csv(io.StringIO(temporal['stages_csv'])), temporal['methods'])

            rows, traces = [], []
            for panel in data['ufgw']:
                for curve in panel['curves']:
                    row = {key: panel[key] for key in
                           ('num_samples', 'epsilon', 'rho_a', 'rho_b', 'feature_weight')}
                    row.update({key: curve[key] for key in ('method', 'seed', 'repeat')})
                    trace = [dict(sweep=sweep, runtime_sec=time, objective=value)
                             for sweep, time, value in zip(curve['sweeps'], curve['runtime_sec'],
                                                            curve['objective'], strict=True)]
                    rows.append(row)
                    traces.append((row, trace))
            plot_trajectories(staging, rows, traces)
            plot_hello(output)

        mappings = {
            'accuracy_runtime_pareto_2x2': 'uot_accuracy_runtime_pareto_2x2',
            'temporal_runtime_accuracy': 'moscot_time_runtime_accuracy',
            'extended_data_fig1a_runtime': 'moscot_time_runtime',
            'objective_time_n16384_eps0_rhoa0.1_rhob0.1_alpha0.4': 'ufgw_objective_time_eps0',
            'objective_time_n16384_eps0.001_rhoa0.1_rhob0.1_alpha0.4': 'ufgw_objective_time_eps0.001',
        }
        for source, target in mappings.items():
            for suffix in ('.pdf', '.png'):
                shutil.copyfile(staging / (source + suffix), output / (target + suffix))
            print(output / (target + '.pdf'))


def main() -> None:
    """
    CN: 默认使用论文归档的绘图快照，仅运行 CPU 汇总图形流程。
    EN: Use the paper's archived plot snapshot by default, running only CPU plotting.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', type=Path,
                        default=PAPER / 'figures/plot_sources/experiment_figures_20261114.json')
    parser.add_argument('--output-dir', type=Path, default=PAPER / 'figures')
    args = parser.parse_args()
    refresh(args.snapshot, args.output_dir)


if __name__ == '__main__':
    main()
