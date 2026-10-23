import { useEffect, useState } from 'react'
import { api } from '../api'
import { usePlatforms } from '../platforms'
const today = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10)
export default function CreatePosts({ go }: { go: (t: string) => void }) {
  const [f, setF] = useState<any>({ brief: '', ideas: '', platform: 'Instagram', tone: 'friendly', start_date: today(), time: '10:00', times: '', image: '', add_logo: false, add_watermark: false, add_contact: false }), [busy, setBusy] = useState(false), [imgs, setImgs] = useState<any[]>([]), [err, setErr] = useState(''), plats = usePlatforms()
  const set = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: v }))
  useEffect(() => { api.get('/api/assets').then(setImgs).catch(() => {}) }, [])
  useEffect(() => { api.get('/api/profile').then(p => setF((x: any) => ({ ...x, add_logo: p.toggles.logo, add_watermark: p.toggles.watermark, add_contact: p.toggles.contact }))).catch(() => {}) }, [])
  const go_ = async () => { if (f.platform === 'Other' && !(f.other_name || '').trim()) { setErr('Type the name of the platform.'); return } setBusy(true); setErr(''); try { await api.post('/api/plan', { ...f, platform: f.platform === 'Other' ? (f.other_name || '').trim() : f.platform, image: f.pick || f.image, ideas: f.ideas.split('\n').filter((x: string) => x.trim()) }); go('Approval Center') } catch (e: any) { setErr(e.message) } setBusy(false) }
  return <><h2>Create posts</h2><div className="card">
    <label>Tell the Genie what you need (e.g. "Seven Instagram posts for the winter collection, friendly")</label><textarea rows={3} value={f.brief} onChange={e => set('brief', e.target.value)} />
    <label>Post ideas, one per line</label><textarea rows={3} value={f.ideas} onChange={e => set('ideas', e.target.value)} />
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <div><label>Platform</label><select value={f.platform} onChange={e => set('platform', e.target.value)}>{plats.map(x => <option key={x}>{x}</option>)}</select></div>
      <div><label>Tone</label><select value={f.tone} onChange={e => set('tone', e.target.value)}>{['friendly', 'professional', 'funny', 'formal', 'promotional'].map(x => <option key={x}>{x}</option>)}</select></div>
      <div><label>Start date</label><input type="date" value={f.start_date} onChange={e => set('start_date', e.target.value)} /></div>
      <div><label>Time</label><input type="time" value={f.time} onChange={e => set('time', e.target.value)} /></div>
      <div><label>Image file name</label><input value={f.image} onChange={e => set('image', e.target.value)} placeholder="photo.jpg" /></div></div>
    <div style={{ marginTop: 10 }}><label>Post times, one per post, separated by commas (optional)</label><input value={f.times} onChange={e => set('times', e.target.value)} placeholder="09:00, 12:30, 15:00, 18:45" /></div>
    <div style={{ marginTop: 10 }}><label>Post image <span className="muted">(pick from your saved images)</span></label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
        {imgs.map((i: any) => <img key={i.id} src={i.url} alt={i.name} title={i.name} onClick={() => set('pick', f.pick === i.url ? '' : i.url)} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: f.pick === i.url ? '3px solid #6366F1' : '1px solid #243055' }} />)}
        {!imgs.length && <span className="muted">No saved images yet. Add them in Brand Kit.</span>}</div>
      {f.pick && <p className="muted">Selected. Click it again to clear.</p>}</div>
    {err && <p className="err">{err}</p>}<button className="btn" style={{ marginTop: 12 }} disabled={busy} onClick={go_}>{busy ? 'Working...' : 'Generate My Content Plan'}</button></div></>
}
