import { useEffect, useState } from 'react'
import { api } from '../api'
export default function UsageBar({ go }: { go: (t: string) => void }) {
  const [b, setB] = useState<any>(null)
  useEffect(() => { const l = () => api.get('/api/billing').then(setB).catch(() => {}); l(); const t = setInterval(l, 4000); return () => clearInterval(t) }, [])
  if (!b) return null
  const u = b.usage.posts, m = b.limits.posts, full = u >= m
  return <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 14, marginBottom: 18, flexWrap: 'wrap' }}>
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ fontSize: 14 }}><b>{b.limits.name} plan</b> · {u} of {m} posts used this week · {b.usage.images} of {b.limits.images} AI images</div>
      <div style={{ height: 8, background: '#243055', borderRadius: 6, marginTop: 8, overflow: 'hidden' }}><div style={{ width: Math.min(100, u / m * 100) + '%', height: '100%', background: full ? '#EF4444' : '#6366F1', transition: 'width .4s' }} /></div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Resets {b.reset}</div>
    </div>
    <button onClick={() => go('Plans')} style={{ background: '#6366F1', color: '#fff', border: 0, borderRadius: 10, padding: '9px 16px', cursor: 'pointer', font: 'inherit', fontWeight: 600 }}>Upgrade</button>
  </div>
}
