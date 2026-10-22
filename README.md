# BookShelf - Mobile Reading Management Application

**BookShelf** là ứng dụng di động (React Native / Expo) cho phép người dùng quản lý danh sách sách cá nhân, phân loại theo thể loại, trạng thái đọc, ghi chú, đánh giá sao và đánh dấu yêu thích.

Ứng dụng được xây dựng theo chuẩn Expo Router, quản lý trạng thái bằng React Context và kết nối thời gian thực với Firebase Authentication và Cloud Firestore Database.

---

## 1. Hướng Dẫn Cài Đặt & Khởi Chạy

### 1.1 Yêu Cầu Môi Trường
- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn / bun

### 1.2 Cài Đặt Thư Viện
Mở terminal tại thư mục dự án và chạy:
```bash
npm install
```

### 1.3 Cấu Hình Firebase
Theo yêu cầu bảo mật, các khóa bí mật của Firebase không được đưa lên Git. Hãy tạo file `.env` tại thư mục gốc của dự án (hoặc sao chép từ `.env.example`):

```bash
cp .env.example .env
```

Điền các thông tin từ Firebase Project Console của bạn vào `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 1.4 Khởi Chạy Ứng Dụng
```bash
npx expo start
```
- Nhấn `w` để mở giao diện Web trên trình duyệt.
- Nhấn `a` để mở trên thiết bị Android Emulator hoặc quét mã QR qua Expo Go.
- Nhấn `i` để mở trên thiết bị iOS Simulator.

---

## 2. Thiết Lập Firebase Cho Người Chấm Điểm (Grader)

### 2.1 Firebase Authentication
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Chọn dự án của bạn -> **Authentication** -> **Sign-in method**.
3. Bật nhà cung cấp **Email/Password**.
4. Tạo một tài khoản thử nghiệm dành cho người chấm điểm trong tab **Users** (hoặc người chấm có thể đăng ký trực tiếp qua màn hình Register của ứng dụng).

### 2.2 Cloud Firestore Database & Security Rules
1. Trong Firebase Console -> **Firestore Database** -> Tạo cơ sở dữ liệu.
2. Sao chép toàn bộ nội dung từ file [`firestore.rules`](./firestore.rules) vào tab **Rules** của Firestore và nhấn **Publish**.

Quy tắc bảo mật đảm bảo:
- Chỉ người dùng đã đăng nhập mới có quyền đọc và chỉnh sửa dữ liệu sách của chính họ.
- Tự động từ chối mọi thao tác ghi dữ liệu không hợp lệ (tiêu đề trống, tác giả trống, sai thể loại, sai trạng thái, rating sai khoảng, ghi chú quá dài, ghi đè sách của người khác).
- Cùng một người dùng không thể lưu trùng cặp `title` + `author` (kể cả khác chữ hoa/thường). Hai người dùng khác nhau vẫn được phép lưu cùng một cuốn sách.

---

## 3. Cấu Trúc Bảng Dữ Liệu `books`

Collection duy nhất: `books`

| Tên trường | Kiểu dữ liệu | Ý nghĩa / Giá trị lưu trữ |
| :--- | :--- | :--- |
| `id` | `string` | Mã định danh duy nhất cho từng cuốn sách (Firestore document ID) |
| `userId` | `string` | UID của người dùng đang đăng nhập sở hữu cuốn sách |
| `title` | `string` | Tiêu đề sách (bắt buộc, không chỉ chứa khoảng trắng, tối đa 100 ký tự) |
| `author` | `string` | Tác giả cuốn sách (bắt buộc, không chỉ chứa khoảng trắng, tối đa 60 ký tự) |
| `genre` | `string` | Một trong các giá trị: `Fiction`, `Non-Fiction`, `Academic`, `Other` |
| `status` | `string` | Một trong các giá trị: `To Read`, `Reading`, `Finished` |
| `rating` | `number \| null` | Đánh giá tùy chọn từ 0 đến 5 (số nguyên thuần) |
| `favorite` | `boolean` | `true` hoặc `false` (mặc định là `false`) |
| `notes` | `string` | Ghi chú ngắn tùy chọn (tối đa 300 ký tự) |
| `createdAt` | `timestamp` | Thời điểm sách được thêm vào |

---

## 4. Danh Sách Các `testID` và Chuỗi Ký Tự Hiển Thị Chính Xác

| `testID` | Vị trí / Màn hình | Nội dung hiển thị / Mục đích |
| :--- | :--- | :--- |
| `home-title` | Màn hình Home | Văn bản: `BookShelf` |
| `error-auth` | Màn hình Login & Register | Hiển thị thông báo lỗi khi Firebase Authentication từ chối |
| `form-success` | Màn hình Register | Văn bản: `Registration successful` khi đăng ký thành công |
| `list-screen` | Màn hình List | Thẻ container bao bọc toàn bộ màn hình List của người dùng đăng nhập |
| `book-form` | Màn hình List | Thẻ container form thêm sách mới |
| `book-success` | Màn hình List | Văn bản: `Book added` khi thêm sách thành công vào Firestore |
| `error-book` | Màn hình List | Hiển thị thông báo lỗi khi Firestore từ chối (ví dụ trùng title + author) |
| `book-item` | Màn hình List | Mỗi hàng / card cuốn sách hiển thị trong danh sách |
| `books-empty` | Màn hình List | Văn bản: `No books found` khi danh sách không có sách hiển thị |
| `book-count` | Màn hình List | Số nguyên thuần thể hiện tổng số sách đang hiển thị trên màn hình |
| `favorite-count` | Màn hình List | Số nguyên thuần thể hiện số sách yêu thích đang hiển thị trên màn hình |

---

## 5. Quy Tắc Xác Thực Dữ Liệu Biểu Mẫu (Validation)

### 5.1 Biểu Mẫu Register & Login
- Email để trống: `Email is required`
- Email không đúng định dạng: `Please enter a valid email address`
- Password để trống: `Password is required`
- Password ít hơn 6 ký tự (chỉ Register): `Password must be at least 6 characters`
- Confirm password để trống (Register): `Confirm password is required`
- Confirm password không khớp (Register): `Passwords do not match`

### 5.2 Biểu Mẫu Thêm Sách & Sửa Sách (Add / Edit Book)
- Title để trống hoặc chỉ có khoảng trắng: `Title is required`
- Title dài hơn 100 ký tự: `Title must be at most 100 characters`
- Author để trống hoặc chỉ có khoảng trắng: `Author is required`
- Author dài hơn 60 ký tự: `Author must be at most 60 characters`
- Genre chưa chọn: `Please choose a genre` (mục đầu tiên để trống mang chữ `Choose genre`)
- Status chưa chọn: `Please choose a status` (mục đầu tiên để trống mang chữ `Choose status`)
- Rating (nếu có nhập): không phải số nguyên từ 0 đến 5: `Rating must be a whole number from 0 to 5`
- Notes dài hơn 300 ký tự: `Notes must be at most 300 characters`
