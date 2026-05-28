# ============================================================
# CHJ Diamond — Nhúng ảnh vào HTML tự động
# Chạy script này sau khi đã lưu ring1.jpg, ring2.jpg, ring3.jpg
# vào cùng thư mục với chj-diamond.html
# ============================================================

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlFile = Join-Path $dir "chj-diamond.html"

Write-Host ""
Write-Host "CHJ Diamond — Image Embedder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Kiểm tra file HTML tồn tại
if (-not (Test-Path $htmlFile)) {
    Write-Host "LỖOI: Không tìm thấy chj-diamond.html" -ForegroundColor Red
    exit 1
}

# Đọc HTML
$html = Get-Content $htmlFile -Raw -Encoding UTF8

# Xử lý từng ảnh
$images = @{
    "ring1" = "ring1.jpg"
    "ring2" = "ring2.jpg"
    "ring3" = "ring3.jpg"
}

$allFound = $true
$b64 = @{}

foreach ($key in $images.Keys) {
    $imgPath = Join-Path $dir $images[$key]

    # Thử thêm .jpeg nếu không có .jpg
    if (-not (Test-Path $imgPath)) {
        $imgPath = $imgPath -replace "\.jpg$", ".jpeg"
    }

    if (Test-Path $imgPath) {
        Write-Host "OK: $($images[$key]) — $(([math]::Round((Get-Item $imgPath).Length / 1KB, 1))) KB" -ForegroundColor Green
        $bytes = [System.IO.File]::ReadAllBytes($imgPath)
        $b64[$key] = [Convert]::ToBase64String($bytes)

        # Xác định MIME type
        if ($imgPath -match "\.png$") { $mime = "image/png" }
        elseif ($imgPath -match "\.(jpeg|jpg)$") { $mime = "image/jpeg" }
        else { $mime = "image/jpeg" }

        $b64[$key] = "data:$mime;base64," + $b64[$key]
    } else {
        Write-Host "THIẾU: $($images[$key]) — chưa tìm thấy file" -ForegroundColor Yellow
        $allFound = $false
    }
}

if (-not $allFound) {
    Write-Host ""
    Write-Host "Một số ảnh chưa được tìm thấy. Script vẫn tiếp tục với các ảnh có sẵn..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Đang nhúng ảnh vào HTML..." -ForegroundColor Cyan

# ── Thay thế gallery card 1 (mặt bên — ring2) ──
if ($b64["ring2"]) {
    $old1 = '<!-- Card 1 – side view -->
    <div class="ring-card" onclick="setActive(this)">
      <div class="ring-img-wrap">
        <div class="diamond-ring-art" id="art1">
          <!-- Side view art -->
          <div style="position:relative;width:100%;height:100%;">
            <div class="ring-band" style="transform:rotate(25deg);top:52%;left:10%;width:80%;"></div>
            <div style="position:absolute;top:18%;left:50%;transform:translateX(-50%);">
              <div style="width:60px;height:60px;position:relative;">
                <div class="center-diamond" style="width:45%;padding-bottom:45%;top:45%;left:45%;transform:translate(-50%,-50%);"></div>
                <div class="halo-ring">
                  <div class="halo-stone" style="top:-7px;left:50%;transform:translateX(-50%);"></div>
                  <div class="halo-stone" style="bottom:-7px;left:50%;transform:translateX(-50%);"></div>
                  <div class="halo-stone" style="top:50%;right:-7px;transform:translateY(-50%);"></div>
                  <div class="halo-stone" style="top:50%;left:-7px;transform:translateY(-50%);"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="gallery-label">Mặt bên</div>
    </div>'

    $new1 = "<!-- Card 1 – side view -->
    <div class=""ring-card"" onclick=""setActive(this)"">
      <div class=""ring-img-wrap"" style=""width:160px;height:160px;overflow:hidden;"">
        <img src=""$($b64['ring2'])"" style=""width:100%;height:100%;object-fit:cover;"" alt=""Nhẫn kim cương - mặt bên"" />
      </div>
      <div class=""gallery-label"">Mặt bên</div>
    </div>"

    if ($html.Contains($old1.Trim().Split("`n")[0].Trim())) {
        $html = $html.Replace($old1, $new1)
        Write-Host "  Đã nhúng ảnh vào Card 1" -ForegroundColor Green
    }
}

# ── Thay thế gallery card MAIN (mặt trước — ring3) ──
if ($b64["ring3"]) {
    $old2 = '<!-- Card 2 – MAIN (top view) -->
    <div class="ring-card main active" onclick="setActive(this)">
      <div class="ring-img-wrap">
        <div class="diamond-ring-art" id="artMain">
          <div class="ring-band"></div>
          <div class="halo-ring">
            <!-- 8 halo stones positioned in circle -->
            <div class="halo-stone" style="top:-8px;left:50%;transform:translateX(-50%);"></div>
            <div class="halo-stone" style="bottom:-8px;left:50%;transform:translateX(-50%);"></div>
            <div class="halo-stone" style="top:50%;right:-8px;transform:translateY(-50%);"></div>
            <div class="halo-stone" style="top:50%;left:-8px;transform:translateY(-50%);"></div>
            <div class="halo-stone" style="top:8%;left:8%;"></div>
            <div class="halo-stone" style="top:8%;right:8%;"></div>
            <div class="halo-stone" style="bottom:8%;left:8%;"></div>
            <div class="halo-stone" style="bottom:8%;right:8%;"></div>
          </div>
          <div class="center-diamond"></div>
        </div>
      </div>
      <div class="gallery-label">Mặt trước ✦</div>
    </div>'

    $new2 = "<!-- Card 2 – MAIN (top view) -->
    <div class=""ring-card main active"" onclick=""setActive(this)"">
      <div class=""ring-img-wrap"" style=""width:200px;height:200px;overflow:hidden;"">
        <img src=""$($b64['ring3'])"" style=""width:100%;height:100%;object-fit:cover;"" alt=""Nhẫn kim cương - mặt trước"" />
      </div>
      <div class=""gallery-label"">Mặt trước ✦</div>
    </div>"

    if ($html.Contains("<!-- Card 2")) {
        $html = $html.Replace($old2, $new2)
        Write-Host "  Đã nhúng ảnh vào Card 2 (MAIN)" -ForegroundColor Green
    }
}

# ── Thay thế gallery card 3 (góc nghiêng — ring1) ──
if ($b64["ring1"]) {
    $old3 = '<!-- Card 3 – angled view -->
    <div class="ring-card" onclick="setActive(this)">
      <div class="ring-img-wrap">
        <div class="diamond-ring-art" id="art3">
          <div style="position:relative;width:100%;height:100%;">
            <div class="ring-band" style="transform:rotate(-20deg);top:54%;"></div>
            <div style="position:absolute;top:15%;left:50%;transform:translateX(-50%);">
              <div style="width:65px;height:65px;position:relative;">
                <div class="halo-ring">
                  <div class="halo-stone" style="top:-7px;left:50%;transform:translateX(-50%);"></div>
                  <div class="halo-stone" style="bottom:-7px;left:50%;transform:translateX(-50%);"></div>
                  <div class="halo-stone" style="top:50%;right:-7px;transform:translateY(-50%);"></div>
                  <div class="halo-stone" style="top:50%;left:-7px;transform:translateY(-50%);"></div>
                  <div class="halo-stone" style="top:8%;right:8%;"></div>
                  <div class="halo-stone" style="bottom:8%;right:8%;"></div>
                </div>
                <div class="center-diamond" style="width:40%;padding-bottom:40%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="gallery-label">Góc nghiêng</div>
    </div>'

    $new3 = "<!-- Card 3 – angled view -->
    <div class=""ring-card"" onclick=""setActive(this)"">
      <div class=""ring-img-wrap"" style=""width:160px;height:160px;overflow:hidden;"">
        <img src=""$($b64['ring1'])"" style=""width:100%;height:100%;object-fit:cover;"" alt=""Nhẫn kim cương - góc nghiêng"" />
      </div>
      <div class=""gallery-label"">Góc nghiêng</div>
    </div>"

    if ($html.Contains("<!-- Card 3")) {
        $html = $html.Replace($old3, $new3)
        Write-Host "  Đã nhúng ảnh vào Card 3" -ForegroundColor Green
    }
}

# ── Thay thế ảnh lớn trong product section (ring3 hoặc ring1) ──
$mainImg = if ($b64["ring1"]) { $b64["ring1"] } elseif ($b64["ring3"]) { $b64["ring3"] } else { $null }

if ($mainImg) {
    # Tìm và thay thế phần ring-large CSS art bằng ảnh thực
    $oldLarge = '        <div class="ring-large" style="margin:0 auto;">
            <div class="ring-band" style="height:10px;border-radius:5px;"></div>
            <div class="halo-ring" style="width:64%;padding-bottom:64%;">
              <div class="halo-stone" style="top:-10px;left:50%;transform:translateX(-50%);width:20px;height:20px;"></div>
              <div class="halo-stone" style="bottom:-10px;left:50%;transform:translateX(-50%);width:20px;height:20px;"></div>
              <div class="halo-stone" style="top:50%;right:-10px;transform:translateY(-50%);width:20px;height:20px;"></div>
              <div class="halo-stone" style="top:50%;left:-10px;transform:translateY(-50%);width:20px;height:20px;"></div>
              <div class="halo-stone" style="top:8%;left:8%;width:18px;height:18px;"></div>
              <div class="halo-stone" style="top:8%;right:8%;width:18px;height:18px;"></div>
              <div class="halo-stone" style="bottom:8%;left:8%;width:18px;height:18px;"></div>
              <div class="halo-stone" style="bottom:8%;right:8%;width:18px;height:18px;"></div>
            </div>
            <div class="center-diamond" style="width:34%;padding-bottom:34%;box-shadow:0 0 40px rgba(200,230,255,0.8),0 0 80px rgba(150,200,255,0.4);"></div>
          </div>'

    $newLarge = "        <img src=""$mainImg"" style=""width:240px;height:240px;object-fit:cover;margin:0 auto;display:block;"" alt=""Nhẫn Kim Cương Halo CHJ Diamond"" />"

    $html = $html.Replace($oldLarge, $newLarge)
    Write-Host "  Đã nhúng ảnh lớn vào trang chi tiết sản phẩm" -ForegroundColor Green
}

# ── Lưu file ──
$outFile = Join-Path $dir "chj-diamond-with-photos.html"
[System.IO.File]::WriteAllText($outFile, $html, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "HOÀN THÀNH!" -ForegroundColor Green
Write-Host "File mới: chj-diamond-with-photos.html" -ForegroundColor Cyan
Write-Host "Kích thước: $(([math]::Round((Get-Item $outFile).Length / 1MB, 2))) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mở file bằng trình duyệt để xem kết quả." -ForegroundColor White
Write-Host ""
