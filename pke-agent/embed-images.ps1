# embed-images.ps1 - Embed local images as base64 into PKE
# Usage: powershell -ExecutionPolicy Bypass -File embed-images.ps1

param()
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$InputJson = Join-Path $ScriptDir "nhan-halo-5ly-d-vvs1-gia.json"
$OutputPke = Join-Path $ScriptDir "nhan-halo-5ly-d-vvs1-gia-FINAL.pke"
$TempJson  = Join-Path $ScriptDir "_temp_embed.json"
$ImgDir    = Join-Path $ScriptDir "images"

# 5 images: token -> description
$Names = "nhan-studio.jpg","nhan-hop-chj.jpg","chung-chi-gia.jpg","khach-deo-nhan.jpg","chat-khach-hang.jpg"
$Descs = "Nhan chup tren nen guong (studio)","Nhan trong hop xanh CHJ","Chung chi GIA","Tay deo nhan + tui CHJ","Screenshot chat khach hang"

Write-Host ""
Write-Host "=== embed-images.ps1 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Folder anh: $ImgDir"
Write-Host ""

$missing = 0
for ($i = 0; $i -lt $Names.Length; $i++) {
    $f = Join-Path $ImgDir $Names[$i]
    if (Test-Path $f) {
        $kb = [Math]::Round((Get-Item $f).Length / 1024, 1)
        Write-Host "  [OK]      $($Names[$i]) ($kb KB)" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $($Names[$i]) <- $($Descs[$i])" -ForegroundColor Red
        $missing++
    }
}

Write-Host ""

if ($missing -gt 0) {
    Write-Host "DUNG LAI: Con $missing anh chua luu." -ForegroundColor Red
    Write-Host ""
    Write-Host "Luu cac anh vao folder:" -ForegroundColor Yellow
    Write-Host "  $ImgDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ten file phai dung y chang:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $Names.Length; $i++) {
        $f = Join-Path $ImgDir $Names[$i]
        if (-not (Test-Path $f)) {
            Write-Host "  $($Names[$i])  <-  $($Descs[$i])" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    exit 1
}

Write-Host "Tat ca 5 anh da co. Bat dau nhung..." -ForegroundColor Green
Write-Host ""

# Load JSON as text
$json = [System.IO.File]::ReadAllText($InputJson, [System.Text.Encoding]::UTF8)

# Embed each image
for ($i = 0; $i -lt $Names.Length; $i++) {
    $f     = Join-Path $ImgDir $Names[$i]
    $bytes = [System.IO.File]::ReadAllBytes($f)
    $b64   = [Convert]::ToBase64String($bytes)
    $ext   = [System.IO.Path]::GetExtension($Names[$i]).ToLower()
    $mime  = if ($ext -eq ".png") { "image/png" } elseif ($ext -eq ".webp") { "image/webp" } else { "image/jpeg" }
    $uri   = "data:$mime;base64,$b64"
    $token = "IMG:$($Names[$i])"
    $json  = $json.Replace($token, $uri)
    $origKb = [Math]::Round($bytes.Length / 1024, 1)
    $b64Kb  = [Math]::Round($b64.Length / 1024, 1)
    Write-Host "  Embedded $($Names[$i]): ${origKb}KB -> base64 ${b64Kb}KB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Ghi temp JSON..." -ForegroundColor Yellow
[System.IO.File]::WriteAllText($TempJson, $json, [System.Text.Encoding]::UTF8)

Write-Host "Chay build-pke.ps1..." -ForegroundColor Yellow
Write-Host ""
$buildScript = Join-Path $ScriptDir "build-pke.ps1"
& powershell -ExecutionPolicy Bypass -File $buildScript -InputFile $TempJson -OutputFile $OutputPke

if (Test-Path $TempJson) { Remove-Item $TempJson -Force }

Write-Host ""
if (Test-Path $OutputPke) {
    $sz = [Math]::Round((Get-Item $OutputPke).Length / 1024, 1)
    Write-Host "=== HOAN THANH ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "  PKE : nhan-halo-5ly-d-vvs1-gia-FINAL.pke ($sz KB)" -ForegroundColor Cyan
    Write-Host "  Anh : Da nhung base64 (khong can host anh rieng)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Import: Pancake.vn > Pages > Import > chon file PKE tren" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "LOI: Khong tim thay file PKE output." -ForegroundColor Red
    exit 1
}
