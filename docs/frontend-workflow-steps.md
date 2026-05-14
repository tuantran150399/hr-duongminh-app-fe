# Hướng Dẫn Test Workflow Theo Frontend

Tài liệu này mô tả cách test tay workflow dựa trên giao diện frontend hiện có trong `front end/hr-duongminh-app-fe`.

Áp dụng tốt nhất khi giao diện đang để `Tiếng Việt`. Một số label trong form vẫn hiển thị tiếng Anh, nên tài liệu sẽ ghi cả tên menu và tên field thực tế trên màn hình.

## 1. Mục tiêu workflow

Workflow cần test:

1. Tạo chi nhánh.
2. Tạo khách hàng, vendor, nhân viên.
3. Tạo file job.
4. Tạo báo giá.
5. Tạo tạm ứng, duyệt, hoàn ứng.
6. Tạo debit note từ báo giá, chốt, gửi khách.
7. Tạo doanh thu, chi phí, đánh dấu chi hộ.
8. Theo dõi công nợ, phải thu, phải trả, báo cáo.

## 2. Menu frontend đang có

Các menu chính liên quan:

- `Chi nhánh` -> `/branches`
- `Đối tác` -> `/partners`
- `Lô hàng / Jobs` -> `/jobs`
- `Tạo Job` -> `/jobs/create`
- `Báo giá / Pricing` -> `/pricing`
- `Tạm ứng & Hoàn ứng` -> `/advances`
- `Bảng kê / Debit Note` -> `/debit-notes`
- `Accounting` -> `/accounting`
- `Chi hộ / Thu hộ` -> `/cob`
- `Báo cáo` -> `/reports`
- `Nhân sự` -> `/hrm`

## 3. Chuẩn bị dữ liệu master

### 3.1. Tạo chi nhánh

Vào menu `Chi nhánh`.

Nhấn `Create Branch`.

Điền:

- `Code`: mã chi nhánh. Ví dụ `HCM`, `HN`, `CONT`, `TRUCK`
- `Name`: tên chi nhánh
- `Address`: địa chỉ
- `Active`: bật

Nhấn `OK`.

### 3.2. Tạo khách hàng và vendor

Vào menu `Partners`.

Nhấn `Add Partner`.

Tạo ít nhất 2 đối tượng:

1. Khách hàng:
- `Partner Code`
- `Partner Type`: chọn `Customer`
- `Name`
- `Tax Code / MST`
- `Contact Person`
- `Phone`
- `Email`
- `Address`

2. Nhà cung cấp:
- `Partner Code`
- `Partner Type`: chọn `Vendor`
- các field còn lại tương tự

Nếu dùng đại lý hoặc vừa là khách vừa là vendor, có thể chọn `BOTH`.

### 3.3. Tạo nhân viên để làm tạm ứng

Vào menu `Nhân sự`.

Tab mặc định `Nhân viên`.

Nhấn `Thêm nhân viên`.

Điền:

- `Mã NV`
- `Họ tên`
- `SĐT`
- `Bộ phận`
- `Position`
- `Ngày vào làm`

Nhấn `OK`.

## 4. Tạo file job

Vào menu `Lô hàng / Jobs`.

Nhấn `Create Job`.

Các nhóm thông tin cần nhập:

### 4.1. Khối Customer and Assignment

- `Job No.`: mã job
- `Customer`: chọn khách hàng
- `Branch`: chọn chi nhánh
- `Assigned User`: chọn người phụ trách nếu có
- `Shipper`
- `Consignee`
- `Agent / Carrier`: chọn đại lý nếu có

### 4.2. Khối Declaration and Cargo

- `Customs Declaration No.`
- `Business Type`
- `Customs Lane`
- `Cargo Type`
- `Container No.`
- `Seal No.`
- `Notes`

### 4.3. Khối Shipment

- `Job Type`: ví dụ `IMPORT`
- `Shipment Mode`: ví dụ `SEA_FCL`, `SEA_LCL`, `ROAD`
- `Vessel`
- `Voyage`
- `POL`
- `POD`
- `Origin`
- `Destination`
- `ETD`
- `ETA`
- `ATD`
- `ATA`
- `Actual Delivery Date`

Nhấn `Create Job`.

Gợi ý test theo file bạn đưa:

- HCM: tạo 2 job
- HN: tạo 3 job
- Chi nhánh container: tạo 2 job
- Chi nhánh xe tải: tạo 2 job

## 5. Tạo báo giá

Vào menu `Báo giá / Pricing`.

Nhấn `Add Tariff`.

### 5.1. Tạo phí TTHQ

Điền:

- `Partner`: có thể chọn khách hàng cụ thể hoặc để trống nếu là bảng giá chung
- `Service Type`: `CUSTOMS`
- `Shipment Mode`: ví dụ `SEA_FCL`
- `Route From`
- `Route To`
- `Unit`: ví dụ `DECLARATION`
- `Currency`: `VND`
- `Rate`: `1000000`
- `Notes`: ghi `TTHQ`

### 5.2. Tạo vận chuyển 20 feet

- `Service Type`: `TRUCKING`
- `Shipment Mode`: `SEA_FCL`
- `Unit`: `20`
- `Rate`: `3000000`

### 5.3. Tạo vận chuyển 40 feet

- `Service Type`: `TRUCKING`
- `Shipment Mode`: `SEA_FCL`
- `Unit`: `40`
- `Rate`: `4000000`

### 5.4. Tạo giá hàng lẻ

Tạo 3 dòng:

1. `LCL`, `Unit = TON`, `Min Quantity = 0`, `Max Quantity = 1`, `Rate = 1000000`
2. `LCL`, `Unit = TON`, `Min Quantity = 1`, `Max Quantity = 3`, `Rate = 3000000`
3. `LCL`, `Unit = TON`, `Min Quantity = 3`, `Max Quantity = 5`, `Rate = 4000000`

Nhấn `OK` để lưu từng dòng giá.

## 6. Tạo tạm ứng và hoàn ứng

Vào menu `Tạm ứng & Hoàn ứng`.

### 6.1. Tạo tạm ứng

Nhấn `Tạo tạm ứng`.

Điền:

- `Nhân viên`
- `Số tiền tạm ứng`: ví dụ `20000000`
- `Đơn vị tiền tệ`: `VND`
- `Mục đích sử dụng`
- `Hạn hoàn ứng`

Nhấn `OK`.

### 6.2. Duyệt tạm ứng

Trên dòng vừa tạo:

- bấm nút duyệt để chuyển sang `Đã duyệt`

### 6.3. Hoàn ứng

Trên dòng trạng thái `Đã duyệt` hoặc `Quá hạn`:

- bấm `Hoàn ứng`

Điền:

- `Số tiền hoàn ứng`
- `Ghi chú`

Nhấn `OK`.

Lưu ý:

- Frontend hiện có luồng tạo, duyệt, từ chối, hoàn ứng.
- Frontend hiện chưa thấy màn hình riêng để chọn `Paid quỹ tiền mặt` hay ghi nhận phiếu quỹ trực tiếp.

## 7. Tạo debit note từ báo giá

Vào menu `Bảng kê / Debit Note`.

Nhấn `Tạo bảng kê`.

### 7.1. Thông tin đầu bảng kê

Điền:

- `Khách hàng`
- `Mã Job (Tùy chọn)`: nên chọn job để hệ thống tự gợi ý giá
- `Tiền tệ`
- `Ngày chứng từ`
- `Ngày đến hạn`
- `Mô tả`

### 7.2. Tự động lấy báo giá

Ở phần `Line Items`:

- bấm `Auto Apply Pricing` / `Tự áp giá`

Kỳ vọng:

- hệ thống kéo các dòng giá phù hợp từ báo giá
- nếu chọn job thì có thể ưu tiên match theo route

### 7.3. Kiểm tra và chỉnh line item

Mỗi dòng có thể sửa:

- `Service Type`
- `Description`
- `Qty`
- `Unit Price`

Hệ thống tự tính:

- `Line Amount`
- `Total`

Ví dụ test theo workflow:

- Job 1: sửa line để tổng = `30000000`
- Job 2: sửa line để tổng = `25000000`

### 7.4. Lưu, chốt, gửi

Sau khi lưu:

1. Trong danh sách debit note, bấm `Chốt`
2. Sau khi trạng thái thành `Đã chốt`, bấm `Gửi`

Mapping với nghiệp vụ:

- `Chốt` = post debit note
- `Gửi` = gửi bảng kê cho khách
- Đây là bước gần nhất với yêu cầu `Làm SOA gửi khách`

## 8. Tạo doanh thu và chi phí trong Accounting

Vào menu `Accounting`.

Có 2 tab:

- `Revenue`
- `Cost`

### 8.1. Tạo doanh thu

Chọn tab `Revenue`.

Nhấn `Create Revenue`.

Điền:

- `Job No.`
- `Description`
- `Currency`
- `Amount`
- `Exchange Rate`
- `Local Amount`
- `Document Date`
- `Due Date`
- `Reference No.`
- `Invoice No.`
- `Notes`

Nhấn `OK`.

Sau đó bấm nút `Post`.

### 8.2. Tạo chi phí

Chọn tab `Cost`.

Nhấn `Create Cost`.

Điền:

- `Job No.`
- `Vendor / Agent`
- `Description`
- `Currency`
- `Amount`
- `Exchange Rate`
- `Local Amount`
- `Document Date`
- `Due Date`
- `Reference No.`
- `Invoice No.`
- `Notes`

Nhấn `OK`.

Sau đó bấm `Post`.

### 8.3. Cập nhật trạng thái thanh toán

Ở cột `Payment`:

- chọn `Unpaid`
- `Partial`
- `Paid`

Lưu ý:

- Frontend hiện có đổi trạng thái thanh toán.
- Frontend hiện chưa thấy form riêng kiểu `Thu khách qua ngân hàng`, `Chi văn phòng phẩm qua tiền mặt`, `Thu tiền nhập quỹ` như module quỹ độc lập.

## 9. Test chi hộ / thu hộ

### 9.1. Chi hộ từ cost

Vào `Accounting` -> tab `Cost`.

Chọn 1 dòng cost đã `Posted`.

Bấm nút `Mark as COB`.

Trong popup:

- xem lại `Cost entry`
- chọn `customer` sẽ thu lại

Nhấn `OK`.

Kỳ vọng:

- hệ thống đánh dấu khoản `Chi hộ`
- tự sinh khoản phải thu tương ứng từ khách hàng

Đây là bước gần nhất với yêu cầu:

- `Chi 5 triệu`
- `Thu hộ nâng hạ 5 triệu`
- `xem nhập chi hộ có nhảy thu hộ không`

### 9.2. Màn hình COB riêng

Vào menu `Chi hộ / Thu hộ`.

Có 2 tab:

- `Charge on behalf`
- `Collect on behalf`

Form `Charge on behalf` có các field:

- `Vendor`
- `Charge to Customer`
- `Job`
- `Amount`
- `Currency`
- `Description`

Form `Collect on behalf` có các field:

- `Customer`
- `Pay to Vendor`
- `Job`
- `Amount`
- `Currency`
- `Description`

## 10. Kiểm tra báo cáo công nợ

Vào menu `Báo cáo`.

Chọn `Khoảng ngày` trước nếu cần.

Các tab nên test:

- `Tổng hợp chi nhánh`
- `Tổng hợp khách hàng`
- `Phải thu`
- `Phải trả`
- `Phải thu quá hạn`
- `Phải trả quá hạn`
- `Lãi lỗ`
- `Dòng tiền`

Nếu cần file Excel:

- bấm `Xuất Excel`

Để test công nợ theo workflow, nên xem tối thiểu:

1. `Phải thu`
2. `Phải trả`
3. `Tổng hợp chi nhánh`
4. `Dòng tiền`

## 11. Mapping workflow gốc sang frontend

### Làm được trực tiếp trên frontend

- Tạo chi nhánh
- Tạo đối tác khách hàng / vendor
- Tạo nhân viên
- Tạo job
- Tạo báo giá
- Tạo tạm ứng
- Duyệt / từ chối / hoàn ứng
- Tạo debit note
- Tự áp báo giá vào debit note
- Chốt và gửi debit note
- Tạo revenue / cost
- Post revenue / cost
- Đánh dấu chi hộ
- Xem báo cáo công nợ

### Chưa thấy màn hình rõ trên frontend hiện tại

- Tạo tài khoản quỹ tiền mặt / ngân hàng từ menu riêng
- Ghi phiếu thu / phiếu chi quỹ riêng kiểu:
  - thu khách qua ngân hàng
  - chi văn phòng phẩm tiền mặt
  - chi văn phòng phẩm chuyển khoản
  - thu tiền Anh Hòa nhập quỹ
- Màn hình SOA riêng biệt dưới tên `SOA`

Ghi chú:

- Một số nghiệp vụ trên đang tồn tại ở backend hoặc được phản ánh gián tiếp qua `Accounting`, `COB`, `Reports`.
- Nếu cần test đúng nghiệp vụ quỹ, frontend hiện tại có thể cần bổ sung màn hình `Treasury`.

## 12. Checklist test tay đề xuất

1. Tạo `Branch`
2. Tạo `Customer`
3. Tạo `Vendor`
4. Tạo `Employee`
5. Tạo 2 hoặc nhiều `Job`
6. Tạo đầy đủ `Pricing`
7. Tạo `Advance`
8. `Approve` advance
9. `Settle` advance
10. Tạo `Debit Note`
11. Bấm `Auto Apply Pricing`
12. Chỉnh tổng tiền theo case test
13. `Post` debit note
14. `Send` debit note
15. Tạo `Revenue`
16. Tạo `Cost`
17. `Post` revenue/cost
18. `Mark as COB` cho cost cần chi hộ
19. Vào `Reports` kiểm tra `Receivables`, `Payables`, `Branch Summary`

## 13. File liên quan để đối chiếu UI

Nếu cần so tiếp UI:

- [routes.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/config/routes.js:1>)
- [jobs/create/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/jobs/create/page.js:1>)
- [pricing/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/pricing/page.js:1>)
- [advances/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/advances/page.js:1>)
- [debit-notes/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/debit-notes/page.js:1>)
- [accounting/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/accounting/page.js:1>)
- [cob/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/cob/page.js:1>)
- [reports/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/reports/page.js:1>)
- [branches/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/branches/page.js:1>)
- [partners/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/partners/page.js:1>)
- [hrm/page.js](</d:/CODE/hr-duongminh/front end/hr-duongminh-app-fe/app/hrm/page.js:1>)
