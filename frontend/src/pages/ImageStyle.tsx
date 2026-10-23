import { useEffect, useState } from 'react'

const THEMES: [string, string][] = [
  ['Cream', '#FFF3E3'], ['Peach', '#FFE1D0'], ['Mint', '#E1F5EC'], ['Sky', '#DEEEFC'],
  ['Lavender', '#ECE6FA'], ['Rose', '#FDE4EC'], ['Sunshine', '#FFEEAA'], ['Sand', '#EEE2CE'],
  ['Midnight', '#121830'], ['Forest', '#143428'], ['Charcoal', '#222226'], ['Berry', '#5C1848'],
]
const get = (k: string, d: string) => { try { return localStorage.getItem(k) || d } catch { return d } }
export const getImgStyle = () => ({ font: get('pgFont', 'Modern'), size: get('pgSize', 'Medium'), theme: get('pgTheme', 'Cream'), logo: true, watermark: false })

export default function ImageStyle() {
  const [s, setS] = useState(getImgStyle())
  useEffect(() => { const f = () => setS(getImgStyle()); window.addEventListener('pgstyle', f); return () => window.removeEventListener('pgstyle', f) }, [])
  const set = (key: string, v: string) => { try { localStorage.setItem(key, v) } catch {} window.dispatchEvent(new Event('pgstyle')) }
  const sel = { padding: '4px 6px', fontSize: 13, width: 'auto' as const }
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0' }}>
    <span className="muted" style={{ fontSize: 13 }}>Font</span>
    <select value={s.font} onChange={e => set('pgFont', e.target.value)} style={sel}><option>Modern</option><option>Elegant</option><option>Friendly</option></select>
    <span className="muted" style={{ fontSize: 13 }}>Text size</span>
    <select value={s.size} onChange={e => set('pgSize', e.target.value)} style={sel}><option>Small</option><option>Medium</option><option>Large</option></select>
    <span className="muted" style={{ fontSize: 13 }}>Background</span>
    {THEMES.map(([n, c]) => <button key={n} title={n} onClick={() => set('pgTheme', n)}
      style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', padding: 0,
               border: s.theme === n ? '3px solid #6366F1' : '1px solid #888' }} />)}
  </div>
}
