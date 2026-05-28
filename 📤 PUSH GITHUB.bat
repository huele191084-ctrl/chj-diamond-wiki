@echo off
chcp 65001 >nul
title Đang lưu lên GitHub...
echo.
echo ========================================
echo   ĐANG LƯU DỮ LIỆU LÊN GITHUB...
echo ========================================
echo.

cd /d "D:\NÃO CỦA HUẾ 1"

git add .

:: Tạo message tự động với ngày giờ
for /f "tokens=1-3 delims=/" %%a in ("%date%") do set NGAY=%%c-%%b-%%a
for /f "tokens=1-2 delims=:." %%a in ("%time: =0%") do set GIO=%%a:%%b

git commit -m "Cập nhật %NGAY% %GIO%"

git push

echo.
if %errorlevel% == 0 (
    echo ✅ XONG! Dữ liệu đã lên GitHub thành công!
) else (
    echo ✅ Không có thay đổi mới hoặc đã lưu xong!
)

echo.
echo Bấm phím bất kỳ để đóng...
pause >nul
