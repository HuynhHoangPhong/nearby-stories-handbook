import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, ArrowRight, AudioLines, BookOpen, ChevronRight, ClipboardList, Files, FileText, Github, Menu, Volume2, VolumeX } from 'lucide-react'
import { pages, groups } from './content/editorial'
import { repository } from './config/assets'
import { Sidebar } from './components/Sidebar'
import { PageContent } from './components/PageContent'
import { DiagramDialog } from './components/DiagramDialog'
import type { ZoomImage } from './components/Shared'
import { playPaper, turnPaper } from './lib/paper'

const resourceLinks = [
  {
    label: 'Bản báo cáo', shortLabel: 'Báo cáo', icon: FileText,
    href: 'https://docs.google.com/document/d/1jTIyhgZI35Mum3TlTVmXG8pCzXwgLuN1sn_p6E36kQE/edit?usp=sharing',
  },
  {
    label: 'Quản lí công việc', shortLabel: 'Công việc', icon: ClipboardList,
    href: 'https://docs.google.com/spreadsheets/d/1NiGegUmbfyaz2TzIF0GZqKTh0hB9H0HW-JaQ84L3alc/edit?gid=0#gid=0',
  },
  { label: 'GitHub', shortLabel: 'GitHub', icon: Github, href: repository },
  {
    label: 'Product Requirement Document', shortLabel: 'PRD', icon: Files,
    href: 'https://docs.google.com/document/d/1u90yZQ-tHGRho60jXjcrB4FM5f1NMC5r8jvqbtLE_WI/edit?usp=sharing',
  },
]

function readPage(): string {
  try { const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')); return pages.some(p => p.id === id) ? id : pages[0]!.id }
  catch { return pages[0]!.id }
}
function readSound(): boolean { try { return localStorage.getItem('ns-handbook-sound') !== 'false' } catch { return true } }

export function App() {
  const [currentId, setCurrentId] = useState(readPage)
  const [sound, setSound] = useState(readSound)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [zoom, setZoom] = useState<ZoomImage | null>(null)
  const [turning, setTurning] = useState(false)
  const bookRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const activeTurn = useRef<ReturnType<typeof turnPaper> | null>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const index = pages.findIndex(p => p.id === currentId)
  const page = pages[index]!
  const group = groups.find(g => g.id === page.group && !g.direct)

  useEffect(() => {
    const sync = () => { activeTurn.current?.cancel(); activeTurn.current = null; setTurning(false); setCurrentId(readPage()); setSidebarOpen(false); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', sync); window.addEventListener('popstate', sync)
    if (!location.hash || !pages.some(p => '#/' + p.id === location.hash)) history.replaceState(null, '', '#/' + readPage())
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); activeTurn.current?.cancel() }
  }, [])
  useEffect(() => { document.title = `${page.title} — Nearby Stories`; }, [page.title])
  useEffect(() => { try { localStorage.setItem('ns-handbook-sound', String(sound)) } catch { /* Reading preference only. */ } }, [sound])
  useEffect(() => {
    if (!sidebarOpen) return
    const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSidebarOpen(false); menuRef.current?.focus() } }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [sidebarOpen])

  function navigate(id: string, flip = false) {
    const nextIndex = pages.findIndex(p => p.id === id)
    if (nextIndex < 0 || id === currentId) { setSidebarOpen(false); return }
    activeTurn.current?.cancel(); activeTurn.current = null
    const old = flip ? bookRef.current?.cloneNode(true) as HTMLElement | undefined : undefined
    window.scrollTo({ top: 0, behavior: 'instant' })
    flushSync(() => { setCurrentId(id); setSidebarOpen(false); setTurning(false) })
    history.pushState(null, '', '#/' + id)
    if (flip) {
      if (sound) playPaper()
      if (old && bookRef.current) {
        setTurning(true)
        const animation = turnPaper(old, bookRef.current, nextIndex > index)
        activeTurn.current = animation
        void animation.finished.then(() => { if (activeTurn.current === animation) { activeTurn.current = null; setTurning(false) } })
      }
    }
  }
  const full = ['backlog', 'rules', 'technologies', 'member-commits', 'commit-detail'].includes(page.kind)
  return <div className="handbook-app">
    <a className="skip-link" href="#reading-content" onClick={e => { e.preventDefault(); mainRef.current?.focus() }}>Đến nội dung</a>
    <header className="app-header">
      <div className="brand">
        <button ref={menuRef} className="icon-button menu-button" type="button" aria-label="Mở mục lục" aria-expanded={sidebarOpen} aria-controls="handbook-sidebar" onClick={() => setSidebarOpen(open => !open)}><Menu /></button>
        <div className="brand-mark" aria-hidden="true"><AudioLines size={25} /></div>
        <div>
          <a href="#/gioi-thieu" onClick={e => { e.preventDefault(); navigate('gioi-thieu') }} className="brand-name">Nearby Stories</a>
          <span className="brand-caption">Sổ tay sản phẩm &amp; thiết kế hệ thống</span>
        </div>
      </div>
      <nav className="header-actions" aria-label="Tài liệu và tùy chọn đọc">
        {resourceLinks.map(({ label, shortLabel, icon: Icon, href }) => (
          <a key={href} href={href} className="header-resource" target="_blank" rel="noreferrer" aria-label={label} title={label}>
            <Icon size={17} aria-hidden="true" />
            <span className="header-label">{label}</span>
            <span className="header-label-short" aria-hidden="true">{shortLabel}</span>
          </a>
        ))}
        <button className={'sound-toggle' + (sound ? ' sound-on' : '')} type="button" aria-pressed={sound}
          aria-label={'Tiếng giấy: ' + (sound ? 'bật' : 'tắt')}
          onClick={() => setSound(value => !value)} title="Tiếng giấy chỉ phát khi dùng Trang trước hoặc Trang sau">
          {sound ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
          <span className="header-label">Tiếng giấy: {sound ? 'bật' : 'tắt'}</span>
          <span className="header-label-short" aria-hidden="true">Tiếng giấy</span>
        </button>
      </nav>
    </header>
    <div className="app-layout">{sidebarOpen && <button className="sidebar-scrim" aria-label="Đóng mục lục" type="button" onClick={() => setSidebarOpen(false)} />}<aside id="handbook-sidebar" className={'app-sidebar' + (sidebarOpen ? ' sidebar-open' : '')}><Sidebar current={page} navigate={id => navigate(id)} close={() => setSidebarOpen(false)} /></aside><main ref={mainRef} id="reading-content" tabIndex={-1} className="reading-desk"><div className="desk-topline"><div className="breadcrumbs"><BookOpen size={15} /><span>Sổ tay sản phẩm</span><ChevronRight size={13} /><span>{group?.title || page.title}</span>{group && <><ChevronRight size={13} /><strong>{page.kind === 'usecase' ? page.key : page.shortTitle}</strong></>}</div><span className="edition-label">Tài liệu cập nhật · 15.11.2026</span></div><div className={'book' + (full ? ' book-wide' : '')} ref={bookRef} aria-label={'Nội dung: ' + page.title} aria-busy={turning}><PageContent key={page.id} page={page} index={index} navigate={id => navigate(id)} onZoom={setZoom} /></div><nav className="page-navigation" aria-label="Lật trang sách"><button type="button" disabled={index === 0 || turning} onClick={() => { const next = pages[index - 1]; if (next) navigate(next.id, true) }}><ArrowLeft size={17} /><span>Trang trước</span></button><span className="page-location">Mục <b>{index + 1}</b><span>/</span>{pages.length}</span><button type="button" disabled={index === pages.length - 1 || turning} onClick={() => { const next = pages[index + 1]; if (next) navigate(next.id, true) }}><span>Trang sau</span><ArrowRight size={17} /></button></nav><div className="sr-only" aria-live="polite">Đang đọc {page.kind === 'usecase' ? page.key + ': ' : ''}{page.title}</div></main></div>{zoom && <DiagramDialog image={zoom} onClose={() => setZoom(null)} />}
  </div>
}
