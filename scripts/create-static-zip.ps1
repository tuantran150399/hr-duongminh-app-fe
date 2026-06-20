$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$stageDir = Join-Path $root '.deploy-static'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$zipLatest = Join-Path $root 'erp-logistics-static.zip'
$zipVersioned = Join-Path $root ("erp-logistics-static.$timestamp.zip")

$envLocal = Join-Path $root '.env.local'
$envBak = Join-Path $root '.env.local.bak'
$envProd = Join-Path $root '.env.production'
$envLocalExisted = Test-Path $envLocal
$originalApiUrl = $env:NEXT_PUBLIC_API_URL

function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    throw "Required env file not found: $FilePath"
  }

  $match = Select-String -Path $FilePath -Pattern "^$Key=(.*)$" | Select-Object -First 1
  if (-not $match) {
    throw "Missing $Key in $FilePath"
  }

  return $match.Matches[0].Groups[1].Value.Trim()
}

Push-Location $root
try {
  if ($envLocalExisted) {
    Write-Host "Hiding .env.local so production config wins..."
    Rename-Item -LiteralPath $envLocal -NewName '.env.local.bak' -Force
  }

  $prodApiUrl = Get-EnvValue -FilePath $envProd -Key 'NEXT_PUBLIC_API_URL'
  $env:NEXT_PUBLIC_API_URL = $prodApiUrl
  Write-Host "Using NEXT_PUBLIC_API_URL=$prodApiUrl"

  Write-Host "Building frontend for production..."
  if (Test-Path (Join-Path $root 'out')) {
    Remove-Item -LiteralPath (Join-Path $root 'out') -Recurse -Force
  }
  npm run build

  if (-not (Test-Path (Join-Path $root 'out'))) {
    throw "Static export folder 'out' was not created. Build may have failed."
  }

  if (Test-Path $stageDir) {
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $stageDir | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $root 'out') | Copy-Item -Destination $stageDir -Recurse -Force

  if (Test-Path $zipLatest) { Remove-Item -LiteralPath $zipLatest -Force }
  if (Test-Path $zipVersioned) { Remove-Item -LiteralPath $zipVersioned -Force }

  tar.exe -a -c -f $zipLatest -C $stageDir .
  tar.exe -a -c -f $zipVersioned -C $stageDir .

  Write-Host ''
  Write-Host 'Created:'
  Write-Host " - $zipLatest"
  Write-Host " - $zipVersioned"
}
finally {
  if ($null -eq $originalApiUrl) {
    Remove-Item Env:NEXT_PUBLIC_API_URL -ErrorAction SilentlyContinue
  } else {
    $env:NEXT_PUBLIC_API_URL = $originalApiUrl
  }

  if ($envLocalExisted -and (Test-Path $envBak)) {
    Rename-Item -LiteralPath $envBak -NewName '.env.local' -Force
    Write-Host 'Restored .env.local'
  }

  Pop-Location
}
