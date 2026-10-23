import CaptionBox from './CaptionBox'
import ImageStyle, { getImgStyle } from './ImageStyle'
import ImageZoom from './ImageZoom'
import { useEffect, useState } from 'react'
import { api } from '../api'

const Preview = ({ p, name }: { p: any, name: string }) => <div style={{ border: '1px solid #3a3220', borderRadius: 12, overflow: 'hidden', margin: '10px 0', background: '#0d0b07', display: 'flex', flexDirection: 'column' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#d4b04a', color: '#111', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{(name || 'P')[0].toUpperCase()}</div>
    <div><b>{name || 'Your business'}</b><div className="muted" style={{ fontSize: 12 }}>{p.platform} · {p.date} {p.time}</div></div>
  </div>
  {(p.platform === 'Instagram' || p.image) && <div className="muted" style={{ flex: 1, minHeight: 300, background: 'linear-gradient(135deg,#2a2314,#4a3a14)', display: 'grid', placeItems: 'center' }}>{p.image ? (p.image.startsWith('/api/') ? <ImageZoom src={p.image} /> : `🖼 ${p.image}`) : 'No image yet'}</div>}
</div>

export default function Approval() {
  const [ps, setPs] = useState<any[]>([]), [msg, setMsg] = useState(''), [note, setNote] = useState(''), [name, setName] = useState(''), [imgs, setImgs] = useState<any[]>([]), [gen, setGen] = useState<any>(null)
  const load = () => api.get('/api/posts').then(setPs).catch(e => setMsg(e.message))
  useEffect(() => { load(); api.get('/api/profile').then(x => setName(x.company || '')).catch(() => {}); api.get('/api/assets').then(setImgs).catch(() => {}) }, [])
  const run = async (fn: () => Promise<any>) => { setMsg(''); setNote(''); try { await fn() } catch (e: any) { setMsg(e.message) } load() }
  const approve = (p: any, revised: boolean) => run(async () => {
    await api.post(`/api/posts/${p.id}/approve?use_revised=${revised}`)
    try { await api.post(`/api/posts/${p.id}/schedule`); setNote(`${p.id} approved and scheduled.`) } catch (e: any) { setNote(`${p.id} approved. ${e.message}`) }
  })
  const reject = (p: any) => {
    const r = prompt('Reason for rejecting? The Genie will try to rewrite the post using it.')
    if (r === null) return
    run(async () => {
      const x = await api.post(`/api/posts/${p.id}/reject`, { reason: r })
      setNote(x?.status === 'Rejected' ? 'Rejected. That reason could not be fixed by editing, so the post stays rejected.' : 'Rewritten using your reason. Please review the new version.')
    })
  }
  const todo = ps.filter(p => ['Awaiting approval', 'Flagged'].includes(p.status)), done = ps.filter(p => ['Approved', 'Rejected'].includes(p.status))
  return <><h2>Approval Center</h2><p className="muted">Nothing is scheduled without your approval.</p>{msg && <p className="err">{msg}</p>}{note && <p className="warn">{note}</p>}
    {todo.map(p => { const v = p.validation; return <div className="card" key={p.id}>
      <b>{p.id}</b> <span className="tag">{p.platform}</span> <span className="tag">{p.status}</span> <span className="muted">{p.date} {p.time}</span>
      {p.regen_note && <div className="warn">✨ {p.regen_note}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'stretch' }}><Preview p={p} name={name} /><CaptionBox p={p} onSaved={load} onError={setMsg} /></div>
      <div style={{ margin: '6px 0' }}><label>Image for this post</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
          {imgs.map((i: any) => <div key={i.id} style={{ position: 'relative' }}><button title="Delete this image" aria-label="Delete image" onClick={(e) => { e.stopPropagation(); if (!confirm('Delete this image permanently?')) return; run(async () => { await Promise.all(ps.filter((q: any) => q.image === i.url).map((q: any) => api.patch('/api/posts/' + q.id, { image: '' }))); await api.post('/api/image-delete/' + i.id); setImgs(await api.get('/api/assets')) }) }} style={{ position: 'absolute', top: -7, right: -7, zIndex: 2, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#c0392b', color: '#fff', fontSize: 12, lineHeight: 1, cursor: 'pointer', padding: 0 }}>🗑</button><img src={i.url} alt={i.name} title={i.name} onClick={() => api.patch('/api/posts/' + p.id, { image: i.url }).then(load).catch((e: any) => setMsg(e.message))} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: p.image === i.url ? '3px solid #6366F1' : '1px solid #243055' }} /></div>)}
          {p.image && <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => api.patch('/api/posts/' + p.id, { image: '' }).then(load).catch((e: any) => setMsg(e.message))}>Remove image</button>}
          <div style={{ width: '100%' }}><ImageStyle /></div><button className="btn" style={{ padding: '4px 10px', fontSize: 13 }} disabled={gen !== null} onClick={() => { setGen(p.id); setMsg(''); api.post('/api/generate-image', { caption: p.caption, platform: p.platform, ...getImgStyle() }).then((r: any) => api.patch('/api/posts/' + p.id, { image: r.url })).then(() => api.get('/api/assets').then(setImgs)).then(load).catch((e: any) => setMsg(e.message)).finally(() => setGen(null)) }}>{gen === p.id ? 'Generating...' : '✨ Generate image'}</button>
          {!imgs.length && <span className="muted">No saved images. Add them in Brand Kit.</span>}</div></div>
      <div className="muted">Validation: <b>{v.result}</b></div>{v.issues.map((i: any, k: number) => <div key={k} className={i.k === 'verify' ? 'warn' : 'err'}>⚠ {i.m}</div>)}
      
      {v.revised && <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}><div className="muted"><b>Original</b><br />{p.caption}</div><div className="muted"><b>Shortened draft</b><br />{v.revised}</div></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="btn" disabled={p.status === 'Flagged'} onClick={() => approve(p, !!v.revised)}>{v.revised ? 'Approve shortened draft' : 'Approve'}</button>
        <button className="btn ghost" onClick={() => reject(p)}>Reject</button>
        <button className="btn ghost" onClick={() => { const c = prompt('Edit caption (needs approval again):', p.caption); if (c) run(() => api.patch('/api/posts/' + p.id, { caption: c })) }}>Edit</button>
        {v.issues.some((i: any) => i.k === 'claim') && <button className="btn ghost" onClick={() => { const e = prompt('Source or evidence for this claim:'); if (e) run(() => api.post(`/api/posts/${p.id}/evidence`, { evidence: e })) }}>Provide evidence</button>}</div></div> })}
    {!todo.length && <div className="card muted">All clear. Create posts to see them here.</div>}
    <h3>Decided</h3>{done.map(p => <div className="card" key={p.id}><b>{p.id}</b> <span className="tag">{p.status}</span><p>{p.caption}</p>{p.reject_reason && <div className="err">Reason: {p.reject_reason}</div>}{p.status === 'Rejected' && <button className="btn ghost" onClick={() => run(async () => { await api.patch('/api/posts/' + p.id, { reject_reason: null }); setNote(`${p.id} restored. Review it in the list above.`) })}>Restore for approval</button>}</div>)}</>
}
