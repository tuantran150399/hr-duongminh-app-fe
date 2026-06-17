# Workflow Dự án & Kiến trúc (Next.js + Redux Toolkit + Ant Design)

## 1. Tổng quan kiến trúc (Architecture)
- **Framework:** Next.js (App Router - sử dụng thư mục `app/`).
- **State Management & Data Fetching:** Redux Toolkit kết hợp với RTK Query.
- **UI Library:** Ant Design (antd).
- **Styling:** CSS (`globals.css`).

## 2. Workflow Phát triển (Development Workflow)
Khi cần phát triển thêm một tính năng mới hoặc một module mới, hãy tuân theo workflow chuẩn sau:

1. **Định nghĩa API (RTK Query):**
   - Thêm các endpoints mới vào file service tương ứng tại `store/services/` (ví dụ `jobsApi.js`, `hrmApi.js`).
   - Nếu là tính năng hoàn toàn mới, hãy tạo một file service mới sử dụng `createApi` và `axiosBaseQuery` hoặc `fetchBaseQuery` (được cấu hình chung tại dự án).
   - Export các hooks auto-generated từ RTK Query (vd: `useGetFeatureQuery`, `useAddFeatureMutation`).

2. **Đăng ký Reducer/Middleware (Chỉ áp dụng khi tạo service mới):**
   - Import API mới vào `store/index.js`.
   - Thêm vào `reducer` và `middleware` trong `configureStore`.

3. **Xây dựng UI Components:**
   - Tái sử dụng tối đa các components có sẵn trong `components/`.
   - Tạo components mới trong `components/` nếu có thể dùng lại ở nhiều nơi.
   - Sử dụng các components của Ant Design (Table, Form, Modal, Button...) thay vì tự code HTML/CSS.

4. **Tạo Page & Tích hợp UI (Next.js App Router):**
   - Tạo thư mục route mới trong `app/` (ví dụ `app/new-feature/page.js`).
   - Gọi các hooks từ RTK Query (đã định nghĩa ở bước 1) để lấy hoặc thay đổi dữ liệu.
   - Lấy global state thông thường thông qua `useAppSelector` và dispatch actions qua `useAppDispatch` từ `store/hooks.js`.

## 3. Danh sách các Components hiện có (Tránh tạo lặp lại)
Các components dùng chung được lưu tại thư mục `components/`:

- **`AccountSettingsModal.js`**: Modal hiển thị và cập nhật cài đặt tài khoản người dùng.
- **`AppProviders.js`**: Provider bao bọc ngoài cùng ứng dụng (bao gồm AntdRegistry, ConfigProvider, StoreProvider cho Redux, và Context xử lý đa ngôn ngữ/từ điển).
- **`AuthGuard.js`**: Component bảo vệ route, dùng để kiểm tra session đăng nhập và phân quyền trước khi render nội dung page.
- **`FilterCard.js`**: Component giao diện chứa các form bộ lọc tìm kiếm chung trên đầu các trang danh sách.
- **`NotificationBell.js`**: Component hiển thị icon chuông thông báo (thường ở Header).
- **`PageHeader.js`**: Component hiển thị tiêu đề của trang và các thành phần breadcrumb, nút action ở góc trên.
- **`StatusTag.js`**: Component hiển thị trạng thái (vd: Active, Draft, Approved) bằng các tag màu sắc tương ứng của antd.
- **`DashboardLayout.js`** (nằm trong `layouts/`): Layout bao bọc chính cho ứng dụng quản trị sau khi đăng nhập (chứa Sidebar navigation, Header...).

## 4. Danh sách các Hooks hiện có (Tránh tạo lặp lại)
Dự án đã thiết lập sẵn các custom hooks tại `store/hooks.js`. Bắt buộc sử dụng các hooks này thay vì import từ `react-redux`:
- **`useAppDispatch`**: Dùng thay thế `useDispatch` để hỗ trợ Typescript/intellisense tốt hơn.
- **`useAppSelector`**: Dùng thay thế `useSelector`.

**Các Hooks API Sinh ra từ RTK Query (`store/services/*`):**
Toàn bộ thao tác fetch dữ liệu và call API phải dùng RTK Query Hooks. **KHÔNG** dùng `axios` kết hợp `useEffect` và `useState` thủ công trên component. Dự án hiện đã có các services sau:
- **`accountingApi`**, **`adjustmentsApi`**, **`adminApi`**, **`adminExtApi`**, **`advancesApi`**, **`authApi`**
- **`cobApi`**, **`dashboardApi`**, **`debitNotesApi`**, **`debtPoliciesApi`**, **`hrmApi`**, **`jobsApi`**
- **`notificationsApi`**, **`partnersApi`**, **`paymentRequestsApi`**, **`pricingApi`**, **`reportsApi`**, **`securityApi`**

Mỗi file service trên sẽ xuất ra các hooks dạng: `useGet...Query`, `useCreate...Mutation`, `useUpdate...Mutation`... Hãy kiểm tra file tương ứng trước khi định nghĩa thêm API.

## 5. Các lưu ý quan trọng khác cho Agent
- **Đa ngôn ngữ (i18n):** Hệ thống text đang được quản lý trực tiếp bằng object `dictionary` bên trong file `components/AppProviders.js`. Hãy bổ sung text vào đây nếu cần hỗ trợ đa ngôn ngữ.
- **Utility Functions:** Kiểm tra thư mục `utils/` trước khi viết các hàm format dữ liệu (ví dụ format tiền tệ, mapping API error, handle form utilities đã có trong `apiMappers.js`, `getApiError.js`, `formUtils.js`).
