# ============================================================
# build-pke.ps1 — Sales Page JSON → Pancake .pke converter
# ============================================================
# Cách dùng:
#   powershell -ExecutionPolicy Bypass -File build-pke.ps1 -InputFile template.json
#   powershell -ExecutionPolicy Bypass -File build-pke.ps1 -InputFile my-page.json -OutputFile output.pke
#
# Input: JSON file với cấu trúc mô tả trong template.json
# Output: .pke file (Base64 + MessagePack) import được vào Pancake.vn
# ============================================================

param(
    [Parameter(Mandatory=$true)][string]$InputFile,
    [string]$OutputFile = ""
)

Set-StrictMode -Off
$ErrorActionPreference = 'Stop'

# ============================================================
# MSGPACK ENCODER
# ============================================================

function Write-MsgMapHeader {
    param($buf, [int]$len)
    if ($len -le 15)       { $buf.Add([byte](0x80 -bor $len)) }
    elseif ($len -le 65535){ $buf.Add([byte]0xDE); $buf.Add([byte](($len -shr 8) -band 0xFF)); $buf.Add([byte]($len -band 0xFF)) }
    else                   { $buf.Add([byte]0xDF); $buf.Add([byte](($len -shr 24) -band 0xFF)); $buf.Add([byte](($len -shr 16) -band 0xFF)); $buf.Add([byte](($len -shr 8) -band 0xFF)); $buf.Add([byte]($len -band 0xFF)) }
}

function Write-MsgArrHeader {
    param($buf, [int]$len)
    if ($len -le 15)       { $buf.Add([byte](0x90 -bor $len)) }
    elseif ($len -le 65535){ $buf.Add([byte]0xDC); $buf.Add([byte](($len -shr 8) -band 0xFF)); $buf.Add([byte]($len -band 0xFF)) }
    else                   { $buf.Add([byte]0xDD); $buf.Add([byte](($len -shr 24) -band 0xFF)); $buf.Add([byte](($len -shr 16) -band 0xFF)); $buf.Add([byte](($len -shr 8) -band 0xFF)); $buf.Add([byte]($len -band 0xFF)) }
}

function Write-MsgStr {
    param($buf, [string]$s)
    $sb = [System.Text.Encoding]::UTF8.GetBytes($s)
    $len = $sb.Length
    if ($len -le 31)       { $buf.Add([byte](0xA0 -bor $len)) }
    elseif ($len -le 255)  { $buf.Add([byte]0xD9); $buf.Add([byte]$len) }
    elseif ($len -le 65535){ $buf.Add([byte]0xDA); $buf.Add([byte](($len -shr 8) -band 0xFF)); $buf.Add([byte]($len -band 0xFF)) }
    else                   { $buf.Add([byte]0xDB); $buf.Add([byte](($len -shr 24) -band 0xFF)); $buf.Add([byte](($len -shr 16) -band 0xFF)); $buf.Add([byte](($len -shr 8) -band 0xFF)); $buf.Add([byte]($len -band 0xFF)) }
    foreach ($b in $sb) { $buf.Add($b) }
}

function Write-MsgValue {
    param($buf, $val)

    if ($null -eq $val) { $buf.Add([byte]0xC0); return }

    # Bool BEFORE numeric (bool is also numeric in PS)
    if ($val -is [bool]) {
        if ($val) { $buf.Add([byte]0xC3) } else { $buf.Add([byte]0xC2) }
        return
    }

    # Signed integers
    if ($val -is [int] -or $val -is [long] -or $val -is [int16] -or $val -is [sbyte]) {
        $v = [long]$val
        if ($v -ge 0 -and $v -le 127) { $buf.Add([byte]$v); return }
        if ($v -ge -32 -and $v -lt 0) { $buf.Add([byte](256 + [int]$v)); return }
        if ($v -ge -128 -and $v -le 127) {
            $buf.Add([byte]0xD0); $buf.Add([byte]((256 + [int]($v -band 0xFF)) -band 0xFF)); return
        }
        if ($v -ge -32768 -and $v -le 32767) {
            $buf.Add([byte]0xD1); $buf.Add([byte](($v -shr 8) -band 0xFF)); $buf.Add([byte]($v -band 0xFF)); return
        }
        if ($v -ge -2147483648 -and $v -le 2147483647) {
            $buf.Add([byte]0xD2)
            $buf.Add([byte](($v -shr 24) -band 0xFF)); $buf.Add([byte](($v -shr 16) -band 0xFF))
            $buf.Add([byte](($v -shr 8) -band 0xFF)); $buf.Add([byte]($v -band 0xFF)); return
        }
        $buf.Add([byte]0xD3)
        for ($sh = 56; $sh -ge 0; $sh -= 8) { $buf.Add([byte](($v -shr $sh) -band 0xFF)) }
        return
    }

    # Unsigned integers
    if ($val -is [uint32] -or $val -is [uint64] -or $val -is [uint16] -or $val -is [byte]) {
        $v = [uint64]$val
        if ($v -le 127)    { $buf.Add([byte]$v); return }
        if ($v -le 255)    { $buf.Add([byte]0xCC); $buf.Add([byte]$v); return }
        if ($v -le 65535)  { $buf.Add([byte]0xCD); $buf.Add([byte](($v -shr 8) -band 0xFF)); $buf.Add([byte]($v -band 0xFF)); return }
        if ($v -le 4294967295) {
            $buf.Add([byte]0xCE)
            $buf.Add([byte](($v -shr 24) -band 0xFF)); $buf.Add([byte](($v -shr 16) -band 0xFF))
            $buf.Add([byte](($v -shr 8) -band 0xFF)); $buf.Add([byte]($v -band 0xFF)); return
        }
        $buf.Add([byte]0xCF)
        for ($sh = 56; $sh -ge 0; $sh -= 8) { $buf.Add([byte](($v -shr $sh) -band 0xFF)) }
        return
    }

    # Float/double
    if ($val -is [double] -or $val -is [float] -or $val -is [decimal]) {
        $fb = [BitConverter]::GetBytes([double]$val)
        if ([BitConverter]::IsLittleEndian) { [Array]::Reverse($fb) }
        $buf.Add([byte]0xCB)
        foreach ($b in $fb) { $buf.Add($b) }
        return
    }

    # String
    if ($val -is [string]) { Write-MsgStr $buf $val; return }

    # Array (Object[], List<>) — but not byte[]
    if (($val -is [System.Array] -and $val -isnot [byte[]]) -or
        ($val -is [System.Collections.IList] -and $val -isnot [string] -and $val -isnot [byte[]])) {
        $arr = @($val)
        Write-MsgArrHeader $buf $arr.Count
        foreach ($item in $arr) { Write-MsgValue $buf $item }
        return
    }

    # OrderedDictionary (from [ordered]@{}) — preserves key order
    if ($val -is [System.Collections.Specialized.OrderedDictionary]) {
        $keys = @($val.Keys)
        Write-MsgMapHeader $buf $keys.Count
        foreach ($k in $keys) { Write-MsgStr $buf "$k"; Write-MsgValue $buf $val[$k] }
        return
    }

    # Hashtable
    if ($val -is [System.Collections.Hashtable]) {
        $keys = @($val.Keys)
        Write-MsgMapHeader $buf $keys.Count
        foreach ($k in $keys) { Write-MsgStr $buf "$k"; Write-MsgValue $buf $val[$k] }
        return
    }

    # PSCustomObject
    if ($val -is [PSCustomObject]) {
        $props = @($val.PSObject.Properties)
        Write-MsgMapHeader $buf $props.Count
        foreach ($p in $props) { Write-MsgStr $buf $p.Name; Write-MsgValue $buf $p.Value }
        return
    }

    # Fallback → string
    Write-MsgStr $buf "$val"
}

# ============================================================
# HELPERS
# ============================================================

$script:idCounter = 0
function New-PkId {
    $script:idCounter++
    $chars = [char[]]'abcdefghijklmnopqrstuvwxyz0123456789'
    -join (1..8 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Count)] })
}

function Get-Prop($obj, $name, $default = $null) {
    if ($obj -is [PSCustomObject]) {
        $p = $obj.PSObject.Properties[$name]
        if ($p) { return $p.Value }
    } elseif ($obj -is [System.Collections.IDictionary]) {
        if ($obj.Contains($name)) { return $obj[$name] }
    }
    return $default
}

# ============================================================
# ELEMENT BUILDERS
# ============================================================

function New-TextBlock($text, $tag, $top, $left, $width, $fontSize, $bold, $color, $align) {
    $styles = [ordered]@{
        width=$width; top=$top; left=$left
        textAlign=$align; lineHeight=1.6; fontWeight=$bold
        fontSize="$fontSize"; color=$color
        borderWidth=0; borderStyle="solid"; borderColor="rgba(229,231,235,1)"
    }
    [ordered]@{
        type="text-block"
        specials=[ordered]@{ text=$text; tag=$tag }
        runtime=[ordered]@{ firstInit="mobile" }
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$styles; config=[ordered]@{ virtualHeight=($fontSize*1.6); notloaded=$false } }
            desktop=[ordered]@{ styles=$styles; config=[ordered]@{ notloaded=$false } }
        }
        properties=[ordered]@{ sync=$true; name=("text-block_"+(New-PkId)); movable=$true }
        id=(New-PkId)
        events=@()
    }
}

function New-Button($text, $top, $left, $width, $height, $bg, $fgColor, $radius, $fontSize) {
    $styles = [ordered]@{
        width=$width; top=$top; left=$left; height=$height
        fontWeight="bold"; fontSize="$fontSize"; color=$fgColor
        boxShadow="0px 4px 4px rgba(0,0,0,0.25)"
        borderWidth=0; borderStyle="solid"; borderRadius=$radius; borderColor="rgba(229,231,235,1)"
        background=$bg
    }
    $cfg = [ordered]@{ notloaded=$false; bgHidden=[ordered]@{} }
    [ordered]@{
        type="button"
        specials=[ordered]@{ text=$text }
        runtime=[ordered]@{ firstInit="mobile" }
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$styles; config=$cfg }
            desktop=[ordered]@{ styles=$styles; config=$cfg }
        }
        properties=[ordered]@{ sync=$true; name="button"; movable=$true }
        id=(New-PkId)
        events=@()
    }
}

function New-ImageBlock($src, $top, $left, $width, $height) {
    $bgStr = "center center/ cover no-repeat  content-box url($src) border-box"
    $styles = [ordered]@{
        width=$width; top=$top; position="absolute"; left=$left; height=$height
        borderWidth=0; borderStyle="solid"; borderColor="rgba(229,231,235,1)"
        background=$bgStr
    }
    $cfg = [ordered]@{ widthBgImage=$width; topBgImage=0; notloaded=$false; leftBgImage=0; heightBgImage=$height; bgHidden=[ordered]@{} }
    [ordered]@{
        type="image-block"
        specials=[ordered]@{ src=$src; imageCompression=$true }
        runtime=[ordered]@{ firstInit="mobile"; checkedBlurImage=$false }
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$styles; config=$cfg }
            desktop=[ordered]@{ styles=$styles; config=$cfg }
        }
        properties=[ordered]@{ sync=$true; name=("image-block_"+(New-PkId)); movable=$true }
        id=(New-PkId)
        events=@()
    }
}

function New-InputEl($fieldName, $placeholder, $top, $height = 44) {
    $sp = [ordered]@{ field_placeholder=$placeholder; field_name=$fieldName }
    if ($fieldName -eq 'phone_number') {
        $sp['validate'] = $true
        $sp['phone_validator'] = '^(\+84|84|0)(5[5|8|9|6]|8[1|2|3|4|5|8|6|9|7]|3[2|3|4|5|6|7|8|9]|7[0|9|7|6|8]|9[0|2|1|4|3|6|7|8|9]|1[2|9])([0-9]{7})$'
    }
    if ($fieldName -eq 'email') {
        $sp['inputPattern'] = '[^@\s]+@[^@\s]+\.[^@\s]+'
    }
    $styles = [ordered]@{
        width=390; top=$top; left=0; height=$height
        color="rgba(50,50,50,1)"; borderRadius="4px"
        borderColor="rgba(210,210,210,1)"; border="1px solid #d9d9d9"
        background="rgba(255,255,255,1)"
    }
    $cfg = [ordered]@{ placeholder="rgba(180,180,180,1)"; notloaded=$false }
    [ordered]@{
        type="input"
        specials=$sp
        runtime=[ordered]@{}
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$styles; config=$cfg }
            desktop=[ordered]@{ styles=$styles; config=$cfg }
        }
        properties=[ordered]@{ sync=$true; name="Input"; movable=$true; field_default=$true }
        id=(New-PkId)
        events=@()
    }
}

function New-Form($fields, $submitText, $top, $fbEvent, $fbValue) {
    $formChildren = [System.Collections.Generic.List[object]]::new()

    # Submit button at top of form
    $btnLeft = [int]((390 - 195) / 2)
    $submitBtn = New-Button $submitText 0 $btnLeft 195 58 "rgba(201,31,23,1)" "rgba(255,255,255,1)" "4px" 21
    $formChildren.Add($submitBtn)

    # Inputs stacking below button
    $inputTop = 68
    foreach ($f in $fields) {
        $ph = Get-Prop $f 'placeholder' (Get-Prop $f 'field' 'input')
        $fn = Get-Prop $f 'field' 'text_input'
        $el = New-InputEl $fn $ph $inputTop
        $formChildren.Add($el)
        $inputTop += 54
    }

    $formH = $inputTop + 15
    $styles = [ordered]@{
        width=390; top=$top; left=15; height=$formH
        fontSize=13; color="rgba(50,50,50,1)"
        borderWidth="1px"; borderStyle="solid"; borderRadius="0px"
        borderColor="rgba(210,210,210,1)"; background="rgba(255,255,255,0)"
    }
    $cfg = [ordered]@{ placeholder="rgba(238,238,238,1)"; notloaded=$false; borderColorHidden=[ordered]@{}; bgHidden=[ordered]@{} }
    [ordered]@{
        type="form"
        specials=[ordered]@{
            submit_success=1; multiFormParent=""
            fb_tracking_currency="VND"; fb_event_type=$fbEvent; fb_conversion_value=$fbValue
        }
        runtime=[ordered]@{ firstInit="mobile" }
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$styles; config=$cfg }
            desktop=[ordered]@{ styles=$styles; config=$cfg }
        }
        properties=[ordered]@{ sync=$true; name="form_1"; movable=$true }
        id=(New-PkId)
        children=$formChildren.ToArray()
    }
}

function New-Line($top) {
    $styles = [ordered]@{ width=390; top=$top; left=15; height=2; background="rgba(210,210,210,0.6)" }
    [ordered]@{
        type="line"
        specials=[ordered]@{}
        runtime=[ordered]@{}
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$styles; config=[ordered]@{} }
            desktop=[ordered]@{ styles=$styles; config=[ordered]@{} }
        }
        properties=[ordered]@{ sync=$true; name="line"; movable=$true }
        id=(New-PkId)
        events=@()
    }
}

# ============================================================
# SESSION → SECTION BUILDER
# ============================================================

function Get-TextHeight($text, $fontSize, $width = 400) {
    $charsPerLine = [Math]::Max(5, [int]($width / ($fontSize * 0.55)))
    $lines = [Math]::Max(1, [Math]::Ceiling($text.Length / $charsPerLine))
    [int]($fontSize * 1.6 * $lines + 12)
}

function Build-Section($sess) {
    $children = [System.Collections.Generic.List[object]]::new()
    $curTop = 15
    $bgColor = Get-Prop $sess 'bg' 'rgba(255,255,255,1)'
    $sectName = Get-Prop $sess 'name' 'Section'

    foreach ($el in $sess.elements) {
        $elType = Get-Prop $el 'type' ''

        switch ($elType) {
            'text' {
                $tag     = Get-Prop $el 'tag' 'p'
                $isBold  = Get-Prop $el 'bold' $false
                $bold    = if ($isBold) { "bold" } else { "normal" }
                $color   = Get-Prop $el 'color' 'rgba(20,20,20,1)'
                $align   = Get-Prop $el 'align' 'left'
                $defSize = switch ($tag) { 'h1' {24} 'h2' {20} 'h3' {18} 'h4' {17} 'h5' {16} default {15} }
                $fsize   = [int](Get-Prop $el 'fontSize' $defSize)
                $txt     = Get-Prop $el 'text' ''
                $elem    = New-TextBlock $txt $tag $curTop 10 400 $fsize $bold $color $align
                $children.Add($elem)
                $curTop += Get-TextHeight $txt $fsize 400
                $curTop += 8
            }

            'button' {
                $bg     = Get-Prop $el 'bg' 'rgba(201,31,23,1)'
                $fg     = Get-Prop $el 'color' 'rgba(255,255,255,1)'
                $fsize  = [int](Get-Prop $el 'fontSize' 18)
                $radius = Get-Prop $el 'radius' '8px'
                $txt    = Get-Prop $el 'text' 'Click'
                $btnW   = 200
                $btnL   = [int]((420 - $btnW) / 2)
                $elem   = New-Button $txt $curTop $btnL $btnW 50 $bg $fg $radius $fsize
                $children.Add($elem)
                $curTop += 65
            }

            'image' {
                $src    = Get-Prop $el 'src' ''
                $imgH   = [int](Get-Prop $el 'height' 280)
                $elem   = New-ImageBlock $src $curTop 15 390 $imgH
                $children.Add($elem)
                $curTop += $imgH + 15
            }

            'form' {
                $submitTxt = Get-Prop $el 'submit' 'ĐẶT HÀNG NGAY'
                $fbEvent   = Get-Prop $el 'fb_event' 'AddToCart'
                $fbVal     = Get-Prop $el 'fb_value' '10000'
                $fields    = @(Get-Prop $el 'fields' @())
                $elem      = New-Form $fields $submitTxt $curTop $fbEvent $fbVal
                $children.Add($elem)
                $curTop += 68 + $fields.Count * 54 + 30
            }

            'divider' {
                $elem = New-Line $curTop
                $children.Add($elem)
                $curTop += 25
            }

            default {
                Write-Warning "Element type '$elType' không được hỗ trợ — bỏ qua."
            }
        }
    }

    $sectH = $curTop + 25
    $mStyles = [ordered]@{ position="relative"; height=$sectH; background=$bgColor }
    $dStyles = [ordered]@{ position="relative"; height=$sectH; background=$bgColor }
    [ordered]@{
        type="section"
        specials=[ordered]@{ imageCompression=$true }
        runtime=[ordered]@{}
        responsive=[ordered]@{
            mobile=[ordered]@{ styles=$mStyles; config=[ordered]@{ notloaded=$false; bgHidden=[ordered]@{} } }
            desktop=[ordered]@{ styles=$dStyles; config=[ordered]@{ bgHidden=[ordered]@{} } }
        }
        properties=[ordered]@{ sync=$true; name=$sectName; movable=$false }
        id=(New-PkId)
        events=@()
        children=$children.ToArray()
    }
}

# ============================================================
# FULL PAGE BUILDER
# ============================================================

function Build-PancakePage($data) {
    $title   = Get-Prop $data 'title' 'Trang Bán Hàng'
    $desc    = Get-Prop $data 'description' ''
    $fbPx    = Get-Prop $data 'fb_pixel' ''
    $ttPx    = Get-Prop $data 'tiktok_pixel' ''

    $settings = [ordered]@{
        width_section=[ordered]@{ mobile=420; desktop=960 }
        title=$title
        tiktok_script=$ttPx
        thumbnail=""
        send_info_to_thank_page=$true
        keywords=$title
        global_track_ids=@()
        fontGeneral="Open Sans"
        fb_tracking_code=$fbPx
        favicon=""
        extra_script=""
        extra_css=""
        description=$desc
        country="84"
        bhet=""
        bbet=""
        auto_save_info_user=$false
        auto_save_draft=$true
        auto_complete_form_in_popup=$false
        analytic_heatmap=$false
    }

    $sessions = Get-Prop $data 'sessions' @()
    $page = @($sessions | ForEach-Object { Build-Section $_ })

    [ordered]@{
        source=[ordered]@{
            settings=$settings
            popup=@()
            page=$page
            options=[ordered]@{
                versionID=([Guid]::NewGuid().ToString())
                mobileOnly=$true
            }
        }
    }
}

# ============================================================
# MAIN
# ============================================================

$inputPath = Resolve-Path $InputFile
Write-Host "Đọc: $inputPath"
$data = Get-Content $inputPath -Raw -Encoding UTF8 | ConvertFrom-Json

Write-Host "Xây dựng cấu trúc Pancake..."
$page = Build-PancakePage $data

Write-Host "Encode MessagePack..."
$buf = [System.Collections.Generic.List[byte]]::new()
Write-MsgValue $buf $page
$msgBytes = $buf.ToArray()

Write-Host "Encode Base64..."
$b64 = [Convert]::ToBase64String($msgBytes)

if (-not $OutputFile) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
    $dir  = [System.IO.Path]::GetDirectoryName((Resolve-Path $InputFile))
    $OutputFile = Join-Path $dir "$base.pke"
}

[System.IO.File]::WriteAllText($OutputFile, $b64, [System.Text.Encoding]::ASCII)

$sessions = @(Get-Prop $data 'sessions' @())
Write-Host ""
Write-Host "DONE!" -ForegroundColor Green
Write-Host "  Output  : $OutputFile"
Write-Host "  MsgPack : $($msgBytes.Length) bytes"
Write-Host "  Base64  : $($b64.Length) chars"
Write-Host "  Sessions: $($sessions.Count)"
Write-Host ""
Write-Host "Pancake.vn > Pages > Import > chon file .pke"
