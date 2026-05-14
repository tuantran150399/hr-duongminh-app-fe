# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG HR LOGISTICS

> Phiên bản: 1.0 — Ngày cập nhật: 14/05/2026

---

## Mục lục

1. [Đăng nhập](#1-đăng-nhập)
2. [Quản lý lô hàng (Jobs)](#2-quản-lý-lô-hàng-jobs)
3. [Kế toán (Accounting)](#3-kế-toán-accounting)
4. [Phiếu ghi nợ (Debit Notes)](#4-phiếu-ghi-nợ-debit-notes)
5. [Chi hộ / Thu hộ (COB)](#5-chi-hộ--thu-hộ-cob)
6. [Đối tác (Partners)](#6-đối-tác-partners)
7. [Nhân sự (HRM)](#7-nhân-sự-hrm)
8. [Tạm ứng (Advances)](#8-tạm-ứng-advances)
9. [Đề nghị thanh toán (Payment Requests)](#9-đề-nghị-thanh-toán-payment-requests)
10. [Biểu phí (Pricing)](#10-biểu-phí-pricing)
11. [Báo cáo (Reports)](#11-báo-cáo-reports)
12. [Bảo mật (Security)](#12-bảo-mật-security)

---

## 1. Đăng nhập

### Bước thực hiện

1. Mở trình duyệt, truy cập địa chỉ hệ thống.
2. Nhập **Email** và **Mật khẩu** đã được cấp.
3. Nhấn nút **Đăng nhập**.
4. Hệ thống chuyển bạn đến trang **Dashboard** nếu thông tin đúng.

### Lưu ý
- Nếu nhập sai mật khẩu, hệ thống sẽ hiển thị thông báo lỗi.
- Phiên làm việc tự động gia hạn. Nếu hết hạn, hệ thống tự chuyển về trang đăng nhập.
- Mỗi tài khoản có **quyền truy cập** khác nhau — bạn chỉ thấy các mục menu được phân quyền.

---

## 2. Quản lý lô hàng (Jobs)

### 2.1. Xem danh sách Jobs

1. Vào menu **Jobs** trên thanh bên trái.
2. Bảng hiển thị tất cả lô hàng: Mã Job, Khách hàng, Loại, Trạng thái, Doanh thu, Chi phí, Lợi nhuận.
3. Sử dụng **ô tìm kiếm** để lọc theo mã job hoặc tên khách hàng.
4. Nhấn các **tag trạng thái** (Tất cả / Nháp / Đang xử lý / Hoàn thành / Đã hủy) để lọc nhanh.
5. Nhấn nút **Export CSV** để tải danh sách về file Excel/CSV.

### 2.2. Tạo Job mới

1. Nhấn nút **Create Job** ở góc phải.
2. Điền thông tin theo 3 phần:

| Phần | Thông tin cần nhập | Bắt buộc |
|------|-------------------|----------|
| Khách hàng & Phân công | Mã Job, Khách hàng, Chi nhánh, Người phụ trách, Shipper, Consignee, Đại lý | Mã Job ✅, Khách hàng ✅ |
| Khai báo & Hàng hóa | Số tờ khai, Loại hình, Luồng hải quan, Loại hàng, Số container, Số seal | Loại hàng ✅ |
| Vận chuyển | Loại Job, Phương thức, Tàu, Chuyến, Cảng xếp/dỡ, ETD, ETA | Loại Job ✅, Phương thức ✅ |

3. Nhấn **Create Job** để lưu. Hệ thống tự chuyển về danh sách.

### 2.3. Xem & chỉnh sửa chi tiết Job

1. Trong danh sách, **nhấn vào dòng** Job cần xem.
2. Chỉnh sửa thông tin trong form → nhấn **Save** để lưu.
3. Các thao tác bổ sung:

| Nút | Chức năng |
|-----|-----------|
| **Copy** | Tạo bản sao Job (mã mới tự sinh) |
| **Cancel Job** | Hủy Job — form sẽ bị khóa hoàn toàn |
| **Back** | Quay về danh sách |

4. Phần **Job Accounting** ở cuối trang hiển thị: Tổng Doanh thu, Chi phí, Lợi nhuận và bảng chi tiết bút toán.

> ⚠️ Job đã **Hoàn thành** hoặc **Đã hủy** sẽ khóa toàn bộ form, không cho chỉnh sửa.

---

## 3. Kế toán (Accounting)

### 3.1. Tổng quan

- Phía trên trang hiển thị 4 thẻ KPI: **Tổng doanh thu**, **Tổng chi phí**, **Lợi nhuận**, **Chưa thanh toán**.
- Bên dưới có 2 tab: **Revenue** (Doanh thu) và **Cost** (Chi phí).

### 3.2. Tạo bút toán mới

1. Nhấn nút **Tạo mới**.
2. Trong modal, điền: Job liên quan, Mô tả, Số tiền, Tiền tệ, Loại (Revenue/Cost).
3. Nhấn **OK** để lưu.

### 3.3. Import Excel

1. Nhấn nút **Import Excel**.
2. Chọn file `.xlsx` đúng mẫu → hệ thống tạo hàng loạt bút toán.

### 3.4. Các thao tác trên bút toán

| Thao tác | Điều kiện | Kết quả |
|----------|-----------|---------|
| **Post** (Duyệt) | Bút toán ở trạng thái NHÁP | NHÁP → ĐÃ DUYỆT |
| **Void** (Hủy) | Bút toán ĐÃ DUYỆT | ĐÃ DUYỆT → ĐÃ HỦY |
| **Cập nhật thanh toán** | Bút toán ĐÃ DUYỆT | CHƯA TT → MỘT PHẦN → ĐÃ TT |
| **Gán COB** | Bút toán ĐÃ DUYỆT | Liên kết với bản ghi chi hộ/thu hộ |

> ⚠️ Bút toán **ĐÃ HỦY** không thể thao tác thêm.

---

## 4. Phiếu ghi nợ (Debit Notes)

### Vòng đời trạng thái
```
NHÁP → ĐÃ DUYỆT → ĐÃ GỬI
(có thể HỦY ở bất kỳ bước nào)
```

### Thao tác

1. **Tạo Debit Note**: Nhấn tạo mới → Chọn Job → Hệ thống tự tính giá từ biểu phí → Xem lại danh sách mục → Lưu.
2. **Post**: Duyệt phiếu (NHÁP → ĐÃ DUYỆT).
3. **Send**: Gửi cho khách hàng (ĐÃ DUYỆT → ĐÃ GỬI).
4. **Void**: Hủy phiếu.

---

## 5. Chi hộ / Thu hộ (COB)

### Tab Chi hộ (Charge On Behalf)
- Ghi nhận chi phí công ty **chi hộ** cho khách hàng.
- Nhấn **Tạo mới** → Chọn Job, Khách hàng, nhập Số tiền, Mô tả → Lưu.
- Khi khách đã thanh toán lại → nhấn **Settle** (Quyết toán).

### Tab Thu hộ (Collect On Behalf)
- Ghi nhận phí công ty **thu hộ** cho đối tác.
- Thao tác tương tự tab Chi hộ.
- Khi đã chuyển tiền cho đối tác → nhấn **Settle**.

---

## 6. Đối tác (Partners)

### 6.1. Xem danh sách
- Vào menu **Partners**. Sử dụng ô tìm kiếm để lọc theo mã, tên, MST, SĐT, email.

### 6.2. Thêm đối tác
1. Nhấn **Add Partner**.
2. Điền thông tin:

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Mã đối tác | ✅ | Không thể sửa sau khi tạo |
| Loại | ✅ | Khách hàng / Nhà cung cấp / Đại lý / Hãng tàu / Đa năng |
| Tên | ✅ | Tên công ty |
| MST, Liên hệ, SĐT, Email, Địa chỉ | Không | Thông tin bổ sung |

3. Nhấn **OK** để lưu.

### 6.3. Sửa đối tác
- Nhấn biểu tượng ✏️ trên dòng → modal hiện ra → sửa → **OK**.

### 6.4. Khóa đối tác
- Nhấn biểu tượng 🔒 → xác nhận → đối tác bị vô hiệu hóa (vẫn giữ trong lịch sử).

---

## 7. Nhân sự (HRM)

### Tab Nhân viên
1. Xem bảng nhân viên, tìm kiếm theo tên/mã, lọc theo phòng ban.
2. **Thêm nhân viên**: Nhấn nút → nhập Mã NV, Họ tên, SĐT, Phòng ban, Vị trí, Ngày vào → Lưu.

### Tab Chấm công
- Xem bảng chấm công: Mã NV, Tên, Ngày, Trạng thái, Số giờ làm.
- Dòng cuối hiển thị **tổng giờ làm**.

### Tab Bảng lương

1. **Tạo bảng lương**: Nhấn nút → Chọn nhân viên, Tháng (YYYY-MM), Lương cơ bản, Phụ cấp, Khấu trừ → Lưu. Backend tự tính lương thực nhận.
2. **Chốt lương**: Nhấn nút **Finalize** trên dòng NHÁP → xác nhận → ĐÃ CHỐT.
3. **Xuất Excel**: Nhấn nút Export Excel để tải bảng lương.

---

## 8. Tạm ứng (Advances)

### Vòng đời
```
CHỜ DUYỆT → ĐÃ DUYỆT → ĐÃ QUYẾT TOÁN
           ↘ TỪ CHỐI
              ĐÃ DUYỆT → QUÁ HẠN (tự động) → ĐÃ QUYẾT TOÁN
```

### Thao tác

1. **Tạo tạm ứng**: Nhấn nút → Chọn nhân viên, Số tiền, Tiền tệ (VND/USD), Mục đích, Ngày đến hạn → Lưu.
2. **Duyệt**: Nhấn ✅ trên dòng CHỜ DUYỆT → xác nhận.
3. **Từ chối**: Nhấn ❌ → nhập lý do → xác nhận.
4. **Quyết toán**: Nhấn nút **Reimburse** trên dòng ĐÃ DUYỆT hoặc QUÁ HẠN → nhập số tiền → xác nhận.

> ⚠️ Tạm ứng quá ngày đến hạn mà chưa quyết toán sẽ tự động chuyển thành **QUÁ HẠN**.

---

## 9. Đề nghị thanh toán (Payment Requests)

### Luồng 2 cấp duyệt
```
TẠO ĐỀ NGHỊ → TRƯỞNG PHÒNG DUYỆT → BAN GIÁM ĐỐC DUYỆT
             ↘ TỪ CHỐI              ↘ TỪ CHỐI
```

### Thao tác

1. **Tạo đề nghị**: Nhấn nút → Chọn Job, Nhà cung cấp, Số tiền, Tiền tệ, Lý do, Ngày mong muốn → Lưu.
2. **Duyệt cấp 1** (Trưởng phòng): Nhấn nút Approve trên dòng.
3. **Duyệt cấp 2** (Ban giám đốc): Nhấn nút Final Approve.
4. **Từ chối**: Nhấn Reject → nhập lý do → xác nhận (ở bất kỳ cấp nào).

---

## 10. Biểu phí (Pricing)

1. **Xem danh sách**: Tìm kiếm theo đối tác, loại dịch vụ, tuyến đường.
2. **Tạo biểu phí**: Nhấn nút tạo → Chọn Đối tác, Loại dịch vụ (Hải quan / Vận tải bộ / Cước biển / Cước hàng không / Phí địa phương / LCL / Khác), Phương thức, Tuyến đi/đến, Đơn giá, Tiền tệ → Lưu.
3. **Import Excel**: Upload file `.xlsx` để tạo hàng loạt biểu phí.

> 💡 Biểu phí được sử dụng bởi **Debit Notes** để tự động tính giá khi tạo phiếu ghi nợ.

---

## 11. Báo cáo (Reports)

### Các loại báo cáo

| Báo cáo | Nội dung |
|---------|----------|
| Tổng hợp theo chi nhánh | Doanh thu, chi phí, lợi nhuận theo chi nhánh |
| Tổng hợp theo khách hàng | Doanh thu, chi phí theo khách hàng |
| Lãi / Lỗ (PnL) | Báo cáo lãi lỗ tổng hợp |
| Dòng tiền | Dòng tiền vào/ra |
| Trạng thái Job | Số lượng Job theo trạng thái |
| Công nợ phải thu | Khách hàng còn nợ |
| Công nợ phải trả | Nhà cung cấp cần trả |
| Phải thu quá hạn | Công nợ thu quá hạn |
| Phải trả quá hạn | Công nợ trả quá hạn |

### Cách sử dụng

1. Vào menu **Reports**.
2. Chọn **khoảng thời gian** bằng bộ lọc ngày ở phía trên.
3. Chuyển **tab** để xem từng loại báo cáo.
4. Nhấn **Export Excel** để tải báo cáo ra file `.xlsx`.

---

## 12. Bảo mật (Security)

### Tab Lịch sử đăng nhập
- Xem ai đã đăng nhập, từ IP nào, thành công hay thất bại.
- Cột **Điểm rủi ro**: Xanh = an toàn, Cam = cần chú ý, Đỏ = nguy hiểm.

### Tab Cảnh báo bảo mật
- Xem danh sách cảnh báo bảo mật theo mức độ: Thấp / Trung bình / Cao / Nghiêm trọng.
- Nhấn **Acknowledge** để xác nhận đã biết.
- Nhấn **Resolve** để đánh dấu đã xử lý xong.

### Tab Quy tắc IP
1. **Tạo rule**: Nhấn nút tạo → Chọn loại (Cho phép / Chặn), Nhập mẫu IP, Nhãn → Lưu.
2. **Sửa rule**: Nhấn biểu tượng ✏️ → chỉnh sửa → Lưu.
3. **Xóa rule**: Nhấn biểu tượng 🗑️ → xác nhận xóa.
4. **Bật/Tắt rule**: Chuyển công tắc Active.

---

## Phụ lục: Sơ đồ quan hệ giữa các module

```
Đối tác (Partners)
  ├──▶ Jobs (Lô hàng)
  │      ├──▶ Kế toán (Accounting) ──▶ Báo cáo (Reports)
  │      ├──▶ Debit Notes (Phiếu ghi nợ)
  │      ├──▶ COB (Chi hộ / Thu hộ)
  │      └──▶ Đề nghị thanh toán (Payment Requests)
  └──▶ Biểu phí (Pricing) ──▶ Debit Notes

Nhân sự (HRM)
  └──▶ Tạm ứng (Advances)

Bảo mật (Security) ── giám sát toàn hệ thống
```

---

*Tài liệu được tạo tự động từ phân tích mã nguồn hệ thống HR Logistics Frontend.*
