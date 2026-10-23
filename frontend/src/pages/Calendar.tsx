import { useEffect, useState } from 'react'
import { api } from '../api'
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export default function Calendar() {
  const [ps, setPs] = useState<any[]>([]), [wk, setWk] = useState(0), [msg, setMsg] = useState(''), [open, setOpen] = useState('')
  const load = () => api.get('/api/posts').then(setPs).catch(e => setMsg(e.message))
  useEffect(() => { load() }, [])
  const run = async (fn: () => Promise<any>) => { setMsg(''); try { await fn() } catch (e: any) { setMsg(e.message) } load() }
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + wk * 7 + i); return d })
  return <><h2>Content calendar</h2>{msg && <p className="err">{msg}</p>}
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><button className="btn ghost" onClick={() => setWk(wk - 1)}>← Previous week</button><button className="btn ghost" onClick={() => setWk(wk + 1)}>Next week →</button></div>
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>{days.map(d => { const k = fmt(d); return <div key={k} className="card" style={{ minHeight: 130, fontSize: 13 }}><b>{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</b>
      {ps.filter(p => p.date === k).map(p => <div key={p.id} style={{ borderTop: '1px solid #243055', marginTop: 8, paddingTop: 6 }}><span className="tag">{p.status}</span> <span className="muted">{p.time} {p.platform}</span><div className="muted">{p.type}</div><div>{open === p.id ? p.caption : p.caption.slice(0, 60) + (p.caption.length > 60 ? '…' : '')}</div>
        {open === p.id && <div className="muted">Validation: {p.validation?.result}{p.sched_id ? ` · ${p.sched_id}` : ''}</div>}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
          <button className="btn ghost" onClick={() => setOpen(open === p.id ? '' : p.id)}>Preview</button>
          <button className="btn ghost" onClick={() => { const c = prompt('Edit caption:', p.caption); if (c) run(() => api.patch('/api/posts/' + p.id, { caption: c })) }}>Edit</button>
          <button className="btn ghost" onClick={() => { const n = prompt('New date (YYYY-MM-DD):', p.date); if (n && /^\d{4}-\d{2}-\d{2}$/.test(n)) run(() => api.patch('/api/posts/' + p.id, { date: n })) }}>Move</button>
          <button className="btn ghost" onClick={() => { const n = (prompt('Platform (Instagram, Facebook, X, LinkedIn, or type any other name):', p.platform) || '').trim(); if (n) run(() => api.patch('/api/posts/' + p.id, { platform: n })) }}>Platform</button>
          {!['Scheduled', 'Published'].includes(p.status) && <button className="btn ghost" onClick={() => confirm('Delete this post?') && run(() => api.del('/api/posts/' + p.id))}>Delete</button>}</div></div>)}
      {!ps.some(p => p.date === k) && <div className="muted" style={{ marginTop: 6 }}>Free day</div>}</div> })}</div>
    <p className="muted">Moving or editing a post clears its approval, so it goes back to the Approval Center.</p></>
}
