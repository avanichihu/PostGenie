import { useEffect, useState } from 'react'
import { api } from '../api'
const PLATS = ['Instagram', 'Facebook', 'X', 'LinkedIn']
export default function Dashboard({ go }: { go: (t: string) => void }) {
  const [s, setS] = useState<any>(null), [p, setP] = useState<any>(null), [skip, setSkip] = useState(false), [err, setErr] = useState('')
  const load = () => { api.get('/api/stats').then(setS).catch(e => setErr(e.message)); api.get('/api/profile').then(setP).catch(() => {}) }
  useEffect(load, [])
  const st = s?.by_status || {}, bars = (o: any) => { const mx = Math.max(1, ...Object.values(o) as number[]); return Object.entries(o).map(([k, v]: any) => <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}><span className="muted" style={{ width: 130 }}>{k}</span><div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(#A5B4FC,#6366F1)', width: `${v / mx * 100}%`, minWidth: 6 }} /><span className="muted">{v}</span></div>) }
  const cards: [string, number][] = [['Total posts', s?.total || 0], ['Awaiting approval', st['Awaiting approval'] || 0], ['Scheduled', st['Scheduled'] || 0], ['Published', st['Published'] || 0], ['Flagged / held / rejected', (st['Flagged'] || 0) + (st['On hold'] || 0) + (st['Rejected'] || 0)]]
  return <>
    <h2>Welcome back{p?.owner ? `, ${p.owner}` : ''}! Ready to create some magic?</h2>
    {err && <p className="err">Can't reach the backend: {err}. Start it with uvicorn on port 8000.</p>}
    {p && !p.connected.length && !skip && <div className="card"><h3>Connect your socials</h3><p className="muted">Optional. You can create, validate and approve posts without it, but scheduling waits for a connected account. (Mock scheduler: connections are simulated.)</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{PLATS.map(x => <button key={x} className="btn" onClick={() => api.post('/api/connect/' + x).then(load)}>{x}</button>)}<button className="btn ghost" onClick={() => setSkip(true)}>Skip for now</button></div></div>}
    {p?.connected.length > 0 && <p className="muted">Connected: {p.connected.join(', ')}</p>}
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>{cards.map(([l, n]) => <div className="card" key={l}><div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 34, color: '#A5B4FC' }}>{n}</div><div className="muted">{l}</div></div>)}</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}><button className="btn" onClick={() => go('Create Posts')}>Create a new post</button><button className="btn ghost" onClick={() => go('Approval Center')}>Review pending approvals</button><button className="btn ghost" onClick={() => go('Scheduled Queue')}>View scheduled posts</button></div>
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <div className="card"><h3>Posts by platform</h3>{s && Object.keys(s.by_platform).length ? bars(s.by_platform) : <p className="muted">No posts yet.</p>}</div>
      <div className="card"><h3>Posts by status</h3>{s && Object.keys(st).length ? bars(st) : <p className="muted">No posts yet.</p>}</div>
      <div className="card"><h3>Planned by day</h3>{s && Object.keys(s.by_day).length ? bars(s.by_day) : <p className="muted">Nothing planned.</p>}</div></div>
    <p className="muted">Every number here comes from your saved posts. Engagement data isn't available with the mock scheduler.</p>
  </>
}
