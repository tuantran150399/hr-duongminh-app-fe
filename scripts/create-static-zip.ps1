$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$stageDir = Join-Path $root '.deploy-static'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$zipLatest = Join-Path $root 'erp-logistics-static.zip'
$zipVersioned = Join-Path $root ("erp-logistics-static.$timestamp.zip")

Push-Location $root
try {
  Write-Host "Building frontend..."
  npm run clean
  npm run build

  if (-not (Test-Path (Join-Path $root 'out'))) {
    throw "Static export folder 'out' was not created."
  }

  if (Test-Path $stageDir) {
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $stageDir | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $root 'out') | Copy-Item -Destination $stageDir -Recurse -Force

  if (Test-Path $zipLatest) {
    Remove-Item -LiteralPath $zipLatest -Force
  }
  if (Test-Path $zipVersioned) {
    Remove-Item -LiteralPath $zipVersioned -Force
  }

  Get-ChildItem -LiteralPath $stageDir | Compress-Archive -DestinationPath $zipLatest -Force
  Get-ChildItem -LiteralPath $stageDir | Compress-Archive -DestinationPath $zipVersioned -Force

  Write-Host "Created:"
  Write-Host " - $zipLatest"
  Write-Host " - $zipVersioned"
}
finally {
  Pop-Location
}
