"""Verify handbook source links and snapshot short, non-configuration excerpts."""
import argparse
import json
import subprocess
from pathlib import Path


REFERENCES = {
    'AF': ('src/Identity/Auth/AuthEndpoints.cs', 'LoginAsync / ActiveRolesAsync', 'Task<IResult> LoginAsync(', 'Kiểm tra tên đăng nhập hoặc email, mật khẩu, trạng thái tài khoản và vai trò đang hoạt động.'),
    'SM': ('src/Web/apps/admin/src/features/auth/model/session.ts', 'session.token / session.refresh / roleHome', 'export const session =', 'Dùng lại hoặc làm mới phiên và chọn trang mở đầu theo vai trò nhân sự.'),
    'AL': ('src/Web/apps/admin/src/app/AdminLayout.tsx', 'AdminLayout / RequireRole', 'export function AdminLayout(', 'Hiển thị chức năng theo quyền, bảo vệ các trang và điều hướng nhân sự chưa đăng nhập.'),
    'LG': ('src/Web/apps/pwa/src/app/LocationGate.tsx', 'LocationGate', 'export function LocationGate(', 'Hiển thị trạng thái định vị, hướng dẫn khi bị từ chối quyền và nút thử lại.'),
    'NR': ('src/Web/apps/pwa/src/app/routes/NearbyRoute.tsx', 'NearbyRoute', 'export function NearbyRoute(', 'Chọn màn hình định vị hoặc danh sách lân cận dựa trên trạng thái vị trí.'),
    'NS': ('src/Web/apps/pwa/src/features/nearby/components/NearbyScreen.tsx', 'NearbyScreen / renderBody', 'export function NearbyScreen(', 'Hiển thị địa điểm, trạng thái tải, lỗi và danh sách không có kết quả.'),
    'MR': ('src/Web/apps/pwa/src/app/routes/MapRoute.tsx', 'LocatedMap · useQuery', 'const result = useQuery({', 'Tải nhóm POI gần vị trí của khách và hiển thị kết quả trên bản đồ.'),
    'SC': ('src/Web/apps/pwa/src/features/story/components/StoryScreen.tsx', 'StoryScreen', 'export function StoryScreen(', 'Hiển thị tải nội dung, lỗi và văn bản đã sẵn sàng để đọc hoặc phát.'),
    'CE': ('src/Catalog/Catalog.Api/Endpoints/CatalogEndpoints.cs', 'MapCatalogEndpoints', 'void MapCatalogEndpoints(', 'Cung cấp API địa điểm, chọn nội dung theo chuỗi ngôn ngữ dự phòng và nhận yêu cầu tạo lại.'),
    'AE': ('src/Web/apps/pwa/src/features/player/components/AudioEngine.tsx', 'AudioEngine', 'export function AudioEngine(', 'Điều khiển phát MP3 và chuyển sự kiện hoặc lỗi media về trạng thái trình phát.'),
    'LR': ('src/Web/apps/pwa/src/features/story/api/useLanguageRequest.ts', 'useLanguageRequest', 'export function useLanguageRequest(', 'Gửi hoặc dùng lại yêu cầu ngôn ngữ; kiểm tra mỗi 2 giây với giới hạn chờ 30 giây.'),
    'PM': ('src/Web/apps/pwa/src/features/player/model/playerMachine.ts', 'playerReducer · NATIVE_READY / SWITCH_TO_NATIVE', "case 'NATIVE_READY':", 'Giữ bản đang phát khi ngôn ngữ mới sẵn sàng và chỉ chuyển âm thanh khi khách đồng ý.'),
    'PS': ('src/Web/apps/admin/src/features/places/components/PlacesScreen.tsx', 'PlacesScreen / confirm', 'export function PlacesScreen(', 'Hiển thị địa điểm và xác nhận thao tác lưu trữ, hiển thị hoặc khôi phục.'),
    'PE': ('src/Web/apps/admin/src/features/places/components/PlaceEditorScreen.tsx', 'PlaceEditorScreen / save', 'export function PlaceEditorScreen(', 'Thu thập, kiểm tra và lưu dữ liệu địa điểm, bản nháp nội dung.'),
    'AP': ('src/Catalog/Catalog.Api/Endpoints/AdminPoiEndpoints.cs', 'MapAdminPoiEndpoints / SaveDraftAsync / Validate', 'void MapAdminPoiEndpoints(', 'Định tuyến quản lý POI và bản nháp, gồm lưu trữ, khôi phục và cập nhật hiển thị.'),
    'CW': ('src/Catalog/Catalog.Api/Application/CatalogWorkflow.cs', 'PublishAsync', 'Task<PublishOutcome> PublishAsync(', 'Kiểm tra bản nháp đã lưu, ghi người xuất bản, yêu cầu tạo nội dung và outbox trong cùng giao dịch.'),
    'JS': ('src/Web/apps/admin/src/features/jobs/components/JobsScreen.tsx', 'JobsScreen / onRegenerate', 'export function JobsScreen(', 'Lọc, phân trang và xem lỗi công việc; gửi yêu cầu chạy lại và phản hồi kết quả.'),
    'DS': ('src/Web/apps/admin/src/features/dashboard/DashboardScreen.tsx', 'DashboardScreen / ExportDialog', 'export function DashboardScreen(', 'Xem thống kê theo kỳ hoặc địa điểm, kiểm tra ngày xuất và điều phối tải báo cáo Excel.'),
}

CAT = 'src/Catalog/Catalog.Api/'
LOC = 'src/Localization/Localization.Api/'
SPEECH_API = 'src/Speech/Speech.Api/'
CATALOG_ENDPOINTS = CAT + 'Endpoints/CatalogEndpoints.cs'
WORKFLOW = CAT + 'Application/CatalogWorkflow.cs'
ANALYTICS_ENDPOINTS = CAT + 'Analytics/AnalyticsEndpoints.cs'
ANALYTICS = CAT + 'Analytics/AnalyticsService.cs'
ADMIN_DASHBOARD = 'src/Web/apps/admin/src/features/dashboard/'

REFERENCES.update({
    'TOKEN': ('src/Identity/Auth/TokenIssuer.cs', 'TokenIssuer.Create', 'RefreshToken Record) Create(', 'Cấp JWT và tạo refresh token. Identity chỉ lưu mã băm của refresh token.'),
    'NEARBY': (CAT + 'Infrastructure/Queries/DapperNearbyPoiQuery.cs', 'DapperNearbyPoiQuery.FindAsync', 'Task<IReadOnlyList<NearbyPoi>> FindAsync(', 'Truy vấn không gian các POI công khai trong bán kính và sắp theo khoảng cách.'),
    'MAP': (CAT + 'Endpoints/MapPoiEndpoints.cs', 'GET /api/pois/map', 'api.MapGet("/pois/map"', 'API truy vấn POI theo vùng tọa độ.'),
    'MAP-NEAREST': (CAT + 'Endpoints/MapPoiEndpoints.cs', 'GET /api/pois/map/nearest', 'api.MapGet("/pois/map/nearest"', 'Tìm tối đa 100 POI công khai gần khách trong phạm vi 50 km.'),
    'STORY-ROUTE': ('src/Web/apps/pwa/src/app/routes/StoryRoute.tsx', 'StoryRoute', 'const listenBlocked =', 'Chặn bắt đầu bài nếu vị trí chưa xác định hoặc ngoài tầm nghe. Bài đã tải vẫn điều khiển được.'),
    'LISTEN-RANGE': ('src/Web/apps/pwa/src/components/listeningRange.ts', 'withinListeningRange', 'export const withinListeningRange', 'PWA chỉ bắt đầu phát khi khoảng cách đã biết và không quá 100 m.'),
    'STORY': (CATALOG_ENDPOINTS, 'GET /api/pois/{id}/story', 'api.MapGet("/pois/{id:guid}/story"', 'Tìm nội dung phục vụ theo phiên bản đang hoạt động và trả lựa chọn ngôn ngữ dự phòng.'),
    'AUDIO-HTTP': (SPEECH_API + 'Program.cs', 'GET /api/audio/{narrationId}/v{version}/{lang}.mp3', 'app.MapGet("/api/audio/', 'Tra khóa đối tượng của bản tổng hợp thành công và phục vụ MP3 với hỗ trợ HTTP Range.'),
    'LANG-REQUEST': (CATALOG_ENDPOINTS, 'POST /api/pois/{id}/languages/{lang}/requests', 'api.MapPost("/pois/{id:guid}/languages/', 'Nhận yêu cầu ngôn ngữ thiếu của khách và chuyển cho CatalogWorkflow.'),
    'REQUEST-STATUS': (CATALOG_ENDPOINTS, 'GET /api/generation-requests/{id}', 'api.MapGet("/generation-requests/', 'Đọc trạng thái yêu cầu tạo nội dung theo mã yêu cầu.'),
    'DRAFT': (CAT + 'Endpoints/AdminPoiEndpoints.cs', 'SaveDraftAsync', 'Task<IResult> SaveDraftAsync(', 'Kiểm tra và lưu bản nháp, cấp số phiên bản khi tạo bản nháp mới.'),
    'GEOCODING': (CAT + 'Application/LocationSearch.cs', 'LocationSearch.SearchAsync', 'public async Task<LocationSuggestion[]> SearchAsync(', 'Tìm vị trí qua Photon để biên tập viên chọn tọa độ cho POI.'),
    'RETRY-HTTP': (CATALOG_ENDPOINTS, 'POST /api/admin/narrations/{narrationId}/versions/{version}/languages/{lang}/retry', 'admin.MapPost("/narrations/', 'Chỉ Operator được gọi đường dẫn xếp hàng thử lại cho phiên bản và ngôn ngữ.'),
    'REQUEUE': (WORKFLOW, 'CatalogWorkflow.RetryAsync', 'Task<RetryResult?> RetryAsync(', 'Tái dùng yêu cầu đang chạy hoặc ghi yêu cầu thử lại theo phiên bản và ngôn ngữ.'),
    'OUTBOX': (CAT + 'Infrastructure/Messaging/CatalogOutboxDispatcher.cs', 'CatalogOutboxDispatcher.ExecuteAsync', 'override async Task ExecuteAsync(', 'Đọc outbox, phát ContentPublished qua message broker và cập nhật trạng thái gửi.'),
    'PROJECTION': (CAT + 'Application/CatalogEventProjection.cs', 'CatalogEventProjection', 'class CatalogEventProjection(', 'Ghi nhận kết quả dịch và tổng hợp, cập nhật tiến độ và ghi nhận lỗi.'),
    'ACTIVATE': (WORKFLOW, 'CatalogWorkflow.TryActivateAsync', 'Task<bool> TryActivateAsync(', 'Chuyển con trỏ phiên bản khi văn bản và âm thanh tiếng Việt sẵn sàng.'),
    'PROGRESS': (CATALOG_ENDPOINTS, 'GET /api/admin/pois/{id}/versions/{version}/progress', 'admin.MapGet("/pois/{id:guid}/versions/', 'Trả tiến độ bốn bản dịch, năm bản âm thanh và phiên bản đang phục vụ.'),
    'LOCALIZATION': (LOC + 'Consumers/ContentPublishedConsumer.cs', 'ContentPublishedConsumer.Consume', 'Task Consume(ConsumeContext<ContentPublished>', 'Dùng lại hoặc tạo văn bản từng ngôn ngữ và phát TranslationReady.'),
    'TRANSLATION': (LOC + 'Providers/GeminiTranslationProvider.cs', 'GeminiTranslationProvider.TranslateAsync', 'Task<(string Title, string Body)> TranslateAsync(', 'Gửi văn bản đã bảo vệ thuật ngữ đến Gemini và đọc kết quả dịch.'),
    'TRANSLATION-STORE': (LOC + 'Consumers/ContentPublishedConsumer.cs', 'ContentPublishedConsumer.Store', 'Task<Translation> Store(', 'Ghi văn bản và metadata của bản dịch vào D3.'),
    'TERM-GUARD': ('src/Localization/Localization.Core/TermGuard.cs', 'TermGuard.Protect', 'Tokens) Protect(', 'Thay thuật ngữ trong văn bản bằng ký hiệu trước khi gọi dịch.'),
    'SPEECH': (SPEECH_API + 'Consumers/TranslationReadyConsumer.cs', 'TranslationReadyConsumer.Consume', 'Task Consume(ConsumeContext<TranslationReady>', 'Dùng lại kết quả hoặc tạo âm thanh, ghi MP3 và phát AudioReady.'),
    'AUDIO-OBJECT': (SPEECH_API + 'Consumers/TranslationReadyConsumer.cs', 'Tạo khóa đối tượng MP3', 'var objectKey =', 'Mỗi lần xử lý ghi một khóa riêng ở MinIO, rồi lưu khóa đó trong bản ghi tệp.'),
    'AUDIO-READY': (SPEECH_API + 'Consumers/TranslationReadyConsumer.cs', 'Publish AudioReady', 'return context.Publish(new AudioReady(', 'Báo Catalog rằng phiên bản và ngôn ngữ này đã có âm thanh.'),
    'JOB-STATE': ('src/Speech/Speech.Core/Entities/SynthesisJob.cs', 'SynthesisJob.Start / Succeed / Fail', 'public void Start(', 'Chuyển trạng thái job, tăng số lần thử và ghi nhận thông tin lỗi.'),
    'JOB-STORE': (SPEECH_API + 'Infrastructure/SynthesisJobStore.cs', 'SynthesisJobStore.TryClaimAsync / TryCompleteAsync', 'Task<bool> TryClaimAsync(', 'Dùng lease để một worker xử lý công việc và kiểm tra quyền hoàn tất của lần chạy.'),
    'TTS': (SPEECH_API + 'Providers/GoogleTtsProvider.cs', 'GoogleTtsProvider.SynthesizeWithTimingAsync', 'Task<SynthesizedSpeech> SynthesizeWithTimingAsync(', 'Gọi Google Cloud Text-to-Speech và lấy MP3 cùng mốc đồng bộ văn bản.'),
    'STORAGE': (SPEECH_API + 'Providers/MinioAudioStorage.cs', 'MinioAudioStorage.SaveAsync', 'Task SaveAsync(', 'Ghi tệp âm thanh vào MinIO và đọc theo khóa đối tượng.'),
    'JOBS-HTTP': (SPEECH_API + 'Endpoints/SpeechAdminEndpoints.cs', 'MapSpeechAdminEndpoints', 'void MapSpeechAdminEndpoints(', 'Giới hạn quyền Operator, lọc và phân trang danh sách, đọc chi tiết job.'),
    'USAGE-HTTP': (ANALYTICS_ENDPOINTS, 'POST /api/analytics/events', 'api.MapPost("/analytics/events"', 'Kiểm tra và tiếp nhận các lô sự kiện sử dụng từ PWA.'),
    'USAGE-INGEST': (ANALYTICS, 'AnalyticsService.IngestAsync', 'Task<int> IngestAsync(', 'Ghi sự kiện khách và cập nhật hiện diện, lượt nghe hoặc sự cố.'),
    'USAGE-PWA': ('src/Web/apps/pwa/src/analytics/usage.ts', 'recordPlaying', 'export function recordPlaying(', 'Ghi lượt nghe theo nội dung thực sự phát, kèm ngôn ngữ của bản phát.'),
    'REPORTS-HTTP': (ANALYTICS_ENDPOINTS, 'GET /api/admin/analytics/overview và /places', 'reports.MapGet("/overview"', 'Trả thống kê tổng quan hoặc theo POI, hỗ trợ kỳ chuẩn và khoảng ngày tùy chọn.'),
    'REPORT': (ANALYTICS, 'AnalyticsService.ReportAsync', 'Task<UsageReport> ReportAsync(', 'Tính kỳ theo UTC+7 rồi tổng hợp khách duy nhất, lượt nghe, hiện diện và trạng thái POI.'),
    'REPORT-OVERVIEW': (ANALYTICS, 'ReportAsync · Khách và lượt nghe', 'var visitors = await selected.', 'Đếm khách duy nhất và tổng hợp lượt nghe theo POI và ngôn ngữ.'),
    'REPORT-PLACES': (ANALYTICS, 'ReportAsync · Số liệu theo POI', 'var places = pois.Select(', 'Ghép tên POI với khách, lượt xem, lượt nghe và khách đang trực tuyến.'),
    'REPORT-INVENTORY': (ANALYTICS, 'ReportAsync · Trạng thái POI', 'var placeCounts = new PlaceSnapshot(', 'Đếm trạng thái hiện tại cho các POI chưa lưu trữ.'),
    'ISSUES': (ANALYTICS_ENDPOINTS, 'GET /api/admin/analytics/errors', 'reports.MapGet("/errors"', 'Trả danh sách và tổng số sự cố theo trạng thái cho dashboard.'),
    'EXPORT-DIALOG': (ADMIN_DASHBOARD + 'DashboardScreen.tsx', 'ExportDialog', 'function ExportDialog(', 'Kiểm tra phạm vi ngày, tải số liệu và xử lý lỗi xuất trên giao diện.'),
    'EXPORT': (ADMIN_DASHBOARD + 'export.ts', 'reportSheets / xlsx / downloadReport', 'export function reportSheets(', 'Tổ chức số liệu thành các sheet và tạo tệp Excel trong trình duyệt.'),
    'DB-CATALOG': (CAT + 'Infrastructure/CatalogDbContext.cs', 'CatalogDbContext.OnModelCreating', 'override void OnModelCreating(', 'Ánh xạ dữ liệu Catalog, gồm POI, phiên bản, nội dung phục vụ, phân tích sử dụng và sự cố.'),
    'DB-IDENTITY': ('src/Identity/Infrastructure/IdentityDbContext.cs', 'IdentityDbContext.OnModelCreating', 'override void OnModelCreating(', 'Ánh xạ tài khoản, phân quyền và refresh token.'),
    'DB-LOCALIZATION': (LOC + 'Infrastructure/LocalizationDbContext.cs', 'LocalizationDbContext.OnModelCreating', 'override void OnModelCreating(', 'Ánh xạ Translations và GlossaryEntries cùng các ràng buộc duy nhất.'),
    'DB-SPEECH': (SPEECH_API + 'Infrastructure/SpeechDbContext.cs', 'SpeechDbContext.OnModelCreating', 'override void OnModelCreating(', 'Ánh xạ SynthesisJobs và AudioFiles, gồm lease và liên kết tệp với job.'),
    'GATEWAY': ('src/Gateway/Program.cs', 'YARP Reverse Proxy', '.AddReverseProxy()', 'Đăng ký YARP để nhận và định tuyến các yêu cầu HTTP.'),
    'DEFAULTS': ('src/BuildingBlocks/ServiceDefaults.cs', 'ServiceDefaults', 'builder.Host.UseSerilog(', 'Cấu hình logging, tracing và hạ tầng giao tiếp dùng chung.'),
    'COMPOSE': ('deploy/docker-compose.yml', 'Docker Compose services', 'services:', 'Cấu hình triển khai các service, SQL Server, RabbitMQ, MinIO và Jaeger.'),
})

REFERENCES.update({
    'AUTH-ROUTES': ('src/Identity/Auth/AuthEndpoints.cs', 'MapAuthEndpoints', 'auth.MapPost("/login"', 'Tập hợp các endpoint đăng nhập, làm mới, đăng xuất và đọc hồ sơ phiên.'),
    'AUTH-REFRESH': ('src/Identity/Auth/AuthEndpoints.cs', 'RefreshAsync', 'Task<IResult> RefreshAsync(', 'Làm mới phiên sau khi kiểm tra refresh token và vai trò còn hiệu lực.'),
    'NEARBY-HTTP': (CATALOG_ENDPOINTS, 'GET /api/pois/nearby', 'api.MapGet("/pois/nearby"', 'Nhận tọa độ khách và truy vấn danh sách POI công khai theo bán kính.'),
    'MAP-NAME': (CAT + 'Endpoints/MapPoiEndpoints.cs', 'GET /api/pois/search', 'api.MapGet("/pois/search"', 'Tìm POI công khai theo tên.'),
    'STORY-FALLBACK': (CATALOG_ENDPOINTS, 'Chọn ngôn ngữ phục vụ', 'while (!contents.ContainsKey(served))', 'Duyệt chuỗi dự phòng đã cấu hình cho đến khi tìm được nội dung có thể phục vụ.'),
    'PUBLISH-HTTP': (CATALOG_ENDPOINTS, 'POST /api/admin/pois/{id}/publish', 'admin.MapPost("/pois/{id:guid}/publish"', 'Kiểm tra quyền biên tập và trả URL theo dõi tiến độ khi Catalog chấp nhận xuất bản.'),
    'PUBLISH-POLL': ('src/Web/apps/admin/src/features/publish/api/useProgress.ts', 'useProgress', 'export function useProgress(', 'Admin Web làm mới tiến độ mỗi 2 giây cho đến khi tác vụ hoàn tất.'),
    'PROJECTION-TEXT': (CAT + 'Application/CatalogEventProjection.cs', 'CatalogEventProjection.TranslationReadyAsync', 'Task TranslationReadyAsync(', 'Ghi văn bản dịch và kiểm tra kết quả trùng.'),
    'PROJECTION-AUDIO': (CAT + 'Application/CatalogEventProjection.cs', 'CatalogEventProjection.AudioReadyAsync', 'Task AudioReadyAsync(', 'Ghi thông tin âm thanh ở Catalog và kiểm tra điều kiện kích hoạt.'),
    'PROJECTION-TRANSLATION-FAULT': (CAT + 'Application/CatalogEventProjection.cs', 'CatalogEventProjection.TranslationFailedAsync', 'Task TranslationFailedAsync(', 'Cập nhật lỗi dịch và trạng thái của yêu cầu ngôn ngữ.'),
    'PROJECTION-AUDIO-FAULT': (CAT + 'Application/CatalogEventProjection.cs', 'CatalogEventProjection.AudioFailedAsync', 'Task AudioFailedAsync(', 'Cập nhật lỗi tổng hợp và ghi sự cố.'),
    'TRANSLATION-REUSE': (LOC + 'Consumers/ContentPublishedConsumer.cs', 'Đọc kết quả dịch đã lưu', 'var stored = await db.Translations', 'Tìm các bản dịch có sẵn của phiên bản để dùng lại.'),
    'TERMS-VALIDATE': (LOC + 'Consumers/ContentPublishedConsumer.cs', 'Kiểm tra và khôi phục thuật ngữ', 'if (!TermGuard.IsValid(result.Title', 'Kiểm tra đủ ký hiệu rồi khôi phục thuật ngữ theo ngôn ngữ đích.'),
    'TRANSLATION-READY': (LOC + 'Consumers/ContentPublishedConsumer.cs', 'Publish TranslationReady', 'await context.Publish(new TranslationReady(', 'Phát kết quả theo từng ngôn ngữ cho Catalog và Speech.'),
    'TRANSLATION-FAULT': (LOC + 'Consumers/ContentPublishedConsumer.cs', 'Báo lỗi sau khi xử lý các ngôn ngữ', 'if (failures.Count == 1)', 'Trả lỗi xử lý về hàng đợi sau khi phát các kết quả thành công.'),
    'AUDIO-REUSE': (SPEECH_API + 'Consumers/TranslationReadyConsumer.cs', 'Dùng lại công việc đã thành công', 'if (job.Status == SynthesisStatus.Succeeded)', 'Lấy bản ghi âm thanh đã lưu và phát lại thông báo sẵn sàng.'),
    'JOB-COMPLETE': (SPEECH_API + 'Infrastructure/SynthesisJobStore.cs', 'SynthesisJobStore.TryCompleteAsync', 'Task<bool> TryCompleteAsync(', 'Ghi thông tin tệp và hoàn tất công việc dưới quyền xử lý hiện tại.'),
    'JOB-FAIL': (SPEECH_API + 'Infrastructure/SynthesisJobStore.cs', 'SynthesisJobStore.MarkFailedAsync', 'Task MarkFailedAsync(', 'Ghi lỗi và giải phóng quyền xử lý của lần chạy đã thất bại.'),
    'REPORT-ASSEMBLE': (ANALYTICS, 'ReportAsync · UsageReport', 'return new UsageReport(', 'Ghép số liệu, mốc thời gian, trạng thái và phạm vi thành phản hồi báo cáo.'),
    'MESSAGING': ('src/BuildingBlocks/ServiceDefaults.cs', 'MassTransit · RabbitMQ', 'builder.Services.AddMassTransit(', 'Đăng ký xử lý sự kiện và kết nối tới RabbitMQ.'),
    'TECH-REACT': ('src/Web/apps/pwa/package.json', 'React · dependencies', '"react":', 'Khai báo React cho PWA.'),
    'TECH-ROUTER': ('src/Web/apps/admin/package.json', 'React Router · dependencies', '"react-router":', 'Khai báo React Router cho Admin Web.'),
    'TECH-I18N': ('src/Web/apps/pwa/package.json', 'i18next và Zustand · dependencies', '"react-i18next":', 'Khai báo đa ngôn ngữ và quản lý trạng thái ở frontend.'),
    'TECH-MAP': ('docs/visitor-map.md', 'Visitor map', '# Visitor map', 'Mô tả MapLibre và OpenFreeMap.'),
    'TECH-FONT': ('src/Web/packages/ui/src/base.css', 'Be Vietnam Pro · @font-face', 'font-weight: 400;', 'Nạp phông Be Vietnam Pro từ tệp trong dự án.'),
    'TECH-DOTNET': ('Directory.Build.props', 'TargetFramework', '<TargetFramework>net9.0</TargetFramework>', 'Chỉ định phiên bản .NET dùng cho backend.'),
    'TECH-SQL': (CAT + 'Infrastructure/Queries/DapperNearbyPoiQuery.cs', 'Dapper · QueryAsync', '.QueryAsync<NearbyPoi>(command)', 'Chạy truy vấn không gian bằng Dapper.'),
    'TECH-RESILIENCE': (SPEECH_API + 'Providers/GoogleTtsProvider.cs', 'TtsResilience.AddTtsResilience', 'public static IServiceCollection AddTtsResilience(', 'Cấu hình thử lại, circuit breaker và timeout cho tổng hợp giọng nói.'),
    'TECH-OBS': ('docs/observability.md', 'Connected traces', '## Part 2: connected traces', 'Tài liệu về tracing xuyên các dịch vụ.'),
    'TECH-CI': ('docs/ci-cd.md', 'Workflow selection', '## Workflow selection', 'Tài liệu về chọn pipeline theo phần code thay đổi.'),
    'TECH-TEST': ('src/Web/vitest.config.ts', 'Vitest defineConfig', 'export default defineConfig(', 'Cấu hình kiểm thử workspace frontend.'),
})

for entity in ('PointOfInterest', 'Narration', 'NarrationSource', 'GenerationRequest', 'CatalogDeliveryContent', 'SupportedLanguage'):
    REFERENCES['DOMAIN-' + entity] = (
        f'src/Catalog/Catalog.Core/Entities/{entity}.cs', entity,
        'public sealed class ' + entity, f'Khai báo lớp miền {entity} trong Catalog.',
    )

BY_USE_CASE = {
    'UC1': ['SM', 'AF', 'AL'], 'UC2': ['LG', 'NR', 'NS', 'MR', 'NEARBY', 'MAP-NEAREST', 'MAP'],
    'UC3': ['SC', 'STORY', 'STORY-ROUTE', 'LISTEN-RANGE', 'AE', 'AUDIO-HTTP'], 'UC4': ['LR', 'PM', 'LANG-REQUEST', 'REQUEST-STATUS', 'REQUEUE'],
    'UC5': ['PS', 'PE', 'AP', 'DRAFT', 'GEOCODING'],
    'UC6': ['DRAFT', 'PUBLISH-HTTP', 'CW', 'OUTBOX', 'LOCALIZATION', 'SPEECH', 'ACTIVATE', 'PROGRESS', 'PUBLISH-POLL'],
    'UC7': ['JS', 'JOBS-HTTP', 'RETRY-HTTP', 'REQUEUE'],
    'UC8': ['DS', 'REPORTS-HTTP', 'REPORT', 'USAGE-INGEST'],
    'UC9': ['EXPORT-DIALOG', 'REPORTS-HTTP', 'REPORT', 'EXPORT'],
}


def build(root: Path, app: Path, ref: str):
    revision = subprocess.check_output(
        ['git', 'rev-parse', '--verify', '--end-of-options', ref + '^{commit}'], cwd=root,
    ).decode('ascii').strip()
    files = {}
    code = {}
    for alias, (relative, symbol, marker, description) in REFERENCES.items():
        if relative not in code:
            blob = subprocess.check_output(['git', 'show', f'{revision}:{relative}'], cwd=root)
            code[relative] = blob.decode('utf-8-sig').splitlines()
        lines = code[relative]
        anchors = [i for i, line in enumerate(lines, start=1) if marker in line]
        if len(anchors) != 1:
            raise ValueError(f'{alias}: expected one anchor for {marker!r} in {relative}, found {anchors}')
        line = anchors[0]
        end = min(len(lines), line + 13)
        excerpt = '' if Path(relative).suffix in ('.yml', '.yaml', '.json') else '\n'.join(lines[line - 1:end])
        files[alias] = {'id': alias, 'path': relative, 'symbol': symbol, 'line': line,
                        'description': description, 'excerpt': excerpt, 'endLine': end}
    (app / 'src' / 'content' / 'code-references.json').write_text(
        json.dumps({'revision': revision, 'files': files, 'byUseCase': BY_USE_CASE}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    print(f'Verified {len(files)} code references at {revision[:7]}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--app', required=True, type=Path)
    parser.add_argument('--revision', default='origin/main', help='Published Git ref to pin the links to')
    args = parser.parse_args()
    build(args.root.resolve(), args.app.resolve(), args.revision)
