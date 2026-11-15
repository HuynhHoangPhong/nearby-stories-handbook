import { useEffect, useRef, useState } from 'react'
import { Download, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { asset } from '../config/assets'
import { source } from '../content/data'
import type { ZoomImage } from './Shared'

export function DiagramDialog({ image, onClose }: { image: ZoomImage; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [zoom, setZoom] = useState(1)
  const src = source.images[image.key]!
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close() } }, [])
  return <dialog ref={ref} className="diagram-dialog" onClose={onClose} onClick={e => { if (e.target === e.currentTarget) ref.current?.close() }} aria-labelledby="diagram-dialog-title">
    <div className="dialog-surface"><header className="dialog-header"><div><span className="eyebrow">Xem sơ đồ</span><h2 id="diagram-dialog-title">{image.title}</h2></div><button className="icon-button" type="button" aria-label="Đóng hình phóng to" onClick={() => ref.current?.close()}><X /></button></header>
      <div className="zoom-controls"><div><button type="button" aria-label="Thu nhỏ" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.25))}><Minus size={17} /></button><span aria-live="polite">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Phóng lớn" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + 0.25))}><Plus size={17} /></button><button type="button" onClick={() => setZoom(1)}><RotateCcw size={15} /> Vừa khung</button></div><a href={asset(src.src)} download><Download size={16} /> Hình gốc</a></div>
      <div className="zoom-stage"><img src={asset(src.src)} alt={image.title} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} /></div>
      <p className="dialog-caption">Có thể phóng lớn rồi cuộn để đọc từng vùng trong hình. Nhấn Esc để quay lại.</p>
    </div>
  </dialog>
}
