import { BookOpen, Boxes, ChevronDown, ChevronRight, Database, GitCompareArrows, GitCommitHorizontal, GitFork, ListChecks, Network, NotebookTabs, Search, Server, Workflow, X } from 'lucide-react'
import { useState } from 'react'
import { groups, pages } from '../content/editorial'
import type { Page } from '../content/types'

const icons = { book: BookOpen, boxes: Boxes, database: Database, sequence: GitCompareArrows, list: ListChecks, rules: NotebookTabs, workflow: Workflow, dfd: GitFork, network: Network, server: Server, commits: GitCommitHorizontal }
const tocPages = pages.filter(page => !page.tocParent)
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase()
export function Sidebar({ current, navigate, close }: { current: Page; navigate: (id: string) => void; close: () => void }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])
  const search = normalize(query.trim())
  const matches = (page: Page, group: string) => normalize(page.title + ' ' + page.id + ' ' + group).includes(search)
  const link = (page: Page) => <a key={page.id} href={'#/' + page.id} aria-current={page.id === current.id ? 'page' : current.tocParent === page.id ? 'location' : undefined} onClick={e => { e.preventDefault(); navigate(page.id) }}>{page.kind === 'usecase' && <span className="nav-uc-id">{page.key}</span>}<span>{page.shortTitle}</span></a>
  const resultCount = tocPages.filter(p => matches(p, groups.find(g => g.id === p.group)?.title || p.group)).length
  return <><div className="sidebar-heading"><span className="small-label">Mục lục</span><button className="icon-button close-sidebar" type="button" aria-label="Đóng mục lục" onClick={close}><X size={20} /></button></div><label className="toc-search"><Search size={16} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trong mục lục…" aria-label="Tìm trong mục lục" /></label><nav aria-label="Mục lục tài liệu" className="toc">{groups.map(group => {
    const children = tocPages.filter(p => p.group === group.id && matches(p, group.title))
    if (!children.length) return null
    const topLinks = children.filter(page => page.dfdLevel !== 2 || page.kind === 'dfd-index')
    const levelTwoLinks = children.filter(page => page.dfdLevel === 2 && page.kind === 'diagram')
    const Icon = icons[group.icon as keyof typeof icons]
    if (group.direct) return children.map(page => (
      <a className="toc-direct" key={page.id} href={'#/' + page.id} aria-current={current.id === page.id ? 'page' : undefined} onClick={e => { e.preventDefault(); navigate(page.id) }}>
        <Icon size={17} /><span>{page.title}</span>
      </a>
    ))
    const open = Boolean(search) || expanded.includes(group.id)
    return <section className="toc-group" key={group.id}><button className="toc-group-button" type="button" aria-expanded={open} aria-controls={'toc-' + group.id} onClick={() => setExpanded(prev => prev.includes(group.id) ? prev.filter(id => id !== group.id) : [...prev, group.id])}><Icon size={17} /><span>{group.title}</span>{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button><div className="toc-children" id={'toc-' + group.id} hidden={!open}>{topLinks.map(link)}{levelTwoLinks.length > 0 && <div className="toc-children toc-level-two" role="group" aria-label="Tiến trình DFD Level 2">{levelTwoLinks.map(link)}</div>}</div></section>
  })}</nav>{search && <p className="search-results" role="status">{resultCount ? `${resultCount} mục phù hợp` : 'Không có mục phù hợp. Thử từ khóa khác.'}</p>}</>
}
