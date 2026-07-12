param(
  [string]$OutputPath = "dist/extension"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))
$rootPrefix = [System.IO.Path]::GetFullPath([string]$root).TrimEnd("\") + "\"
if (-not $out.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to write outside workspace: $out"
}

Push-Location $root
try {
  $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
  & $npm run build:studio
  if ($LASTEXITCODE -ne 0) {
    throw "Studio build failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

if (Test-Path $out) {
  Remove-Item -LiteralPath $out -Recurse -Force
}

New-Item -ItemType Directory -Path $out | Out-Null

Copy-Item -LiteralPath (Join-Path $root "manifest.json") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "src") -Destination $out -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets") -Destination $out -Recurse

Write-Host "Chrome-loadable extension built at: $out"
