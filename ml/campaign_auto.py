# -*- coding: utf-8 -*-
"""Autonomous results campaign: E1 -> E2 -> ensemble -> E4 until holdout >= 0.85.

Runs detached (no user input). Waits for any in-flight campaign (lock file),
then executes phases in order, stopping early on victory:

  VICTORY = fresh-holdout AUC >= 0.85 with val AUC >= 0.80 (seed or candidate)

Phases:
  P1  baseline seeds 12,13 (seed 11 picked up by scan wherever it finished)
  P2  gap seeds 21,22,23
  P3  gap128 seeds 24,25 (only if best gap val >= best baseline val - 0.002)
  P4  greedy ensemble over all improve_* dirs -> candidate_ensemble.json
  P5  ablations, 1 seed each (only if best holdout < 0.85):
      horizon6, horizon24, window120, dropout0.2, dropout0.4, lr3e-4
  P6  final greedy ensemble over everything

Writes AUTOCAMPAIGN_RESULTS.md at the end no matter what.

Launch detached:
  Start-Process .\\.venv\\Scripts\\python.exe -ArgumentList '-u -m ml.campaign_auto' ...
"""
import glob
import json
import os
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_HO = 0.85
MIN_VAL = 0.80
LOCK = os.path.join(REPO, 'ml', 'training_runs', '.campaign.lock')
PHASE_TIMEOUT = 6 * 3600


def log(msg):
    print(f'[AUTO {time.strftime("%H:%M:%S")}] {msg}', flush=True)


def lock_holder_alive():
    try:
        with open(LOCK) as f:
            pid = int(f.read().strip())
    except (ValueError, OSError):
        return False
    try:
        import subprocess
        out = subprocess.run(['tasklist', '/FI', f'PID eq {pid}', '/FO', 'CSV'],
                             capture_output=True, text=True).stdout
        return out.count(str(pid)) > 0
    except OSError:
        return True  # benefit of the doubt: keep waiting


def wait_for_lock():
    while os.path.exists(LOCK):
        if not lock_holder_alive():
            log('stale lock found (holder dead); clearing')
            try:
                os.remove(LOCK)
            except OSError:
                pass
            return
        log('waiting for in-flight campaign (lock held)...')
        time.sleep(60)


def run_phase(args, timeout=PHASE_TIMEOUT):
    log('RUN: python -u -m ml.improve_results ' + ' '.join(args))
    try:
        subprocess.run([sys.executable, '-u', '-m', 'ml.improve_results'] + args,
                       cwd=REPO, timeout=timeout)
    except subprocess.TimeoutExpired:
        log('phase timed out; continuing with whatever finished')


def scan():
    """Collect all finished seeds across improve_* run dirs."""
    out = []
    for mpath in sorted(glob.glob(os.path.join(REPO, 'ml', 'training_runs', 'improve_*',
                                               'seed*', 'metrics.json'))):
        try:
            m = json.load(open(mpath))
            out.append({'key': os.path.relpath(os.path.dirname(mpath), REPO),
                        'val': m['val_auc'], 'ho': m['fresh_holdout_auc'],
                        'cfg': m.get('config', '?')})
        except Exception:
            continue
    return out


def best_of(rows):
    if not rows:
        return None, None
    by_val = max(rows, key=lambda r: r['val'])
    by_ho = max(rows, key=lambda r: r['ho'])
    return by_val, by_ho


def victory(rows):
    for r in rows:
        if r['ho'] >= TARGET_HO and r['val'] >= MIN_VAL:
            return r
    for cpath in sorted(glob.glob(os.path.join(REPO, 'ml', 'training_runs', 'improve_*',
                                               'candidate_ensemble.json'))):
        try:
            c = json.load(open(cpath))
            if c['fresh_holdout_auc'] >= TARGET_HO and c['val_auc'] >= MIN_VAL:
                return {'key': 'CANDIDATE ' + os.path.relpath(cpath, REPO),
                        'val': c['val_auc'], 'ho': c['fresh_holdout_auc'],
                        'cfg': str(c['members'])}
        except Exception:
            continue
    return None


def report(rows, verdict):
    lines = ['# Autonomous campaign results', '',
             f'Target: fresh-holdout >= {TARGET_HO} with val >= {MIN_VAL}', '',
             '| run/seed | config | val | holdout |', '|---|---|---|---|']
    for r in sorted(rows, key=lambda r: -r['ho']):
        lines.append(f"| {r['key']} | {r['cfg']} | {r['val']:.4f} | {r['ho']:.4f} |")
    lines += ['', f'**Verdict: {verdict}**', '']
    with open(os.path.join(REPO, 'ml', 'training_runs', 'AUTOCAMPAIGN_RESULTS.md'), 'w') as f:
        f.write('\n'.join(lines))
    log('wrote AUTOCAMPAIGN_RESULTS.md')


def main():
    wait_for_lock()
    log(f'TARGET: fresh-holdout >= {TARGET_HO} (val >= {MIN_VAL})')

    # P1: finish the baseline family
    run_phase(['--config', 'baseline', '--seeds', '12', '13', '--tag', 'E1'])
    rows = scan()
    v = victory(rows)
    if v:
        report(rows, f"VICTORY after P1: {v['key']} val={v['val']:.4f} ho={v['ho']:.4f}")
        return

    # P2: gap channels
    run_phase(['--config', 'gap', '--seeds', '21', '22', '23', '--tag', 'E2a'])
    rows = scan()
    v = victory(rows)
    if v:
        report(rows, f"VICTORY after P2: {v['key']} val={v['val']:.4f} ho={v['ho']:.4f}")
        return

    base_val = max((r['val'] for r in rows if r['cfg'].startswith('baseline')), default=0)
    gap_val = max((r['val'] for r in rows if r['cfg'].startswith('gap') and 'gap128' not in r['cfg']), default=0)

    # P3: width stacks with gaps?
    if gap_val >= base_val - 0.002:
        run_phase(['--config', 'gap128', '--seeds', '24', '25', '--tag', 'E2b'])
        rows = scan()
        v = victory(rows)
        if v:
            report(rows, f"VICTORY after P3: {v['key']} val={v['val']:.4f} ho={v['ho']:.4f}")
            return
    else:
        log(f'skip P3: gap val {gap_val:.4f} < baseline val {base_val:.4f} - 0.002')

    # P4: greedy ensemble over everything so far
    dirs = sorted(glob.glob(os.path.join(REPO, 'ml', 'training_runs', 'improve_*')))
    dirs = [d for d in dirs if os.path.isdir(d)]
    if dirs:
        run_phase(['--ensemble'] + dirs)
    rows = scan()
    v = victory(rows)
    if v:
        report(rows, f"VICTORY after P4: {v['key']} val={v['val']:.4f} ho={v['ho']:.4f}")
        return

    # P5: ablations, one seed each
    abl = [('horizon6', ['--horizon', '6', '--seeds', '31']),
           ('horizon24', ['--horizon', '24', '--seeds', '32']),
           ('window120', ['--window', '120', '--seeds', '33']),
           ('dropout02', ['--dropout', '0.2', '--seeds', '34']),
           ('dropout04', ['--dropout', '0.4', '--seeds', '35']),
           ('lr3e-4', ['--lr', '3e-4', '--seeds', '36'])]
    for tag, extra in abl:
        run_phase(['--config', 'gap', '--tag', 'E4' + tag] + extra)
        rows = scan()
        v = victory(rows)
        if v:
            report(rows, f"VICTORY after P5/{tag}: {v['key']} val={v['val']:.4f} ho={v['ho']:.4f}")
            return

    # P6: final ensemble over everything
    dirs = sorted(glob.glob(os.path.join(REPO, 'ml', 'training_runs', 'improve_*')))
    dirs = [d for d in dirs if os.path.isdir(d)]
    if dirs:
        run_phase(['--ensemble'] + dirs)
    rows = scan()
    v = victory(rows)
    bv, bh = best_of(rows)
    if v:
        report(rows, f"VICTORY after P6: {v['key']} val={v['val']:.4f} ho={v['ho']:.4f}")
    else:
        extra = ''
        if bv:
            extra = f' Best val: {bv["key"]} {bv["val"]:.4f}. Best holdout: {bh["key"]} {bh["ho"]:.4f}.'
        report(rows, 'TARGET NOT REACHED.' + extra + ' See ml/RESULTS_PLAN.md E4/GRU-D fallback.')


if __name__ == '__main__':
    main()
