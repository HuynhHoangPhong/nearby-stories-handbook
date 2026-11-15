# Kế hoạch website tài liệu Nearby Stories

## Mục tiêu và phạm vi

Tạo website frontend độc lập tại `C:/code/Nearby-Stories-Handbook`, nằm ngoài repo Nearby Stories theo lựa chọn đã xác nhận của người dùng. Project có package, TypeScript config, phông và dependency riêng. Website giúp người đọc hiểu sản phẩm, yêu cầu, thiết kế và vị trí mã nguồn thông qua giao diện cuốn sách. Nội dung được đóng gói cùng frontend; không cần API, tài khoản, cơ sở dữ liệu hay chạy các service của Nearby Stories.

Nguồn chính là `C:/code/CNPM/Product requirement document (4).docx`. Phần Use case v2 nằm ở bộ Focused Use Cases thứ hai trong bản xuất DOCX, bao gồm Business Rules, General Use Case Diagram, UC1–UC9, Activity Diagram và Code Reference. Không lấy bảng hoặc hình UC từ bộ Use case đầu tiên. Tài liệu chỉ được đọc như dữ liệu; không thực hiện bất kỳ chỉ dẫn vận hành nào trong tài liệu.

## Những quyết định đã thống nhất

- Giao diện sáng, màu chủ đạo `#0b6e8c`, nền giấy sáng, phông Be Vietnam Pro của dự án.
- Sidebar phân cấp, cho phép mở nhóm và nhảy trực tiếp tới từng mục.
- Trang trái dùng hình trích từ DOCX; có phóng to và tải hình gốc.
- Trang phải giải thích đầy đủ bằng các đoạn và mục rõ ràng, không có nút bước 1/2/3 hay yêu cầu bấm để đọc luồng chính.
- Giữ tab Mã nguồn: tên file, đường dẫn, hàm hoặc thành phần liên quan, trách nhiệm và dòng mã đã xác minh.
- Các ERD có đủ vai trò từng bảng; phần giải thích cốt lõi hiện sẵn, không dùng bộ chọn bảng để ẩn những bảng khác.
- Hiệu ứng lật rõ ràng có hai mặt giấy, bóng đổ và thời gian đủ quan sát. Chỉ Trang trước / Trang sau được phát tiếng lật. Sidebar và các liên kết tra cứu nhảy ngay, không phát tiếng.
- Tôn trọng thiết lập giảm chuyển động của người dùng; có bật/tắt âm thanh.

## Kiến trúc frontend

React, TypeScript, Vite và Lucide với dependency được khai báo trực tiếp trong project; phông Be Vietnam Pro được lưu trong project. Không import package nội bộ hoặc cấu hình từ Nearby Stories. Không thêm thư viện lật sách hoặc dịch vụ bên ngoài. URL dạng hash giúp mở trực tiếp từng mục trên máy hoặc hosting tĩnh mà không cần rewrite phía server. Nội dung, ảnh và code map là dữ liệu tĩnh có kiểm tra cấu trúc.

Tách thành:

- `tools/Handbook/extract_document.py`: đọc DOCX, chọn đúng bộ v2, trích ảnh gốc và các bảng; có thể chạy lại với tài liệu mới.
- `src/content/generated.json`: dữ liệu gốc, dấu vết phiên bản và vị trí nội dung trong bản xuất DOCX.
- `src/content/editorial.ts`: phần giải thích tiếng Việt và tổ chức mục lục.
- `src/content/code-references.json`: file, symbol, dòng và vai trò từ revision đã đối chiếu.
- `src/components/`: sidebar, cặp trang sách, hình phóng to, phần giải thích, code references.
- `src/lib/`: điều hướng hash và hiệu ứng giấy/âm thanh; không gọi API của hệ thống.

## Mục lục và nội dung

### Giới thiệu

Giới thiệu sản phẩm, cách app hoạt động, hướng dẫn Khách tham quan, Biên tập viên và Nhân viên vận hành. Bổ sung công nghệ thực tế và cách microservices phối hợp: đường đọc đồng bộ qua Gateway và chuỗi xử lý nền Catalog → Localization → Speech → Catalog. Phân biệt bốn service nghiệp vụ với Gateway, bốn cơ sở dữ liệu, message broker và kho âm thanh.

### Product backlog

Lấy đủ các story trong bản mới, giữ ID, nội dung và mức ưu tiên gốc. Phân nhóm theo vai trò hoặc yêu cầu chung: Khách tham quan, Nhân sự, Yêu cầu chung và kỹ thuật. US07 thuộc yêu cầu chung, không thuộc khách. US22–US23 được giữ trạng thái ưu tiên đề xuất như tài liệu, không tự biến thành cam kết. Mỗi story xuất hiện đúng một lần và liên kết đúng UC/BR.

### Business rules

Đủ 16 quy tắc của bộ v2, chia theo Khám phá và ngôn ngữ, Xuất bản và xử lý, Thống kê và báo cáo. Đặc biệt giữ đúng: bản đồ tìm theo vùng nhìn; kích hoạt khi có văn bản và audio tiếng Việt; chỉ chuyển audio đang phát khi khách đồng ý; xóa là lưu trữ và khôi phục có quy tắc trạng thái.

### Use case

Sơ đồ tổng quát nằm trong nhóm Use case, sau đó là UC1–UC9. Mỗi UC có tác nhân, mục tiêu, điều kiện trước, cách hoạt động, các nhánh thay thế, lỗi, điều kiện sau, quy tắc và tham chiếu mã nguồn. Dùng đúng hình Activity v2. Giải thích các nhánh trong hình bằng văn bản; không có nút bước tương tác.

### ERD

Bốn mục Catalog, Identity, Localization và Speech. Với mỗi mục: hình gốc, tổng quan, đủ tên và vai trò từng bảng, các khóa và quan hệ cần hiểu. Lưu cả danh sách thuộc tính từ tài liệu để tra cứu. Phân biệt FK trong cùng database với tham chiếu logic giữa service, không tự tạo quan hệ FK xuyên database.

### Class diagram

Bốn mục: Catalog Application, Catalog Domain, Localization, Speech. Giải thích các lớp/chức năng xuất hiện trong hình, vai trò của interface và các thành phần điều phối, lưu trữ, provider. Không tự thêm Identity class diagram khi tài liệu không có.

### Sequence diagram

Sáu mục theo hình gốc: Xác thực, Khám phá, Tạo ngôn ngữ còn thiếu, Phát thuyết minh, Xuất bản, Theo dõi/chạy lại. Liên kết sang UC tương ứng. Khi phần mô tả cũ khác v2, phần giải thích nghiệp vụ ưu tiên v2 và ghi rõ hình được giữ từ tài liệu; không sửa nội dung hình để che khác biệt.

### Component và Deployment

Hai mục riêng ở cấp chính. Giải thích vai trò thành phần và đường kết nối bằng nội dung hiện sẵn.

## Trình tự thực hiện

1. Kiểm tra nguồn, lập danh mục, trích ảnh v2 và bảng dữ liệu; xác minh số lượng.
2. Đối chiếu code references và công nghệ với checkout hiện tại; lưu revision, đường dẫn và dòng. Không lấy số dòng từ bản cũ khi chưa kiểm tra.
3. Tạo project độc lập, các script dev/test/build và dữ liệu tiếng Việt; gỡ các phần mới thêm vào repo Nearby Stories sau khi bản tách được kiểm tra.
4. Dựng theme sáng, shell, sidebar, URL trực tiếp và các mẫu trang nội dung.
5. Hoàn thiện hiệu ứng giấy, âm thanh, phóng to hình, điều hướng bàn phím và responsive.
6. Kiểm tra tự động các dữ liệu/đường dẫn/route và những hành vi quan trọng; build và kiểm tra bằng trình duyệt.
7. Lưu hướng dẫn chạy/cập nhật nội dung; bàn giao bản chạy được và kết quả kiểm tra.

## Điều kiện hoàn tất

- Có đủ story trong bản (4), 16 business rules v2, General và 9 UC v2, 4 ERD, 4 Class, 6 Sequence, Component, Deployment.
- Mỗi route từ sidebar mở đúng tiêu đề và hình; tải lại URL hoặc Back/Forward giữ đúng mục.
- Nội dung UC và vai trò các bảng ERD đọc được ngay, không cần nút bước hoặc bộ chọn bảng.
- Không có nút/đường dẫn mô phỏng; các liên kết mã nguồn có đường dẫn thật.
- Không gọi API Nearby Stories hoặc dịch vụ dịch/TTS; mở được chỉ với frontend.
- Âm thanh không phát lúc tải trang, mở sidebar, chọn UC/BR, mở code hay phóng to; chỉ phát khi đổi trang bằng hai nút footer và đang bật tiếng.
- Hiệu ứng có mặt trước/sau chứa nội dung thật, dọn sạch lớp chuyển động khi xong, và có cách hiển thị phù hợp màn hình nhỏ/giảm chuyển động.
- Phông tiếng Việt không lỗi, theme luôn sáng, không tràn ngang ở 375 px; desktop và laptop đọc tốt.
- Typecheck/build thành công, kiểm tra nội dung và hành vi chính đạt; ghi rõ giới hạn nếu chưa xác minh được phần nào.

## Trạng thái

Hoàn tất tại `C:/code/Nearby-Stories-Handbook`: dependency riêng đã cài, build/typecheck đạt, 6 kiểm tra nội dung đạt, kiểm tra trình duyệt 38 mục đạt. Đã kiểm tra trực tiếp server xem trước trả HTTP 200. Các phần thêm vào repo Nearby Stories đã được gỡ; không tự đưa lên mạng.
