import { useEffect, useState } from 'react'
import { api } from '../api'
import { usePlatforms } from '../platforms'
export default function Queue() {
  const [ps, setPs] = useState<any[]>([]), [msg, setMsg] = useState(''), [ok, setOk] = useState(''), [fp, setFp] = useState(''), plats = usePlatforms(), [fs, setFs] = useState('')
  const [ed, setEd] = useState<any>(null)
  const load = () => api.get('/api/posts').then(setPs).catch(e => setMsg(e.message))
  useEffect(() => { load() }, [])
  const run = async (fn: () => Promise<any>) => { setMsg(''); setOk(''); try { await fn() } catch (e: any) { setMsg(e.message) } load() }
  const open = (p: any) => setEd({ id: p.id, date: p.date || new Date(Date.now() + 864e5).toISOString().slice(0, 10), time: p.time || '10:00' })
  const confirm = (p: any) => run(async () => { if (p.status === 'Rejected') { await api.patch('/api/posts/' + p.id, { reject_reason: null }); await api.post(`/api/posts/${p.id}/approve`) } await api.post(`/api/posts/${p.id}/reschedule`, { date: ed.date, time: ed.time }); setOk(`${p.id} will be uploaded on ${ed.date} at ${ed.time}.`); setEd(null) })
  const unsched = (p: any) => { if (!confirm(`Remove ${p.id} from the schedule? It goes back to the Approval Center and nothing will be posted.`)) return; run(async () => { await api.post(`/api/posts/${p.id}/unschedule`); setOk(`${p.id} removed from the schedule. You can find it in the Approval Center.`) }) }
  const rejectIt = (p: any) => { const r = prompt('Reason for rejecting? The Genie will try to rewrite the post using it.'); if (r === null) return; run(async () => { await api.post(`/api/posts/${p.id}/unschedule`); const x = await api.post(`/api/posts/${p.id}/reject`, { reason: r }); setOk(x?.status === 'Rejected' ? `${p.id} rejected and removed from the schedule.` : `${p.id} removed from the schedule and rewritten using your reason. Review it in the Approval Center.`) }) }
  const list = ps.filter(p => p.status !== 'Draft' && (!fp || p.platform === fp) && (!fs || p.status === fs))
  return <><h2>Scheduled queue</h2>{msg && <p className="err">{msg}</p>}{ok && <p className="warn">{ok}</p>}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      <select style={{ width: 'auto' }} value={fp} onChange={e => setFp(e.target.value)}><option value="">All platforms</option>{Array.from(new Set([...plats, ...ps.map(q => q.platform)])).map(x => <option key={x}>{x}</option>)}</select>
      <select style={{ width: 'auto' }} value={fs} onChange={e => setFs(e.target.value)}><option value="">All statuses</option>{['Awaiting approval', 'Approved', 'Scheduled', 'Rejected', 'On hold', 'Flagged'].map(x => <option key={x}>{x}</option>)}</select>
      <button className="btn ghost" onClick={() => run(async () => { for (const p of ps.filter(p => p.status === 'Approved')) await api.post(`/api/posts/${p.id}/schedule`) })}>Schedule all approved (keeps their current times)</button>
      <button className="btn ghost" onClick={() => run(() => api.post('/api/verify-all'))}>Re-read scheduler queue</button></div>
    {list.map(p => <div className="card" key={p.id}><b>{p.id}</b> <span className="tag">{p.platform}</span> <span className="tag">{p.status}</span> <span className="muted">{p.date} {p.time} · Scheduler ID: {p.sched_id || 'none'}</span>
      <p>{p.caption}</p>
      {p.fail && <div className="err">{p.fail}. Held, not sent without its image.</div>}
      {p.verify && <div className={p.verify.result === 'Verified' ? 'muted' : 'warn'}>Verification: <b>{p.verify.result}</b> {p.verify.diff.join(', ')}</div>}
      {ed?.id === p.id && <div style={{ border: '1px solid #3a3220', borderRadius: 12, padding: 12, margin: '10px 0' }}>
        <b>Confirm date and time</b>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '8px 0' }}>
          <div><label>Date</label><input type="date" value={ed.date} onChange={e => setEd({ ...ed, date: e.target.value })} /></div>
          <div><label>Time</label><input type="time" value={ed.time} onChange={e => setEd({ ...ed, time: e.target.value })} /></div></div>
        <p className="warn">This will be uploaded to {p.platform} on {ed.date} at {ed.time}.</p>
        <div style={{ display: 'flex', gap: 8 }}><button className="btn" onClick={() => confirm(p)}>Yes, confirm</button><button className="btn ghost" onClick={() => setEd(null)}>Cancel</button></div></div>}
      {ed?.id !== p.id && p.status === 'Approved' && <button className="btn" onClick={() => open(p)}>Schedule…</button>}
      {ed?.id !== p.id && p.status === 'Rejected' && <button className="btn" onClick={() => open(p)}>Restore and schedule…</button>}
      {ed?.id !== p.id && p.status === 'Scheduled' && <button className="btn ghost" onClick={() => open(p)}>Change date or time</button>}
      {ed?.id !== p.id && p.status === 'Scheduled' && <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => unsched(p)}>Unschedule</button>}
      {ed?.id !== p.id && p.status === 'Scheduled' && <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => rejectIt(p)}>Reject…</button>}
      {p.status === 'On hold' && <button className="btn" onClick={() => { const i = prompt('New image file name:', 'photo.jpg'); if (i) run(async () => { await api.patch('/api/posts/' + p.id, { image: i }); await api.post(`/api/posts/${p.id}/approve`); await api.post(`/api/posts/${p.id}/schedule`) }) }}>Replace image and retry</button>}</div>)}
    {!list.length && <div className="card muted">No posts match.</div>}</>
}
