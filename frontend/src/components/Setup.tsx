import { useState } from 'react'
import { api } from '../api'
import Assets from './Assets'
const DOMAINS = ['Café or restaurant', 'Clothing brand', 'Salon', 'Fitness', 'Tech startup', 'Creator', 'Other']
export default function Setup({ onDone }: { onDone: () => void }) {
  const [s, setS] = useState(0), [d, setD] = useState<any>({ domain: '', other: '', company: '', owner: '', phone: '', email: '', website: '', handles: '', schemes: '', assets: { logo: '', watermark: '', samples: [] }, toggles: { logo: true, watermark: false, contact: true } })
  const set = (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v }))
  const T = (k: string, l: string, t = 'text') => <><label>{l}</label><input type={t} value={d[k]} onChange={e => set(k, e.target.value)} /></>
  const ok = s === 0 ? !!d.domain && (d.domain !== 'Other' || d.other) : s === 1 ? !!d.company && !!d.owner : true
  const finish = async () => { await api.put('/api/profile', { domain: d.domain === 'Other' ? d.other : d.domain, company: d.company, owner: d.owner, contact: { phone: d.phone, email: d.email, website: d.website, handles: d.handles }, schemes: d.schemes.split('\n').map((x: string) => x.trim()).filter(Boolean), assets: d.assets, toggles: d.toggles, setup_done: true }); onDone() }
  return <div className="page" style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 18px' }}>
    <h2>Set up your profile</h2><p className="muted">Step {s + 1} of 4</p>
    <div className="card">
      {s === 0 && <><h3>Which domain are you in?</h3><p className="muted">Pick one. Plans and captions are tailored to it.</p>{DOMAINS.map(x => <label key={x} style={{ color: 'inherit', fontSize: 15 }}><input type="radio" style={{ width: 'auto', marginRight: 8 }} checked={d.domain === x} onChange={() => set('domain', x)} />{x}</label>)}{d.domain === 'Other' && <input placeholder="Your domain" value={d.other} onChange={e => set('other', e.target.value)} />}</>}
      {s === 1 && <><h3>Business details</h3>{T('company', 'Company name')}{T('owner', 'Owner name')}<p className="muted" style={{ marginTop: 14 }}>Contact details for your posts</p>{T('phone', 'Phone')}{T('email', 'Email', 'email')}{T('website', 'Website')}{T('handles', 'Social handles')}</>}
      {s === 2 && <><h3>Brand assets</h3><p className="muted">Optional. Saved until you delete them. You can manage them later in Brand Kit.</p><Assets /></>}
      {s === 3 && <><h3>Current schemes and offers</h3><p className="muted">One per line. Only these count as approved claims. Any other discount in a caption gets flagged.</p><textarea rows={5} value={d.schemes} onChange={e => set('schemes', e.target.value)} placeholder="20% off winter coats" />
        <p className="muted" style={{ marginTop: 14 }}>Defaults for new posts (switch per post later)</p>
        {(['logo', 'watermark', 'contact'] as const).map(k => <label key={k} style={{ color: 'inherit', fontSize: 15 }}><input type="checkbox" style={{ width: 'auto', marginRight: 8 }} checked={d.toggles[k]} onChange={e => set('toggles', { ...d.toggles, [k]: e.target.checked })} />Add {k === 'contact' ? 'contact details' : k}</label>)}</>}
    </div>
    <div style={{ display: 'flex', gap: 8 }}>{s > 0 && <button className="btn ghost" onClick={() => setS(s - 1)}>Back</button>}{s < 3 ? <button className="btn" disabled={!ok} onClick={() => setS(s + 1)}>Next</button> : <button className="btn" onClick={finish}>Finish</button>}</div>
  </div>
}
