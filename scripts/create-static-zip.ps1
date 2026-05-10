$ErrorActionPreference = 'Stop'

$root       = Resolve-Path (Join-Path $PSScriptRoot '..')
$stageDir   = Join-Path $root '.deploy-static'
$timestamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
$zipLatest  = Join-Path $root 'erp-logistics-static.zip'
$zipVersioned = Join-Path $root ("erp-logistics-static.$timestamp.zip")

$envLocal   = Join-Path $root '.env.local'
$envBak     = Join-Path $root '.env.local.bak'
$envLocalExisted = Test-Path $envLocal

Push-Location $root
try {
  # ── Temporarily hide .env.local so .env.production takes effect ──────────
  if ($envLocalExisted) {
    Write-Host "Hiding .env.local to ensure .env.production is used..."
    Rename-Item -LiteralPath $envLocal -NewName '.env.local.bak' -Force
  }

  Write-Host "Building frontend (production)..."
  if (Test-Path (Join-Path $root 'out')) {
    Remove-Item -LiteralPath (Join-Path $root 'out') -Recurse -Force
  }
  npm run build

  if (-not (Test-Path (Join-Path $root 'out'))) {
    throw "Static export folder 'out' was not created. Build may have failed."
  }

  # ── Stage files ───────────────────────────────────────────────────────────
  if (Test-Path $stageDir) {
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $stageDir | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $root 'out') | Copy-Item -Destination $stageDir -Recurse -Force

  # ── Zip ───────────────────────────────────────────────────────────────────
  if (Test-Path $zipLatest)    { Remove-Item -LiteralPath $zipLatest    -Force }
  if (Test-Path $zipVersioned) { Remove-Item -LiteralPath $zipVersioned -Force }

  Get-ChildItem -LiteralPath $stageDir | Compress-Archive -DestinationPath $zipLatest    -Force
  Get-ChildItem -LiteralPath $stageDir | Compress-Archive -DestinationPath $zipVersioned -Force

  Write-Host ""
  Write-Host "Created:"
  Write-Host " - $zipLatest"
  Write-Host " - $zipVersioned"
}
finally {
  # ── Always restore .env.local ─────────────────────────────────────────────
  if ($envLocalExisted -and (Test-Path $envBak)) {
    Rename-Item -LiteralPath $envBak -NewName '.env.local' -Force
    Write-Host "Restored .env.local"
  }
  Pop-Location
}
