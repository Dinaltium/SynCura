"""Fetch shared datasets from Google Drive (data stays out of git).

Usage:
    pip install gdown
    # Team Drive folder ID via flag or SYNCURA_DATA_FOLDER_ID env var:
    python scripts/download_data.py --folder-id <drive-folder-id>
    python scripts/download_data.py --dataset challenge-2019 --folder-id <id>

The script downloads into data/ (gitignored) and verifies file counts.
"""
import argparse
import os
import sys

DATASETS = {
    'challenge-2019': {
        # Google Drive folder ID holding challenge-2019-1.0.0/ (set by whoever uploads).
        # Override with --folder-id or SYNCURA_DATA_FOLDER_ID.
        'folder_id': os.environ.get('SYNCURA_DATA_FOLDER_ID', 'PASTE_DRIVE_FOLDER_ID_HERE'),
        'subdir': os.path.join('challenge-2019-1.0.0', 'training', 'training_setA'),
        'expected_files': 20336,
        'ext': '.psv',
    },
}

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def download(folder_id, dest):
    import gdown
    os.makedirs(dest, exist_ok=True)
    gdown.download_folder(id=folder_id, output=dest, quiet=False, use_cookies=False)


def verify(dest, expected, ext):
    files = [f for f in os.listdir(dest) if f.endswith(ext)] if os.path.isdir(dest) else []
    print(f'verified {len(files)}/{expected} {ext} files in {dest}')
    if len(files) != expected:
        print(f'WARNING: expected {expected} files, found {len(files)}', file=sys.stderr)
        return False
    empty = [f for f in files
             if os.path.getsize(os.path.join(dest, f)) == 0]
    if empty:
        print(f'WARNING: {len(empty)} empty files (e.g. {empty[0]})', file=sys.stderr)
        return False
    print('OK: all files present and non-empty')
    return True


def main():
    ap = argparse.ArgumentParser(description='Fetch shared SynCura datasets from Google Drive.')
    ap.add_argument('--dataset', default='challenge-2019', choices=list(DATASETS),
                    help='which dataset to fetch')
    ap.add_argument('--folder-id', default=None, help='Google Drive folder ID (overrides default/env)')
    args = ap.parse_args()

    cfg = DATASETS[args.dataset]
    folder_id = args.folder_id or cfg['folder_id']
    if not folder_id or folder_id == 'PASTE_DRIVE_FOLDER_ID_HERE':
        print('ERROR: no Drive folder ID. Pass --folder-id or set SYNCURA_DATA_FOLDER_ID.',
              file=sys.stderr)
        return 1
    dest = os.path.join(REPO_ROOT, 'data', cfg['subdir'])
    print(f'downloading {args.dataset} -> {dest}')
    download(folder_id, dest)
    ok = verify(dest, cfg['expected_files'], cfg['ext'])
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
