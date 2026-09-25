"""Portable dataset locations for SynCura.

All training/eval scripts resolve data through here instead of hardcoding
absolute paths, so the repo works on any machine:

    set SYNCURA_DATA_ROOT=D:\\ml-data        # optional override (PowerShell)
    python -m ml.sweep_xval                   # otherwise defaults to PROJ/data

Layout expected under the root:
    <root>/predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0/
        predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0/
            set-a/  set-b_full/set-b/  Outcomes-a.txt  Outcomes-b.txt
    <root>/challenge-2019-1.0.0/training/training_setA/   (via scripts/download_data.py)
"""
import os

PHYSIONET2012_DIRNAME = (
    'predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0'
)
PHYSIONET2012_INNER = (
    'predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0'
)


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def data_root():
    """Absolute path to the datasets folder (override with SYNCURA_DATA_ROOT)."""
    override = os.environ.get('SYNCURA_DATA_ROOT')
    if override:
        return os.path.abspath(override)
    return os.path.join(repo_root(), 'data')


def physionet2012_root():
    """Absolute path to the extracted PhysioNet 2012 challenge folder."""
    return os.path.join(data_root(), PHYSIONET2012_DIRNAME, PHYSIONET2012_INNER)


def challenge2019_setA():
    """Absolute path to the Challenge-2019 training_setA folder."""
    return os.path.join(data_root(), 'challenge-2019-1.0.0', 'training', 'training_setA')
