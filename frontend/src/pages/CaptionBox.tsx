import { useEffect, useState } from 'react'
import { api } from '../api'

export default function CaptionBox({ p, onSaved, onError }: { p: any, onSaved: () => void, onError: (m: string) => void }) {
  const [text, setText] = useState(p.caption || '')
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState('')
  useEffect(() => { setText(p.caption || '') }, [p.caption])
  const dirty = text !== (p.caption || '')

  const save = () => {
    setBusy('save')
    api.patch('/api/posts/' + p.id, { caption: text }).then(onSaved).catch((e: any) => onError(e.message)).finally(() => setBusy(''))
  }
  const regen = () => {
    setBusy('regen')
    const idea = 'Rewrite this social media post' + (hint ? ' (' + hint + ')' : '') + ': ' + text
    api.post('/api/captions', { idea, tone: 'friendly', n: 1 })
      .then((r: any) => { const c = Array.isArray(r) ? r[0] : r; setText(typeof c === 'string' ? c : (c?.caption || c?.text || text)) })
      .catch((e: any) => onError(e.message)).finally(() => setBusy(''))
  }
  return <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, margin: '10px 0' }}>
    <label>Caption (edit it, or ask the Genie to rewrite it)</label>
    <textarea value={text} onChange={e => setText(e.target.value)}
      style={{ width: '100%', flex: 1, minHeight: 240, resize: 'vertical', boxSizing: 'border-box', padding: 10, borderRadius: 8,
               background: '#0d0b07', color: '#f3e9c8', border: '1px solid #243055', font: 'inherit', lineHeight: 1.5 }} />
    <div className="muted" style={{ fontSize: 12 }}>{text.length} characters{dirty ? ' · unsaved changes' : ''}</div>
    <input value={hint} onChange={e => setHint(e.target.value)} placeholder="Optional: how should it change? e.g. shorter, funnier, add a question"
      style={{ width: '100%', boxSizing: 'border-box', marginTop: 8 }} />
    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
      <button className="btn" disabled={!dirty || busy !== ''} onClick={save}>{busy === 'save' ? 'Saving...' : 'Save caption'}</button>
      <button className="btn ghost" disabled={busy !== ''} onClick={regen}>{busy === 'regen' ? 'Rewriting...' : '🔄 Regenerate caption'}</button>
      {dirty && <button className="btn ghost" onClick={() => setText(p.caption || '')}>Undo</button>}
    </div>
  </div>
}
