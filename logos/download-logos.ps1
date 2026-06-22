<#
  download-logos.ps1
  Downloads a logo PNG for every subscription listed in manifest.json into this folder.

  Run it on YOUR machine (it needs internet):
      cd "c:\Users\F8DK\Desktop\payment\logos"
      powershell -ExecutionPolicy Bypass -File .\download-logos.ps1

  For each service it tries, in order:
    1. Clearbit logo API   https://logo.clearbit.com/<domain>?size=256   (clean square logo)
    2. Google favicon       https://www.google.com/s2/favicons?domain=<domain>&sz=128 (always works)

  Files are saved as <slug>.png. Re-run any time to refresh; pass -Force to overwrite existing files.
#>
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $here 'manifest.json'

if (-not (Test-Path $manifestPath)) { Write-Host "manifest.json not found next to this script." -ForegroundColor Red; exit 1 }

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ok = 0; $fav = 0; $skip = 0; $fail = 0
$headers = @{ 'User-Agent' = 'Mozilla/5.0' }

function Save-Url($url, $outFile) {
  try {
    Invoke-WebRequest -Uri $url -OutFile $outFile -Headers $headers -TimeoutSec 25 -UseBasicParsing
    if ((Get-Item $outFile).Length -gt 200) { return $true }
    Remove-Item $outFile -ErrorAction SilentlyContinue; return $false
  } catch { if (Test-Path $outFile) { Remove-Item $outFile -ErrorAction SilentlyContinue }; return $false }
}

foreach ($l in $manifest.logos) {
  $out = Join-Path $here ($l.slug + '.png')

  if (-not $l.domain) { Write-Host ("  --   {0,-22} (no brand logo - uses an emoji in the app)" -f $l.name) -ForegroundColor DarkGray; $skip++; continue }
  if ((Test-Path $out) -and -not $Force) { Write-Host ("  ==   {0,-22} already exists (use -Force to refresh)" -f $l.name) -ForegroundColor DarkGray; $skip++; continue }

  $favDomain = if ($l.favicon) { $l.favicon } else { $l.domain }

  if (Save-Url ("https://logo.clearbit.com/{0}?size=256" -f $l.domain) $out) {
    Write-Host ("  OK   {0,-22} <- clearbit ({1})" -f $l.name, $l.domain) -ForegroundColor Green; $ok++
  }
  elseif (Save-Url ("https://www.google.com/s2/favicons?domain={0}&sz=128" -f $favDomain) $out) {
    Write-Host ("  fav  {0,-22} <- favicon  ({1})" -f $l.name, $favDomain) -ForegroundColor Yellow; $fav++
  }
  else {
    Write-Host ("  XX   {0,-22} FAILED - grab it manually from {1}" -f $l.name, $l.brandfetch) -ForegroundColor Red; $fail++
  }
}

Write-Host ""
Write-Host ("Done. clearbit: {0}   favicon: {1}   skipped: {2}   failed: {3}" -f $ok, $fav, $skip, $fail) -ForegroundColor Cyan
Write-Host "To use these inside the app offline, set  SUB_LOGO_LOCAL=true  near the top of the logo block in index.html." -ForegroundColor Cyan
