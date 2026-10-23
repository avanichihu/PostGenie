import { useEffect, useState } from 'react'
import { api } from '../api'
import { usePlatforms } from '../platforms'
const CTAS = ['Message us to learn more.', 'Visit us this week.', 'Tell us what you think in the comments.']
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10)
function Cap({ init, platform, tags }: { init: string, platform: string, tags: string }) {
  const [t, setT] = useState(init), [note, setNote] = useState(''), [date, setDate] = useState(tomorrow())
  const fix = async (mode: string) => { const lang = mode === 'translate' ? prompt('Translate into which language?') : ''; if (mode === 'translate' && !lang) return; try { const r = await api.post('/api/rewrite', { text: t, mode, lang }); setT(r.text); setNote(r.note || '') } catch (e: any) { setNote(e.message) } }
  const save = () => { try { const s = JSON.parse(localStorage.getItem('pg_saved') || '[]'); localStorage.setItem('pg_saved', JSON.stringify([...s, t])); setNote('Saved on this device.') } catch { setNote('Could not save.') } }
  const send = async () => { try { const p = await api.post('/api/posts', { platform, caption: t, date, time: '10:00', image: '' }); setNote(`Sent to the calendar as ${p.id}. Review it in the Approval Center.`) } catch (e: any) { setNote(e.message) } }
  const b = (l: string, f: () => void) => <button className="btn ghost" onClick={f}>{l}</button>
  return <div className="card"><textarea rows={3} value={t} onChange={e => setT(e.target.value)} />
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {b('Copy', () => { navigator.clipboard?.writeText(t); setNote('Copied.') })}{b('Add hashtags', () => tags && setT(t + ' ' + tags))}{b('Add call to action', () => setT(t + ' ' + CTAS[Math.floor(Math.random() * 3)]))}
      {b('Shorten', () => fix('shorten'))}{b('Rewrite', () => fix('rewrite'))}{b('Fix grammar', () => fix('grammar'))}{b('Translate', () => fix('translate'))}{b('Save', save)}</div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}><input type="date" style={{ width: 160 }} value={date} onChange={e => setDate(e.target.value)} /><button className="btn" onClick={send}>Send to calendar</button></div>{note && <p className="muted">{note}</p>}</div>
}
export default function Captions() {
  const [idea, setIdea] = useState(''), [tone, setTone] = useState('friendly'), [platform, setPlatform] = useState('Instagram'), [other, setOther] = useState(''), [caps, setCaps] = useState<string[]>([]), [tags, setTags] = useState(''), [run, setRun] = useState(0), [err, setErr] = useState(''), plats = usePlatforms()
  useEffect(() => { api.get('/api/profile').then(p => setTags(p.hashtags || '')).catch(() => {}) }, [])
  const gen = async () => { if (!idea.trim()) return setErr('Enter an idea first.'); if (platform === 'Other' && !other.trim()) return setErr('Type the name of the platform.'); setErr(''); try { setCaps(await api.post('/api/captions', { idea, tone, n: 3 })); setRun(run + 1) } catch (e: any) { setErr(e.message) } }
  return <><h2>AI Caption Studio</h2><div className="card"><label>Post idea</label><input value={idea} onChange={e => setIdea(e.target.value)} placeholder="Promote our new cold coffee" />
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><div><label>Tone</label><select value={tone} onChange={e => setTone(e.target.value)}>{['friendly', 'formal', 'funny', 'professional', 'promotional'].map(x => <option key={x}>{x}</option>)}</select></div>
      <div><label>Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)}>{plats.map(x => <option key={x}>{x}</option>)}</select></div></div>
    {err && <p className="err">{err}</p>}<button className="btn" style={{ marginTop: 12 }} onClick={gen}>{caps.length ? 'Regenerate' : 'Generate captions'}</button></div>
    {caps.map((c, i) => <Cap key={run + '-' + i} init={c} platform={platform === 'Other' ? other.trim() : platform} tags={tags} />)}
    <p className="muted">Without an AI key, captions come from simple templates and Rewrite, Fix grammar and Translate leave your text unchanged. Add GEMINI_API_KEY on the backend to enable them. Brand rules are checked when a caption is sent to the calendar.</p></>
}
