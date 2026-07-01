# Workflow test — Công nợ, Debit Note, chi hộ/thu hộ và void

Ngày cập nhật: 2026-07-01

## 1. Phạm vi

Tài liệu dùng để test các thay đổi:

- Kiểm tra hạn mức khi tạo hoặc sửa Debit Note.
- Đưa khoản chi hộ vào Debit Note và tránh tính công nợ hai lần.
- Ghi nhận thanh toán, xóa Draft và void Debit Note.
- Void chi hộ và thu hộ.
- Màn **Tổng quan công nợ** sử dụng dữ liệu thật từ backend.
- Đổi ngôn ngữ Việt/Anh trên các giao diện liên quan.

## 2. Điều kiện trước khi test

- Đã chạy migration:
  - `1748800000000-LinkCobToDebitNotes`
  - `1748810000000-AddVoidSupportToCobEntries`
- User test có quyền `partner:manage`, `accounting:view` và `accounting:post`.
- Có khách hàng A với chính sách công nợ đang hiệu lực:
  - Hạn mức: `300.000.000 VND`.
  - Ngày bắt đầu không lớn hơn ngày test.
  - Chưa hết ngày kết thúc hoặc không có ngày kết thúc.
- Có hai lô hàng thuộc khách hàng A:
  - Lô 1: dịch vụ `50.000.000 VND`.
  - Lô 2: dịch vụ `100.000.000 VND`.
- Có khoản chi hộ `10.000.000 VND` thuộc lô 2, trạng thái `OPEN`.

Nên test trên dữ liệu riêng và ghi lại ID của Partner, Job, COB, Debit Note và Revenue Entry để đối chiếu.

## 3. Workflow A — Tạo Debit trong hạn mức

1. Mở module Debit Note và chọn khách hàng A.
2. Chọn lô 1 và lô 2.
3. Kiểm tra danh sách chi hộ khả dụng có khoản `10.000.000 VND` của lô 2.
4. Chọn khoản chi hộ này.
5. Kiểm tra tổng tiền trước khi lưu.
6. Lưu Debit Note.

Kết quả mong đợi:

- Tổng dịch vụ: `150.000.000 VND`.
- Tổng chi hộ: `10.000.000 VND`.
- Tổng Debit Note: `160.000.000 VND`.
- Preview hiển thị công nợ dự kiến `160.000.000 VND` nếu trước đó khách chưa có nợ.
- Debit Note được tạo thành công.
- Dòng chi hộ lưu đúng `cobEntryId`, không cho sửa số tiền nguồn.
- Khoản chi hộ có `billedDebitNoteId` bằng ID Debit vừa tạo.
- Revenue riêng do chi hộ sinh ra chuyển sang `VOIDED` để không bị cộng hai lần.
- Tổng quan công nợ của khách hàng A hiển thị `160.000.000 VND`.

## 4. Workflow B — Chặn vượt hạn mức

1. Giữ hạn mức khách hàng A là `300.000.000 VND`.
2. Tạo Debit Note mới có tổng tiền `500.000.000 VND`.
3. Theo dõi phần preview và bấm lưu.
4. Gọi trực tiếp API tạo Debit với cùng payload để kiểm tra không thể bỏ qua FE.

Kết quả mong đợi:

- FE cảnh báo công nợ dự kiến vượt hạn mức.
- FE không cho lưu.
- BE trả lỗi `DEBT_LIMIT_EXCEEDED`.
- Response có `currentDebt`, `projectedDebt`, `exceededBy` và thông tin policy.
- Không có Debit Note, Debit Note Line hoặc liên kết COB mới được lưu dở dang.

## 5. Workflow C — Không sử dụng một khoản chi hộ cho hai Debit

1. Dùng khoản chi hộ đã nằm trong Debit Note ở Workflow A.
2. Mở form tạo Debit Note khác cho cùng khách hàng và lô hàng.
3. Kiểm tra danh sách chi hộ khả dụng.
4. Thử gọi API trực tiếp với `cobEntryId` đã sử dụng.

Kết quả mong đợi:

- Khoản chi hộ không xuất hiện trong danh sách khả dụng của Debit mới.
- BE từ chối nếu gửi thủ công `cobEntryId` đó.
- Công nợ không bị cộng thêm `10.000.000 VND` lần thứ hai.

## 6. Workflow D — Sửa Debit Note

1. Mở Debit Note Draft có tổng `160.000.000 VND`.
2. Thay đổi dòng dịch vụ từ `50.000.000` thành `70.000.000 VND`.
3. Giữ khoản chi hộ `10.000.000 VND`.
4. Kiểm tra preview và lưu.

Kết quả mong đợi:

- Tổng Debit mới là `180.000.000 VND`.
- Preview loại Debit cũ ra trước khi cộng Debit mới; không được tính `160 + 180`.
- Công nợ sau lưu là `180.000.000 VND` nếu khách không có khoản nợ khác.
- Liên kết chi hộ vẫn giữ nguyên.

Tiếp tục bỏ chọn khoản chi hộ và lưu lại.

Kết quả mong đợi:

- Tổng Debit giảm `10.000.000 VND`.
- `billedDebitNoteId` của chi hộ được xóa.
- Revenue riêng của chi hộ được khôi phục về `POSTED`.
- Khoản chi hộ xuất hiện lại trong danh sách khả dụng.
- Tổng công nợ vẫn đúng và không bị thiếu hoặc cộng hai lần.

## 7. Workflow E — Thanh toán Debit Note

1. Tạo/Post Debit Note `160.000.000 VND`.
2. Ghi nhận thanh toán một phần `60.000.000 VND`.
3. Mở Tổng quan công nợ.
4. Ghi nhận thanh toán phần còn lại `100.000.000 VND`.

Kết quả mong đợi:

- Sau thanh toán lần 1: `paidAmount = 60.000.000`, số dư nợ là `100.000.000 VND`, trạng thái `PARTIAL`.
- Drawer Tổng quan công nợ hiển thị số dư `100.000.000 VND`, không hiển thị nguyên giá trị `160.000.000 VND`.
- Sau thanh toán đủ: trạng thái `PAID`.
- Khoản Debit không còn trong danh sách công nợ đang mở.
- Công nợ khách hàng giảm tương ứng.

## 8. Workflow F — Xóa Debit Draft

1. Tạo Debit Draft có liên kết một khoản chi hộ.
2. Xóa Debit Draft.

Kết quả mong đợi:

- Chỉ Debit trạng thái `DRAFT` được phép xóa.
- Debit lines được xóa.
- Liên kết `billedDebitNoteId` được giải phóng.
- Revenue riêng của chi hộ trở lại `POSTED`.
- Công nợ khách hàng được tính lại.
- Khoản chi hộ có thể được chọn cho Debit mới.

## 9. Workflow G — Void Debit Note

1. Void một Debit Note đang còn nợ và có liên kết chi hộ.
2. Nhập lý do void.
3. Kiểm tra Debit, Revenue, COB và Tổng quan công nợ.

Kết quả mong đợi:

- Debit Note chuyển `VOIDED`, lưu `voidedAt`, `voidedBy`, `voidReason`.
- Revenue của Debit chuyển `VOIDED`.
- Chi hộ được gỡ khỏi Debit và có thể sử dụng lại.
- Revenue riêng của chi hộ trở lại `POSTED`.
- Công nợ khách hàng được tính lại đúng.
- Audit log có action `VOID`.

## 10. Workflow H — Void chi hộ

API:

```http
POST /accounting/cob/:id/void
Content-Type: application/json

{
  "reason": "Nhập sai khoản chi hộ"
}
```

Test lần lượt các trường hợp:

1. Chi hộ `OPEN`, chưa nằm trong Debit.
2. Chi hộ đã `SETTLED`.
3. Chi hộ đang nằm trong Debit Note.
4. Chi hộ đã `VOIDED`.

Kết quả mong đợi:

- Trường hợp 1: chi hộ, thu hộ theo cặp và Revenue liên quan cùng chuyển `VOIDED`; công nợ được giảm; có audit `VOID_COB`.
- Trường hợp 2: BE từ chối void.
- Trường hợp 3: BE từ chối và yêu cầu xử lý từ Debit Note.
- Trường hợp 4: BE báo khoản đã void.

## 11. Workflow I — Void thu hộ

API:

```http
POST /accounting/collect-on-behalf/:id/void
Content-Type: application/json

{
  "reason": "Nhập sai khoản thu hộ"
}
```

Kết quả mong đợi:

- Thu hộ độc lập, trạng thái `OPEN`: chuyển `VOIDED`, có `voidedAt`, `voidedBy` và audit `VOID_COLLECT`.
- Thu hộ đã `SETTLED`: không được void.
- Thu hộ được tạo theo cặp với chi hộ: không được void riêng; phải void chi hộ gốc.
- Thu hộ đã `VOIDED`: không được void lần hai.

## 12. Workflow J — Tổng quan công nợ

1. Mở `/debts`.
2. Kiểm tra bốn chỉ số tổng hợp.
3. Kiểm tra danh sách khách hàng.
4. Lọc lần lượt `Bình thường`, `Sắp chạm hạn mức`, `Vượt hạn mức`, `Có nợ quá hạn`.
5. Bấm vào khách hàng A để mở drawer chi tiết.

Kết quả mong đợi:

- Không còn sử dụng mock data.
- `Tổng công nợ` bằng tổng các khoản `POSTED`, chưa thanh toán.
- Debit Note thanh toán một phần chỉ tính phần còn lại.
- `Nợ quá hạn` chỉ tính khoản có `dueDate` nhỏ hơn ngày hiện tại.
- Trạng thái được xác định theo thứ tự ưu tiên:
  1. Có nợ quá hạn → `overdue`.
  2. Sử dụng từ 100% hạn mức → `over_limit`.
  3. Sử dụng từ 80% đến dưới 100% → `near_limit`.
  4. Các trường hợp còn lại → `normal`.
- Drawer thể hiện được khoản nợ gồm:
  - Loại `Debit Note` hoặc `Khoản phải thu`.
  - Mã chứng từ/hóa đơn.
  - Số lô hàng.
  - Nội dung.
  - Số tiền còn nợ.
  - Ngày đến hạn và trạng thái quá hạn.

## 13. Workflow K — Đổi ngôn ngữ

1. Mở màn Tổng quan công nợ bằng tiếng Việt.
2. Chuyển sang English từ header.
3. Mở drawer chi tiết.
4. Chuyển lại tiếng Việt.

Kết quả mong đợi:

- Tiêu đề, bộ lọc, cột bảng, loại khoản nợ và trạng thái đổi đúng ngôn ngữ.
- Không hiển thị raw value như `near_limit`, `over_limit`, `DEBIT_NOTE` hoặc `RECEIVABLE`.
- Ngày tiếng Việt dùng `DD/MM/YYYY`.
- Ngày tiếng Anh dùng `MM/DD/YYYY`.
- Dữ liệu tiền và công nợ không thay đổi khi đổi ngôn ngữ.

## 14. Kiểm tra API và phân quyền

| API | Quyền cần có | Kết quả |
| --- | --- | --- |
| `GET /debts/summary` | `partner:manage` | Trả tổng hợp công nợ thật |
| `GET /debts/customers` | `partner:manage` | Trả danh sách và hỗ trợ lọc status |
| `GET /debts/customers/:id/items` | `partner:manage` | Trả chi tiết khoản đang nợ |
| `POST /debit-notes/debt-preview` | Theo quyền Debit Note hiện tại | Trả preview hạn mức |
| `GET /debit-notes/cob-candidates` | Theo quyền Debit Note hiện tại | Trả chi hộ khả dụng |
| `POST /accounting/cob/:id/void` | `accounting:post` | Void chi hộ hợp lệ |
| `POST /accounting/collect-on-behalf/:id/void` | `accounting:post` | Void thu hộ độc lập hợp lệ |

User không có quyền phải nhận `403` và không được nhìn thấy hoặc thay đổi dữ liệu ngoài phạm vi cho phép.

## 15. Checklist nghiệm thu nhanh

- [ ] Debit `500 triệu` bị chặn khi hạn mức là `300 triệu`.
- [ ] Hai lô `50 + 100 triệu` và chi hộ `10 triệu` tạo công nợ đúng `160 triệu`.
- [ ] Chi hộ trong Debit không bị tính hai lần.
- [ ] Một chi hộ không thể nằm trong hai Debit.
- [ ] Sửa Debit không cộng đồng thời giá trị Debit cũ và mới.
- [ ] Thanh toán một phần chỉ còn hiển thị số dư.
- [ ] Xóa Draft và void Debit giải phóng chi hộ đúng cách.
- [ ] Void chi hộ đồng bộ khoản thu hộ theo cặp và Revenue.
- [ ] Không void riêng thu hộ được tạo theo cặp với chi hộ.
- [ ] Tổng quan công nợ lấy dữ liệu thật và drawer chỉ ra từng khoản nợ.
- [ ] Bộ lọc trạng thái trả đúng kết quả.
- [ ] Toàn bộ label, trạng thái và ngày tháng đổi đúng Việt/Anh.
- [ ] Audit log ghi nhận các thao tác void.
