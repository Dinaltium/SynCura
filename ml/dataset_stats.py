import argparse
import os
import numpy as np
from ml.dataset import load_physionet_batch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--physionet', required=True)
    parser.add_argument('--outcomes', required=False)
    parser.add_argument('--window', type=int, default=60)
    parser.add_argument('--max-patients', type=int, default=None)
    args = parser.parse_args()

    phys = args.physionet
    outc = args.outcomes

    print('PhysioNet dir:', phys)
    if outc:
        print('Outcomes file:', outc)

    data = load_physionet_batch(phys, outc, max_patients=args.max_patients)
    print('Patients found:', len(data))

    seqs = []
    lengths = []
    usable = 0
    for df_pivot, label, pid in data:
        available = [c for c in ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP'] if c in df_pivot.columns]
        if len(available) == 0:
            continue
        usable += 1
        try:
            min_min = int(df_pivot.index.min())
            max_min = int(df_pivot.index.max())
            L = max_min - min_min + 1
        except Exception:
            L = len(df_pivot)
        lengths.append(L)
        s = max(0, L - args.window)
        seqs.append(s)

    if usable == 0:
        print('No usable patient records found')
    else:
        total_sequences = int(np.sum(seqs))
        print('Usable patients:', usable)
        print('Total sequences (windows):', total_sequences)
        print('Avg seq/patient:', float(np.mean(seqs)))
        print('Median seq/patient:', float(np.median(seqs)))
        print('Min/Max seq/patient:', int(np.min(seqs)), int(np.max(seqs)))
        print('Avg recording minutes:', float(np.mean(lengths)))
        print('Min/Max recording minutes:', int(np.min(lengths)), int(np.max(lengths)))
        print('\nSample patient IDs:')
        sample_ids = [pid for _, _, pid in data[:5]]
        print('\n'.join(sample_ids))


if __name__ == '__main__':
    main()
