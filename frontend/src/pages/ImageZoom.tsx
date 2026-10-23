import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ImageZoom({ src }: { src: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <img src={src} alt="" title="Open full size" onClick={() => setOpen(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
      {open && createPortal(
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setOpen(false)} aria-label="Close" title="Close"
            style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%',
                     border: 'none', background: 'rgba(255,255,255,0.95)', color: '#111',
                     fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>✕</button>
          <img src={src} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '95vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>,
        document.body
      )}
    </>
  )
}
