<#  Antigravity hesap gecisi - komut satiri / skill.
    Depo: D:\proje\AgAccountManager\bin\Accounts  (GUI ile ortak)

    powershell -ExecutionPolicy Bypass -File switch.ps1 -List
    powershell -ExecutionPolicy Bypass -File switch.ps1 -CaptureCurrent
    powershell -ExecutionPolicy Bypass -File switch.ps1 -To ornek@gmail.com [-NoRelaunch]
    powershell -ExecutionPolicy Bypass -File switch.ps1 -Logout
#>
param(
  [switch] $List,
  [switch] $CaptureCurrent,
  [string] $To,
  [switch] $Logout,
  [switch] $NoRelaunch,
  [string] $Store
)
$ErrorActionPreference = 'Stop'

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if     ($Store)                                                  { $storeDir = $Store }
elseif (Test-Path 'D:\proje\AgAccountManager\bin\Accounts')      { $storeDir = 'D:\proje\AgAccountManager\bin\Accounts' }
elseif (Test-Path (Join-Path $appDir 'bin\Accounts'))            { $storeDir = Join-Path $appDir 'bin\Accounts' }
else                                                             { $storeDir = Join-Path $appDir 'Accounts' }
New-Item -ItemType Directory -Force -Path $storeDir | Out-Null
$regPath = Join-Path $storeDir 'accounts.json'

$gem = Join-Path $env:USERPROFILE '.gemini'
$agy = Join-Path $gem 'antigravity'
$web = Join-Path $env:APPDATA 'Antigravity'

function Get-Slug([string] $s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return 'bilinmeyen' }
  ($s -replace '[^A-Za-z0-9._@-]', '_')
}
function Get-Stamp { Get-Date -Format 'yyyy-MM-dd_HHmmss' }

function Get-ActiveEmail {
  $f = Join-Path $gem 'google_accounts.json'
  if (Test-Path $f) { try { (Get-Content -Raw $f | ConvertFrom-Json).active } catch { $null } }
}
function Get-Reg {
  if (Test-Path $regPath) { try { @(Get-Content -Raw $regPath | ConvertFrom-Json) } catch { @() } } else { @() }
}
function Set-Reg($accs) { ($accs | ConvertTo-Json -Depth 6) | Set-Content -Path $regPath -Encoding UTF8 }
function Add-Reg($acc) {
  $accs = @(Get-Reg | Where-Object { $_.Email -ne $acc.Email -and $_.Name -ne $acc.Name })
  $accs += $acc
  Set-Reg $accs
}
function Test-AgRunning { [bool](Get-Process -Name 'Antigravity', 'antigravity-agent' -ErrorAction SilentlyContinue) }
function Stop-Ag {
  Get-Process -Name 'Antigravity', 'antigravity-agent' -ErrorAction SilentlyContinue |
    ForEach-Object { try { $_.Kill($true); $_.WaitForExit(5000) } catch { } }
  Start-Sleep -Milliseconds 800
}
function Start-Ag {
  $c = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\Antigravity\Antigravity.exe'),
    'C:\Program Files\Antigravity\Antigravity.exe'
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($c) { Start-Process $c } else { try { Start-Process 'antigravity' } catch { } }
}

function Get-IdentityItems {
  @(
    (Join-Path $gem 'oauth_creds.json'),
    (Join-Path $gem 'google_accounts.json'),
    (Join-Path $gem 'installation_id'),
    (Join-Path $web 'Network\Cookies'),
    (Join-Path $web 'Network\Cookies-journal'),
    (Join-Path $web 'Network\Network Persistent State'),
    (Join-Path $web 'Network\Trust Tokens'),
    (Join-Path $web 'Network\Trust Tokens-journal'),
    (Join-Path $web 'Local Storage'),
    (Join-Path $web 'Session Storage'),
    (Join-Path $web 'SharedStorage'),
    (Join-Path $web 'SharedStorage-wal'),
    (Join-Path $web 'Shared Dictionary'),
    (Join-Path $web 'DIPS'),
    (Join-Path $web 'blob_storage'),
    (Join-Path $web 'Preferences')
  )
}
function Get-VolatileItems {
  $a = @('Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache') |
    ForEach-Object { Join-Path $web $_ }
  $a + @(
    (Join-Path $web 'Network\Network Persistent State'),
    (Join-Path $agy 'agyhub_summaries_proto.pb'),
    (Join-Path $agy 'implicit')
  )
}

function Move-Into([string[]] $items, [string] $dest, [bool] $copyBack) {
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $n = 0
  foreach ($it in $items) {
    if (-not (Test-Path $it)) { continue }
    $leaf = Split-Path $it -Leaf
    $par  = Split-Path (Split-Path $it -Parent) -Leaf
    $tgt  = Join-Path $dest ($par + '__' + $leaf)
    try {
      Copy-Item -LiteralPath $it -Destination $tgt -Recurse -Force
      if (-not $copyBack) { Remove-Item -LiteralPath $it -Recurse -Force }
      $n++
    } catch { Write-Warning "  ! $leaf : $_" }
  }
  $n
}
function Remove-Each([string[]] $items) {
  foreach ($it in $items) { if (Test-Path $it) { try { Remove-Item -LiteralPath $it -Recurse -Force } catch { } } }
}
function Copy-Back([string] $snap) {
  $n = 0
  Get-ChildItem $snap -Force | Where-Object { $_.Name -notmatch '^_' } | ForEach-Object {
    $parts = $_.Name -split '__', 2
    if ($parts.Count -eq 2) {
      switch ($parts[0]) {
        'Antigravity' { $base = $web }
        'Network'     { $base = Join-Path $web 'Network' }
        default       { $base = $gem }
      }
      New-Item -ItemType Directory -Force -Path $base | Out-Null
      Copy-Item $_.FullName (Join-Path $base $parts[1]) -Recurse -Force
      $n++
    }
  }
  $n
}
function New-SnapDir([string] $slug) { Join-Path $storeDir (Join-Path $slug (Get-Stamp)) }

# ---------------- komutlar ----------------
if ($List) {
  $accs = Get-Reg
  if (-not $accs) { 'Kayitli hesap yok.'; return }
  $act = Get-ActiveEmail
  foreach ($x in $accs) {
    $flag = if ($x.Email -eq $act) { ' [AKTIF]' } else { '' }
    '{0,-24} <{1}>{2}  son:{3}' -f $x.Name, $x.Email, $flag, $x.LastSaved
  }
  return
}

if ($CaptureCurrent) {
  $e = Get-ActiveEmail
  if (-not $e) { 'Aktif oturum yok. Once Antigravity''e giris yap.'; return }
  if (Test-AgRunning) { Stop-Ag }
  $d = New-SnapDir (Get-Slug $e)
  $n = Move-Into (Get-IdentityItems) $d $true
  Add-Reg ([pscustomobject]@{ Name = $e; Email = $e; Tier = ''; LastSaved = (Get-Date -Format 'yyyy-MM-dd HH:mm'); SnapshotDir = $d })
  "Yakalandi: $e  ($n oge)  ->  $d"
  return
}

if ($Logout) {
  if (Test-AgRunning) { Stop-Ag }
  $e = Get-ActiveEmail
  $d = New-SnapDir (Get-Slug $e)
  $n1 = Move-Into (Get-IdentityItems) $d $false
  $n2 = Move-Into (Get-VolatileItems) (Join-Path $d '_volatile') $false
  '{ "active": "", "old": [] }' | Set-Content (Join-Path $gem 'google_accounts.json') -Encoding UTF8
  if ($e) { Add-Reg ([pscustomobject]@{ Name = $e; Email = $e; Tier = ''; LastSaved = (Get-Date -Format 'yyyy-MM-dd HH:mm'); SnapshotDir = $d }) }
  "Cikis + temizle: kimlik/oturum=$n1  gecici=$n2"
  "Arsiv: $d"
  "Antigravity acilista YENI cookie/session yazacak."
  return
}

if ($To) {
  $acc = Get-Reg | Where-Object { $_.Email -eq $To -or $_.Name -eq $To } | Select-Object -First 1
  if (-not $acc) { "Hesap bulunamadi: $To  (once -CaptureCurrent ile kaydet)"; return }
  if (Test-AgRunning) { 'Antigravity kapatiliyor...'; Stop-Ag }

  $cur = Get-ActiveEmail
  if ($cur -and $cur -ne $acc.Email) {
    $cd = New-SnapDir (Get-Slug $cur)
    [void](Move-Into (Get-IdentityItems) $cd $false)
    Add-Reg ([pscustomobject]@{ Name = $cur; Email = $cur; Tier = ''; LastSaved = (Get-Date -Format 'yyyy-MM-dd HH:mm'); SnapshotDir = $cd })
  }
  else {
    [void](Move-Into (Get-IdentityItems) (New-SnapDir (Get-Slug $cur)) $false)
  }

  $snap = $null
  if ($acc.SnapshotDir -and (Test-Path $acc.SnapshotDir)) { $snap = $acc.SnapshotDir }
  else {
    $bd = Join-Path $storeDir (Get-Slug $acc.Email)
    if (Test-Path $bd) { $snap = (Get-ChildItem $bd -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName }
  }
  if (-not $snap) { "'$($acc.Email)' icin arsiv yok."; return }

  Remove-Each (Get-VolatileItems)
  $n = Copy-Back $snap
  "'$($acc.Email)' cookie/session yazildi ($n oge). Limit/kullanim izleri sifirlandi."
  if (-not $NoRelaunch) { Start-Sleep -Milliseconds 800; Start-Ag; 'Antigravity yeniden baslatildi.' }
  return
}

@'
Antigravity hesap gecisi:
  -List             kayitli hesaplar
  -CaptureCurrent   aktif oturumu kaydet
  -To <email>       o hesaba gec (kapat -> yaz -> limit sifirla -> yeniden baslat)
  -To <email> -NoRelaunch
  -Logout           cikis + cookie/session temizle
'@
