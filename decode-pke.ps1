# decode-pke.ps1 — Decode .pke files (Base64 + MessagePack) to JSON
# Usage: .\decode-pke.ps1 <input.pke> [output.json]

param(
    [string]$InputFile,
    [string]$OutputFile
)

# ── MessagePack parser ──────────────────────────────────────────────────────
$script:buf = $null
$script:pos = 0

function Read-Byte { return $script:buf[$script:pos++] }

function Read-UInt16 {
    $v = ([uint32]$script:buf[$script:pos] -shl 8) -bor $script:buf[$script:pos+1]
    $script:pos += 2; return $v
}

function Read-UInt32 {
    $v = ([uint64]$script:buf[$script:pos]   -shl 24) -bor `
         ([uint64]$script:buf[$script:pos+1] -shl 16) -bor `
         ([uint64]$script:buf[$script:pos+2] -shl 8)  -bor `
                  $script:buf[$script:pos+3]
    $script:pos += 4; return $v
}

function Read-Str($len) {
    $s = [System.Text.Encoding]::UTF8.GetString($script:buf, $script:pos, $len)
    $script:pos += $len; return $s
}

function Read-Float32 {
    $bytes = $script:buf[$script:pos..($script:pos+3)]
    [Array]::Reverse($bytes)
    $v = [BitConverter]::ToSingle($bytes, 0)
    $script:pos += 4; return [Math]::Round($v, 4)
}

function Read-Float64 {
    $bytes = $script:buf[$script:pos..($script:pos+7)]
    [Array]::Reverse($bytes)
    $v = [BitConverter]::ToDouble($bytes, 0)
    $script:pos += 8; return [Math]::Round($v, 4)
}

function Parse-Value {
    $b = Read-Byte

    # positive fixint (0x00-0x7F)
    if ($b -le 0x7F) { return $b }

    # negative fixint (0xE0-0xFF)
    if ($b -ge 0xE0) { return [int]$b - 256 }

    # fixmap (0x80-0x8F)
    if (($b -band 0xF0) -eq 0x80) {
        $n = $b -band 0x0F
        return Read-Map $n
    }

    # fixarray (0x90-0x9F)
    if (($b -band 0xF0) -eq 0x90) {
        $n = $b -band 0x0F
        return Read-Array $n
    }

    # fixstr (0xA0-0xBF)
    if (($b -band 0xE0) -eq 0xA0) {
        $n = $b -band 0x1F
        return Read-Str $n
    }

    switch ($b) {
        0xC0 { return $null }
        0xC2 { return $false }
        0xC3 { return $true }

        # bin8
        0xC4 {
            $n = Read-Byte
            $script:pos += $n
            return "[bin8:$n bytes]"
        }
        # bin16
        0xC5 {
            $n = Read-UInt16
            $script:pos += $n
            return "[bin16:$n bytes]"
        }

        # float32
        0xCA { return Read-Float32 }
        # float64
        0xCB { return Read-Float64 }

        # uint8
        0xCC { return Read-Byte }
        # uint16
        0xCD { return Read-UInt16 }
        # uint32
        0xCE { return Read-UInt32 }
        # uint64
        0xCF {
            $v = ([uint64]$script:buf[$script:pos]   -shl 56) -bor `
                 ([uint64]$script:buf[$script:pos+1] -shl 48) -bor `
                 ([uint64]$script:buf[$script:pos+2] -shl 40) -bor `
                 ([uint64]$script:buf[$script:pos+3] -shl 32) -bor `
                 ([uint64]$script:buf[$script:pos+4] -shl 24) -bor `
                 ([uint64]$script:buf[$script:pos+5] -shl 16) -bor `
                 ([uint64]$script:buf[$script:pos+6] -shl 8)  -bor `
                          $script:buf[$script:pos+7]
            $script:pos += 8; return $v
        }

        # int8
        0xD0 { $v = Read-Byte; if ($v -gt 127) { return $v - 256 }; return $v }
        # int16
        0xD1 { $v = Read-UInt16; if ($v -gt 32767) { return [int]$v - 65536 }; return $v }
        # int32
        0xD2 {
            $v = Read-UInt32
            if ($v -gt 2147483647) { return [int64]$v - 4294967296 }
            return $v
        }

        # fixext1
        0xD4 { $script:pos += 2; return "[fixext1]" }
        # fixext2
        0xD5 { $script:pos += 3; return "[fixext2]" }
        # fixext4
        0xD6 { $script:pos += 5; return "[fixext4]" }
        # fixext8
        0xD7 { $script:pos += 9; return "[fixext8]" }
        # fixext16
        0xD8 { $script:pos += 17; return "[fixext16]" }

        # str8
        0xD9 { $n = Read-Byte; return Read-Str $n }
        # str16
        0xDA { $n = Read-UInt16; return Read-Str $n }
        # str32
        0xDB { $n = Read-UInt32; return Read-Str $n }

        # array16
        0xDC { $n = Read-UInt16; return Read-Array $n }
        # array32
        0xDD { $n = Read-UInt32; return Read-Array $n }

        # map16
        0xDE { $n = Read-UInt16; return Read-Map $n }
        # map32
        0xDF { $n = Read-UInt32; return Read-Map $n }

        default {
            throw "Unknown MessagePack byte: 0x$($b.ToString('X2')) at position $($script:pos - 1)"
        }
    }
}

function Read-Map($n) {
    $obj = [ordered]@{}
    for ($i = 0; $i -lt $n; $i++) {
        $k = Parse-Value
        $v = Parse-Value
        $obj["$k"] = $v
    }
    return $obj
}

function Read-Array($n) {
    $arr = [System.Collections.Generic.List[object]]::new()
    for ($i = 0; $i -lt $n; $i++) {
        $arr.Add((Parse-Value))
    }
    return $arr.ToArray()
}

# ── Main ─────────────────────────────────────────────────────────────────────
if (-not $InputFile) {
    # Batch mode: decode all .pke in Downloads
    $files = Get-ChildItem "C:\Users\PK_TECH\Downloads\*.pke"
    foreach ($f in $files) {
        $out = Join-Path "D:\NÃO CỦA HUẾ 1\raw" ($f.BaseName + ".json")
        & $PSCommandPath -InputFile $f.FullName -OutputFile $out
    }
    exit
}

Write-Host "Decoding: $InputFile"
$raw = [System.IO.File]::ReadAllBytes($InputFile)
$text = [System.Text.Encoding]::ASCII.GetString($raw).Trim()
$script:buf = [Convert]::FromBase64String($text)
$script:pos = 0

try {
    $result = Parse-Value
    $json = $result | ConvertTo-Json -Depth 50 -Compress:$false

    if ($OutputFile) {
        [System.IO.File]::WriteAllText($OutputFile, $json, [System.Text.Encoding]::UTF8)
        Write-Host "  Saved: $OutputFile ($([Math]::Round($json.Length/1024, 1)) KB)"
    } else {
        $result | ConvertTo-Json -Depth 50
    }
} catch {
    Write-Host "  ERROR: $_" -ForegroundColor Red
}
