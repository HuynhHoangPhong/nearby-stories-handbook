import { useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, Check, Code2, Copy, Expand, FileText } from 'lucide-react'
import { asset, repository } from '../config/assets'
import { codeData, source } from '../content/data'
import type { CodeFile } from '../content/types'

function codeUrl(file: CodeFile) {
  const path = file.path.split('/').map(encodeURIComponent).join('/')
  return repository + '/blob/' + codeData.revision + '/' + path + '#L' + file.line
}

export interface ZoomImage { key: string; title: string }
export function Figure({ imageKey, title, onZoom }: { imageKey: string; title: string; onZoom: (image: ZoomImage) => void }) {
  const image = source.images[imageKey]
  if (!image) return <p>Chưa có hình cho mục này.</p>
  return <figure className="document-figure">
    <div className="figure-toolbar"><span>{image.sourceVersion}</span><button type="button" onClick={() => onZoom({ key: imageKey, title })}><Expand size={15} /> Phóng to</button></div>
    <button className="figure-image" type="button" onClick={() => onZoom({ key: imageKey, title })} aria-label={'Phóng to ' + title}><img src={asset(image.src)} alt={title} decoding="async" /></button>
    <figcaption><FileText size={13} /><span>{title}</span><a href={asset(image.src)} download aria-label={'Tải hình ' + title}><ArrowDownToLine size={14} /></a></figcaption>
  </figure>
}

export function CodeReferences({ ids, showRevision = true }: { ids: string[]; showRevision?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null)
  const files = [...new Set(ids)].map(id => codeData.files[id]).filter(file => file !== undefined)
  return <div className="code-references">
    {showRevision && <p className="code-introduction">Các đường dẫn trỏ tới mã nguồn tại phiên bản <code>{codeData.revision.slice(0, 7)}</code>.</p>}
    {files.map(file => <section className="code-file" key={file.id}>
      <div className="code-file-title"><Code2 size={18} /><h3>{file.path.split('/').pop()}</h3><button className="icon-button" type="button" aria-label={'Sao chép đường dẫn ' + file.path} onClick={() => { void navigator.clipboard?.writeText(file.path).then(() => setCopied(file.id)).catch(() => setCopied(null)) }}>{copied === file.id ? <Check size={16} /> : <Copy size={16} />}</button></div>
      <code className="file-path">{file.path}</code>
      <div className="symbol-line">{file.symbol} <span>· dòng {file.line}</span></div>
      <p>{file.description}</p>
      <a className="text-link" href={codeUrl(file)} target="_blank" rel="noreferrer">Xem mã nguồn <ArrowUpRight size={14} /></a>
      {file.excerpt && <details className="code-excerpt"><summary>Đoạn mã tại vị trí này</summary><pre><code>{file.excerpt.split('\n').map((line, index) => <span className="code-line" key={index}><span className="line-number" aria-hidden="true">{file.line + index}</span><span>{line || ' '}</span></span>)}</code></pre></details>}
    </section>)}
    <span className="sr-only" role="status">{copied ? 'Đã sao chép đường dẫn.' : ''}</span>
  </div>
}

export function ArticleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="article-section"><h3>{title}</h3>{children}</section>
}
export function CrossLink({ to, children, navigate }: { to: string; children: React.ReactNode; navigate: (id: string) => void }) {
  return <a href={'#/' + to} className="cross-link" onClick={e => { e.preventDefault(); navigate(to) }}>{children}<ArrowUpRight size={14} /></a>
}
export function SourceLink({ id, children }: { id: string; children: React.ReactNode }) {
  const file = codeData.files[id]
  if (!file) return null
  return <a className="text-link" href={codeUrl(file)} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={13} /></a>
}
