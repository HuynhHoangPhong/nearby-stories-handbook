// The only caller of playPaper is the explicit Previous / Next action.
let audioContext: AudioContext | undefined
export function playPaper(): void {
  try {
    audioContext ??= new AudioContext()
    const context = audioContext
    if (context.state === 'suspended') void context.resume().catch(() => {})
    const duration = 0.9, time = context.currentTime, rate = context.sampleRate
    const buffer = context.createBuffer(1, Math.ceil(rate * duration), rate)
    const data = buffer.getChannelData(0)
    let brown = 0
    for (let i = 0; i < data.length; i++) {
      const x = i / rate
      brown = 0.48 * brown + 0.52 * (Math.random() * 2 - 1)
      const sweep = Math.sin(Math.PI * Math.min(1, x / 0.82)) ** 2
      const crackle = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 1.4 : 0
      data[i] = (brown + crackle) * (0.2 + 0.8 * sweep)
    }
    const source = context.createBufferSource(), high = context.createBiquadFilter(), low = context.createBiquadFilter(), gain = context.createGain()
    source.buffer = buffer
    high.type = 'highpass'; high.frequency.value = 900
    low.type = 'lowpass'; low.frequency.setValueAtTime(1600, time)
    low.frequency.exponentialRampToValueAtTime(6200, time + 0.35)
    low.frequency.exponentialRampToValueAtTime(1300, time + duration)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.12, time + 0.09)
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.42)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    source.connect(high); high.connect(low); low.connect(gain); gain.connect(context.destination)
    source.start(time); source.stop(time + duration)
    source.onended = () => { source.disconnect(); high.disconnect(); low.disconnect(); gain.disconnect() }
  } catch { /* Reading the handbook remains available when browser audio is unavailable. */ }
}

function copyFace(target: HTMLElement, from: HTMLElement, side: 'left' | 'right'): void {
  const leaves = from.querySelectorAll<HTMLElement>(':scope > .leaf')
  const leaf = leaves[side === 'left' ? 0 : 1]
  if (leaf) target.append(leaf.cloneNode(true))
  else {
    const spread = from.querySelector<HTMLElement>(':scope > .paper-full')
    if (spread) {
      const copy = spread.cloneNode(true) as HTMLElement
      copy.classList.add('turn-wide-content')
      if (side === 'right') copy.classList.add('crop-right')
      target.append(copy)
    }
  }
  target.querySelectorAll<HTMLElement>('[id]').forEach(el => el.removeAttribute('id'))
  target.querySelectorAll<HTMLElement>('a,button,input,summary').forEach(el => el.setAttribute('tabindex', '-1'))
}

export function turnPaper(old: HTMLElement, book: HTMLElement, forward: boolean): { finished: Promise<void>; cancel: () => void } {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { finished: Promise.resolve(), cancel: () => {} }
  const narrow = book.clientWidth < 650
  const overlay = document.createElement('div')
  overlay.className = 'turn-overlay' + (narrow ? ' turn-narrow' : '')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.height = Math.min(Math.max(book.clientHeight, old.clientHeight, 650), 1000) + 'px'
  const hold = document.createElement('div'); hold.className = 'turn-hold ' + (forward ? 'hold-left' : 'hold-right')
  const sheet = document.createElement('div'); sheet.className = 'turn-sheet'
  sheet.style.left = narrow ? '0' : forward ? '50%' : '0'
  sheet.style.transformOrigin = forward ? 'left center' : 'right center'
  const front = document.createElement('div'); front.className = 'turn-front'
  const back = document.createElement('div'); back.className = 'turn-back'
  copyFace(hold, old, forward ? 'left' : 'right')
  copyFace(front, old, forward ? 'right' : 'left')
  copyFace(back, book, forward ? 'left' : 'right')
  const shade = document.createElement('div'); shade.className = 'turn-floor-shadow'
  sheet.append(front, back); overlay.append(hold, shade, sheet); book.append(overlay)
  const sign = forward ? -1 : 1
  const animation = sheet.animate([
    { transform: 'rotateY(0deg) rotateZ(0deg)', offset: 0 },
    { transform: `rotateY(${sign * 20}deg) rotateZ(${sign * 1.8}deg) translateZ(24px)`, offset: 0.18 },
    { transform: `rotateY(${sign * 85}deg) rotateZ(${sign * 3.4}deg) translateZ(36px)`, offset: 0.52 },
    { transform: `rotateY(${sign * 148}deg) rotateZ(${sign * 1.2}deg) translateZ(15px)`, offset: 0.78 },
    { transform: `rotateY(${sign * 180}deg) rotateZ(0deg)`, offset: 1 },
  ], { duration: 1350, easing: 'cubic-bezier(.24,.42,.25,1)', fill: 'forwards' })
  const shadow = shade.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.5 }, { opacity: 0 }], { duration: 1350, fill: 'forwards' })
  const curl = front.animate([{ borderRadius: '2px 12px 12px 2px' }, { borderRadius: '0 60px 35px 0', offset: 0.5 }, { borderRadius: '2px 12px 12px 2px' }], { duration: 1350 })
  const cleanup = () => { overlay.remove(); shadow.cancel(); curl.cancel() }
  return { finished: animation.finished.then(cleanup, cleanup), cancel: () => { animation.cancel(); cleanup() } }
}
