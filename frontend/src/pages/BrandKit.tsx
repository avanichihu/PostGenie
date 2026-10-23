import { useEffect, useState } from 'react'
const DOMAINS = ['Café or restaurant', 'Clothing brand', 'Salon', 'Fitness', 'Tech startup', 'Creator', 'Other']
import { api } from '../api'
import Assets from '../components/Assets'
export default function BrandKit() {
  const [d, setD] = useState<any>(null), [msg, setMsg] = useState(''), [dom, setDom] = useState(''), [other, setOther] = useState('')
  useEffect(() => { api.get('/api/profile').then(x => { const v = x.domain || ''; if (!v) return; if (DOMAINS.includes(v)) setDom(v); else { setDom('Other'); setOther(v) } }).catch(() => {}) }, [])
  useEffect(() => { api.get('/api/profile').then(p => setD({ company: p.company, owner: p.owner, tone: p.tone, hashtags: p.hashtags, phone: p.contact.phone || '', email: p.contact.email || '', website: p.contact.website || '', handles: p.contact.handles || '', banned: p.banned.join(', '), schemes: p.schemes.join('\n') })).catch(e => setMsg(e.message)) }, [])
  if (!d) return <p className="muted">{msg || 'Loading...'}</p>
  const T = (k: string, l: string) => <div><label>{l}</label><input value={d[k]} onChange={e => setD({ ...d, [k]: e.target.value })} /></div>
  const save = async () => { try { await api.put('/api/profile', { ...(dom && (dom !== 'Other' || other) ? { domain: dom === 'Other' ? other : dom } : {}), company: d.company, owner: d.owner, tone: d.tone, hashtags: d.hashtags, contact: { phone: d.phone, email: d.email, website: d.website, handles: d.handles }, banned: d.banned.split(',').map((x: string) => x.trim()).filter(Boolean), schemes: d.schemes.split('\n').map((x: string) => x.trim()).filter(Boolean) }); setMsg('Brand kit saved. New posts use these rules.') } catch (e: any) { setMsg(e.message) } }
  return <><h2>Brand Kit</h2><div className="card"><div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>{T('company', 'Business name')}{T('owner', 'Owner name')}{T('tone', 'Brand tone')}{T('hashtags', 'Preferred hashtags')}{T('phone', 'Phone')}{T('email', 'Email')}{T('website', 'Website')}{T('handles', 'Social handles')}</div>
    <label>Prohibited words (comma separated)</label><input value={d.banned} onChange={e => setD({ ...d, banned: e.target.value })} />
    <label>Approved offers (one per line). Only these discounts pass validation.</label><textarea rows={4} value={d.schemes} onChange={e => setD({ ...d, schemes: e.target.value })} />
    <label>Domain <span className="muted">(plans and captions are tailored to it)</span></label>
    <select value={dom} onChange={e => setDom(e.target.value)}><option value="">Choose a domain</option>{DOMAINS.map(x => <option key={x} value={x}>{x}</option>)}</select>
    {dom === 'Other' && <input placeholder="Your domain" value={other} onChange={e => setOther(e.target.value)} />}
    <button className="btn" style={{ marginTop: 12 }} onClick={save}>Save brand kit</button>{msg && <p className="muted">{msg}</p>}</div>
    <div className="card"><h3>Brand assets</h3><p className="muted">Your logo, watermark and sample images. They are saved until you delete them.</p><Assets /></div></>
}
