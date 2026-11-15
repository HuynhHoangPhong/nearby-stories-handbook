# Nội dung kỹ thuật đã đối chiếu cho sổ tay Nearby Stories

## Nguồn và phạm vi

- Nguồn yêu cầu: `C:/code/CNPM/Product requirement document (4).docx`, bộ use case thứ hai ở cuối tài liệu, tương ứng **Use case v2** mà người dùng chọn. Bộ này có Business Rules 2.1–2.16, UC1–UC9, các activity diagram và Code Reference UC1–UC9.
- Revision được DOCX ghi: `main ab67171`. HEAD của checkout khi kiểm tra cũng là `ab67171`.
- Cả 18 đường dẫn được định nghĩa bằng mã AF, SM, AL, LG, NR, NS, MR, SC, CE, AE, LR, PM, PS, PE, AP, CW, JS, DS đều tồn tại ở checkout hiện tại.
- D1–D5 trong Code Reference là **điều kiện trên diagram**, không phải số bước hoặc số thứ tự các file. Một điều kiện có thể tổng hợp nhiều nhánh kiểm tra trong code. Không cần chuyển chúng thành nút bước trong giao diện đọc.
- Nghiên cứu này chỉ đọc tài liệu và source. Không chạy backend, không xác nhận hạ tầng đang trực tuyến và không kiểm thử việc gọi nhà cung cấp ngoài.

## Nội dung giới thiệu công nghệ

| Nhóm | Công nghệ có trong dự án | Vai trò nên giải thích cho người đọc | Bằng chứng trong repository |
| --- | --- | --- | --- |
| Giao diện | React 19, TypeScript, Vite | Xây hai ứng dụng: PWA cho khách và web quản trị cho nhân sự | `src/Web/apps/pwa/package.json`, `src/Web/apps/admin/package.json`, `src/Web/package.json` |
| Điều hướng và dữ liệu giao diện | React Router 7, TanStack Query 5 | Chuyển màn hình; gọi, lưu tạm và làm mới dữ liệu từ API | Hai package.json của app; `src/Web/apps/admin/src/features/dashboard/DashboardScreen.tsx:17` |
| Trạng thái và đa ngôn ngữ | Zustand 5, i18next, react-i18next | Quản lý trạng thái phía khách và bản dịch giao diện PWA | `src/Web/apps/pwa/package.json` |
| Bản đồ | MapLibre GL 6, OpenFreeMap/OpenStreetMap | Hiển thị bản đồ, vị trí và điểm tham quan | `src/Web/apps/pwa/package.json`, `docs/visitor-map.md` |
| Cài đặt ứng dụng | vite-plugin-pwa | Cho phép ứng dụng khách có trải nghiệm cài lên màn hình chính | `src/Web/apps/pwa/package.json`, `src/Web/apps/pwa/vite.config.ts` |
| Nhận diện giao diện | Be Vietnam Pro, CSS dùng chung | Phông hỗ trợ tiếng Việt và bộ màu thống nhất giữa các ứng dụng | `src/Web/packages/ui/src/base.css`, `src/Web/packages/ui/src/tokens.css` |
| Backend | C#, .NET 9, ASP.NET Core | Các API và worker xử lý nghiệp vụ độc lập | `Directory.Build.props`, các `Program.cs` của service |
| Cổng vào | YARP 2.2 | Gateway định tuyến HTTP và áp dụng phân quyền, giới hạn yêu cầu | `src/Gateway/Gateway.csproj`, `src/Gateway/Program.cs:11`, `src/Gateway/appsettings.json` |
| Xác thực | ASP.NET Core Identity, JWT, refresh token | Xác thực tài khoản và giới hạn chức năng theo vai trò Editor/Operator | `src/Identity/Identity.csproj`, `src/Identity/Auth/AuthEndpoints.cs:33`, `src/BuildingBlocks/StaffAuthentication.cs` |
| Cơ sở dữ liệu | SQL Server, EF Core 9, Dapper, NetTopologySuite | Lưu dữ liệu theo service; truy vấn địa lý để tìm nơi gần khách | Các csproj của Catalog/Identity/Localization/Speech; `src/Catalog/Catalog.Api/Infrastructure/Queries/DapperNearbyPoiQuery.cs:11` |
| Giao tiếp nền | RabbitMQ, MassTransit 8.5 | Chuyển sự kiện giữa Catalog, Localization và Speech | `src/BuildingBlocks/ServiceDefaults.cs:68`, `src/BuildingBlocks/BuildingBlocks.csproj` |
| Dịch nội dung | Gemini qua HTTP | Dịch nội dung nguồn tiếng Việt; mô hình được cấu hình trong dự án | `src/Localization/Localization.Api/Providers/GeminiTranslationProvider.cs:51` |
| Tạo giọng nói | Google Cloud Text-to-Speech | Biến văn bản đã chuẩn bị thành âm thanh MP3 | `src/Speech/Speech.Api/Providers/GoogleTtsProvider.cs:68`, `src/Speech/Speech.Api/Speech.Api.csproj` |
| Lưu âm thanh | MinIO | Lưu và đọc các object âm thanh; database lưu metadata và object key | `src/Speech/Speech.Api/Providers/MinioAudioStorage.cs:35`, `src/Speech/Speech.Api/Providers/MinioAudioStorage.cs:47` |
| Chịu lỗi | Polly, Microsoft.Extensions.Http.Resilience | Thử lại và giới hạn thời gian khi gọi nhà cung cấp ngoài | `src/Speech/Speech.Api/Providers/GoogleTtsProvider.cs:25`, `src/Localization/Localization.Api/Providers/GeminiTranslationProvider.cs:19` |
| Theo dõi hệ thống | Serilog, OpenTelemetry, Jaeger | Ghi log và lần theo một request/message qua nhiều service | `src/BuildingBlocks/ServiceDefaults.cs:33`, `src/BuildingBlocks/ServiceDefaults.cs:47`, `deploy/docker-compose.yml` |
| Triển khai và kiểm tra | Docker Compose, GitHub Actions, Vitest | Chạy các thành phần độc lập và kiểm tra thay đổi tự động | `deploy/docker-compose.yml`, `.github/workflows/`, `src/Web/vitest.config.ts` |

Các phiên bản trên là dependency được ghi trong checkout, không phải khuyến nghị nâng cấp hay tuyên bố về phiên bản mới nhất. Không cần nêu tất cả dependency phụ lên trang công nghệ; ưu tiên vai trò của từng công nghệ.

## Giải thích microservice cho trang giới thiệu

### Các thành phần chính

- **Gateway:** cổng HTTP duy nhất của backend được công bố ra ngoài trong cấu hình Compose. Chuyển request tới Identity, Catalog hoặc Speech. Localization là worker nội bộ, không có route trực tiếp qua Gateway.
- **Identity:** quản lý tài khoản, vai trò Editor/Operator, JWT và refresh token.
- **Catalog:** quản lý điểm tham quan, bản nháp/phiên bản thuyết minh, yêu cầu tạo nội dung và kết quả sẵn sàng phục vụ. Đây là nơi ứng dụng khách đọc danh sách địa điểm và nội dung.
- **Localization:** nhận sự kiện xuất bản, tạo bản dịch theo ngôn ngữ và phát kết quả cho bước tạo âm thanh.
- **Speech:** tổng hợp giọng nói, theo dõi công việc, lưu âm thanh vào MinIO và thông báo kết quả cho Catalog.

Có năm chương trình backend kể cả Gateway. Bốn service nghiệp vụ có bốn database riêng về mặt logic. Compose có thể đặt các database này trên cùng một SQL Server; không nên mô tả thành bốn máy chủ SQL vật lý.

### Luồng đọc nhanh

`PWA → Gateway → Catalog → PWA`

Khách mở danh sách lân cận hoặc bản đồ. Catalog truy vấn dữ liệu địa điểm đang hoạt động, chưa xóa và được hiển thị. Danh sách lân cận dùng bán kính mặc định 100 m; bản đồ dùng vùng bản đồ đang chọn. Khi khách mở thuyết minh, Catalog trả văn bản cùng vị trí âm thanh theo ngôn ngữ phù hợp. PWA lấy MP3 qua `Gateway → Speech → MinIO` để phát. Việc nghe một nội dung đã sẵn sàng không phải gọi dịch hoặc tạo giọng đọc lại.

Bằng chứng: `src/Catalog/Catalog.Api/Endpoints/CatalogEndpoints.cs:27`, `src/Catalog/Catalog.Api/Endpoints/CatalogEndpoints.cs:40`, `src/Catalog/Catalog.Api/Endpoints/MapPoiEndpoints.cs:15`, `src/Speech/Speech.Api/Program.cs:54`.

### Luồng tạo nội dung nền

`Editor → Gateway → Catalog → ContentPublished → Localization → TranslationReady → Speech → AudioReady → Catalog`

- Editor lưu bản nháp tiếng Việt rồi yêu cầu xuất bản. Catalog kiểm tra bản nháp, tạo các yêu cầu ngôn ngữ và ghi sự kiện vào outbox trong cùng transaction.
- `CatalogOutboxDispatcher` phát `ContentPublished` qua RabbitMQ bằng MassTransit. HTTP xuất bản có thể trả 202 trước khi việc dịch và tạo âm thanh hoàn tất.
- `ContentPublishedConsumer` của Localization chuẩn bị nội dung theo năm ngôn ngữ. Tiếng Việt dùng nguồn gốc; bốn ngôn ngữ còn lại đi qua nhà cung cấp dịch. Từng ngôn ngữ phát một `TranslationReady`.
- `TranslationReadyConsumer` của Speech tạo MP3 và lưu MinIO, sau đó phát `AudioReady`. Mỗi ngôn ngữ được theo dõi riêng.
- Các consumer của Catalog cập nhật projection qua `CatalogEventProjection`. `CatalogWorkflow.TryActivateAsync` đưa phiên bản vào phục vụ khi có **văn bản và âm thanh tiếng Việt**, vì tiếng Việt là dự phòng cuối cùng. Các ngôn ngữ khác có thể tiếp tục xử lý.
- Sự kiện có thể được giao lại. Outbox và các kiểm tra idempotency hỗ trợ tránh phát sinh xử lý trùng; không nên viết rằng RabbitMQ đảm bảo giao đúng một lần.

Bằng chứng: `src/Catalog/Catalog.Api/Application/CatalogWorkflow.cs:16`, `src/Catalog/Catalog.Api/Infrastructure/Messaging/CatalogOutboxDispatcher.cs:12`, `src/Localization/Localization.Api/Consumers/ContentPublishedConsumer.cs:28`, `src/Speech/Speech.Api/Consumers/TranslationReadyConsumer.cs:26`, `src/Catalog/Catalog.Api/Application/CatalogEventProjection.cs:43`, `src/Catalog/Catalog.Api/Application/CatalogWorkflow.cs:131`.

### Tạo ngôn ngữ còn thiếu khi khách đang nghe

Khách tiếp tục nghe bản dự phòng trong lúc ứng dụng gửi hoặc sử dụng lại một yêu cầu tạo ngôn ngữ. `useLanguageRequest` kiểm tra trạng thái mỗi 2 giây, tối đa 30 giây. Khi ngôn ngữ mới sẵn sàng, `playerReducer` giữ âm thanh đang phát và chờ khách chấp nhận chuyển. Khi không có âm thanh đang phát, nội dung mới có thể thay thế cho lần phát tiếp theo. Giới hạn yêu cầu, lỗi hoặc hết thời gian chờ dẫn tới tiếp tục dùng bản dự phòng.

Bằng chứng: `src/Web/apps/pwa/src/features/story/api/useLanguageRequest.ts:29`, `src/Web/apps/pwa/src/features/player/model/playerMachine.ts:129`.

## Mã file và điểm vào đã kiểm tra

| Mã | Đường dẫn | Hàm hoặc khối trách nhiệm | Điểm bắt đầu hiện tại |
| --- | --- | --- | --- |
| AF | `src/Identity/Auth/AuthEndpoints.cs` | `LoginAsync`; kiểm tra định danh, mật khẩu, tài khoản và vai trò đang hoạt động | 33; kiểm tra 37–53; `ActiveRolesAsync` tại 104 |
| SM | `src/Web/apps/admin/src/features/auth/model/session.ts` | `session.token`, `session.refresh`, `roleHome` | 39; 52; 76 |
| AL | `src/Web/apps/admin/src/app/AdminLayout.tsx` | `AdminLayout`, `RequireRole`, `HomeRedirect` | 12; 62; 67 |
| LG | `src/Web/apps/pwa/src/app/LocationGate.tsx` | `LocationGate`; hiển thị định vị, từ chối quyền và thử lại | 10; phần giao diện 18–27 |
| NR | `src/Web/apps/pwa/src/app/routes/NearbyRoute.tsx` | `NearbyRoute`; chọn LocationGate hoặc NearbyScreen theo trạng thái vị trí | 10; điều kiện tại 20 |
| NS | `src/Web/apps/pwa/src/features/nearby/components/NearbyScreen.tsx` | `NearbyScreen` / `renderBody`; lỗi tải và kết quả rỗng | 32 / 55; lỗi tại 95; rỗng tại 108 |
| MR | `src/Web/apps/pwa/src/app/routes/MapRoute.tsx` | `MapRoute` / `LocatedMap`; dữ liệu POI trên bản đồ | 18 / 25; truy vấn tại 40; lỗi tại 95 |
| SC | `src/Web/apps/pwa/src/features/story/components/StoryScreen.tsx` | `StoryScreen`; tải, lỗi, thử lại và nội dung sẵn sàng | 39; trạng thái tại 50–59 |
| CE | `src/Catalog/Catalog.Api/Endpoints/CatalogEndpoints.cs` | `MapCatalogEndpoints`; story/fallback và retry ngôn ngữ | 18; endpoint story tại 40; fallback 52–66; retry 144–150 |
| AE | `src/Web/apps/pwa/src/features/player/components/AudioEngine.tsx` | `AudioEngine`; phát và xử lý lỗi media | 8; gọi `play()` tại 38; sự kiện media 62–78 |
| LR | `src/Web/apps/pwa/src/features/story/api/useLanguageRequest.ts` | `useLanguageRequest`; request/reuse, timeout và polling | 29; request 49–63; timeout 65–73; polling 78–92 |
| PM | `src/Web/apps/pwa/src/features/player/model/playerMachine.ts` | `playerReducer`; NATIVE_READY và SWITCH_TO_NATIVE | 74; xử lý ngôn ngữ mới 129–157 |
| PS | `src/Web/apps/admin/src/features/places/components/PlacesScreen.tsx` | `PlacesScreen`; danh sách, chọn thao tác và xác nhận | 16; `confirm` tại 28–35 |
| PE | `src/Web/apps/admin/src/features/places/components/PlaceEditorScreen.tsx` | `PlaceEditorScreen`; kiểm tra và gửi dữ liệu chỉnh sửa | 29; hàm `save` tại 60, `form.trigger()` tại 61; `onSaveDraft` tại 88; `onPublish` tại 97 |
| AP | `src/Catalog/Catalog.Api/Endpoints/AdminPoiEndpoints.cs` | `MapAdminPoiEndpoints`, `CreateAsync`, `UpdateAsync`, `SaveDraftAsync`, `Validate` | 11; 93; 109; 139; 170 |
| CW | `src/Catalog/Catalog.Api/Application/CatalogWorkflow.cs` | `PublishAsync`, `RetryAsync`, `TryActivateAsync` | 16; 71; 131 |
| JS | `src/Web/apps/admin/src/features/jobs/components/JobsScreen.tsx` | `JobsScreen`, `onRegenerate`; tải, lỗi và chạy lại | 19; 30; trạng thái 51–59; nút chạy lại tại 89 |
| DS | `src/Web/apps/admin/src/features/dashboard/DashboardScreen.tsx` | `DashboardScreen`, `ExportDialog` | 13; 157 |

## Liên kết giải thích UC1 đến UC9

- **UC1:** SM39, SM52–66 và AL28 cho phiên có sẵn/refresh. AF37–47 kiểm tra thông tin; AF48–50 kiểm tra hoạt động; AF51–53 và AF104–109 kiểm tra vai trò. SM76 chọn trang theo vai trò. Giải thích username hoặc email đều được hỗ trợ.
- **UC2:** LG10/18–27, NR20 cho vị trí chưa sẵn sàng. NS95–106 và MR95 cho lỗi dữ liệu; NS108–119 và MR97 cho rỗng. Bổ sung CE27 và `DapperNearbyPoiQuery.FindAsync`63 để người đọc hiểu truy vấn backend; dùng `MapPoiEndpoints`15 để phân biệt vùng bản đồ với bán kính danh sách.
- **UC3:** SC39–60 thể hiện tải nội dung; CE52–66 chọn bản ngôn ngữ đã đủ văn bản và âm thanh rồi theo chuỗi dự phòng; AE32–48 và AE62–78 phát media và phản hồi lỗi. Một nhánh diagram có thể đi qua cả UI và backend.
- **UC4:** LR49–63 tạo hoặc dùng lại yêu cầu; LR65–73 đặt giới hạn chờ; LR78–92 polling và xử lý thành công/lỗi/429. PM129–157 quyết định chỉ đề nghị chuyển khi đang phát, và thực hiện chuyển khi khách chấp nhận.
- **UC5:** PS28–35 xác nhận lưu trữ/khôi phục; PE60–86 kiểm tra và xử lý lưu thông tin; AP170–182 kiểm tra backend. AP29–63 chứa visibility/restore/archive. AP153–166 cấp phiên bản khi tạo draft. Dùng từ “lưu trữ/xóa mềm” thay vì “xóa vĩnh viễn khi chưa xuất bản”.
- **UC6:** CW19–35 kiểm tra draft được xuất bản; CW39–57 đổi trạng thái và lưu outbox cùng transaction; CW133–169 kích hoạt theo tiếng Việt sẵn sàng. Việc cấp số version thuộc lúc tạo draft ở AP153–166, không tự tăng số version mỗi lần publish.
- **UC7:** JS51–59 hiển thị tải/lỗi/rỗng; JS82 mở lỗi và JS89 yêu cầu regenerate; JS30–36 báo thành công/thất bại. CE144–150 áp quyền Operator và xếp yêu cầu; CW100–112 dùng lại yêu cầu chưa hoàn tất hoặc đưa failed request về Pending.
- **UC8:** DS17 tải báo cáo; DS31 chọn kỳ; DS34 lỗi/thử lại; phần điều hướng theo địa điểm tại DS54. Ngày báo cáo dùng Asia/Ho_Chi_Minh/UTC+7, không dùng timezone trình duyệt tùy ý.
- **UC9:** `ExportDialog` DS157; DS160–164 kiểm tra ngày; DS170 hủy; DS171 gửi; DS165–168 lấy báo cáo và tải xlsx; DS177–178 hiển thị lỗi validation/xuất. Xuất báo cáo sử dụng `src/Web/apps/admin/src/features/dashboard/export.ts`, không cần backend riêng cho trang sổ tay.

## Các khác biệt và giới hạn cần giữ rõ

1. **V2 khớp revision checkout, nhưng một số khoảng dòng trong DOCX là vùng tham khảo rộng.** Ví dụ LG18–29 trong tài liệu trong khi LocationGate kết thúc ở dòng 28; NR22–24 là props của NearbyScreen, điều kiện vị trí thực nằm ở NR20. DS34 mới là nhánh lỗi/thử lại, còn DS35 bắt đầu phần dữ liệu. Website nên dùng tên hàm + điểm bắt đầu đã kiểm tra, kèm điều kiện được giải thích, thay vì khẳng định mọi số dòng cũ trỏ đúng một biểu thức.
2. **V1 khác nghiệp vụ hiện tại.** Không dùng lại lời giải thích “đợi đủ cả năm âm thanh mới live”, “publish luôn tăng version”, hay “POI chưa xuất bản được xóa cứng”. V2 và source hiện dùng VI readiness, version khi tạo draft và archive/restore.
3. **Backlog đã cập nhật.** Mở đầu DOCX nói US22 và US23 là đề xuất Should. Không tiếp tục tuyên bố tài liệu chỉ có 21 story từ bản trước. Phải trích lại bảng backlog mới và giữ trạng thái đề xuất nếu tài liệu ghi như vậy.
4. **Không ép quan hệ một bước một file.** Nhánh D1–D5 có thể trải qua hook/component/endpoint/workflow, nên bảng code reference cần mô tả trách nhiệm chứ không chỉ số dòng.
5. **Không gọi Localization là API công khai.** Service này chạy một host có health defaults và consumer, nhưng không có route ứng dụng trực tiếp cho trình duyệt qua Gateway.
6. **Không biến “no failed jobs” thành bảo đảm hệ thống đã hoàn tất mọi job.** Chuỗi giao diện JS57 có câu “Every published narration has audio in all five languages” ở empty state lọc failed; danh sách không có failed job có thể còn pending/processing. Nội dung sổ tay nên mô tả đúng trạng thái thay vì sao chép câu đó như một bất biến.

