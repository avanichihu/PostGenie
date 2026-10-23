import { useEffect, useState } from 'react'
import { api } from '../api'
const read = (f: File) => new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = () => rej(new Error('Could not read the file')); fr.readAsDataURL(f) })
const KINDS: [string, string, number, string][] = [
  ['logo', 'Logo', 1, 'One image. A new upload replaces it.'],
  ['watermark', 'Watermark', 1, 'One image. A new upload replaces it.'],
  ['sample', 'Sample images', 3, 'Up to 3. You can pick several files at once.']]
export default function Assets() {
  const [items, setItems] = useState<any[]>([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const load = () => api.get('/api/assets').then(setItems).catch(e => setMsg(e.message))
  useEffect(() => { load() }, [])
  const up = async (kind: string, files: File[], max: number) => {
    if (!files.length) return
    setMsg(''); setBusy(true)
    const have = items.filter(i => i.kind === kind).length
    const list = kind === 'sample' ? files.slice(0, Math.max(0, max - have)) : [files[0]]
    if (!list.length) { setMsg('You already have 3 sample images. Delete one to add another.'); setBusy(false); return }
    try {
      for (const f of list) await api.post('/api/assets', { kind, name: f.name, data: await read(f) })
      if (kind === 'sample' && files.length > list.length) setMsg(`Only ${list.length} added. Up to 3 sample images are allowed.`)
    } catch (e: any) { setMsg(e.message) }
    setBusy(false); load()
  }
  const del = (i: any) => { if (!confirm(`Delete ${i.name}? This cannot be undone.`)) return; api.del('/api/assets/' + i.id).then(load).catch(e => setMsg(e.message)) }
  return <>{msg && <p className="err">{msg}</p>}
    {KINDS.map(([kind, label, max, hint]) => { const mine = items.filter(i => i.kind === kind), full = kind === 'sample' && mine.length >= max
      return <div key={kind} style={{ marginBottom: 16 }}><label>{label} <span className="muted">({mine.length}/{max}) {hint}</span></label>
        <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple={kind === 'sample'} disabled={busy || full} onChange={e => { const fs = Array.from(e.target.files || []); e.target.value = ''; up(kind, fs, max) }} />
        {full && <p className="muted">All 3 slots are used. Delete one to add another.</p>}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          {mine.map(i => <div key={i.id} style={{ width: 120 }}>
            <a href={i.url} target="_blank" rel="noreferrer"><img src={i.url} alt={i.name} style={{ width: 120, height: 90, objectFit: 'contain', background: '#0e0b06', border: '1px solid #243055', borderRadius: 8 }} /></a>
            <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.name}>{i.name}</div>
            <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => del(i)}>Delete</button></div>)}
          {!mine.length && <span className="muted">Nothing uploaded yet.</span>}</div></div> })}</>
}
