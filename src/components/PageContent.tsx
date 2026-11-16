import { lazy, Suspense, useState } from 'react'
import { ArrowRight, AudioLines, Check, ChevronRight, Database, FilePenLine, Headphones, Languages, MapPinned, Radio, ShieldCheck, Workflow } from 'lucide-react'
import { backlogGroups, diagrams, rules, storyDescriptions, storyTitles, useCases } from '../content/editorial'
import { roles, serviceDescriptions, technologies } from '../content/introduction'
import { codeData, source } from '../content/data'
import { dataFlowDiagrams } from '../content/data-flows'
import type { DiagramItem, Page, SourceTable } from '../content/types'
import { ArticleSection, CodeReferences, CrossLink, Figure, SourceLink } from './Shared'
import type { ZoomImage } from './Shared'
import { MemberCommitList } from './MemberCommits'

const MemberCommitDetail = lazy(() => import('./CommitDetail'))

interface Props { page: Page; index: number; navigate: (id: string) => void; onZoom: (image: ZoomImage) => void }
const leafNumber = (n: number) => <span className="leaf-number">{String(n).padStart(2, '0')}</span>
function Tags({ children }: { children: React.ReactNode }) { return <div className="tags">{children}</div> }
function Related({ ids, navigate }: { ids: string[]; navigate: Props['navigate'] }) {
  return <div className="related-links">{ids.map(id => <CrossLink key={id} to={id.toLowerCase()} navigate={navigate}><span className="reference-id">{id}</span>{useCases.find(u => u.id === id)?.title}</CrossLink>)}</div>
}
function RefLinks({ references, navigate }: { references: string; navigate: Props['navigate'] }) {
  const ucs = [...references.matchAll(/UC\d+/g)].map(m => m[0])
  const brs = [...references.matchAll(/2\.(\d+)/g)].map(m => Number(m[1]))
  return <div className="reference-tags">{ucs.map(id => <a key={id} href={'#/' + id.toLowerCase()} onClick={e => { e.preventDefault(); navigate(id.toLowerCase()) }}>{id}</a>)}{brs.map(n => <a key={n} href={'#/quy-tac-' + (n <= 7 ? 1 : n <= 12 ? 2 : 3)} onClick={e => { e.preventDefault(); navigate('quy-tac-' + (n <= 7 ? 1 : n <= 12 ? 2 : 3)) }}>BR 2.{n}</a>)}{!ucs.length && !brs.length && <span>{references}</span>}</div>
}
function SchemaTable({ table }: { table: SourceTable }) {
  const keys = table.fields.filter(f => /\b(?:PK|FK|AK\d*|UQ)\b|khóa chính|khóa ngoại|tham chiếu/i.test(f.note))
  return <section className="schema-table" id={'bang-' + table.name}>
    <h3><Database size={16} /><code>{table.name}</code></h3><p>{table.purpose}</p>
    {keys.length > 0 && <ul className="schema-keys">{keys.map(f => <li key={f.name}><code>{f.name}</code><span>{f.note}</span></li>)}</ul>}
    <details className="schema-details"><summary>Tra cứu {table.fields.length} thuộc tính</summary><div className="schema-fields">{table.fields.map(f => <div className="schema-field" key={f.name}><div><code>{f.name}</code><span>{f.type}</span></div><p>{f.meaning}</p>{f.note && <small>{f.note}</small>}</div>)}</div></details>
  </section>
}

export function PageContent({ page, index, navigate, onZoom }: Props) {
  const [tab, setTab] = useState<'explain' | 'code'>('explain')
  const pageNo = index * 2 + 1
  const tabs = (label: string) => <div className="article-tabs" role="tablist" aria-label={label}><button type="button" id="explain-tab" role="tab" aria-controls="article-panel" aria-selected={tab === 'explain'} onClick={() => setTab('explain')}>Giải thích</button><button type="button" id="code-tab" role="tab" aria-controls="article-panel" aria-selected={tab === 'code'} onClick={() => setTab('code')}>Mã nguồn</button></div>

  if (page.kind === 'member-commits') return <MemberCommitList memberPage={page.id} navigate={navigate} />
  if (page.kind === 'commit-detail') return <Suspense fallback={<section className="paper-full" aria-busy="true"><h1>{page.title}</h1><p>Đang mở chi tiết commit…</p></section>}>
    <MemberCommitDetail sha={page.key!} navigate={navigate} />
  </Suspense>

  if (page.kind === 'intro') return <>
    <section className="leaf leaf-left cover-leaf"><span className="eyebrow">Sổ tay sản phẩm</span><h1>Khám phá địa điểm.<br /><span>Lắng nghe câu chuyện.</span></h1><p className="lead">Nearby Stories giúp bạn tìm hiểu những nơi quanh mình qua thuyết minh đa ngôn ngữ.</p><div className="intro-journey">{[{ icon: <MapPinned />, title: 'Tìm quanh mình', text: 'Khám phá địa điểm gần bạn hoặc trong vùng bản đồ.' }, { icon: <Languages />, title: 'Chọn ngôn ngữ', text: 'Tiếng Việt, Anh, Nhật, Hàn hoặc Trung.' }, { icon: <Headphones />, title: 'Nghe và khám phá', text: 'Chọn địa điểm để đọc hoặc nghe thuyết minh.' }].map(item => <div className="journey-stop" key={item.title}><span className="journey-icon">{item.icon}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</div><div className="cover-note"><AudioLines size={18} /><span>Nội dung được biên tập trước, dịch và tạo giọng nói để phục vụ người tham quan.</span></div>{leafNumber(pageNo)}</section>
    <section className="leaf leaf-right"><span className="eyebrow">Ba vai trò sử dụng</span><h2>Bạn dùng app thế nào?</h2><div className="role-intros">{roles.map((role, i) => <section key={role.id}><div className="role-title">{i === 0 ? <Headphones /> : i === 1 ? <FilePenLine /> : <ShieldCheck />}<h3>{role.title}</h3></div><p>{role.summary}</p><CrossLink to={role.page} navigate={navigate}>Xem cách sử dụng</CrossLink></section>)}</div><div className="reading-note"><span className="small-label">Đọc tiếp</span><CrossLink to="cong-nghe" navigate={navigate}>Các công nghệ sử dụng</CrossLink><CrossLink to="microservices" navigate={navigate}>Cách microservices phối hợp</CrossLink><CrossLink to="dfd-level-0" navigate={navigate}>Đọc sơ đồ luồng dữ liệu</CrossLink></div>{leafNumber(pageNo + 1)}</section>
  </>
  if (page.kind === 'role') {
    const role = roles.find(r => r.id === page.key)!
    return <><section className="leaf leaf-left"><span className="eyebrow">Giới thiệu · Cách sử dụng</span><h1>{role.title}</h1><p className="lead">{role.summary}</p><div className="guide-list">{role.steps.map(step => <ArticleSection key={step.title} title={step.title}><p>{step.text}</p></ArticleSection>)}</div>{leafNumber(pageNo)}</section><section className="leaf leaf-right"><span className="eyebrow">Trải nghiệm trong ứng dụng</span><h2>Những điều cần biết</h2>{role.notes.map(note => <p className="note-line" key={note}><Check size={17} /><span>{note}</span></p>)}<ArticleSection title="Các chức năng liên quan"><Related ids={role.related} navigate={navigate} /></ArticleSection>{leafNumber(pageNo + 1)}</section></>
  }
  if (page.kind === 'technologies') return <section className="paper-full"><span className="eyebrow">Giới thiệu · Công nghệ</span><h1>Những công nghệ làm nên Nearby Stories</h1><p className="lead full-lead">Mỗi công nghệ đảm nhiệm một phần cụ thể: giao diện, nghiệp vụ, dữ liệu, sản xuất nội dung và vận hành.</p><div className="technology-list">{technologies.map(t => <section className="technology" key={t.name}><span className="small-label">{t.category}</span><h3>{t.name}</h3><p>{t.purpose}</p><SourceLink id={t.source}>Vị trí trong dự án</SourceLink></section>)}</div><p className="source-note">Các công nghệ được đối chiếu từ dependency và cấu hình của dự án tại {codeData.revision.slice(0, 7)}.</p>{leafNumber(pageNo)}</section>
  if (page.kind === 'microservices') return <>
    <section className="leaf leaf-left"><span className="eyebrow">Giới thiệu · Kiến trúc</span><h1>Các service<br />phối hợp thế nào?</h1><p className="lead">Mỗi service sở hữu một trách nhiệm. Giao diện đọc nội dung đã sẵn sàng, còn dịch và tạo âm thanh chạy qua hàng đợi.</p><div className="service-map" aria-label="Ứng dụng đi qua Gateway tới các service nghiệp vụ"><div className="client-node">PWA <span>·</span> Admin Web</div><span className="map-connector" /><div className="gateway-node"><Workflow size={20} /><strong>Gateway</strong><span>Cổng HTTP</span></div><span className="map-connector" /><div className="service-nodes">{serviceDescriptions.slice(1).map(s => <div key={s.name}><strong>{s.name}</strong><span>{s.role}</span></div>)}</div></div><div className="event-pipeline"><span className="small-label"><Radio size={14} /> Chuỗi sự kiện qua RabbitMQ</span>{[['Catalog', 'ContentPublished'], ['Localization', 'TranslationReady'], ['Speech', 'AudioReady'], ['Catalog', 'Cập nhật nội dung']].map(([name, event], i) => <div className="event-step" key={String(name) + i}><strong>{name}</strong><span>{event}</span>{i < 3 && <ChevronRight size={16} />}</div>)}</div><p className="source-note">Localization là worker nội bộ. Bốn database riêng về mặt logic có thể cùng nằm trên một SQL Server.</p>{leafNumber(pageNo)}</section>
    <section className="leaf leaf-right"><span className="eyebrow">Đọc nhanh · Xử lý nền</span><h2>Hai luồng hoạt động</h2><ArticleSection title="Khi khách tìm và nghe"><p>PWA gửi yêu cầu qua Gateway đến Catalog. Catalog trả địa điểm, văn bản và vị trí âm thanh theo ngôn ngữ phù hợp. MP3 được lấy qua Gateway → Speech → MinIO để phát.</p><p>Nội dung đã sẵn sàng được dùng lại; thao tác nghe không phải dịch hoặc tạo giọng đọc từ đầu.</p></ArticleSection><ArticleSection title="Khi biên tập viên xuất bản"><p>Catalog kiểm tra bản nháp rồi ghi thay đổi cùng sự kiện vào outbox trong một transaction. Dispatcher phát <code>ContentPublished</code> tới RabbitMQ.</p><p>Localization chuẩn bị nội dung và phát <code>TranslationReady</code>. Speech tạo MP3, lưu MinIO và phát <code>AudioReady</code>. Catalog tập hợp kết quả để phục vụ.</p></ArticleSection><ArticleSection title="Khi nào phiên bản mới được dùng?"><p>Khi văn bản và âm thanh tiếng Việt sẵn sàng. Phiên bản cũ tiếp tục phục vụ trong lúc chờ; các ngôn ngữ khác có thể dùng dự phòng.</p></ArticleSection><ArticleSection title="Vì sao có outbox và xử lý trùng?"><p>Message có thể được giao lại. Outbox giữ sự kiện cùng thay đổi nghiệp vụ; các kiểm tra idempotency giúp dùng lại kết quả đã có và tránh xử lý trùng.</p></ArticleSection><Related ids={['UC4', 'UC6', 'UC7']} navigate={navigate} />{leafNumber(pageNo + 1)}</section>
  </>
  if (page.kind === 'backlog') {
    const group = backlogGroups.find(g => g.id === page.key)!
    const stories = source.stories.filter(s => group.ids.includes(s.id))
    return <section className="paper-full"><span className="eyebrow">Product backlog · {group.title}</span><h1>{group.title}</h1><p className="lead full-lead">{stories.length} yêu cầu được giữ mã, mức ưu tiên và liên kết theo tài liệu sản phẩm.</p><div className="backlog-list">{stories.map(s => { const i = Number(s.id.slice(2)) - 1; return <article className="story" id={s.id.toLowerCase()} key={s.id}><div className="story-meta"><span className="story-id">{s.id}</span><span className={'priority priority-' + s.priority.toLowerCase()}>{s.priority}</span>{s.proposed && <span className="proposed">Đề xuất</span>}</div><div><h3>{storyTitles[i]}</h3><p>{storyDescriptions[i]}</p><RefLinks references={s.references} navigate={navigate} /><details className="original-story"><summary>Nội dung gốc</summary><p lang="en">{s.text}</p></details></div></article> })}</div>{group.id === 'staff' && <p className="source-note">US22 và US23 được đề xuất mức Should trong tài liệu cập nhật.</p>}{leafNumber(pageNo)}</section>
  }
  if (page.kind === 'rules') {
    const bounds = [[1, 7], [8, 12], [13, 16]][Number(page.key)]!
    return <section className="paper-full"><span className="eyebrow">Business rules · Use case v2</span><h1>{page.title}</h1><p className="lead full-lead">Những quy tắc quyết định hành vi và điều kiện xử lý của hệ thống.</p><div className="rules-list">{rules.map((text, i) => i + 1 >= bounds[0]! && i + 1 <= bounds[1]! && <section className="rule" key={i} id={'br-' + (i + 1)}><span className="rule-id">BR 2.{i + 1}</span><div><p>{text}</p><div className="reference-tags">{useCases.filter(u => u.rules.includes(i + 1)).map(u => <a href={'#/' + u.id.toLowerCase()} key={u.id} onClick={e => { e.preventDefault(); navigate(u.id.toLowerCase()) }}>{u.id}</a>)}</div></div></section>)}</div>{leafNumber(pageNo)}</section>
  }
  if (page.kind === 'usecase') {
    const uc = useCases.find(u => u.id === page.key)!
    return <><section className="leaf leaf-left"><div className="sticky-diagram"><span className="eyebrow">Use case v2 · {uc.id}</span><h1>{uc.title}</h1><Tags><span className="tag">{uc.actor}</span></Tags><Figure imageKey={uc.id.toLowerCase() + '-activity'} title={'Activity diagram · ' + uc.id} onZoom={onZoom} navigate={navigate} /><p className="figure-reading-hint">Luồng chính và các nhánh trong hình được giải thích đầy đủ ở trang bên phải.</p><div className="diagram-legend"><span><i className="legend-dot" /> Bắt đầu / kết thúc</span><span><i className="legend-diamond" /> Điều kiện rẽ nhánh</span></div></div>{leafNumber(pageNo)}</section><section className="leaf leaf-right">{tabs('Nội dung ' + uc.id)}<div id="article-panel" role="tabpanel" aria-labelledby={tab === 'explain' ? 'explain-tab' : 'code-tab'}>{tab === 'code' ? <CodeReferences ids={codeData.byUseCase[uc.id] || []} /> : <><ArticleSection title="Mục tiêu"><p>{uc.summary}</p></ArticleSection><div className="precondition"><span className="small-label">Trước khi bắt đầu</span><p>{uc.precondition}</p></div><ArticleSection title="Cách hoạt động">{uc.flow.map(p => <p key={p}>{p}</p>)}</ArticleSection>{uc.implementation && <ArticleSection title="Triển khai hiện tại"><p>{uc.implementation}</p></ArticleSection>}<ArticleSection title="Các nhánh thay thế">{uc.alternatives.map(p => <p className="branch-note" key={p}>{p}</p>)}</ArticleSection><ArticleSection title="Khi xảy ra lỗi">{uc.errors.map(p => <p className="error-note" key={p}>{p}</p>)}</ArticleSection><ArticleSection title="Kết quả"><p>{uc.outcome}</p></ArticleSection><ArticleSection title="Quy tắc liên quan"><div className="inline-rules">{uc.rules.map(n => <div key={n}><CrossLink to={'quy-tac-' + (n <= 7 ? 1 : n <= 12 ? 2 : 3)} navigate={navigate}>BR 2.{n}</CrossLink><p>{rules[n - 1]}</p></div>)}</div></ArticleSection></>}</div>{leafNumber(pageNo + 1)}</section></>
  }
  if (page.kind === 'erd') {
    const db = source.databases.find(d => d.id === page.key)!
    return <><section className="leaf leaf-left"><div className="sticky-diagram"><span className="eyebrow">Thiết kế dữ liệu · ERD</span><h1>{db.name}</h1><p className="lead">{db.summary}</p><Tags><span className="tag">{db.tables.length} bảng</span><span className="tag">Database riêng theo service</span></Tags><Figure imageKey={db.image} title={'ERD · ' + db.name} onZoom={onZoom} navigate={navigate} /><p className="figure-reading-hint">Mỗi bảng trong hình đều có vai trò được trình bày ở trang bên phải. Phóng to để đọc tên cột và quan hệ.</p></div>{leafNumber(pageNo)}</section><section className="leaf leaf-right">{tabs('Dữ liệu ' + db.name)}<div id="article-panel" role="tabpanel" aria-labelledby={tab === 'explain' ? 'explain-tab' : 'code-tab'}>{tab === 'code' ? <CodeReferences ids={['DB-' + db.id.toUpperCase()]} /> : <><span className="eyebrow">{db.tables.length} bảng · Vai trò & liên kết</span><h2>Dữ liệu được tổ chức ra sao?</h2><p className="schema-intro">PK là khóa chính, FK là khóa ngoại, AK và UQ đánh dấu tính duy nhất. Các cột cùng nhãn FK hoặc AK có thể tạo khóa ghép. Tham chiếu giữa các service được đối chiếu ở tầng ứng dụng.</p>{db.tables.map(table => <SchemaTable key={table.name} table={table} />)}</>}</div>{leafNumber(pageNo + 1)}</section></>
  }
  if (page.kind === 'dfd-index') return <>
    <section className="leaf leaf-left">
      <span className="eyebrow">DFD Level 2</span>
      <h1>Phân rã tiến trình</h1>
      <p className="lead">Năm sơ đồ đi sâu vào các tiến trình ở Level 1. Mỗi hình giữ số hiệu của tiến trình cha và các kho dữ liệu để bạn lần theo dữ liệu giữa hai mức.</p>
      <CrossLink to="dfd-level-1" navigate={navigate}>Xem lại DFD Level 1</CrossLink>
      {leafNumber(pageNo)}
    </section>
    <section className="leaf leaf-right">
      <h2>Năm tiến trình được phân rã</h2>
      {dataFlowDiagrams.filter(diagram => diagram.level === 2)
        .sort((a, b) => a.title.localeCompare(b.title, 'vi'))
        .map(diagram => <ArticleSection key={diagram.id} title={diagram.title}>
          <p>{diagram.summary}</p>
          <CrossLink to={diagram.id} navigate={navigate}>Mở sơ đồ {diagram.title.split(' ')[0]}</CrossLink>
        </ArticleSection>)}
      {leafNumber(pageNo + 1)}
    </section>
  </>
  const diagram = diagrams.find(d => d.id === page.key)!
  if (page.group === 'dfd') {
    const describeItems = (items: DiagramItem[]) => items.map(item => <ArticleSection key={item.name} title={item.name}>
      <p>{item.description}</p>
      {item.target && <CrossLink to={item.target} navigate={navigate}>
        {item.target.startsWith('erd-') ? 'Xem ERD' : 'Xem sơ đồ Level 2'}
      </CrossLink>}
    </ArticleSection>)

    return <>
      <section className="leaf leaf-left">
        <div className="sticky-diagram">
          <span className="eyebrow">{'DFD Level ' + page.dfdLevel}</span>
          <h1>{diagram.title}</h1>
          <Figure imageKey={diagram.image} title={page.title} onZoom={onZoom} navigate={navigate} />
          <div className="related-links">
            {diagram.parent && <CrossLink to={diagram.parent} navigate={navigate}>
              {diagram.parent === 'dfd-level-0' ? 'Xem lại DFD Level 0' : 'Về danh sách DFD Level 2'}
            </CrossLink>}
            {diagram.next && <CrossLink to={diagram.next} navigate={navigate}>{diagram.next === 'dfd-level-2' ? 'Đọc tiếp DFD Level 2' : 'Đọc tiếp DFD Level 1'}</CrossLink>}
          </div>
        </div>
        {leafNumber(pageNo)}
      </section>
      <section className="leaf leaf-right">
        {tabs(page.title)}
        <div id="article-panel" role="tabpanel" aria-labelledby={tab === 'explain' ? 'explain-tab' : 'code-tab'}>
          {tab === 'code' ? <>
            <h2>Mã nguồn theo luồng dữ liệu</h2>
            <p className="code-introduction">Các đường dẫn trỏ tới mã nguồn tại phiên bản <code>{codeData.revision.slice(0, 7)}</code>.</p>
            {diagram.items.map(item => item.code && <ArticleSection key={item.name} title={item.name}>
              <CodeReferences ids={item.code} showRevision={false} />
            </ArticleSection>)}
          </> : <>
            <h2>Cách dữ liệu đi qua hệ thống</h2>
            <p className="lead">{diagram.summary}</p>
            {diagram.implementation && <ArticleSection title="Triển khai hiện tại"><p>{diagram.implementation}</p></ArticleSection>}
            {describeItems(diagram.items)}
            {diagram.stores && <><h2>Kho dữ liệu</h2>{describeItems(diagram.stores)}</>}
            <ArticleSection title="Use case liên quan"><Related ids={diagram.related} navigate={navigate} /></ArticleSection>
          </>}
        </div>
        {leafNumber(pageNo + 1)}
      </section>
    </>
  }
  return <><section className="leaf leaf-left"><div className="sticky-diagram"><span className="eyebrow">{page.kind === 'general' ? 'Use case v2' : page.group === 'class' ? 'Class diagram' : page.group === 'sequence' ? 'Sequence diagram' : 'Kiến trúc hệ thống'}</span><h1>{diagram.title}</h1><Figure imageKey={diagram.image} title={diagram.title} onZoom={onZoom} navigate={navigate} /></div>{leafNumber(pageNo)}</section><section className="leaf leaf-right">{diagram.code?.length ? tabs('Nội dung ' + diagram.title) : <span className="eyebrow">Đọc sơ đồ</span>}<div id="article-panel" role={diagram.code?.length ? 'tabpanel' : undefined} aria-labelledby={diagram.code?.length ? tab === 'explain' ? 'explain-tab' : 'code-tab' : undefined}>{tab === 'code' && diagram.code ? <CodeReferences ids={diagram.code} /> : <><h2>{diagram.title}</h2><p className="lead">{diagram.summary}</p>{diagram.implementation && <ArticleSection title="Triển khai hiện tại"><p>{diagram.implementation}</p></ArticleSection>}{diagram.items.map(item => <ArticleSection key={item.name} title={item.name}><p>{item.description}</p></ArticleSection>)}{diagram.related.length > 0 && <ArticleSection title="Use case liên quan"><Related ids={diagram.related} navigate={navigate} /></ArticleSection>}{page.kind === 'general' && <CrossLink to="uc1" navigate={navigate}>Mở đặc tả UC1 <ArrowRight size={14} /></CrossLink>}</>}</div>{leafNumber(pageNo + 1)}</section></>
}
