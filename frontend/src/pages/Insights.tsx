import { useEffect, useState } from 'react'
import { api } from '../api'
import { usePlatforms } from '../platforms'
const N = (n: number) => n.toLocaleString()
export default function Insights() {
  const [ps, setPs] = useState<any[]>([]), [msg, setMsg] = useState(''), [fp, setFp] = useState(''), plats = usePlatforms()
  useEffect(() => { api.get('/api/insights').then(setPs).catch(e => setMsg(e.message)) }, [])
  const list = ps.filter(p => !fp || p.platform === fp)
  const sum = (k: string) => list.reduce((a, p) => a + p[k], 0)
  const best = [...list].sort((a, b) => b.likes - a.likes)[0]
  const stat = (label: string, v: number) => <div style={{ textAlign: 'center', minWidth: 80 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{N(v)}</div><div className="muted" style={{ fontSize: 13 }}>{label}</div></div>
  return <><h2>Insights</h2>
    <p className="warn">Demo data: these numbers are simulated because nothing has been posted to a real account yet. They will show real figures once a real account is connected.</p>{msg && <p className="err">{msg}</p>}
    <select style={{ width: 'auto', marginBottom: 14 }} value={fp} onChange={e => setFp(e.target.value)}><option value="">All platforms</option>{Array.from(new Set([...plats, ...ps.map(q => q.platform)])).map(x => <option key={x}>{x}</option>)}</select>
    {list.length > 0 && <div className="card"><b>Totals</b><div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>{stat('Posts', list.length)}{stat('Views', sum('views'))}{stat('Likes', sum('likes'))}{stat('Comments', sum('comments'))}{stat('Shares', sum('shares'))}{stat('Saves', sum('saves'))}{stat('Followers gained', sum('follower_change'))}</div>
      {best && <p className="muted" style={{ marginTop: 10 }}>Most liked: <b>{best.id}</b> with {N(best.likes)} likes</p>}</div>}
    {list.map(p => <div className="card" key={p.id}><b>{p.id}</b> <span className="tag">{p.platform}</span> <span className="tag">{p.status}</span> <span className="muted">{p.date} {p.time}</span>
      <p>{p.caption}</p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>{stat('Views', p.views)}{stat('Likes', p.likes)}{stat('Comments', p.comments)}{stat('Shares', p.shares)}{stat('Saves', p.saves)}</div>
      <p style={{ marginTop: 10 }}>Followers: {N(p.followers_before)} → {N(p.followers_after)} <b style={{ color: p.follower_change >= 0 ? '#6fcf97' : '#eb5757' }}>{p.follower_change >= 0 ? '▲ +' : '▼ '}{p.follower_change}</b> <span className="muted">change after post</span></p></div>)}
    {!list.length && <div className="card muted">No posts to show yet. Schedule a post and it will appear here.</div>}</>
}
