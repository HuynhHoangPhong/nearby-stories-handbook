# Nearby Stories Handbook

Website tài liệu sản phẩm chạy độc lập bằng **React + TypeScript + Vite**. Project có dữ liệu, ảnh, phông, cấu hình và dependency riêng. Không cần khởi động Nearby Stories, Docker, backend hoặc cơ sở dữ liệu.

## Chạy website

Tại thư mục project:

```sh
npm install
npm run dev
```

Mở `http://127.0.0.1:5175` theo địa chỉ Vite in ra.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Bản production nằm trong `dist`. Đây là frontend tĩnh, có thể đưa nguyên thư mục lên hosting tĩnh. URL dạng hash, ví dụ `#/uc6`, không cần rewrite hoặc backend. `base: './'` hỗ trợ hosting dưới thư mục con.

## Cấu trúc

```text
src/
  components/       Sidebar, trang nội dung, phần mã nguồn, hình phóng to
  content/          Dữ liệu từ DOCX, diễn giải tiếng Việt, mục lục, code map
  assets/fonts/     Be Vietnam Pro tự lưu trong project
  config/           Đường dẫn ảnh và repository tham khảo
  lib/              Hiệu ứng giấy và âm thanh
public/
  diagrams/         35 hình từ PRD và báo cáo
  documents/        Bản PRD gốc lưu kèm
tools/Handbook/     Công cụ cập nhật nội dung và kiểm tra bằng trình duyệt
docs/              Kế hoạch và đối chiếu mã nguồn
```

## Nguồn và cách cập nhật

`PRD.docx` là nguồn chính cho backlog, business rules, Use case v2 và ERD. `PRD_DFD.docx` là nguồn cho bảy hình DFD. `Nhom2_BaoCao_CNPM.docx` bổ sung hai sơ đồ tuần tự cho UC8 và UC9. Handbook có 23 user story, 16 business rule, 9 use case, 35 hình và 32 bảng ERD. US22 và US23 giữ mức Should theo PRD.

Build thường ngày dùng dữ liệu đã đóng gói. Khi có tài liệu Word mới, dùng Python có `lxml` để cập nhật ảnh, dữ liệu và bản PRD tải xuống.

```sh
python tools/Handbook/extract_document.py --source "C:/code/CNPM/V2/PRD.docx" --report "C:/code/CNPM/V2/Nhom2_BaoCao_CNPM.docx" --dfd "C:/code/CNPM/V2/PRD_DFD.docx" --app .
```

Tạo lại các liên kết mã nguồn từ phiên bản đã có trên GitHub.

```sh
python tools/Handbook/build_code_references.py --root "C:/code/Nearby-Stories" --revision origin/main --app .
```

`generated.json` ghi nguồn của từng hình và dữ liệu trích từ Word. `editorial.ts`, `introduction.ts` và `data-flows.ts` giữ phần diễn giải dùng trên web. Công cụ tạo liên kết lấy nội dung và số dòng từ cùng một commit Git. Sau khi các chú thích DFD có trên GitHub, chạy `git fetch origin` trong repo Nearby Stories rồi tạo lại liên kết và build để số dòng theo bản đã phát hành.

## Cách đọc và điều hướng

- Các nhóm mục lục đóng khi mở handbook. Tìm kiếm tiếng Việt không dấu hiển thị các mục phù hợp. Có thể mở trực tiếp từng mục bằng URL.
- Thanh đầu trang có liên kết tới báo cáo, quản lí công việc, GitHub và PRD. Nút tiếng giấy nằm ở ngoài cùng bên phải.
- Giải thích UC hiển thị đầy đủ, không có các nút bước 1/2/3.
- Mục lục DFD có Level 0, Level 1 và Level 2. Trang Level 2 dẫn tới năm sơ đồ con. Level 1 cũng có liên kết tới Level 2 và các ERD liên quan. Tab Mã nguồn nhóm liên kết theo tiến trình.
- ERD liệt kê các bảng của Catalog (20), Identity (8), Localization (2) và Speech (2). Có phần tra cứu khóa, kiểu và ý nghĩa từng thuộc tính.
- Mã nguồn giữ tên file, đường dẫn, hàm, số dòng, trách nhiệm và liên kết mã gốc.
- Mục **Commit** nằm cuối mục lục và có ba trang thành viên. HuynhHoangPhong có 14 commit, n1giahuy có 11 và ThNhan713 có 24. Danh sách theo lịch sử nhánh `main` tại `c6c1f8a`, với ngày ở cột phải. Chọn tiêu đề để xem mục tiêu, tác dụng của từng thay đổi, diễn giải theo tệp và liên kết GitHub. Tệp của commit gộp nhánh được đối chiếu với trạng thái của nhánh nhận trước khi gộp.
- Hiệu ứng lật trang hai mặt kéo dài 1,35 giây. Tiếng giấy tổng hợp chỉ phát ở Trang trước / Trang sau khi bật tiếng.
- Sidebar, mở code, phóng to và nút bật tiếng không phát âm thanh. Tôn trọng thiết lập giảm chuyển động của thiết bị.
- Trang sách dùng nền trắng. Bìa, thanh điều hướng và mục lục dùng các sắc xanh lam. Phông Be Vietnam Pro được lưu trong project.

Kế hoạch chi tiết: `docs/handbook-implementation-plan.md`. Đối chiếu công nghệ và code: `docs/handbook-code-research.md`.
