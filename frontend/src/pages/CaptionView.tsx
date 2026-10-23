import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CaptionView({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const copy = () => {
    navigator.clipboard.writeText(text || '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <>
      <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => { setCopied(false); setOpen(true) }}>Full caption</button>
      {open && createPortal(
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button onClick={() => setOpen(false)} aria-label="Close" title="Close"
            style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%',
                     border: 'none', background: 'rgba(255,255,255,0.95)', color: '#111',
                     fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>✕</button>
          <div onClick={e => e.stopPropagation()}
            style={{ maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#17120a',
                     color: '#f3e9c8', border: '1px solid #243055', borderRadius: 12, padding: 20 }}>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 15 }}>{text}</div>
            <div style={{ marginTop: 14 }}>
              <button className="btn" style={{ padding: '4px 12px', fontSize: 13 }} onClick={copy}>{copied ? 'Copied' : 'Copy caption'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
