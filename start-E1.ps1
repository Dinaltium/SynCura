# One-click E1 launcher: causal baseline (seeds 11-13).
# - Kills stray improve_results processes (duplicate GPU jobs)
# - Clears a stale campaign lock
# - Runs training in THIS window (visible progress) + mirrors to log file
# Usage: right-click -> Run with PowerShell, or:  powershell -NoExit -File .\start-E1.ps1
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:PYTHONIOENCODING = 'utf-8'

Write-Host '[E1] Checking for stray training processes...'
Get-Process python -ErrorAction SilentlyContinue | ForEach-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
    if ($cmd -like '*improve_results*') {
        Write-Host "[E1] Stopping stray PID $($_.Id)"
        Stop-Process -Id $_.Id -Force
    }
}
$lock = 'ml\training_runs\.campaign.lock'
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host '[E1] Cleared stale lock' }

$log = 'ml\training_runs\campaign_E1.log'
Write-Host "[E1] Starting baseline seeds 11-13. Live below + log: $log"
.\.venv\Scripts\python.exe -u -m ml.improve_results --config baseline --seeds 11 12 13 2>&1 |
    Tee-Object -FilePath $log
Write-Host '[E1] DONE (or stopped). Send the seed lines to your assistant for gating.'
