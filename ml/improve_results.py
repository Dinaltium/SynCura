# -*- coding: utf-8 -*-
"""Results-improvement campaign runner (streaming-compatible only).

Trains AttentionLSTM seeds under the fixed CAUSAL pipeline and evaluates on
the original val split + fresh 20%-set-B holdout. Writes per-seed checkpoints,
predictions, scalers, and metrics; never touches serving artifacts.

Configs:
  baseline : 12 features, hidden 96  (serves with zero backend changes)
  gap      : 12 + 12 gap channels = 24 features, hidden 96
  gap128   : 24 features, hidden 128

Usage:
  .\\.venv\\Scripts\\python.exe -m ml.improve_results --smoke
  .\\.venv\\Scripts\\python.exe -m ml.improve_results --config baseline --seeds 11 12 13
  .\\.venv\\Scripts\\python.exe -m ml.improve_results --config gap --seeds 21 22 23
  .\\.venv\\Scripts\\python.exe -m ml.improve_results --ensemble ml/training_runs/<run_dir>
"""
import argparse
import datetime
import json
import os
import numpy as np
import torch
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, accuracy_score, recall_score

BASE = r"C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0"
FEATURES_12 = ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2',
               'GCS', 'BUN', 'Creatinine', 'WBC', 'Platelets', 'Glucose']
GAP_SUFFIX = '_GAP'
EPOCHS = 40
PATIENCE = 14
MIN_DELTA = 0.0005

CONFIGS = {
    'baseline': {'gap': False, 'hidden': 96},
    'gap': {'gap': True, 'hidden': 96},
    'gap128': {'gap': True, 'hidden': 128},
}


def feature_names(gap):
    return FEATURES_12 + ([f + GAP_SUFFIX for f in FEATURES_12] if gap else [])


def build_all(gap, train_stride=30, smoke=False):
    from ml.dataset import load_and_create_sequences
    kw = dict(vital_features=FEATURES_12, window_minutes=90,
              label_mode='proximity', horizon_hours=12, gap_channels=gap)
    print('loading original val (stride 15)...', flush=True)
    Xva, yva, pva = load_and_create_sequences(
        physionet_dir=os.path.join(BASE, 'set-a'),
        outcomes_file=os.path.join(BASE, 'Outcomes-a.txt'), stride=15, **kw)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    _, v_idx = next(gss.split(Xva, yva, groups=pva))
    Xva, yva = Xva[v_idx], yva[v_idx]

    mp = 60 if smoke else None
    print('loading full set-a (stride %d)...' % train_stride, flush=True)
    Xa, ya, pa = load_and_create_sequences(
        physionet_dir=os.path.join(BASE, 'set-a_full', 'set-a'),
        outcomes_file=os.path.join(BASE, 'Outcomes-a.txt'),
        stride=train_stride, max_patients=mp, **kw)
    print('loading full set-b (stride %d)...' % train_stride, flush=True)
    Xb, yb, pb = load_and_create_sequences(
        physionet_dir=os.path.join(BASE, 'set-b_full', 'set-b'),
        outcomes_file=os.path.join(BASE, 'Outcomes-b.txt'),
        stride=train_stride, max_patients=mp, **kw)
    return (Xva, yva), (Xa, ya, pa), (Xb, yb, pb)


def split_holdout(pb, seed=123, test_size=0.2):
    upb = np.unique(pb)
    gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    _, ho_idx = next(gss.split(np.zeros(len(upb)), np.zeros(len(upb)), groups=upb))
    ho_patients = set(upb[ho_idx])
    return np.array([p not in ho_patients for p in pb])


def norm_fit(X_tr):
    flat = X_tr.reshape(-1, X_tr.shape[-1])
    mean = np.nanmean(flat, axis=0)
    std = np.nanstd(flat, axis=0) + 1e-6
    mean = np.where(np.isnan(mean), 0.0, mean)
    std = np.where(np.isnan(std), 1.0, std)
    return mean, std


def norm_apply(X, mean, std):
    return ((np.where(np.isnan(X), mean, X) - mean) / std).astype(np.float32)


def preds_of(model, X, device):
    from ml.train_lstm import SimpleLSTMDataset
    from torch.utils.data import DataLoader
    model.eval()
    dl = DataLoader(SimpleLSTMDataset(X, np.zeros(len(X))), batch_size=512, shuffle=False)
    pr = np.zeros(len(X))
    off = 0
    with torch.no_grad():
        for xb, _ in dl:
            b = xb.shape[0]
            pr[off:off + b] = model(xb.to(device)).cpu().numpy().ravel()
            off += b
    return pr


def eval_logits(p, y):
    pr = 1 / (1 + np.exp(-p))
    return {'auc': float(roc_auc_score(y, pr)),
            'accuracy': float(accuracy_score(y, pr > 0.5)),
            'recall': float(recall_score(y, pr > 0.5))}


def train_seed(seed, cfg_name, X_tr, y_tr, X_va, y_va, X_fho, y_fho,
               run_base, epochs=EPOCHS, smoke=False):
    from ml.train_lstm import train as quick_train, AttentionLSTMModel
    cfg = CONFIGS[cfg_name]
    n_feat = X_tr.shape[-1]
    mean, std = norm_fit(X_tr)
    X_trn, X_van, X_fhon = (norm_apply(X, mean, std) for X in (X_tr, X_va, X_fho))
    torch.manual_seed(seed)
    np.random.seed(seed)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    n_pos = int((y_tr == 1).sum())
    pw = int((y_tr == 0).sum()) / max(1, n_pos)
    print(f'  seed {seed} [{cfg_name}]: train {X_trn.shape} '
          f'dist={np.bincount(y_tr.astype(int))}', flush=True)
    model = AttentionLSTMModel(input_size=n_feat, hidden_size=cfg['hidden'],
                               dropout=0.3).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4, weight_decay=1e-4)
    best_auc, best_state, patience = 0.0, None, 0
    max_ep = 2 if smoke else epochs
    for epoch in range(max_ep):
        model, optimizer = quick_train(
            X_trn, y_tr, epochs=1, batch_size=128, learning_rate=1e-4,
            pos_weight=pw, model_class=AttentionLSTMModel, model=model,
            optimizer=optimizer, dropout=0.3, hidden_size=cfg['hidden'],
            weight_decay=1e-4)
        for pg in optimizer.param_groups:
            pg['lr'] = max(1e-4 * (0.5 ** (epoch // 6)), 1e-6)
        mets = eval_logits(preds_of(model, X_van, device), y_va)
        if mets['auc'] - best_auc > MIN_DELTA:
            best_auc, patience = mets['auc'], 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            patience += 1
        if patience >= PATIENCE:
            break
    if best_state is not None:
        model.load_state_dict(best_state)
    p_va = preds_of(model, X_van, device)
    p_fho = preds_of(model, X_fhon, device)
    va, fh = eval_logits(p_va, y_va), eval_logits(p_fho, y_fho)
    out_dir = os.path.join(run_base, f'seed{seed}')
    os.makedirs(out_dir, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(out_dir, 'model.pt'))
    np.save(os.path.join(out_dir, 'p_va.npy'), p_va)
    np.save(os.path.join(out_dir, 'p_fho.npy'), p_fho)
    m = {'config': f'{cfg_name}-causal-seed{seed}', 'features': feature_names(cfg['gap']),
         'window': 90, 'hidden': cfg['hidden'], 'causal': True,
         'train': 'set-a_full(excl orig val) + 80pct set-b' if not smoke else 'smoke subset',
         'fresh_holdout': '20pct set-b (seed 123)',
         'best_auc': best_auc, 'val_auc': va['auc'], 'val_accuracy': va['accuracy'],
         'val_recall': va['recall'], 'fresh_holdout_auc': fh['auc'],
         'fresh_holdout_accuracy': fh['accuracy'], 'fresh_holdout_recall': fh['recall'],
         'epochs_trained': epoch + 1, 'seed': seed}
    with open(os.path.join(out_dir, 'metrics.json'), 'w') as f:
        json.dump(m, f, indent=2)
    with open(os.path.join(out_dir, 'scaler.json'), 'w') as f:
        json.dump({'features': feature_names(cfg['gap']),
                   'mean': mean.tolist(), 'std': std.tolist()}, f, indent=2)
    print(f"  seed {seed}: val={va['auc']:.4f} | fresh-holdout={fh['auc']:.4f}", flush=True)
    return m


def run_ensemble(run_dir):
    """Greedy val-gated ensemble over a finished run dir (cached predictions)."""
    seeds = sorted(d for d in os.listdir(run_dir)
                   if d.startswith('seed') and os.path.exists(os.path.join(run_dir, d, 'p_va.npy')))
    Pva = {s: np.load(os.path.join(run_dir, s, 'p_va.npy')) for s in seeds}
    Pfho = {s: np.load(os.path.join(run_dir, s, 'p_fho.npy')) for s in seeds}
    yva = yfho = None
    # Labels are identical across seeds; recover counts from metrics is not
    # possible, so ensemble selection here is val-AUC greedy on cached logits
    # only when label files are unavailable. Prefer ml/compare_holdout-style
    # selection with labels when available.
    order = sorted(Pva, key=lambda s: float(np.mean(Pva[s])), reverse=False)
    print(f'seeds in {run_dir}: {seeds}', flush=True)
    print('(Run greedy selection with labels via ml/compare_holdout.py pattern; '
          'cached-prediction averaging shown below.)', flush=True)
    for s in seeds:
        m = json.load(open(os.path.join(run_dir, s, 'metrics.json')))
        print(f"  {s}: val={m['val_auc']:.4f} fresh-holdout={m['fresh_holdout_auc']:.4f}", flush=True)
    pe = np.mean([Pva[s] for s in seeds], axis=0)
    phe = np.mean([Pfho[s] for s in seeds], axis=0)
    np.save(os.path.join(run_dir, 'ensemble_all_p_va.npy'), pe)
    np.save(os.path.join(run_dir, 'ensemble_all_p_fho.npy'), phe)
    print('saved mean-of-all cached logits (evaluate with labels before promoting)', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', choices=list(CONFIGS) + ['all'], default='baseline')
    ap.add_argument('--seeds', nargs='+', type=int, default=[11])
    ap.add_argument('--smoke', action='store_true', help='tiny fast validation run')
    ap.add_argument('--ensemble', default=None, help='run greedy-ensemble report on a run dir')
    args = ap.parse_args()

    if args.ensemble:
        run_ensemble(args.ensemble)
        return

    cfgs = list(CONFIGS) if args.config == 'all' else [args.config]
    for cfg_name in cfgs:
        gap = CONFIGS[cfg_name]['gap']
        (Xva, yva), (Xa, ya, pa), (Xb, yb, pb) = build_all(
            gap, train_stride=30, smoke=args.smoke)
        from ml.dataset import load_and_create_sequences
        _, _, val_pids = load_and_create_sequences(
            physionet_dir=os.path.join(BASE, 'set-a'),
            outcomes_file=os.path.join(BASE, 'Outcomes-a.txt'),
            vital_features=FEATURES_12, window_minutes=90, stride=15,
            label_mode='proximity', horizon_hours=12,
            gap_channels=gap)
        gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
        _, v_idx = next(gss.split(np.zeros(len(val_pids)), np.zeros(len(val_pids)),
                                  groups=np.array(val_pids)))
        val_set = set(np.array(val_pids)[v_idx])
        tr_mask_b = split_holdout(np.array(pb))
        X_tr = np.concatenate([Xa[np.array([p not in val_set for p in pa])],
                               Xb[tr_mask_b]], axis=0)
        y_tr = np.concatenate([ya[np.array([p not in val_set for p in pa])],
                               yb[tr_mask_b]], axis=0)
        X_fho, y_fho = Xb[~tr_mask_b], yb[~tr_mask_b]
        print(f'TRAIN combined: {X_tr.shape} dist={np.bincount(y_tr.astype(int))}', flush=True)
        print(f'VAL: {Xva.shape} | FRESH HOLDOUT: {X_fho.shape} '
              f'dist={np.bincount(y_fho.astype(int))}', flush=True)

        tag = 'smoke' if args.smoke else datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        run_base = os.path.join('ml', 'training_runs', f'improve_{cfg_name}_{tag}')
        os.makedirs(run_base, exist_ok=True)
        results = []
        for seed in args.seeds:
            results.append((seed, train_seed(seed, cfg_name, X_tr, y_tr, Xva, yva,
                                            X_fho, y_fho, run_base, smoke=args.smoke)))
        results.sort(key=lambda r: r[1]['val_auc'], reverse=True)
        print('\nRanking:', flush=True)
        for seed, m in results:
            print(f"  seed{seed}: val={m['val_auc']:.4f} "
                  f"fresh-holdout={m['fresh_holdout_auc']:.4f}", flush=True)
        print(f'Runs: {run_base}', flush=True)


if __name__ == '__main__':
    main()
