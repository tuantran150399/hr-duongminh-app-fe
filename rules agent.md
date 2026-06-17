# Quy tắc chuyển ngữ (i18n) cho Agent

Khi phát triển hoặc thêm mới các chuỗi văn bản (text) trên giao diện (UI) của dự án, Agent cần tuân thủ nghiêm ngặt các quy tắc sau:

1. **Sử dụng Hook nội bộ**: Luôn luôn sử dụng hook `useLanguage` được export từ `components/AppProviders.js` thay vì hardcode trực tiếp các chuỗi văn bản vào file component.
   - *Đúng*: `const { t } = useLanguage(); return <span>{t('common.save')}</span>;`
   - *Sai*: `return <span>Lưu</span>;`
   - *Sai*: `return <span>{isVietnamese ? 'Lưu' : 'Save'}</span>;`

2. **Cập nhật Dictionary trong AppProviders**:
   - Khi có text mới, bắt buộc phải bổ sung từ khóa (key) tương ứng vào **cả hai** object `en` và `vi` trong biến `dictionary` ở file `components/AppProviders.js`.
   - Cần đặt từ khóa vào đúng module (ví dụ: `common`, `accounting`, `jobs`...) tương ứng với tính năng đang làm.
   - *Lưu ý quan trọng*: Phải tìm đúng block của module đó. Tránh việc khai báo trùng lặp tên module (ví dụ: tạo thêm block `accounting: {}` mới trong khi đã có sẵn block `accounting: {}`) dẫn đến lỗi ghi đè dữ liệu mất bản dịch cũ.

3. **Không tự ý cài đặt thêm thư viện i18n**: 
   - Không cài đặt hay thêm các hàm/thư viện quản lý đa ngôn ngữ (như `react-i18next`, `next-intl`...) vì dự án đã có sẵn cấu trúc Context tự xây dựng trong `AppProviders.js` dùng trực tiếp khá ổn định định.

4. **Trường hợp ngoại lệ**: 
   - Những text liên quan đến System Metadata (chẳng hạn như cấu hình `metadata` trong `layout.js` Server Component) hoặc Brand Name (Tên thương hiệu, ví dụ: "Dương Minh Logistics") có thể để nguyên không cần bắt buộc phải dịch nếu không có yêu cầu đặc biệt.
