# Kiểm tra handbook ngày 15/11/2026

- TypeScript, bản dựng Vite và 8 kiểm thử nội dung đều đạt.
- Chromium đã kiểm tra 51 mục lục, gồm 34 trang có tab Mã nguồn và 16 liên kết ở trang Công nghệ. Trang DFD Level 2 liệt kê đủ 5 sơ đồ con. Đã kiểm tra liên kết tới ERD, phóng to và tải hình.
- Bảy hình DFD trùng với hình trong `PRD_DFD.docx`. Bốn ERD đối chiếu với 32 bảng trong EF Core.
- Đã kiểm tra nền sách trắng, vùng xanh bên ngoài và năm nút đầu trang ở 12 kích thước từ 320 đến 1440 px. Bốn liên kết đầu trang mở tab mới. Nút tiếng giấy ở ngoài cùng bên phải.
- Các nhóm mục lục đóng khi mở trang hoặc tải lại một liên kết trực tiếp. Tìm kiếm hiển thị các mục phù hợp. Nhóm DFD dùng nhãn gọn và phần ghi chú cũ ở cuối mục lục đã được gỡ.
- Đã đối chiếu 103 đích liên kết theo tệp và dòng ở commit `fbf425462cbab0e1ec5e8a70d1f190f7af4f8696`, đang là `main` trên GitHub tại lúc kiểm tra. Liên kết cần quyền đọc repo.
- Trong repo Nearby Stories trên máy, 60 chú thích trong 23 tệp bao phủ 10 tiến trình Level 1 và 27 tiến trình con Level 2. Đã so sánh với commit GitHub và xác nhận toàn bộ thay đổi mã nguồn là chú thích. Khi chú thích được đưa lên GitHub, tạo lại liên kết theo hướng dẫn trong README để lấy số dòng mới.

- Đối chiếu 49 commit và 1.784 lượt thay đổi tệp với lịch sử Git tại `c6c1f8a`. ThNhan713 được đối chiếu qua các tên tác giả Do Nhan, Nhan, ThNhan và ThNhan713 có cùng địa chỉ tác giả trong Git. Danh sách của commit gộp nhánh được so với cha thứ nhất. Chromium kiểm tra đủ 49 trang chi tiết, tên commit, ngày, mục tiêu, các gạch đầu dòng, vị trí liên kết và nhóm tệp.

## Chạy lại kiểm tra

```sh
npm test
npm run build
node tools/Handbook/browser-check.cjs <duong-dan-module-playwright> <duong-dan-chromium> <thu-muc-ket-qua>
```

Kiểm tra trình duyệt đọc bản dựng trong `dist`. Công cụ tạo liên kết lấy dòng và đoạn trích từ cùng một commit Git.
