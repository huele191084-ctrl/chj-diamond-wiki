// Cấu hình website. Điền API_URL (URL Web app Apps Script, kết thúc bằng /exec) rồi chạy tools/verify.mjs.
window.CHJ_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyH2BxvPJy-SzFW9uYB4VNQw4yIWCelWV8dmU0U6SLyyoxxRaT6GAUf08qSpmJPKnzsQw/exec',
  ZALO_PHONE: '0912268667',
  // Link nhóm Zalo CHJ (lấy từ mã QR của ảnh mời vào nhóm)
  ZALO_GROUP_URL: 'https://zaloapp.com/qr/g/gjccws780?src=qr',
  // Tài khoản nhận tiền (giải mã từ mã VietQR CHJ gửi: BIN 970441 = VIB)
  BANK: { name: 'VIB (Ngân hàng Quốc tế)', number: '686979686', holder: 'CTTNHH CHUNG HIEU JEWELRY' },
  PIXEL_ID: '556532239837827'
};
